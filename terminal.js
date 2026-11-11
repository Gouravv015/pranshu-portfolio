// Pranshu's developer terminal: a tiny virtual filesystem you explore with ls / cd / cat.
// Content comes from his résumé only.
const EMAIL = 'ipranshukumar26@gmail.com';
const GITHUB = 'https://github.com/Pranshu936';
const LINKEDIN = 'https://www.linkedin.com/in/pranshu-kumar-iitm';

const box = (title) => {
  const w = 54, pad = w - title.length, l = Math.floor(pad / 2);
  return `╔${'═'.repeat(w)}╗\n║${' '.repeat(l)}${title}${' '.repeat(pad - l)}║\n╚${'═'.repeat(w)}╝\n`;
};
const group = (title, rows) => {
  const w = 52;
  return [`  ┌─── ${title} ${'─'.repeat(w - title.length - 5)}┐`, ...rows.map((r) => `  │  ${r.padEnd(w - 3)}│`), `  └${'─'.repeat(w)}┘`].join('\n');
};

const file = (content) => ({ type: 'file', content });
const dir = (children) => ({ type: 'dir', children });
const FS = dir({
  about: dir({ 'about.txt': file(`${box('ABOUT PRANSHU KUMAR')}
  Name:       Pranshu Kumar
  Role:       Software Developer
  Based in:   Vadodara, India
  Focus:      Backend Systems | AI Applications | Full-Stack

  I'm a software developer skilled in Java, Python and web
  technologies, focused on scalable solutions, full-stack
  development and machine learning.

  I mentor juniors, lead technical projects, and lately I
  give AI agents safe, useful access to real systems.

  Type 'cat skills/skills.txt' to see my tech stack.
  Type 'cd projects' to explore my work.`) }),
  education: dir({ 'education.txt': file(`${box('EDUCATION')}
  🎓 B.Tech Computer Science (CSE Core)
     Parul University, Vadodara · 2023–2027 · CGPA 8.54

  🎓 BS Data Science and Applications
     IIT Madras, Chennai · 2023–present · CGPA 7.04

  Two degrees, in parallel.`) }),
  experience: dir({
    'servicenow.txt': file(`${box('ServiceNow · Associate Software Engineer Intern')}
  Where:  Hyderabad · May 2026 – Jul 2026

  → Built vsf-mcp: a Model Context Protocol server that
    gives Claude authenticated access to ServiceNow VSF
    instances, with OAuth 2.0 + PKCE and 30+ environment
    validation checks.
  → Built agentic SDLC hooks and bundled skills: ATF test
    generation, code coverage estimation, instance scan
    orchestration and test data generation.`),
    'tnp-cell.txt': file(`${box('Training & Placement Cell · Operation Intern')}
  Where:  Parul University · Jul 2026 – present

  → Leading the TNP cell for CSE/IT placements and
    coordinating with companies.
  → Mentoring juniors on résumés, interviews and technical
    skills; organising workshops and placement drives.`),
  }),
  skills: dir({ 'skills.txt': file(`${box('SKILLS')}
${group('Languages', ['Java • Python • C • C++ • JavaScript', 'HTML • CSS'])}

${group('Frameworks', ['Django • Flask • FastAPI'])}

${group('Databases', ['MySQL • PostgreSQL • MongoDB • SQLite'])}

${group('Machine Learning', ['Scikit-learn • PyTorch • Pandas • NumPy', 'Matplotlib • FAISS • QLoRA'])}

${group('Tools', ['VS Code • Jupyter • Colab • PyCharm • Anaconda'])}`) }),
  projects: dir({
    'pandas-docs-assistant.txt': file(`${box('Pandas Documentation Assistant')}
  Tech Stack:  Python, Mistral-7B, QLoRA, FAISS, Gradio, RAG

  Description:
  An AI chatbot for the Pandas library. A fine-tuned
  Mistral-7B-Instruct answers from a FAISS index of the
  official docs. I built the whole RAG pipeline: scraping,
  processing, QLoRA fine-tuning and the Gradio UI.

  Code: ${GITHUB}/pandas-rag-chatbot`),
    'brain-os.txt': file(`${box('Brain OS')}
  Tech Stack:  Python, embeddings, semantic search

  Description:
  An AI-powered knowledge and memory system that organizes,
  connects and retrieves information: semantic search,
  contextual memory, document understanding, automatic
  summaries and knowledge linking.

  Code: ${GITHUB}/BrainOS`),
    'study-room.txt': file(`${box('Study Room')}
  Tech Stack:  Python, Django, SQLite

  Description:
  A full-stack app for finding study partners: create and
  join rooms, chat in real time. Auth, profiles, and full
  CRUD for rooms, topics and messages, with activity feeds.

  Code: ${GITHUB}/StudyRoom`),
  }),
  contact: dir({ 'contact.sh': file(`#!/bin/bash
# ══════════════════════════════════════════════════════
#                  CONTACT PRANSHU
# ══════════════════════════════════════════════════════

echo "📧 Email:    ${EMAIL}"
echo "🐙 GitHub:   github.com/Pranshu936"
echo "💼 LinkedIn: linkedin.com/in/pranshu-kumar-iitm"
echo ""
echo "Feel free to reach out for collaborations!"`) }),
});

