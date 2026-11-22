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
    if (!isset($_SESSION['form_token']) || time() - ($_SESSION['form_issued'] ?? 0) > 7200) {
        $_SESSION['form_token'] = bin2hex(random_bytes(32));
        $_SESSION['form_issued'] = time();
    }
    respond(200, ['token' => $_SESSION['form_token']]);
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['ok' => false]);
}

$token = $_POST['token'] ?? '';
if (!is_string($token) || !isset($_SESSION['form_token']) ||
    time() - ($_SESSION['form_issued'] ?? 0) > 7200 || !hash_equals($_SESSION['form_token'], $token)) {
    respond(422, ['ok' => false, 'error' => 'token']);
}
if (($_POST['website'] ?? '') !== '') {
    respond(422, ['ok' => false]);
}
$data = [];
foreach (['name' => 100, 'phone' => 50, 'email' => 150, 'project' => 1000, 'service' => 100] as $field => $limit) {
    $value = $_POST[$field] ?? '';
    if (!is_string($value) || strlen($value) > $limit * 4 || str_contains($value, "\0")) {
        respond(400, ['ok' => false]);
    }
    $data[$field] = trim($value);
}
$services = [
    'soil' => 'Испытания грунтов',
    'concrete' => 'Испытания бетона',
    'asphalt' => 'Испытания асфальтобетона',
    'aggregates' => 'Испытания песка, щебня и нерудных материалов',
    'rebar' => 'Испытания арматуры',
    'onsite' => 'Выездные лабораторные испытания',
];
if ($data['name'] === '' || !preg_match('/^\+?[0-9() .\-]{5,50}$/D', $data['phone']) ||
    strlen(preg_replace('/\D/', '', $data['phone'])) < 5 ||
    ($data['email'] !== '' && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) ||
    ($data['service'] !== '' && !isset($services[$data['service']]))) {
    respond(400, ['ok' => false]);
}
if (time() - ($_SESSION['last_request'] ?? 0) < 30) {
    respond(429, ['ok' => false]);
}
$_SESSION['last_request'] = time();
$message = "Имя: {$data['name']}\nТелефон: {$data['phone']}\nПочта: {$data['email']}";
if ($data['service'] !== '') {
    $message .= "\nУслуга: {$services[$data['service']]}";
}
if ($data['project'] !== '') {
    $message .= "\nОписание: {$data['project']}";
}
$headers = [
    'From' => 'website@kzsapazert.kz',
    'Content-Type' => 'text/plain; charset=UTF-8',
    'MIME-Version' => '1.0',
];
if ($data['email'] !== '') {
    $headers['Reply-To'] = $data['email'];
}
$sent = mail('kz.sapa.zertkhanasy@mail.ru', '=?UTF-8?B?' . base64_encode('Заявка с сайта kzsapazert.kz') . '?=', $message, $headers);
if (!$sent) {
    respond(502, ['ok' => false]);
}
unset($_SESSION['form_token'], $_SESSION['form_issued']);
respond(200, ['ok' => true]);
