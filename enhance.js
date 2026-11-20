const formCopy = {
  ru: ['Заявка на лабораторное сопровождение','Ваше имя','Телефон','Электронная почта','Расскажите о проекте','Отправить заявку'],
  kk: ['Зертханалық сүйемелдеуге өтінім','Аты-жөніңіз','Телефон','Электрондық пошта','Жоба туралы айтыңыз','Өтінім жіберу'],
  en: ['Request laboratory support','Your name','Phone','Email','Tell us about the project','Send inquiry'],
  zh: ['申请实验室技术支持','您的姓名','电话','电子邮箱','请介绍您的项目','发送申请'],
};

const requestForm = document.querySelector('#request-form');


function updateEnhancements() {
  const lang = document.querySelector('#language').value;
  const labels = formCopy[lang];
  requestForm.querySelectorAll('h3,label:not(#request-check-label),button').forEach((element, index) => {
    element.textContent = labels[index];
  });
  if (lang === 'kk') {
    document.querySelector('h1').textContent = document.querySelector('h1').innerHTML.replaceAll('<br>', ' ');
  }
  if (lang !== 'zh') {
    const patterns = {
      ru: /(^|[\s«(])(в|во|на|к|ко|с|со|у|о|об|от|до|за|из|по|для|над|под|при|без|через|и|а|но) +(?=\S)/giu,
      kk: /(^|[\s«(])(және|мен|пен|бен) +(?=\S)/giu,
      en: /(^|[\s(])(a|an|the|to|of|in|on|at|for|and) +(?=\S)/gi,
    };
    const walker = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      node.nodeValue = node.nodeValue.replace(patterns[lang], '$1$2\u00a0');
    }
  }
}

const sendCopy = {
  ru: ['Заявка отправлена', 'Закрыть', 'Не удалось отправить заявку. Повторите попытку или напишите нам по почте.'],
  kk: ['Өтінім жіберілді', 'Жабу', 'Өтінім жіберілмеді. Қайталап көріңіз немесе бізге пошта арқылы жазыңыз.'],
  en: ['Inquiry sent', 'Close', 'Could not send your inquiry. Please try again or email us.'],
  zh: ['申请已发送', '关闭', '发送失败。请重试或通过电子邮件联系我们。'],
};
requestForm.addEventListener('submit', async event => {
  event.preventDefault();
  const lang = document.querySelector('#language').value;
  const [success, close, error] = sendCopy[lang];
  const status = document.querySelector('#request-help');
  const submit = requestForm.querySelector('button[type="submit"]');
  submit.disabled = true;
  status.textContent = '';
  try {
    const response = await fetch('request.php', {method: 'POST', body: new FormData(requestForm)});
    const result = await response.json();
    if (!response.ok || !result.ok) {
      await updateChallenge(true);
      if (result.error === 'captcha') {
        challengeInput.setCustomValidity(challengeCopy[lang][1]);
        challengeInput.reportValidity();
        return;
      }
      throw new Error('Request rejected');
    }
    requestForm.reset();
    if (projectDialog.open) projectDialog.close();
    const dialog = document.querySelector('#request-success');
    dialog.querySelector('h3').textContent = success;
    dialog.querySelector('button').textContent = close;
    if (dialog.showModal) dialog.showModal();
    else status.textContent = success;
    void updateChallenge(true);
  } catch {
    status.textContent = error;
  } finally {
    submit.disabled = false;
  }
});

updateEnhancements();
document.querySelector('#language').addEventListener('change', updateEnhancements);

const challengeInput = document.querySelector('#request-check');
const challengeLabel = document.querySelector('#request-check-label');
const challengeCopy = {
  ru: ['Проверка', 'Введите правильный ответ.', 'необязательно'],
  kk: ['Тексеру', 'Дұрыс жауапты енгізіңіз.', 'міндетті емес'],
  en: ['Verification', 'Enter the correct answer.', 'optional'],
  zh: ['验证', '请输入正确答案。', '选填'],
};
async function updateChallenge(regenerate = false) {
  const [title, , optional] = challengeCopy[document.querySelector('#language').value];
  requestForm.querySelector('label[for="request-project"]').textContent =
    formCopy[document.querySelector('#language').value][4] + ' (' + optional + ')';
  challengeInput.setCustomValidity('');
  if (!regenerate && challengeLabel.dataset.question) {
    challengeLabel.textContent = title + ': ' + challengeLabel.dataset.question + ' = ?';
    return;
  }
  challengeInput.value = '';
  try {
    const response = await fetch('request.php', {cache:'no-store'});
    if (!response.ok) throw new Error('Challenge unavailable');
    const {question} = await response.json();
    challengeLabel.dataset.question = question;
    const currentTitle = challengeCopy[document.querySelector('#language').value][0];
    challengeLabel.textContent = currentTitle + ': ' + question + ' = ?';
  } catch {
    challengeLabel.textContent = title;
    document.querySelector('#request-help').textContent = sendCopy[document.querySelector('#language').value][2];
  }
}
challengeInput.addEventListener('input', () => challengeInput.setCustomValidity(''));
document.querySelector('#language').addEventListener('change', () => updateChallenge());
updateChallenge(true);

const hero = document.querySelector('.hero');
const motion = matchMedia('(prefers-reduced-motion: no-preference) and (pointer: fine)');
hero.addEventListener('pointermove', event => {
  if (!motion.matches) return;
  const bounds = hero.getBoundingClientRect();
  hero.style.setProperty('--photo-x', `${(0.5 - (event.clientX - bounds.left) / bounds.width) * 20}px`);
  hero.style.setProperty('--photo-y', `${(0.5 - (event.clientY - bounds.top) / bounds.height) * 12}px`);
});
hero.addEventListener('pointerleave', () => {
  hero.style.setProperty('--photo-x', '0px');
  hero.style.setProperty('--photo-y', '0px');
});

if ('IntersectionObserver' in window) {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      if (!reducedMotion.matches && !entry.target.contains(document.activeElement)) {
        entry.target.classList.add('scroll-enter');
      }
    }
  }, { rootMargin: '0px 0px -32px', threshold: 0 });
  document.querySelectorAll('.intro-section .two-col, .section-head, .service-layout, .benefit-grid, .field-section > div, .accreditation > div, .contact-section .two-col').forEach(element => observer.observe(element));
}

