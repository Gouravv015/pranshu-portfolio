// GSAP + ScrollTrigger for choreography, Lenis as the only smooth-scroll engine,
// matter.js for the toolbox (loaded on approach), WebAudio ambient sound (opt-in).
const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer: fine)').matches;
let audio = null; // ambient sound, created on first toggle
const narrow = () => innerWidth < 900;

const { gsap, ScrollTrigger } = window;
if (!gsap || !ScrollTrigger) {
  root.classList.add('ready');
  document.querySelector('.pre')?.remove();
  throw new Error('GSAP unavailable: static page shown.');
}
gsap.registerPlugin(ScrollTrigger);

/* ================= Smooth scroll + anchors ================= */
let lenis = null;
if (!reduce && window.Lenis) {
  lenis = new window.Lenis({ lerp: 0.075, wheelMultiplier: 0.95, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
function goTo(hash) {
  const el = hash === '#top' ? null : document.querySelector(hash);
  if (hash !== '#top' && !el) return false;
  if (lenis) lenis.scrollTo(el || 0, { duration: 1.8, easing: (t) => 1 - Math.pow(1 - t, 4) });
  else scrollTo({ top: el ? el.getBoundingClientRect().top + scrollY : 0 });
  if (el) { el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: true }); }
  return true;
}
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (a && goTo(a.getAttribute('href'))) e.preventDefault();
});

/* ================= Clock ================= */
const clock = document.querySelector('.clock');
const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
const tickClock = () => { clock.textContent = fmt.format(new Date()); };
tickClock(); setInterval(tickClock, 15000);

/* ================= Cursor ================= */
const cursor = document.querySelector('.cursor');
if (fine && !reduce) {
  const label = cursor.querySelector('.cursor__label');
  const cx = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
  const cy = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });
  addEventListener('pointermove', (e) => { cx(e.clientX); cy(e.clientY); }, { passive: true });
  document.addEventListener('pointerover', (e) => {
    const lab = e.target.closest('[data-cursor]');
    const link = e.target.closest('a, button');
    label.textContent = lab ? lab.dataset.cursor : '';
    cursor.classList.toggle('has-label', !!lab);
    cursor.classList.toggle('is-link', !lab && !!link);
    cursor.classList.toggle('is-text', !lab && !link && !!e.target.closest('.h2, .about__text, .hn, .talk, .xp__what h3'));
  });
  document.addEventListener('pointerleave', () => gsap.to(cursor, { opacity: 0, duration: 0.2 }));
  document.addEventListener('pointerenter', () => gsap.to(cursor, { opacity: 1, duration: 0.2 }));
} else cursor.remove();

/* ================= Hero: kinetic name + typed intro ================= */
// Size PRANSHU so it spans the hero edge to edge.
function fitHero() {
  const row = document.querySelector('.hn');
  if (!row) return;
  row.style.setProperty('--fit', '100px');
  row.style.display = 'inline-block'; // measure the word itself, not its container
  const w = row.getBoundingClientRect().width;
  row.style.display = '';
  // the hero's inner width (not the heading's, which a too-wide word would stretch)
  const hero = row.closest('.hero'), cs = getComputedStyle(hero);
  const avail = hero.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  if (w) row.style.setProperty('--fit', `${Math.floor(Math.min((100 * avail) / w * 0.995, innerHeight * 0.6))}px`);
}
document.fonts?.ready.then(() => { fitHero(); ScrollTrigger.refresh(); });
addEventListener('resize', fitHero);
const heroChars = [];
document.querySelectorAll('.hn').forEach((row) => {
  const dot = row.querySelector('.hn__dot');
  const text = row.firstChild.textContent;
  const chars = [...text].map((c) => Object.assign(document.createElement('span'), { className: 'ch', textContent: c }));
  row.replaceChildren(...chars, ...(dot ? [dot] : []));
  heroChars.push(...chars);
});
if (fine && !reduce) {
  // Letters rise and stretch upward as the cursor nears them.
  gsap.set(heroChars, { transformOrigin: '50% 100%' });
  const set = heroChars.map((l) => ({ y: gsap.quickTo(l, 'yPercent', { duration: 0.5, ease: 'power3' }), s: gsap.quickTo(l, 'scaleY', { duration: 0.5, ease: 'power3' }) }));
  const heroEl = document.querySelector('.hero');
  let centers = [];
  const measureChars = () => { centers = heroChars.map((l) => { const r = l.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }); };
  heroEl.addEventListener('pointerenter', measureChars);
  heroEl.addEventListener('pointermove', (e) => {
    if (!centers.length) measureChars();
    heroChars.forEach((_, i) => {
      const k = Math.max(0, 1 - Math.hypot(e.clientX - centers[i][0], (e.clientY - centers[i][1]) * 1.4) / (innerWidth * 0.18));
      set[i].y(-10 * k); set[i].s(1 + 0.14 * k);
    });
  });
  heroEl.addEventListener('pointerleave', () => set.forEach((q) => { q.y(0); q.s(1); }));
  addEventListener('resize', () => { centers = []; });
}

