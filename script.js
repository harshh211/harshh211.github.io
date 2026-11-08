// ---------- Animated case card ----------
// Each case = one project, told as alert → triage → fix.
// Edit the text so it matches what you actually did in each lab.
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

const TAGS = { alert: 'ALERT', triage: 'TRIAGE', fixed: 'FIXED' };
const linesEl = document.getElementById('term-lines');
const labelEl = document.getElementById('case-label');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Types one line: colored tag first, then the text letter by letter
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

// Loops through every case forever
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

    await sleep(2800); // pause so people can read it
    i = (i + 1) % cases.length;
  }
}

if (linesEl && labelEl) run();

// ---------- Intro loader ----------
(function () {
  const loader = document.getElementById('loader');
  if (!loader) return;

  const num = document.getElementById('loader-num');
  const word = document.getElementById('loader-word');

  // Removes the loader and starts the hero animation
  function finish() {
    document.body.classList.remove('loading');
    loader.remove();
  }

  // Only play once per visit (and skip for people who prefer less motion)
  let seen = false;
  try {
    seen = sessionStorage.getItem('introSeen') === '1';
  } catch (e) {}

  if (seen || reduceMotion) {
    finish();
    return;
  }

  async function intro() {
    // 1. Count 0% → 100% in random jumps, like a real loader
    let p = 0;
    await sleep(1500);
    while (p < 100) {
      p = Math.min(100, p + Math.ceil(Math.random() * 15));
      num.textContent = p;
      await sleep(80 + Math.random() * 110);
    }
    await sleep(300);

    // 2. Switch to ACCESS GRANTED
    loader.classList.add('granted');
    word.textContent = 'WELCOME';
    await sleep(700);

    // 3. Stretch the pill wide
    loader.classList.add('expand');
    await sleep(650);

    // 4. Fill the whole screen
    loader.classList.add('fill');
    await sleep(600);

    // 5. Fade out and reveal the site
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
// ---------- About: words sharpen as you scroll ----------
(function () {
  const textEl = document.getElementById('about-text');
  if (!textEl) return;

  // Wrap every word in its own <span class="w">
  const words = textEl.textContent.trim().split(/\s+/);
  textEl.innerHTML = words.map((word) => `<span class="w">${word}</span>`).join(' ');
  const spans = Array.from(textEl.querySelectorAll('.w'));

  // People who prefer less motion just see the full text
  if (reduceMotion) {
    spans.forEach((s) => s.classList.add('on'));
    return;
  }

  // A word lights up once it passes 75% of the way up the screen
  // (and fades back if you scroll up again)
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
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const colors = ['95, 212, 196', '120, 160, 255', '232, 236, 233']; // teal, blue, white
  let dots = [];
  let w = 0;
  let h = 0;

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

  function makeDot() {
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.3 + 0.4,              // size
      vx: (Math.random() - 0.5) * 0.12,          // slow sideways drift
      vy: -(Math.random() * 0.18 + 0.04),        // slow upward drift
      a: Math.random() * 0.5 + 0.2,              // brightness
      tw: Math.random() * Math.PI * 2,           // twinkle phase
      c: colors[Math.floor(Math.random() * colors.length)],
    };
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    for (const d of dots) {
      if (!calm) {
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
      ctx.fillStyle = `rgba(${d.c}, ${alpha})`;
      ctx.fill();
    }

    if (!calm) requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
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
    background: 'radial-gradient(circle, rgba(255, 255, 255, 0.07) 0%, rgba(160, 190, 255, 0.04) 30%, transparent 65%)',
    opacity: '0',
    transition: 'opacity 0.6s ease',
    willChange: 'transform',
    pointerEvents: 'none',
  });
  layer.appendChild(glow);

  const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
    x += (tx - x) * (smooth ? 0.6 : 1);
    y += (ty - y) * (smooth ? 0.6 : 1);
    glow.style.transform = `translate(${x}px, ${y}px)`;
    requestAnimationFrame(follow);
  }
  follow();
})();