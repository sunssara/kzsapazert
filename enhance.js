const formCopy = {
  ru: ['Заявка на лабораторное сопровождение','Ваше имя','Телефон','Электронная почта','Расскажите о проекте','Отправить заявку','Откроется почтовое приложение с заполненной заявкой. Нажмите «Отправить» в письме.'],
  kk: ['Зертханалық сүйемелдеуге өтінім','Аты-жөніңіз','Телефон','Электрондық пошта','Жоба туралы айтыңыз','Өтінім жіберу','Дайын өтінім пошта қолданбасында ашылады. Хаттағы «Жіберу» түймесін басыңыз.'],
  en: ['Request laboratory support','Your name','Phone','Email','Tell us about the project','Send inquiry','Your email app opens with a draft. Select Send in the email app.'],
  zh: ['申请实验室技术支持','您的姓名','电话','电子邮箱','请介绍您的项目','发送申请','邮件应用将打开已填写的草稿。请在邮件应用中点击发送。'],
};

const requestForm = document.querySelector('#request-form');


function updateEnhancements() {
  const lang = document.querySelector('#language').value;
  const labels = formCopy[lang];
  requestForm.querySelectorAll('h3,label,button,p').forEach((element, index) => {
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

requestForm.addEventListener('submit', event => {
  event.preventDefault();
  const labels = formCopy[document.querySelector('#language').value];
  const data = new FormData(requestForm);
  const lines = ['name', 'phone', 'email', 'project'].map((key, index) => `${labels[index + 1]}: ${data.get(key).trim()}`);
  location.href = `mailto:kz.sapa.zertkhanasy@mail.ru?subject=${encodeURIComponent(labels[0])}&body=${encodeURIComponent(lines.join('\r\n'))}`;
});

updateEnhancements();
document.querySelector('#language').addEventListener('change', updateEnhancements);

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