// Typed intro: real things from his résumé, in his voice.
const LINES = ['I build MCP servers.', 'I make models read the manual.', 'I connect AI agents to real systems.', 'I study two degrees at once.', 'I help juniors get placed.'];
const typed = document.querySelector('.typed');
function startTyping() {
  if (reduce) return;
  let li = 0, ci = LINES[0].length, deleting = true;
  const step = () => {
    const line = LINES[li];
    if (deleting) {
      ci--;
      if (ci <= 0) { deleting = false; li = (li + 1) % LINES.length; }
    } else {
      ci++;
      if (ci >= LINES[li].length) { deleting = true; typed.textContent = LINES[li]; return setTimeout(step, 2200); }
    }
    typed.textContent = (deleting ? line : LINES[li]).slice(0, Math.max(0, ci));
    setTimeout(step, deleting ? 28 : 55 + Math.random() * 50);
  };
  setTimeout(step, 1800);
}

/* ================= Preloader ================= */
const pre = document.querySelector('.pre');

const EASE = 'expo.out'; // closest GSAP curve to cubic-bezier(.22, 1, .36, 1)
const GREETINGS = ['Hello', 'नमस्ते', 'Bonjour', 'Ciao', 'Olá', 'こんにちは', 'Hallå', 'Guten Tag', 'Hallo'];

async function boot() {
  lenis?.stop();
  if (reduce) { pre.remove(); return showChoice(); }
  const word = pre.querySelector('.pre__word');
  const txt = pre.querySelector('.pre__txt');
  const path = pre.querySelector('.pre__curve path');

  // The fill is a rectangle with a bowed bottom edge (300px deep); lifting the screen flattens it.
  const shape = (bow) => {
    const w = innerWidth, h = innerHeight;
    return `M0 0 L${w} 0 L${w} ${h} Q${w / 2} ${h + bow} 0 ${h} L0 0 Z`;
  };
  path.setAttribute('d', shape(300));

  // First greeting lingers, the rest flash by.
  gsap.fromTo(word, { opacity: 0 }, { opacity: 1, duration: 1, delay: 0.2 });
  await Promise.all([new Promise((r) => setTimeout(r, 700)), document.fonts.load('400 100px Anton').catch(() => {})]);
  for (let i = 1; i < GREETINGS.length; i++) {
    txt.textContent = GREETINGS[i];
    await new Promise((r) => setTimeout(r, 110));
  }
  await new Promise((r) => setTimeout(r, 150));

  // Exit: the word slides up and fades while the whole screen lifts and its curved edge flattens.
  const LIFT = 'power4.inOut'; // close to cubic-bezier(.76, 0, .24, 1)
  const bow = { v: 300 };
  await gsap.timeline()
    .to(word, { y: -100, opacity: 0, duration: 0.8, ease: LIFT }, 0)
    .to(pre, { yPercent: -100, duration: 0.8, ease: LIFT }, 0.2)
    .to(bow, { v: 0, duration: 0.7, ease: LIFT, onUpdate: () => path.setAttribute('d', shape(bow.v)) }, 0.5)
    .add(showChoice, 0.55);
  pre.remove();
}

// The hero entrance, played once the visitor picks "Portfolio".
let entered = false;
function enterPortfolio() {
  root.classList.add('ready');
  lenis?.start();
  if (entered || reduce) { entered = true; return ScrollTrigger.refresh(); }
  entered = true;
  ScrollTrigger.refresh();
  const row = document.querySelector('.hn');
  row.classList.add('is-masked');
  gsap.timeline()
    // PRANSHU rises letter by letter from below its baseline
    .from(heroChars, { yPercent: 115, duration: 1.2, ease: 'expo.out', stagger: 0.06, onComplete: () => row.classList.remove('is-masked') }, 0)
    .from('.hero__hi, .hero__type, .hero__cta > *', { y: 24, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.08 }, 0.6)
    .add(startTyping, 1.4)
    .from('.nav > *', { yPercent: -120, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.06 }, 0.5)
    .from('.hero__ui > *', { y: 30, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08 }, 0.7);
}

/* ================= Choose your experience: the website, or the PK-1100 laptop ================= */
const choice = document.querySelector('.choice');
const gl = choice.querySelector('.choice__gl');
let sfx = null; // one AudioContext for the UI blips, created on the first click
const ctx = () => (sfx ||= new (window.AudioContext || window.webkitAudioContext)());
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
function tone(c, freq, dur, type = 'square', vol = 0.08) {
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, c.currentTime);
  g.gain.setValueAtTime(vol, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
  o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + dur);
}
function pickSound() {
  const c = ctx(), o = c.createOscillator(), g = c.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(600, c.currentTime); o.frequency.exponentialRampToValueAtTime(1200, c.currentTime + 0.08);
  g.gain.setValueAtTime(0.12, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
  o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + 0.15);
  setTimeout(() => tone(c, 1800, 0.1, 'triangle', 0.05), 40);
}