/* ---------- filesystem helpers ---------- */
function resolve(cwd, arg) {
  if (arg === '/' || arg === '~') return { node: FS, path: [] };
  const parts = /^[/~]/.test(arg) ? arg.replace('~', '').split('/').filter(Boolean) : [...cwd, ...arg.split('/').filter(Boolean)];
  const path = [];
  for (const p of parts) p === '..' ? path.pop() : p !== '.' && path.push(p);
  let node = FS;
  for (const p of path) {
    if (node.type !== 'dir' || !node.children[p]) return { node: null, path: cwd };
    node = node.children[p];
  }
  return { node, path };
}
const at = (path) => resolve([], '/' + path.join('/')).node;

/* ---------- commands ---------- */
const BANNER = `
 ██████╗ ██████╗  █████╗ ███╗   ██╗███████╗██╗  ██╗██╗   ██╗
 ██╔══██╗██╔══██╗██╔══██╗████╗  ██║██╔════╝██║  ██║██║   ██║
 ██████╔╝██████╔╝███████║██╔██╗ ██║███████╗███████║██║   ██║
 ██╔═══╝ ██╔══██╗██╔══██║██║╚██╗██║╚════██║██╔══██║██║   ██║
 ██║     ██║  ██║██║  ██║██║ ╚████║███████║██║  ██║╚██████╔╝
 ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝`;
const WELCOME = [
  { text: BANNER, type: 'hi', cls: 'banner' }, { text: '' },
  { text: "  Welcome to Pranshu Kumar's Developer Terminal", type: 'hi' },
  { text: '  Software Developer | Backend Systems | AI | Full-Stack', type: 'dim' }, { text: '' },
  { text: "  Type 'help' to see available commands.", type: 'dim', click: 'help' },
  { text: '  Use Tab for autocomplete, ↑/↓ for command history.', type: 'dim' }, { text: '' },
];
const NAMES = ['help', 'ls', 'cd', 'cat', 'clear', 'whoami', 'pwd', 'resume', 'github', 'linkedin', 'email', 'contact', 'back', 'coffee', 'matrix', 'sudo'];
const err = (text) => [{ text, type: 'err' }];

function help(cwd) {
  const c = (text, click) => ({ text, type: 'dim', click });
  const out = [
    { text: '╔══════════════════════════════════════════════════════╗' },
    { text: '║                  AVAILABLE COMMANDS                  ║' },
    { text: '╚══════════════════════════════════════════════════════╝' }, { text: '' },
    { text: '  Navigation:', type: 'hi' },
    c('    ls [dir]          List directory contents', 'ls'),
    c('    cd <dir>          Change directory'),
    c('    cd ..             Go back one directory', 'cd ..'),
    c('    back              Go back (shortcut for cd ..)', 'back'),
    c('    cat <file>        Read file contents'),
    c('    pwd               Print working directory', 'pwd'), { text: '' },
    { text: '  Information:', type: 'hi' },
    c('    whoami            About me', 'whoami'),
    c('    help              Show this help', 'help'), { text: '' },
    { text: '  Quick Access:', type: 'hi' },
    c('    resume            View my résumé', 'resume'),
    c('    github            Open GitHub profile', 'github'),
    c('    linkedin          Open LinkedIn profile', 'linkedin'),
    c('    contact           Contact information', 'contact'), { text: '' },
    { text: '  System:', type: 'hi' },
    c('    clear             Clear terminal', 'clear'), { text: '' },
    { text: '  💡 Tip: Use Tab for autocomplete, ↑/↓ for history', type: 'dim' },
    { text: '  🔍 Try exploring: ls → cd projects → cat brain-os.txt', type: 'dim', click: 'cd projects' },
  ];
  if (cwd.length) out.push({ text: `  📂 Currently in: /${cwd.join('/')}, type 'back' to go up`, type: 'dim', click: 'back' });
  return out;
}