const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('#site-nav');
const menuLabels = { ru: ['Открыть меню', 'Закрыть меню'], kk: ['Мәзірді ашу', 'Мәзірді жабу'], en: ['Open menu', 'Close menu'], zh: ['打开菜单', '关闭菜单'] };
function setMenu(open) {
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', menuLabels[document.querySelector('#language').value][Number(open)]);
}
menuToggle.addEventListener('click', () => setMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
siteNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    menuToggle.focus();
  }
});
document.querySelector('#language').addEventListener('change', () => setMenu(false));
setMenu(false);

const projectDialog = document.querySelector('#project-dialog');
const projectFormHome = requestForm.parentElement;
const projectClose = projectDialog.querySelector('.project-close');
let projectTrigger;
document.querySelectorAll(':is(a[data-t="cta"], a[data-t="writeUs"])[href="#request-form"]').forEach(trigger => {
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.addEventListener('click', event => {
    if (!projectDialog.showModal) return;
    event.preventDefault();
    projectTrigger = trigger;
    projectClose.ariaLabel = {ru:'Закрыть',kk:'Жабу',en:'Close',zh:'关闭'}[document.querySelector('#language').value];
    projectDialog.append(requestForm);
    projectDialog.showModal();
    projectClose.focus();
  });
});
projectClose.addEventListener('click', () => projectDialog.close());
projectDialog.addEventListener('close', () => {
  projectFormHome.append(requestForm);
  projectTrigger?.focus({preventScroll:true});
});

const dotSections = [...document.querySelectorAll('main > section')];
const sectionDots = document.createElement('nav');
sectionDots.className = 'section-dots';
const dotLinks = dotSections.map((section, index) => {
  section.id ||= 'section-' + (index + 1);
  const link = document.createElement('a');
  link.href = '#' + section.id;
  sectionDots.append(link);
  return link;
});
document.body.append(sectionDots);