// The 3D laptop loads while the preloader runs. If WebGL or the CDN fails, the "boot" button still works.
let laptop = null;
const laptopReady = import('./laptop.js?v=15')
  .then(({ createLaptop }) => { laptop = createLaptop(gl, { reduce }); })
  .catch(() => gl.remove());
gl.addEventListener('laptophover', (e) => choice.classList.toggle('is-lap-hover', e.detail));
gl.addEventListener('click', (e) => { if (laptop?.hits(e)) pick('terminal'); });
gl.addEventListener('laptopboot', () => setTimeout(() => pick('terminal'), 350)); // typed BOOT on the laptop

// While the choice screen is up, your real keyboard types on the 3D laptop.
addEventListener('keydown', (e) => {
  if (choice.hidden || !lap.hidden || busy || !laptop || e.metaKey || e.ctrlKey) return;
  if (e.target.closest?.('input, textarea')) return;
  if (e.key === 'Enter' && e.target.closest?.('button')) return; // Enter on a focused button still presses it
  if (laptop.keyDown(e)) e.preventDefault();
});

// Sounds for the laptop, only when the site's sound is switched on: a drive whirr on hover, clicks on keys.
function noiseBurst(dur, freq, vol, q = 1) {
  const c = ctx(), n = Math.ceil(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  src.buffer = buf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
  g.gain.value = vol; src.connect(f).connect(g).connect(c.destination); src.start();
  return f;
}
gl.addEventListener('laptopkey', (e) => {
  if (!audio?.on) return;
  noiseBurst(e.detail === 'boot' ? 0.05 : 0.035, e.detail === 'boot' ? 900 : 2600 + Math.random() * 800, e.detail === 'boot' ? 0.05 : 0.09, 2);
});
gl.addEventListener('laptophover', (e) => {
  if (!e.detail || !audio?.on) return;
  const f = noiseBurst(0.7, 300, 0.05, 3), c = ctx();
  f.frequency.setValueAtTime(300, c.currentTime); f.frequency.linearRampToValueAtTime(900, c.currentTime + 0.35); f.frequency.linearRampToValueAtTime(420, c.currentTime + 0.7);
  [0.1, 0.25, 0.4].forEach((t) => setTimeout(() => noiseBurst(0.012, 3200, 0.06, 4), t * 1000)); // head seeks
});

async function showChoice() {
  choice.hidden = false;
  gsap.set('.choice__title, .choice__site, .choice__term', { opacity: 1 }); // the dive fades these out
  gsap.set(gl, { clearProps: 'filter,scale,transform' });
  await laptopReady;
  laptop?.reset(); laptop?.start();
  choice.focus({ preventScroll: true });
  if (reduce) return;
  laptop?.intro();
  gsap.timeline()
    .fromTo(choice, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: EASE })
    .fromTo('.choice__title', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5 }, 0.2)
    .fromTo('.choice__site', { opacity: 0, x: -80, y: 60 }, { opacity: 1, x: 0, y: 0, duration: 0.9, ease: EASE, clearProps: 'transform' }, 0.3)
    .fromTo('.choice__term > *', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, ease: EASE, stagger: 0.08 }, 0.6);
}
async function hideChoice() {
  if (!reduce) await gsap.to(choice, { opacity: 0, filter: 'blur(10px)', duration: 0.6, ease: EASE });
  choice.hidden = true;
  gsap.set(choice, { filter: 'none' });
  laptop?.stop();
}
let busy = false;
async function pick(kind) {
  if (busy) return;
  busy = true;
  try { pickSound(); } catch { /* sound is decoration */ }
  if (kind === 'terminal') {
    // Fly into the screen; the bezel view takes over just before the camera arrives.
    if (laptop && !reduce) {
      gsap.to('.choice__title, .choice__site, .choice__term', { opacity: 0, duration: 0.35 });
      laptop.dive();
      // passing through the glass: the 3D view smears and splits its colours just before the bezel view takes over
      gsap.to(gl, { delay: 0.75, duration: 0.35, ease: 'power2.in', scale: 1.08,
        filter: 'blur(2px) drop-shadow(3px 0 0 rgba(255,0,60,.45)) drop-shadow(-3px 0 0 rgba(0,120,255,.45))' });
      await wait(1000);
    }
    await openLap('choice');
    choice.hidden = true;
    laptop?.stop();
  } else if (reduce) {
    await hideChoice();
    enterPortfolio();
  } else {
    // Stairs: blue columns rise to cover the screen, the site swaps in behind them, then they lift away.
    const stairs = document.querySelector('.stairs'), cols = stairs.children;
    gsap.set(stairs, { visibility: 'visible' });
    gsap.set(cols, { yPercent: 0, scaleY: 0, transformOrigin: '50% 100%' });
    await gsap.to(cols, { scaleY: 1, duration: 0.55, ease: 'power3.in', stagger: 0.06 });
    choice.hidden = true; laptop?.stop();
    scrollTo(0, 0); fitHero();
    gsap.to(cols, { yPercent: -100, duration: 0.8, ease: 'power4.inOut', stagger: 0.06, onComplete: () => gsap.set(stairs, { visibility: 'hidden' }) });
    gsap.delayedCall(0.45, enterPortfolio);
  }
  busy = false;
}
choice.addEventListener('click', (e) => { const b = e.target.closest('[data-pick]'); if (b) pick(b.dataset.pick); });