function ls(cwd, arg) {
  const node = arg ? resolve(cwd, arg).node : at(cwd);
  if (!node) return err(`ls: cannot access '${arg}': No such file or directory`);
  if (node.type !== 'dir') return [{ text: arg }];
  const base = arg ? arg.replace(/\/?$/, '/') : '';
  return Object.entries(node.children).map(([name, n]) => n.type === 'dir'
    ? { text: `📁 ${name}/`, type: 'dir', click: `cd ${base}${name}` }
    : { text: `📄 ${name}`, click: `cat ${base}${name}` });
}

function cat(cwd, arg) {
  if (!arg) return err('cat: missing file operand');
  const { node } = resolve(cwd, arg);
  if (!node) return err(`cat: ${arg}: No such file or directory`);
  if (node.type !== 'file') return err(`cat: ${arg}: Is a directory`);
  return node.content.split('\n').map((text) => {
    const url = text.match(/https?:\/\/\S+/);
    return url ? { text, href: url[0] } : { text };
  });
}

function cd(cwd, arg) {
  if (!arg || arg === '~' || arg === '/') return { out: [], cwd: [] };
  const { node, path } = resolve(cwd, arg);
  if (!node) return { out: err(`cd: no such directory: ${arg}`), cwd };
  if (node.type !== 'dir') return { out: err(`cd: not a directory: ${arg}`), cwd };
  return { out: [], cwd: path };
}

// Inside a folder, file listings end with a clickable way back up.
const withBack = (out, cwd) => (cwd.length ? [...out, { text: '' }, { text: "  💡 Type 'back' or 'cd ..' to go back", type: 'dim', click: 'back' }] : out);
const open = (url) => window.open(url, '_blank', 'noopener');

function exec(raw, cwd) {
  const [name = '', ...args] = raw.trim().split(/\s+/);
  const cmd = name.toLowerCase();
  const same = (out) => ({ out, cwd });
  switch (cmd) {
    case 'help': return same(help(cwd));
    case 'ls': return same(withBack(ls(cwd, args[0]), cwd));
    case 'cd': return cd(cwd, args[0]);
    case 'back': return cd(cwd, '..');
    case 'cat': return same(withBack(cat(cwd, args[0]), cwd));
    case 'clear': return { clear: true, cwd };
    case 'pwd': return same([{ text: '/' + cwd.join('/') }]);
    case 'whoami': return same([{ text: 'pranshu: Software Developer focused on backend systems, AI applications and full-stack development. B.Tech CSE @ Parul University + BS Data Science @ IIT Madras.' }]);
    case 'resume': open('assets/Pranshu-Kumar-Resume.pdf'); return same([{ text: '📄 Opening résumé...', type: 'hi' }, { text: 'assets/Pranshu-Kumar-Resume.pdf', type: 'link', href: 'assets/Pranshu-Kumar-Resume.pdf' }]);
    case 'github': open(GITHUB); return same([{ text: '🐙 Opening GitHub profile...', type: 'hi' }, { text: GITHUB, type: 'link', href: GITHUB }]);
    case 'linkedin': open(LINKEDIN); return same([{ text: '💼 Opening LinkedIn profile...', type: 'hi' }, { text: LINKEDIN, type: 'link', href: LINKEDIN }]);
    case 'email': return same([{ text: `📧 ${EMAIL}`, type: 'link', href: `mailto:${EMAIL}` }]);
    case 'contact': return same(cat([], 'contact/contact.sh'));
    case 'coffee': return same([
      { text: '☕ Brewing coffee...' }, { text: '' },
      ...['   ( (', '    ) )', '  ........', '  |      |]', '  \\      /', "   `----'"].map((text) => ({ text, type: 'hi' })),
      { text: '' }, { text: 'Coffee ready! Now back to coding...', type: 'dim' }]);
    case 'matrix': return same([
      { text: '🟢 Entering the Matrix...', type: 'hi' }, { text: '' },
      { text: 'Wake up, Pranshu...' }, { text: 'The Matrix has you...' }, { text: 'Follow the white rabbit. 🐇', type: 'hi' }]);
    case 'sudo': return same(args.join(' ') === 'hire-pranshu'
      ? [{ text: '🔓 Access granted.', type: 'hi' }, { text: '' }, { text: '   ✅ Great developer detected.', type: 'hi' },
        { text: `   📧 Next step: ${EMAIL}`, href: `mailto:${EMAIL}?subject=Let%27s%20talk` }, { text: '   🎉 Welcome aboard!', type: 'hi' }]
      : err("sudo: permission denied. Try 'sudo hire-pranshu'"));
    default: return same(err(`command not found: ${cmd}. Type 'help' for available commands.`));
  }
}

