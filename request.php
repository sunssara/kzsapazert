<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
session_start(['cookie_secure' => true, 'cookie_httponly' => true, 'cookie_samesite' => 'Lax']);

function respond(int $status, array $body): never {
    http_response_code($status);
    echo json_encode($body);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $a = random_int(2, 9);
    $b = random_int(2, 9);
    $_SESSION['challenge'] = $a + $b;
    $_SESSION['challenge_time'] = time();
    respond(200, ['question' => "$a + $b"]);
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['ok' => false]);
}

$answer = $_SESSION['challenge'] ?? null;
$created = $_SESSION['challenge_time'] ?? 0;
unset($_SESSION['challenge'], $_SESSION['challenge_time']);
$data = [];
foreach (['name' => 100, 'phone' => 50, 'email' => 150, 'project' => 1000, 'service' => 100, 'check' => 2] as $field => $limit) {
    $value = $_POST[$field] ?? '';
    if (!is_string($value) || strlen($value) > $limit * 4 || str_contains($value, "\0")) {
        respond(400, ['ok' => false]);
    }
    $data[$field] = trim($value);
}
if ($answer === null || time() - $created > 1800 || $data['check'] !== (string) $answer) {
    respond(422, ['error' => 'captcha']);
}
if ($data['name'] === '' || !preg_match('/^\+?[0-9() .\-]{5,50}$/D', $data['phone']) ||
    !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    respond(400, ['ok' => false]);
}
if (time() - ($_SESSION['last_request'] ?? 0) < 30) {
    respond(429, ['ok' => false]);
}
$message = "Имя: {$data['name']}\nТелефон: {$data['phone']}\nПочта: {$data['email']}";
if ($data['service'] !== '') {
    $message .= "\nУслуга: {$data['service']}";
}
if ($data['project'] !== '') {
    $message .= "\nОписание: {$data['project']}";
}
$sent = mail('kz.sapa.zertkhanasy@mail.ru', '=?UTF-8?B?' . base64_encode('Заявка с сайта kzsapazert.kz') . '?=', $message, [
    'From' => 'website@kzsapazert.kz',
    'Reply-To' => $data['email'],
    'Content-Type' => 'text/plain; charset=UTF-8',
    'MIME-Version' => '1.0',
]);
if (!$sent) {
    respond(502, ['ok' => false]);
}
$_SESSION['last_request'] = time();
respond(200, ['ok' => true]);