// Website card: the blue light follows the cursor.
const site = choice.querySelector('.choice__site');
site.addEventListener('pointermove', (e) => {
  const r = site.getBoundingClientRect();
  site.style.setProperty('--mx', `${e.clientX - r.left}px`); site.style.setProperty('--my', `${e.clientY - r.top}px`);
});
// Tilted card: the card leans toward the cursor and lifts; the Enter pill sits above it in 3D, so it drifts with the tilt.
if (fine && !reduce) {
  const tilt = { duration: 0.6, ease: 'power3' };
  const rx = gsap.quickTo(site, 'rotationX', tilt), ry = gsap.quickTo(site, 'rotationY', tilt), sc = gsap.quickTo(site, 'scale', tilt);
  const AMP = 12;
  site.addEventListener('pointermove', (e) => {
    const r = site.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
    rx(-py * AMP * 2); ry(px * AMP * 2); sc(1.05);
  });
  site.addEventListener('pointerleave', () => { rx(0); ry(0); sc(1); });
}


/* ================= Inside the PK-1100: the bezel, the cracked LCD, the live terminal ================= */
const lap = document.querySelector('.lap');
const lapFrame = lap.querySelector('.lap__frame');
const crackCanvas = lap.querySelector('.lap__crack');
let lapFrom = 'page';
// The crack is drawn at the screen's real pixel size (and redrawn on resize) so its hairlines stay sharp.
// The same geometry also builds a displacement map that breaks the terminal's text along the shards.
const grainEl = lap.querySelector('.lap__grain'), mapEl = lap.querySelector('.lap__map');
async function paintCrack() {
  const { drawCrack, crackDisplacement } = await import('./crack.js?v=3');
  const r = crackCanvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio, 2);
  const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
  crackCanvas.width = w; crackCanvas.height = h;
  drawCrack(crackCanvas.getContext('2d'), w, h);
  const map = crackDisplacement(w, h);
  mapEl.setAttribute('href', map.toDataURL());
  mapEl.setAttribute('width', r.width); mapEl.setAttribute('height', r.height);
  lapFrame.classList.add('is-cracked');
  if (!grainEl.style.backgroundImage) grainEl.style.backgroundImage = `url(${noise(220)})`;
}
// Monochrome noise tile for the grain.
function noise(n) {
  const c = document.createElement('canvas'); c.width = c.height = n;
  const g = c.getContext('2d'), img = g.createImageData(n, n);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 90;
  }
  g.putImageData(img, 0, 0);
  return c.toDataURL();
}
addEventListener('resize', () => { if (!lap.hidden) paintCrack(); });
async function openLap(from) {
  lapFrom = from;
  lenis?.stop();
  lapFrame.src = 'terminal.html?v=3#lcd'; // a fresh boot every time you open it
  lap.hidden = false;
  paintCrack();
  if (!reduce) {
    if (from === 'choice') {
      gsap.fromTo(lap.querySelector('.lap__glass'), { scale: 7 }, { scale: 1, duration: 0.8, ease: 'power3.out', clearProps: 'transform,scale' });
      gsap.fromTo(lap.querySelector('.lap__screen'), { filter: 'blur(6px) contrast(1.3)' }, { filter: 'blur(0px) contrast(1)', duration: 0.7, ease: 'power2.out', clearProps: 'filter' });
    }
    await gsap.fromTo(lap, { opacity: 0 }, { opacity: 1, duration: 0.45, ease: 'power2.out' });
  }
  lapFrame.focus();
}
lapFrame.addEventListener('load', () => lapFrame.contentWindow?.document.querySelector('.in')?.focus());
async function closeLap() {
  if (!reduce) await gsap.to(lap, { opacity: 0, duration: 0.35 });
  lap.hidden = true;
  lapFrame.removeAttribute('src');
  if (lapFrom === 'choice') showChoice();
  else lenis?.start();
}
lap.querySelector('.lap__back').addEventListener('click', closeLap);
lap.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLap(); });

