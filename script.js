const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const cases = [
  {
    name: 'AD Attack Lab',
    lines: [
      ['alert',  'Kerberoasting on corp.local'],
      ['triage', 'T1558.003 · weak SPNs'],
      ['fixed',  'service accounts hardened'],
    ],
  },
  {
    name: 'Home SOC Lab',
    lines: [
      ['alert',  'SSH brute-force burst'],
      ['triage', 'Splunk · T1110 Brute Force'],
      ['fixed',  'IP blocked · alert tuned'],
    ],
  },
  {
    name: 'NHI Escalation Scanner',
    lines: [
      ['alert',  'iam:PassRole abuse path'],
      ['triage', 'role → admin in 2 hops'],
      ['fixed',  'policy scoped down'],
    ],
  },
  {
    name: 'DevSecOps Terraform Lab',
    lines: [
      ['alert',  'public S3 bucket in PR'],
      ['triage', 'Checkov · CKV_AWS_20'],
      ['fixed',  'merge blocked until fixed'],
    ],
  },
];

(function () {
  const TAGS = { alert: 'ALERT', triage: 'TRIAGE', fixed: 'FIXED' };
  const linesEl = document.getElementById('term-lines');
  const labelEl = document.getElementById('case-label');
  if (!linesEl || !labelEl) return;

  async function typeLine(type, text) {
    const line = document.createElement('div');
    line.className = 'term-line';

    const tag = document.createElement('span');
    tag.className = `tag tag-${type}`;
    tag.textContent = TAGS[type];

    const txt = document.createElement('span');
    txt.className = 'txt';

    line.append(tag, txt);
    linesEl.append(line);

    if (reduceMotion) {
      txt.textContent = text;
      return;
    }

    line.classList.add('typing');
    for (const ch of text) {
      txt.textContent += ch;
      await sleep(30);
    }
    line.classList.remove('typing');
  }

  async function run() {
    let i = 0;
    while (true) {
      const c = cases[i];
      labelEl.textContent = `0${i + 1} / ${c.name}`;
      linesEl.innerHTML = '';

      for (const [type, text] of c.lines) {
        await typeLine(type, text);
        await sleep(400);
      }

      await sleep(2800);
      i = (i + 1) % cases.length;
    }
  }

  run();
})();

(function () {
  const loader = document.getElementById('loader');
  if (!loader) return;

  const num = document.getElementById('loader-num');
  const word = document.getElementById('loader-word');

  function finish() {
    document.body.classList.remove('loading');
    loader.remove();
  }

  let seen = false;
  try {
    seen = sessionStorage.getItem('introSeen') === '1';
  } catch (e) {}

  if (seen || reduceMotion) {
    finish();
    return;
  }

  async function intro() {
    let p = 0;
    await sleep(1500);
    while (p < 100) {
      p = Math.min(100, p + Math.ceil(Math.random() * 15));
      num.textContent = p;
      await sleep(80 + Math.random() * 110);
    }
    await sleep(300);

    loader.classList.add('granted');
    word.textContent = 'WELCOME';
    await sleep(700);

    loader.classList.add('expand');
    await sleep(650);

    loader.classList.add('fill');
    await sleep(600);

    document.body.classList.remove('loading');
    loader.classList.add('done');
    try {
      sessionStorage.setItem('introSeen', '1');
    } catch (e) {}
    await sleep(700);
    loader.remove();
  }

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (location.hash) history.replaceState(null, '', location.pathname);
  window.scrollTo(0, 0);

  intro();
})();

(function () {
  const header = document.getElementById('site-header');
  const hero = document.querySelector('.hero');
  if (!header || !hero) return;

  function updateHeader() {
    header.classList.toggle('is-solid', window.scrollY > 40);
  }

  window.addEventListener('scroll', updateHeader, { passive: true });
  window.addEventListener('resize', updateHeader);
  updateHeader();

  const links = Array.from(document.querySelectorAll('.site-nav a'));
  const pairs = links
    .map((a) => ({ link: a, section: document.querySelector(a.getAttribute('href')) }))
    .filter((p) => p.section && p.section !== document.body);

  function updateActive() {
    let current = links[0];
    if (window.scrollY > 40) {
      const line = window.innerHeight * 0.4;
      pairs.forEach((p) => {
        if (p.section.getBoundingClientRect().top <= line) current = p.link;
      });
    }
    links.forEach((a) => a.classList.toggle('is-active', a === current));
  }

  window.addEventListener('scroll', updateActive, { passive: true });
  window.addEventListener('resize', updateActive);
  updateActive();
})();

(function () {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;

  const root = document.documentElement;

  function label() {
    const dark = root.dataset.theme === 'dark';
    btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  }

  label();

  btn.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    label();
    try {
      localStorage.setItem('theme', next);
    } catch (e) {}
  });
})();