function labelDots() {
  const lang = document.querySelector('#language').value;
  sectionDots.ariaLabel = {ru:'Разделы страницы',kk:'Бет бөлімдері',en:'Page sections',zh:'页面章节'}[lang];
  dotSections.forEach((section, index) => {
    const label = section.querySelector('h1,h2').innerText.replace(/\s+/g, ' ').trim();
    dotLinks[index].ariaLabel = label;
    dotLinks[index].title = label;
  });
}
let dotsQueued = false;
function updateDots() {
  if (dotsQueued) return;
  dotsQueued = true;
  requestAnimationFrame(() => {
    dotsQueued = false;
    const readingLine = innerHeight * .4;
    let active = 0;
    dotSections.forEach((section, index) => {
      if (section.getBoundingClientRect().top <= readingLine) active = index;
    });
    if (scrollY + innerHeight >= document.documentElement.scrollHeight - 2) active = dotSections.length - 1;
    dotLinks.forEach((link, index) => {
      if (index === active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  });
}
document.querySelector('#language').addEventListener('change', labelDots);
addEventListener('scroll', updateDots, {passive:true});
addEventListener('resize', updateDots);
labelDots();
updateDots();

const certificateCard = document.querySelector('a.certificate');
const certificateGallery = document.querySelector('#certificate-gallery');
const galleryImage = certificateGallery.querySelector('img');
const galleryPrevious = certificateGallery.querySelector('.gallery-prev');
const galleryNext = certificateGallery.querySelector('.gallery-next');
const galleryClose = certificateGallery.querySelector('.gallery-close');
const galleryLabels = {
  ru: ['Аттестат аккредитации', 'Предыдущая страница', 'Следующая страница', 'Закрыть'],
  kk: ['Аккредиттеу аттестаты', 'Алдыңғы бет', 'Келесі бет', 'Жабу'],
  en: ['Accreditation certificate', 'Previous page', 'Next page', 'Close'],
  zh: ['认可证书', '上一页', '下一页', '关闭'],
};
let galleryPage = 1;
function showCertificatePage(page) {
  galleryPage = Math.max(1, Math.min(2, page));
  const [title, previous, next, close] = galleryLabels[document.querySelector('#language').value];
  certificateGallery.querySelector('h3').textContent = title;
  galleryPrevious.ariaLabel = previous;
  galleryNext.ariaLabel = next;
  galleryClose.ariaLabel = close;
  galleryImage.src = 'certificate-page-' + galleryPage + '.webp';
  galleryImage.alt = title + ' · ' + galleryPage + ' / 2';
  certificateGallery.querySelector('output').textContent = galleryPage + ' / 2';
  galleryPrevious.disabled = galleryPage === 1;
  galleryNext.disabled = galleryPage === 2;
}
certificateCard.setAttribute('aria-haspopup', 'dialog');
certificateCard.addEventListener('click', event => {
  if (!certificateGallery.showModal || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  showCertificatePage(1);
  certificateGallery.showModal();
  galleryClose.focus();
});
galleryClose.addEventListener('click', () => certificateGallery.close());
galleryPrevious.addEventListener('click', () => showCertificatePage(galleryPage - 1));
galleryNext.addEventListener('click', () => showCertificatePage(galleryPage + 1));
certificateGallery.addEventListener('keydown', event => {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  event.preventDefault();
  showCertificatePage(galleryPage + (event.key === 'ArrowRight' ? 1 : -1));
});
let galleryTouch;
galleryImage.addEventListener('touchstart', event => { galleryTouch = event.changedTouches[0].clientX; }, {passive:true});
galleryImage.addEventListener('touchend', event => {
  const distance = event.changedTouches[0].clientX - galleryTouch;
  if (Math.abs(distance) > 50) showCertificatePage(galleryPage + (distance < 0 ? 1 : -1));
}, {passive:true});