/* ================= Scroll choreography ================= */
const nav = document.querySelector('.nav');
// Section index: the current section's name lights up and the blue bar on the top edge slides over it.
// The row stays put while it fits; when it doesn't, names that are behind you slide out of view.
const idx = document.querySelector('.idx'), idxTrack = idx.querySelector('.idx__track');
const idxMarker = idxTrack.querySelector('.idx__marker');
const idxItems = [...idxTrack.querySelectorAll('.idx__item')];
let idxOn = null;
function idxPlace(instant) {
  if (!idxOn) return;
  const d = instant || reduce ? 0 : 0.7;
  gsap.to(idxMarker, { x: idxOn.offsetLeft, width: idxOn.offsetWidth, duration: d, ease: 'power3.inOut', overwrite: true });
  const max = Math.max(0, idxTrack.scrollWidth - idx.clientWidth);
  gsap.to(idxTrack, { x: -Math.min(max, Math.max(0, idxOn.offsetLeft - 28)), duration: d, ease: 'power3.inOut', overwrite: true });
}
function idxActivate(item) {
  if (item === idxOn) return;
  idxOn?.classList.remove('is-on'); idxOn?.removeAttribute('aria-current');
  idxOn = item; item.classList.add('is-on'); item.setAttribute('aria-current', 'true');
  idxPlace();
}
idxItems.forEach((item) => {
  const sec = document.getElementById(item.dataset.for);
  if (!sec) return;
  ScrollTrigger.create({
    trigger: sec, start: 'top 50%', end: 'bottom 50%', refreshPriority: -2,
    onToggle: (st) => { if (st.isActive) idxActivate(item); },
  });
});
idxActivate(idxItems[0]);
addEventListener('resize', () => idxPlace(true));
document.fonts?.ready.then(() => idxPlace(true));
ScrollTrigger.create({ start: 40, end: 'max', onToggle: (s) => nav.classList.toggle('is-scrolled', s.isActive) });
ScrollTrigger.create({
  trigger: '.exp', start: 'top 40px', end: 'bottom 40px', refreshPriority: -1,
  onToggle: (s) => nav.classList.toggle('on-light', s.isActive),
});

// Split a heading into words for the reveal. The accessible name stays whole in a screen-reader-only copy;
// the split copy is hidden from assistive tech. Inline elements (like <em>) keep their markup.
function splitWords(el) {
  const label = el.textContent.replace(/\s+/g, ' ').trim();
  const vis = Object.assign(document.createElement('span'), { className: 'split' });
  vis.setAttribute('aria-hidden', 'true');
  const inners = [];
  const word = (text) => {
    const o = Object.assign(document.createElement('span'), { className: 'w' });
    const i = Object.assign(document.createElement('span'), { className: 'wi', textContent: text });
    o.append(i); inners.push(i); return o;
  };
  const fill = (target, text) => text.split(/(\s+)/).forEach((part) => {
    if (!part) return;
    target.append(/^\s+$/.test(part) ? ' ' : word(part));
  });
  el.childNodes.forEach((n) => {
    if (n.nodeType === 3) fill(vis, n.textContent);
    else if (n.nodeName === 'BR') vis.append(document.createElement('br'));
    else { const c = n.cloneNode(false); fill(c, n.textContent); vis.append(c); }
  });
  el.replaceChildren(Object.assign(document.createElement('span'), { className: 'sr-only', textContent: label }), vis);
  return inners;
}

if (!reduce) {
  // Hero: the name drifts left and the bottom details fade as you leave.
  gsap.to('.hn', { xPercent: -12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 } });
  gsap.to('.hero__ui', { opacity: 0, y: -40, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: '35% top', scrub: 1 } });

  // Headings rise word by word from behind their own edge, then the section's supporting copy follows.
  document.querySelectorAll('[data-split]').forEach((h) => {
    gsap.from(splitWords(h), { yPercent: 112, duration: 1.1, ease: 'expo.out', stagger: 0.06, scrollTrigger: { trigger: h, start: 'top 85%', once: true } });
  });
  gsap.utils.toArray('[data-reveal]').forEach((el) => {
    gsap.from(el, { y: 36, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });
  gsap.utils.toArray('.sec-head .label, .about > .label, .contact__k').forEach((l) => {
    gsap.from(l, { opacity: 0, x: -12, duration: 0.8, ease: 'expo.out', scrollTrigger: { trigger: l, start: 'top 90%', once: true } });
  });

  // About: the sentence lights up word by word as you read down the page.
  document.querySelectorAll('[data-read]').forEach((p) => {
    const words = splitWords(p);
    gsap.fromTo(words, { opacity: 0.14 }, { opacity: 1, ease: 'none', stagger: 0.1, scrollTrigger: { trigger: p, start: 'top 80%', end: 'bottom 45%', scrub: 1 } });
  });

  document.querySelectorAll('[data-count]').forEach((el) => {
    const end = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0), suffix = el.dataset.suffix || '', c = { v: 0 };
    el.textContent = (0).toFixed(dec) + suffix;
    gsap.to(c, { v: end, duration: 2.2, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true }, onUpdate: () => { el.textContent = c.v.toFixed(dec) + suffix; } });
  });

  // Experience: the light panel wipes open from a rounded inset to full bleed as it arrives.
  gsap.fromTo('.exp', { clipPath: 'inset(9% 5% 0% 5% round 40px)' }, {
    clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none',
    scrollTrigger: { trigger: '.exp', start: 'top bottom', end: 'top 25%', scrub: 1 },
  });
}

