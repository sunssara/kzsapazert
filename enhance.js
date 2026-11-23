const formCopy = {
  ru: ['Оставить заявку','Ваше имя','Телефон','Электронная почта (необязательно)','Услуга','Комментарий (необязательно)','Отправить заявку','Выберите услугу', 'Другое'],
  kk: ['Өтінім қалдыру','Аты-жөніңіз','Телефон','Электрондық пошта (міндетті емес)','Қызмет','Түсініктеме (міндетті емес)','Өтінім жіберу','Қызметті таңдаңыз', 'Басқа'],
  en: ['Request a quote','Your name','Phone','Email (optional)','Service','Comment (optional)','Send inquiry','Select a service', 'Other'],
  zh: ['提交申请','您的姓名','电话','电子邮箱（选填）','服务','备注（选填）','发送申请','请选择服务', '其他'],
};

const requestForm = document.querySelector('#request-form');
const requestServices = ['soil', 'concrete', 'asphalt', 'aggregates', 'rebar', 'onsite'];
const requestServiceSelect = document.querySelector('#request-service');
const requestToken = requestForm.elements.namedItem('token');
let tokenRequest;

function prepareRequest() {
  tokenRequest ??= fetch('request.php', {cache: 'no-store'})
    .then(async response => {
      if (!response.ok) throw new Error('Form token unavailable');
      const {token} = await response.json();
      if (typeof token !== 'string' || !token) throw new Error('Missing form token');
      requestToken.value = token;
    })
    .finally(() => { tokenRequest = undefined; });
  return tokenRequest;
}

function updateEnhancements() {
  const lang = document.querySelector('#language').value;
  const labels = formCopy[lang];
  requestForm.setAttribute('aria-label', labels[0]);
  document.querySelector('#project-dialog').setAttribute('aria-label', labels[0]);
  requestForm.querySelectorAll('.request-field label, button[type="submit"]').forEach((element, index) => {
    element.textContent = labels[index + 1];
  });
  const selected = requestServiceSelect.value;
  requestServiceSelect.replaceChildren(
    new Option(labels[7], ''),
    ...serviceCopy[lang].items.map(([title], index) => new Option(title, requestServices[index])),
    new Option(labels[8], 'other')
  );
  requestServiceSelect.value = selected;
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
    if (!requestToken.value) await prepareRequest();
    const response = await fetch('request.php', {method: 'POST', body: new FormData(requestForm)});
    const result = await response.json();
    if (!response.ok || !result.ok) {
      if (result.error === 'token') requestToken.value = '';
      throw new Error('Request rejected');
    }
    requestForm.reset();
    if (projectDialog.open) projectDialog.close();
    const dialog = document.querySelector('#request-success');
    dialog.querySelector('h3').textContent = success;
    dialog.querySelector('button').textContent = close;
    if (dialog.showModal) dialog.showModal();
    else status.textContent = success;
    void prepareRequest().catch(() => {});
  } catch {
    status.textContent = error;
  } finally {
    submit.disabled = false;
  }
});

updateEnhancements();
document.querySelector('#language').addEventListener('change', updateEnhancements);

void prepareRequest().catch(() => {});

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
const projectLinks = ':is(a[data-t="cta"], a[data-t="writeUs"], a[data-t="quote"])[href="#request-form"]';
document.querySelectorAll(projectLinks).forEach(link => link.setAttribute('aria-haspopup', 'dialog'));
document.addEventListener('click', event => {
  const trigger = event.target.closest(projectLinks);
  if (!trigger) return;
  const lang = document.querySelector('#language').value;
  if (!projectDialog.showModal) return;
  event.preventDefault();
  projectTrigger = trigger;
  projectClose.ariaLabel = {ru:'Закрыть',kk:'Жабу',en:'Close',zh:'关闭'}[lang];
  projectDialog.append(requestForm);
  projectDialog.showModal();
  projectClose.focus();
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

const nativeLanguage = document.querySelector('#language');
const languagePicker = document.querySelector('.language-picker');
const languageSummary = languagePicker.querySelector('summary');
const languageCurrent = languagePicker.querySelector('.language-current');
const languageOptions = languagePicker.querySelector('.language-options');
const languageNames = { ru: 'Русский', kk: 'Қазақша', en: 'English', zh: '中文' };
const languageLabels = { ru: 'Язык', kk: 'Тіл', en: 'Language', zh: '语言' };

for (const option of nativeLanguage.options) {
  const button = document.createElement('button');
  button.type = 'button';
  button.value = option.value;
  button.textContent = option.textContent;
  button.setAttribute('aria-label', languageNames[option.value]);
  button.addEventListener('click', () => {
    if (nativeLanguage.value !== option.value) {
      nativeLanguage.value = option.value;
      nativeLanguage.dispatchEvent(new Event('change', { bubbles: true }));
    }
    languagePicker.open = false;
    languageSummary.focus();
  });
  languageOptions.append(button);
}

function updateLanguagePicker() {
  const current = nativeLanguage.selectedOptions[0];
  languageCurrent.textContent = current.textContent;
  languageSummary.setAttribute('aria-label', languageLabels[current.value] + ': ' + current.textContent);
  for (const button of languageOptions.children) {
    button.setAttribute('aria-current', String(button.value === current.value));
  }
}
nativeLanguage.addEventListener('change', updateLanguagePicker);
updateLanguagePicker();
nativeLanguage.hidden = true;
languagePicker.hidden = false;

document.addEventListener('click', event => {
  if (!languagePicker.contains(event.target)) languagePicker.open = false;
});
languagePicker.addEventListener('focusout', event => {
  if (!languagePicker.contains(event.relatedTarget)) languagePicker.open = false;
});
languagePicker.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || !languagePicker.open) return;
  event.preventDefault();
  event.stopPropagation();
  languagePicker.open = false;
  languageSummary.focus();
});
