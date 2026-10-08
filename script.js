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