/* ================= Section tracking (drives the ambient sound's mood) ================= */
let anchors = [];
const measureScenes = () => {
  anchors = [...document.querySelectorAll('[data-scene]')].map((el) => ({ at: el.getBoundingClientRect().top + scrollY - innerHeight * 0.45, i: +el.dataset.scene }));
};
ScrollTrigger.addEventListener('refresh', measureScenes);
measureScenes();
let lastScene = 0;
ScrollTrigger.create({
  start: 0, end: 'max',
  onUpdate: (self) => {
    const y = self.scroll(), W = innerHeight * 0.6;
    let f = 0;
    for (let k = 1; k < anchors.length; k++) f += (anchors[k].i - anchors[k - 1].i) * Math.min(1, Math.max(0, (y - (anchors[k].at - W)) / W));
    const now = Math.round(f);
    if (now !== lastScene) { lastScene = now; audio?.setMood(now); audio?.chime(now + 7, 0.06); }
  },
});

/* ================= Sound (opt-in) ================= */
const soundBtn = document.querySelector('.sound');
soundBtn.addEventListener('click', async () => {
  if (!audio) { const { createAudio } = await import('./audio.js?v=4'); audio = createAudio(); }
  if (!audio) { soundBtn.hidden = true; return; }
  const on = await audio.toggle();
  soundBtn.setAttribute('aria-pressed', String(on));
  if (on) { audio.setMood(lastScene); audio.chime(2, 0.1); }
});
document.addEventListener('visibilitychange', () => audio?.mute(document.hidden));

/* ================= Work: numbered cards on a 3D ring, turned by the scroll ================= */
// The section pins while you scroll through it; the ring turns one card per stretch of scroll, the card
// facing you comes forward, its neighbours swing away and dim, and you travel down the spiral as it turns.
{
  const ring = document.querySelector('.ring');
  const spin = ring.querySelector('.ring__spin');
  const cards = [...spin.querySelectorAll('.card')];
  cards.forEach((c) => { const face = Object.assign(document.createElement('span'), { className: 'card__in' }); face.append(...c.childNodes); c.append(face); });
  const cur = ring.querySelector('.ring__cur');
  const N = cards.length, STEP = 360 / N;
  let current = -1;
  function turn(p) { // p: 0 → 1 across the pinned scroll
    const at = p * (N - 1); // which card faces you (fractional)
    const card0 = ring.querySelector('.card'), r = card0.offsetWidth * 0.98, rise = card0.offsetHeight * 0.42;
    spin.style.transform = `translateZ(${-r}px) translateY(${-at * rise}px) rotateY(${-at * STEP}deg)`;
    cards.forEach((c, i) => {
      const off = Math.abs(i - at); // how far round the ring this card is from the front
      c.style.opacity = Math.max(0, 1 - off * 0.38).toFixed(3);
      c.style.filter = `brightness(${Math.max(0.35, 1 - off * 0.3).toFixed(3)})`;
    });
    const n = Math.round(at);
    cards.forEach((c, i) => c.classList.toggle('is-front', i === n && Math.abs(i - at) < 0.18));
    if (n !== current) {
      const dir = n > current ? 1 : -1;
      current = n; cur.textContent = String(n + 1).padStart(2, '0');
      if (!reduce) gsap.fromTo(cur, { yPercent: 70 * dir, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.45, ease: 'expo.out', overwrite: true });
    }
  }
  if (!reduce) {
    ScrollTrigger.create({
      trigger: ring, start: 'top top', end: () => '+=' + innerHeight * 0.75 * (N - 1),
      pin: true, scrub: 0.8, invalidateOnRefresh: true,
      onUpdate: (st) => turn(st.progress),
      onRefresh: (st) => turn(st.progress),
    });
    turn(0);
  }
}