/* ---------- rendering ---------- */
const screen = document.querySelector('.screen');
const outEl = document.querySelector('.out');
const form = document.querySelector('.line--input');
const input = document.querySelector('.in');
const psEl = document.querySelector('.ps');
const TYPE = { err: 't-err', dim: 't-dim', hi: 't-hi', link: 't-link', dir: 't-dir' };

function prompt(cwd) {
  const s = document.createElement('span');
  s.className = 'ps';
  const path = cwd.length ? '~/' + cwd.join('/') : '~';
  s.innerHTML = `<span class="u">pranshu</span><span class="s">@</span><span class="h">portfolio</span><span class="c">:</span><span class="p"></span><span class="d">$&nbsp;</span>`;
  s.querySelector('.p').textContent = path;
  return s;
}

function renderLine({ text, type, click, href, cls }) {
  const pre = document.createElement('pre');
  pre.className = [TYPE[type], cls].filter(Boolean).join(' ');
  if (href) {
    const a = document.createElement('a');
    a.href = href; a.textContent = text; a.target = '_blank'; a.rel = 'noopener';
    if (!type) pre.className = 't-link';
    pre.append(a);
  } else pre.textContent = text || ' ';
  if (!click) return pre;
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'click'; b.append(pre);
  b.addEventListener('click', (e) => { e.stopPropagation(); run(click, false); });
  return b;
}
const renderLines = (lines) => { const d = document.createElement('div'); d.className = 'lines'; lines.forEach((l) => d.append(renderLine(l))); return d; };

let cwd = [];
const history = [];
let hIdx = -1;

function run(raw, fromInput = true) {
  const entry = document.createElement('div');
  entry.className = 'entry';
  const line = document.createElement('div');
  line.className = 'line';
  const typed = document.createElement('span');
  typed.className = 'glow';
  typed.textContent = raw;
  line.append(prompt(cwd), typed);
  entry.append(line);
  if (fromInput) input.value = '';
  if (raw.trim()) {
    history.push(raw); hIdx = -1;
    const res = exec(raw, cwd);
    cwd = res.cwd;
    if (res.clear) { outEl.replaceChildren(); paintPrompt(); return; }
    if (res.out.length) entry.append(renderLines(res.out));
  }
  outEl.append(entry);
  paintPrompt();
  requestAnimationFrame(() => { screen.scrollTop = screen.scrollHeight; });
}
const paintPrompt = () => psEl.replaceChildren(...prompt(cwd).childNodes);