(function () {
  const textEl = document.getElementById('about-text');
  if (!textEl) return;

  const words = textEl.textContent.trim().split(/\s+/);
  textEl.innerHTML = words.map((word) => `<span class="w">${word}</span>`).join(' ');
  const spans = Array.from(textEl.querySelectorAll('.w'));

  if (reduceMotion) {
    spans.forEach((s) => s.classList.add('on'));
    return;
  }

  function update() {
    const line = window.innerHeight * 0.75;
    spans.forEach((s) => {
      s.classList.toggle('on', s.getBoundingClientRect().top < line);
    });
  }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  }, { passive: true });

  window.addEventListener('resize', update);
  update();
})();

(function () {
  const canvas = document.getElementById('bg-stars');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const palettes = {
    dark:  ['95, 212, 196', '120, 160, 255', '232, 236, 233'],
    light: ['13, 143, 128', '70, 110, 230', '120, 110, 210'],
  };
  const isDark = () => document.documentElement.dataset.theme === 'dark';
  let dots = [];
  let w = 0;
  let h = 0;

  function makeDot() {
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.3 + 0.4,
      vx: (Math.random() - 0.5) * 0.12,
      vy: -(Math.random() * 0.18 + 0.04),
      a: Math.random() * 0.5 + 0.2,
      tw: Math.random() * Math.PI * 2,
      c: Math.floor(Math.random() * 3),
    };
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.min(110, Math.round((w * h) / 14000));
    dots = Array.from({ length: count }, makeDot);
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    for (const d of dots) {
      if (!reduceMotion) {
        d.x += d.vx;
        d.y += d.vy;
        d.tw += 0.02;

        if (d.y < -5) { d.y = h + 5; d.x = Math.random() * w; }
        if (d.x < -5) d.x = w + 5;
        if (d.x > w + 5) d.x = -5;
      }

      const alpha = d.a * (0.65 + 0.35 * Math.sin(d.tw));
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      const color = (isDark() ? palettes.dark : palettes.light)[d.c];
      ctx.fillStyle = `rgba(${color}, ${alpha})`;
      ctx.fill();
    }

    if (!reduceMotion) requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => {
    resize();
    if (reduceMotion) draw();
  });
  resize();
  draw();
})();

(function () {
  const layer = document.querySelector('.bg-fx');
  if (!layer || !window.matchMedia('(hover: hover)').matches) return;

  const glow = document.createElement('div');
  Object.assign(glow.style, {
    position: 'absolute',
    left: '0',
    top: '0',
    width: '640px',
    height: '640px',
    marginLeft: '-320px',
    marginTop: '-320px',
    borderRadius: '50%',
    background: 'var(--cursor-glow)',
    opacity: '0',
    transition: 'opacity 0.6s ease',
    willChange: 'transform',
    pointerEvents: 'none',
  });
  layer.appendChild(glow);

  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  let tx = x;
  let ty = y;

  window.addEventListener('mousemove', (e) => {
    tx = e.clientX;
    ty = e.clientY;
    glow.style.opacity = '1';
  }, { passive: true });

  document.addEventListener('mouseleave', () => {
    glow.style.opacity = '0';
  });

  function follow() {
    x += (tx - x) * (reduceMotion ? 1 : 0.6);
    y += (ty - y) * (reduceMotion ? 1 : 0.6);
    glow.style.transform = `translate(${x}px, ${y}px)`;
    requestAnimationFrame(follow);
  }
  follow();
})();

(function () {
  const form = document.getElementById('contact-form');
  const status = document.getElementById('cf-status');
  if (!form || !status) return;

  const button = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.className = 'ft-status';
    status.textContent = 'Sending…';
    button.disabled = true;

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        form.reset();
        status.classList.add('ok');
        status.textContent = 'Message sent. I\'ll get back to you soon.';
      } else {
        throw new Error('Request failed');
      }
    } catch (err) {
      status.classList.add('bad');
      status.textContent = 'That didn\'t send. Email me at harshvardhan.kamble@outlook.com instead.';
    } finally {
      button.disabled = false;
    }
  });
})();

(function () {
  const items = document.querySelectorAll('.jr-item');
  if (!items.length) return;

  if (reduceMotion || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('in'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -12% 0px' });

  items.forEach((el) => observer.observe(el));
})();

(function () {
  const menu = document.querySelector('.cta-resume');
  if (!menu) return;

  document.addEventListener('click', (e) => {
    if (menu.open && !menu.contains(e.target)) menu.open = false;
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') menu.open = false;
  });
})();

(function () {
  const btn = document.getElementById('to-top');
  if (!btn) return;

  function update() {
    btn.classList.toggle('show', window.scrollY > window.innerHeight * 0.8);
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
})();