/* ================= Work cards: hover (front card only) ================= */
// Tilt toward the cursor, the glass frosts and catches a light where you point, the number sits deeper
// and drifts against the cursor, a sweep of light crosses the glass, and the number decodes as you arrive.
if (fine && !reduce) {
  document.querySelectorAll('.card').forEach((card) => {
    const face = card.querySelector('.card__in'), num = card.querySelector('.card__n'), of = card.querySelector('.card__of');
    const q = (el, prop, d = 0.6) => gsap.quickTo(el, prop, { duration: d, ease: 'power3' });
    const rx = q(face, '--rx'), ry = q(face, '--ry'), s = q(face, '--s', 0.8), hv = q(face, '--hover', 0.5);
    const nx = q(num, 'x', 0.9), ny = q(num, 'y', 0.9), ox = q(of, 'x', 1.1), oy = q(of, 'y', 1.1);
    let inside = false;
    const leave = () => {
      if (!inside) return;
      inside = false; card.classList.remove('is-hover');
      rx(0); ry(0); s(1); hv(0); nx(0); ny(0); ox(0); oy(0);
    };
    card.addEventListener('pointermove', (e) => {
      if (!card.classList.contains('is-front')) return leave();
      const r = face.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height; // 0..1
      if (!inside) {
        inside = true; card.classList.add('is-hover');
        const t = num.textContent; let k = 0;
        const flick = setInterval(() => { num.textContent = String((Math.random() * 99) | 0).padStart(2, '0'); if (++k > 6) { clearInterval(flick); num.textContent = t; } }, 45);
      }
      face.style.setProperty('--mx', `${px * 100}%`); face.style.setProperty('--my', `${py * 100}%`);
      rx((0.5 - py) * 14); ry((px - 0.5) * 18); s(1.035); hv(1);
      nx((0.5 - px) * 22); ny((0.5 - py) * 16); ox((0.5 - px) * 10); oy((0.5 - py) * 8);
    });
    card.addEventListener('pointerleave', leave);
  });
}

/* ================= Toolbox physics (matter.js, loaded on approach) ================= */
const box = document.querySelector('.play__box');
box.dataset.cursor = 'Drag';
if (!reduce) {
  ScrollTrigger.create({
    trigger: '.play', start: 'top 120%', once: true,
    onEnter: () => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js';
      s.onload = () => ScrollTrigger.create({ trigger: box, start: 'top 75%', once: true, onEnter: startPhysics });
      document.head.append(s);
    },
  });
}
function startPhysics() {
  const { Engine, Bodies, Body, Composite, Mouse, MouseConstraint } = window.Matter;
  const items = [...box.children];
  const sizes = items.map((li) => [li.offsetWidth, li.offsetHeight]);
  box.classList.add('is-live');
  const W = box.clientWidth, H = box.clientHeight;
  const engine = Engine.create({ gravity: { y: 1.1 } });
  const wall = { isStatic: true, render: { visible: false } };
  Composite.add(engine.world, [
    Bodies.rectangle(W / 2, H + 50, W * 3, 100, wall),
    Bodies.rectangle(-50, H / 2, 100, H * 4, wall),
    Bodies.rectangle(W + 50, H / 2, 100, H * 4, wall),
  ]);
  const bodies = items.map((li, i) => {
    const [w, h] = sizes[i];
    const b = Bodies.rectangle(40 + Math.random() * (W - 80), -Math.random() * H * 1.2 - h, w, h, {
      chamfer: { radius: h / 2 }, restitution: 0.45, friction: 0.08, frictionAir: 0.012, angle: (Math.random() - 0.5) * 0.8,
    });
    Composite.add(engine.world, b);
    return b;
  });
  if (fine) {
    const mouse = Mouse.create(box);
    // Let the page keep scrolling over the box.
    mouse.element.removeEventListener('wheel', mouse.mousewheel);
    mouse.element.removeEventListener('mousewheel', mouse.mousewheel);
    mouse.element.removeEventListener('DOMMouseScroll', mouse.mousewheel);
    Composite.add(engine.world, MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.2, render: { visible: false } } }));
  } else {
    // Touch: tap a pill to flick it; dragging stays page scroll.
    items.forEach((li, i) => li.addEventListener('pointerdown', () => Body.setVelocity(bodies[i], { x: (Math.random() - 0.5) * 14, y: -18 })));
  }
  let lastHit = 0;
  window.Matter.Events.on(engine, 'collisionStart', (ev) => {
    const now = performance.now();
    if (now - lastHit < 90) return;
    const hard = ev.pairs.find((p) => !p.bodyA.isStatic && !p.bodyB.isStatic && Math.hypot(p.bodyA.velocity.x - p.bodyB.velocity.x, p.bodyA.velocity.y - p.bodyB.velocity.y) > 6);
    if (hard) { lastHit = now; audio?.chime((hard.bodyA.id * 3) % 7, 0.045); }
  });
  let running = true;
  new IntersectionObserver(([e]) => { running = e.isIntersecting; }).observe(box);
  gsap.ticker.add((time, delta) => {
    if (!running || document.hidden) return;
    Engine.update(engine, Math.min(delta, 32));
    bodies.forEach((b, i) => {
      const [w, h] = sizes[i];
      items[i].style.transform = `translate(${b.position.x - w / 2}px, ${b.position.y - h / 2}px) rotate(${b.angle}rad)`;
    });
  });
}