function complete() {
  const parts = input.value.split(/\s+/);
  if (parts.length <= 1) {
    const m = NAMES.filter((n) => n.startsWith(parts[0].toLowerCase()));
    if (m.length === 1) input.value = m[0] + ' ';
    return;
  }
  const segs = parts[parts.length - 1].split('/');
  const partial = segs.pop() || '';
  const prefix = segs.join('/');
  const base = prefix ? resolve(cwd, prefix) : { node: at(cwd) };
  if (!base.node || base.node.type !== 'dir') return;
  const m = Object.keys(base.node.children).filter((k) => k.startsWith(partial));
  if (m.length !== 1) return;
  const suffix = base.node.children[m[0]].type === 'dir' ? '/' : ' ';
  parts[parts.length - 1] = (prefix ? prefix + '/' : '') + m[0] + suffix;
  input.value = parts.join(' ');
}

/* ---------- keystroke sound + volume ---------- */
const embedded = location.hash === '#embed';
let volume = embedded ? 0 : 0.5, actx;
function click() {
  if (!volume) return;
  try {
    actx ||= new AudioContext();
    const t = actx.currentTime, len = 0.015 + Math.random() * 0.01;
    const o = actx.createOscillator(), f = actx.createBiquadFilter(), g = actx.createGain();
    o.type = 'square'; o.frequency.value = 800 + Math.random() * 400;
    f.type = 'highpass'; f.frequency.value = 600;
    g.gain.setValueAtTime(volume * 0.3, t); g.gain.exponentialRampToValueAtTime(0.001, t + len);
    o.connect(f).connect(g).connect(actx.destination);
    o.start(t); o.stop(t + len);
  } catch { /* audio is decoration */ }
}
const volBtn = document.querySelector('.vol__btn'), volRange = document.querySelector('.vol__range');
const ICON_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>';
const ICON_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z"/><line x1="22" y1="9" x2="16" y2="15"/><line x1="16" y1="9" x2="22" y2="15"/></svg>';
function setVolume(v) {
  volume = v; volRange.value = v;
  volBtn.innerHTML = v ? ICON_ON : ICON_OFF;
  volBtn.setAttribute('aria-label', v ? 'Mute keystroke sound' : 'Unmute keystroke sound');
}
volBtn.addEventListener('click', () => setVolume(volume ? 0 : 0.5));
volRange.addEventListener('input', () => setVolume(parseFloat(volRange.value)));
document.querySelector('.vol').addEventListener('click', (e) => e.stopPropagation());
setVolume(volume);

/* ---------- input ---------- */
form.addEventListener('submit', (e) => { e.preventDefault(); run(input.value); });
input.addEventListener('keydown', (e) => {
  click();
  if (e.key === 'Tab') { e.preventDefault(); complete(); }
  else if (e.key === 'ArrowUp' && history.length) {
    e.preventDefault();
    hIdx = hIdx === -1 ? history.length - 1 : Math.max(0, hIdx - 1);
    input.value = history[hIdx];
  } else if (e.key === 'ArrowDown' && hIdx !== -1) {
    e.preventDefault();
    hIdx = hIdx + 1 >= history.length ? -1 : hIdx + 1;
    input.value = hIdx === -1 ? '' : history[hIdx];
  } else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); outEl.replaceChildren(); }
});
document.querySelector('.shell').addEventListener('click', (e) => {
  if (!e.target.closest('a, button, input') && !getSelection().toString()) input.focus({ preventScroll: true });
});

// Inside the PK-1100 (#lcd): an old reflective LCD look, and the machine boots before the prompt appears.
const lcd = location.hash === '#lcd';
document.body.classList.toggle('lcd', lcd);
const BOOT = [
  'PK Personal Computer                       (PK-1100)',
  'Copyright (C) 2026 Pranshu Kumar',
  '',
  'PK-DOS   Version 1.0',
  'Memory check ............ 640K OK',
  'Loading PORTFOLIO.SYS ... done',
  '',
];
paintPrompt();
if (lcd) {
  form.hidden = true;
  const boot = renderLines([]);
  outEl.append(boot);
  BOOT.forEach((text, i) => setTimeout(() => boot.append(renderLine({ text, type: i ? undefined : 'hi' })), 140 * i));
  setTimeout(() => { outEl.append(renderLines(WELCOME)); form.hidden = false; input.focus(); }, 140 * BOOT.length + 250);
} else {
  outEl.append(renderLines(WELCOME));
}
// Embedded in the portfolio page, don't grab focus (it would yank the parent's scroll).
if (!embedded) input.focus();