/* ================= Contact: letters rise toward the cursor ================= */
const talk = document.querySelector('.talk__vis');
// each word's letters are held together, and a real space between words lets the phrase
// break onto two lines on narrow screens without splitting a word
const letters = [];
const talkParts = talk.textContent.split(' ').flatMap((word, wi) => {
  const w = Object.assign(document.createElement('span'), { className: 'talk__word' });
  [...word].forEach((c) => { const l = Object.assign(document.createElement('span'), { className: 'ch', textContent: c }); w.append(l); letters.push(l); });
  return wi ? [document.createTextNode(' '), w] : [w];
});
talk.replaceChildren(...talkParts);
if (fine && !reduce) {
  gsap.set(letters, { transformOrigin: '50% 100%' });
  const setters = letters.map((l) => ({ y: gsap.quickTo(l, 'yPercent', { duration: 0.6, ease: 'power3' }), s: gsap.quickTo(l, 'scaleY', { duration: 0.6, ease: 'power3' }) }));
  let rects = [];
  const measure = () => { rects = letters.map((l) => { const r = l.getBoundingClientRect(); return r.left + r.width / 2; }); };
  ScrollTrigger.addEventListener('refresh', measure);
  const sec = document.querySelector('.contact');
  sec.addEventListener('pointerenter', measure);
  sec.addEventListener('pointermove', (e) => {
    letters.forEach((_, i) => {
      const k = Math.max(0, 1 - Math.abs(e.clientX - rects[i]) / (innerWidth * 0.22));
      setters[i].y(-14 * k); setters[i].s(1 + 0.18 * k);
    });
  });
  sec.addEventListener('pointerleave', () => setters.forEach((q) => { q.y(0); q.s(1); }));
} else if (!reduce) {
  // touch screens: one wave runs through the letters when the section scrolls in
  gsap.fromTo(letters, { yPercent: 0 }, { yPercent: -14, transformOrigin: '50% 100%', stagger: { each: 0.05, yoyo: true, repeat: 1 }, duration: 0.4, ease: 'power2.out', scrollTrigger: { trigger: talk, start: 'top 80%', once: true } });
}

/* ================= Micro-interactions ================= */
// Section labels decode: random glyphs settle into the real text, left to right.
const GLYPHS = '!<>-_/[]{}=+*^?#01';
function decode(el) {
  const text = el.textContent, o = { p: 0 };
  gsap.to(o, {
    p: 1, duration: 0.8, ease: 'power2.out',
    onUpdate: () => {
      const shown = Math.floor(o.p * text.length);
      el.textContent = text.slice(0, shown) + [...text.slice(shown)].map((c) => (c === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join('');
    },
    onComplete: () => { el.textContent = text; },
  });
}
// Nav names roll up to a copy of themselves on hover.
idxItems.forEach((a) => {
  const t = a.textContent;
  a.innerHTML = `<span class="rw"><span class="r" data-t="${t}">${t}</span></span>`;
  a.setAttribute('aria-label', t);
});
idxPlace(true);
// Experience: each divider draws itself in, left to right.
document.querySelectorAll('.xp__row').forEach((row) => row.append(Object.assign(document.createElement('span'), { className: 'xp__rule' })));

if (!reduce) {
  document.querySelectorAll('.sec-head .label, .about > .label, .contact__k, .figures dt').forEach((el) => {
    ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: () => decode(el) });
  });
  document.querySelectorAll('.xp__rule').forEach((r) => {
    gsap.fromTo(r, { scaleX: 0 }, { scaleX: 1, duration: 1.4, ease: 'expo.inOut', scrollTrigger: { trigger: r.parentElement, start: 'top 88%', once: true } });
  });
  // Big headings lean a little with the scroll speed, then settle.
  if (lenis) {
    const lean = gsap.quickTo('.h2, .about__text, .xp__what h3', 'skewY', { duration: 0.6, ease: 'power3' });
    lenis.on('scroll', ({ velocity }) => lean(gsap.utils.clamp(-2.5, 2.5, velocity * 0.06)));
  }
}

if (fine && !reduce) {
  // Magnetic controls: they lean toward the cursor and spring back when it leaves.
  document.querySelectorAll('.btn, .nav__cta, .sound, .nav__mark, .foot a, .contact__mail').forEach((el) => {
    const strength = el.classList.contains('contact__mail') ? 0.12 : 0.32;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' }), yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * strength); yTo((e.clientY - r.top - r.height / 2) * strength);
    });
    el.addEventListener('pointerleave', () => gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)', overwrite: true }));
  });
  // Hero depth: the typed line and buttons drift slightly against the cursor.
  const heroEl = document.querySelector('.hero');
  const px = gsap.quickTo('.hero__row', 'x', { duration: 1, ease: 'power3' }), py = gsap.quickTo('.hero__row', 'y', { duration: 1, ease: 'power3' });
  const lx = gsap.quickTo('.hero__hi', 'x', { duration: 1.2, ease: 'power3' });
  heroEl.addEventListener('pointermove', (e) => {
    const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
    px(nx * -14); py(ny * -10); lx(nx * 18);
  });
  heroEl.addEventListener('pointerleave', () => { px(0); py(0); lx(0); });
}

boot();
document.fonts?.ready.then(() => ScrollTrigger.refresh());
addEventListener('load', () => ScrollTrigger.refresh());
