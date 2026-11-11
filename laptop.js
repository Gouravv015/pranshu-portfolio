// The "Terminal" door on the choice screen: the PK-1100, an original 3D laptop built from simple shapes,
// inspired by mid-80s clamshell portables.
// - It powers on when the screen appears: a flash, the panel warms up, the boot text types itself out.
// - Your real keyboard drives it: keys press down on the model and what you type shows on its LCD.
// - Hover wakes the LCD (it flutters); click dives the camera into the screen.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { drawCrack } from './crack.js?v=3';

const PLASTIC = 0xd8ca9b, PLASTIC_DARK = 0xc1b185, KEY = 0xeee4c2, KEY_GREY = 0x8e8b75;

export function createLaptop(canvas, { reduce = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  const HOME = { pos: new THREE.Vector3(-1.9, 2.5, 5.6), look: new THREE.Vector3(0, 0.55, -0.15) };
  camera.position.copy(HOME.pos);
  const look = HOME.look.clone();

  scene.add(new THREE.HemisphereLight(0xfff3dc, 0x0e0e0e, 0.9));
  const key = new THREE.DirectionalLight(0xffe6bf, 2.2); key.position.set(3, 5, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0x5227ff, 3); rim.position.set(-4, 2.5, -4); scene.add(rim);
  // A warm desk lamp from the upper left.
  const lamp = new THREE.SpotLight(0xffd29a, 26, 14, 0.5, 0.85, 2);
  lamp.position.set(-2.6, 4.6, 2.2); lamp.target.position.set(0.2, 0.3, 0); scene.add(lamp, lamp.target);
  // Reflections for the screen glass only.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  /* ---------- aged plastic: faint grain, uneven yellowing (heavier at the top), a few scuffs ---------- */
  const age = document.createElement('canvas'); age.width = age.height = 512;
  const ag = age.getContext('2d');
  ag.fillStyle = '#fff'; ag.fillRect(0, 0, 512, 512);
  const yel = ag.createLinearGradient(0, 0, 0, 512);
  yel.addColorStop(0, 'rgba(206,168,82,.22)'); yel.addColorStop(0.55, 'rgba(206,168,82,.06)'); yel.addColorStop(1, 'rgba(206,168,82,0)');
  ag.fillStyle = yel; ag.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 14; i++) {
    const x = Math.random() * 512, y = Math.random() * 512, r = 40 + Math.random() * 120;
    const b = ag.createRadialGradient(x, y, 0, x, y, r);
    b.addColorStop(0, 'rgba(196,158,76,.09)'); b.addColorStop(1, 'rgba(196,158,76,0)');
    ag.fillStyle = b; ag.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const img = ag.getImageData(0, 0, 512, 512);
  for (let i = 0; i < img.data.length; i += 4) { const n = (Math.random() - 0.5) * 14; img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n; }
  ag.putImageData(img, 0, 0);
  for (let i = 0; i < 18; i++) { // scuffs
    ag.strokeStyle = Math.random() < 0.5 ? 'rgba(120,104,70,.18)' : 'rgba(255,255,255,.35)';
    ag.lineWidth = 0.6 + Math.random();
    const x = Math.random() * 512, y = Math.random() * 512, a = Math.random() * Math.PI, l = 10 + Math.random() * 50;
    ag.beginPath(); ag.moveTo(x, y); ag.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); ag.stroke();
  }
  const ageTex = new THREE.CanvasTexture(age); ageTex.colorSpace = THREE.SRGBColorSpace;
  const bumpTex = new THREE.CanvasTexture(age);

  const mat = (color, rough = 0.72) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0 });
  const aged = (color) => new THREE.MeshStandardMaterial({ color, map: ageTex, bumpMap: bumpTex, bumpScale: 0.6, roughness: 0.72, metalness: 0 });
  const box = (w, h, d, r, m) => new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, r), m);
  const plastic = aged(PLASTIC), plasticDark = aged(PLASTIC_DARK), dark = mat(0x3a3a34, 0.5);
  const cyl = (r, h, m) => new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 20), m);

  const laptop = new THREE.Group();
  scene.add(laptop);

  // Base, rear hinge housing, keyboard well.
  const base = box(3.1, 0.3, 2.5, 0.06, plastic); base.position.y = 0.15; laptop.add(base);
  const rear = box(3.1, 0.44, 0.55, 0.06, plastic); rear.position.set(0, 0.22, -1.0); laptop.add(rear);
  const well = box(2.86, 0.03, 1.72, 0.01, plasticDark); well.position.set(0, 0.3, 0.27); laptop.add(well);

  // Vent grilles on the rear housing, either side of the hinge block.
  const slat = new THREE.BoxGeometry(0.018, 0.12, 0.02);
  for (const side of [-1, 1]) for (let i = 0; i < 14; i++) {
    const s = new THREE.Mesh(slat, dark); s.position.set(side * (0.62 + i * 0.05), 0.33, -0.72); laptop.add(s);
  }

  // Floppy drive on the right side: bezel, slot, eject button.
  const bezel = box(0.014, 0.13, 0.92, 0.01, plasticDark); bezel.position.set(1.551, 0.16, 0.2); laptop.add(bezel);
  const slot = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.022, 0.72), mat(0x1c1c18, 0.4)); slot.position.set(1.556, 0.17, 0.16); laptop.add(slot);
  const eject = box(0.02, 0.045, 0.09, 0.006, mat(KEY_GREY, 0.6)); eject.position.set(1.562, 0.15, 0.6); laptop.add(eject);
  // Rubber feet and hinge screws.
  for (const [x, z] of [[-1.35, -1.08], [1.35, -1.08], [-1.35, 1.08], [1.35, 1.08]]) {
    const f = cyl(0.08, 0.03, mat(0x2a2a26, 0.9)); f.position.set(x, -0.005, z); laptop.add(f);
  }
  // Status lights on the front lip: power (on), disk (blinks), caps (toggles).
  const LED_OFF = new THREE.Color(0x4a4636);
  const leds = {};
  [['power', 0x6dff8e], ['disk', 0xffb347], ['caps', 0x6dff8e]].forEach(([name, on], i) => {
    const m = new THREE.MeshBasicMaterial({ color: LED_OFF.clone(), toneMapped: false });
    const l = box(0.07, 0.022, 0.012, 0.005, m); l.position.set(1.02 + i * 0.13, 0.2, 1.251); laptop.add(l);
    leds[name] = { m, on: new THREE.Color(on), lit: false };
  });
  const setLed = (name, lit) => { const l = leds[name]; l.lit = lit; l.m.color.copy(lit ? l.on : LED_OFF); };
  setLed('power', true);
  let diskTimer = 0;
  const blinkDisk = (ms = 120) => { setLed('disk', true); clearTimeout(diskTimer); diskTimer = setTimeout(() => setLed('disk', false), ms); };

  /* ---------- keyboard: plain rounded keys on one grid (main rows all 12.5 units), so nothing overlaps ---------- */
  const PX = 0.17, PZ = 0.18, z0 = -0.38, GAP = 0.35, KEY_Y = 0.345;
  const LEFT = -(2 + GAP + 12.5 + GAP + 1) * PX / 2;
  const keys = []; // { x, z, w, grey, label, mesh, i, p }
  const add = (u, r, label, grey = false, w = 1) => keys.push({ x: LEFT + (u + w / 2) * PX, z: z0 + r * PZ, w, grey, label, p: 0 });
  for (let r = 0; r < 5; r++) for (let c = 0; c < 2; c++) add(c, r, `F${r * 2 + c + 1}`, true);
  const M = 2 + GAP;
  const ROWS = [ // [label, width, grey]
    [['Esc', 1, 1], ...'1234567890'.split('').map((l) => [l, 1]), ['←', 1.5, 1]],
    [['Tab', 1.5, 1], ...'QWERTYUIOP'.split('').map((l) => [l, 1]), ['↵', 1, 1]],
    [['Ctrl', 1.5, 1], ...'ASDFGHJKL;'.split('').map((l) => [l, 1]), ['↵', 1, 1]],
    [['Shift', 2, 1], ...'ZXCVBNM,.'.split('').map((l) => [l, 1]), ['Shift', 1.5, 1]],
    [['Alt', 2, 1], [' ', 8], ['Caps', 2.5, 1]],
  ];
  ROWS.forEach((row, r) => { let u = M; for (const [label, w, grey] of row) { add(u, r, label, !!grey, w); u += w; } });
  ['Num', 'Scr', 'Ins', 'Del', 'Brk'].forEach((l, r) => add(M + 12.5 + GAP, r, l, true));

  const keyGeo = new RoundedBoxGeometry(0.155, 0.06, 0.15, 2, 0.022);
  const o3 = new THREE.Object3D();
  const placeKey = (k) => {
    o3.position.set(k.x, KEY_Y - 0.024 * k.p, k.z + 0.27);
    o3.scale.set((k.w * PX - 0.015) / 0.155, 1, 1);
    o3.updateMatrix(); k.mesh.setMatrixAt(k.i, o3.matrix); k.mesh.instanceMatrix.needsUpdate = true;
  };
  for (const grey of [false, true]) {
    const list = keys.filter((k) => k.grey === grey);
    const m = new THREE.InstancedMesh(keyGeo, mat(grey ? KEY_GREY : KEY, 0.6), list.length);
    list.forEach((k, i) => { k.mesh = m; k.i = i; placeKey(k); });
    laptop.add(m);
  }
  function pressKey(label) {
    for (const k of keys.filter((q) => q.label === label)) {
      gsap.timeline({ onUpdate: () => placeKey(k) })
        .to(k, { p: 1, duration: 0.05, ease: 'power2.out', overwrite: true })
        .to(k, { p: 0, duration: 0.16, ease: 'power2.in' });
    }
  }

  // Hinge block, its two round knobs, two screws.
  const hinge = box(0.95, 0.2, 0.3, 0.05, plastic); hinge.position.set(0, 0.42, -0.66); laptop.add(hinge);
  for (const x of [-0.27, 0.27]) { const knob = cyl(0.07, 0.03, dark); knob.rotation.x = Math.PI / 2; knob.position.set(x, 0.42, -0.5); laptop.add(knob); }
  for (const x of [-0.42, 0.42]) { const sc = cyl(0.016, 0.01, mat(0x6d6656, 0.4)); sc.rotation.x = Math.PI / 2; sc.position.set(x, 0.42, -0.508); laptop.add(sc); }

  // Lid, pivoting at the hinge and tilted back.
  const lid = new THREE.Group();
  lid.position.set(0, 0.42, -0.86); lid.rotation.x = -0.28;
  laptop.add(lid);
  const shell = box(3.02, 1.5, 0.13, 0.06, plastic); shell.position.y = 0.75; lid.add(shell);
  const recess = box(2.62, 1.06, 0.02, 0.02, plasticDark); recess.position.set(0, 0.84, 0.07); lid.add(recess);
  for (const x of [-1.51, 1.51]) { // red latch tabs on the sides
    const tab = box(0.035, 0.13, 0.06, 0.01, mat(0x8a2c22, 0.5)); tab.position.set(x, 1.33, 0); lid.add(tab);
  }
  for (const x of [-1.38, 1.38]) { const sc = cyl(0.014, 0.008, mat(0x6d6656, 0.4)); sc.rotation.x = Math.PI / 2; sc.position.set(x, 0.12, 0.066); lid.add(sc); }
  // The screen sits a little sunk into the bezel: a darker lip around it.
  const lipMat = mat(0x8f8466, 0.8);
  for (const [w, h, x, y] of [[2.38, 0.025, 0, 1.31], [2.38, 0.025, 0, 0.39], [0.025, 0.94, -1.18, 0.85], [0.025, 0.94, 1.18, 0.85]]) {
    const lip = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.012), lipMat); lip.position.set(x, y, 0.084); lid.add(lip);
  }

  // LCD: a canvas texture, redrawn every frame.
  const sc = document.createElement('canvas'); sc.width = 1280; sc.height = 500;
  const g = sc.getContext('2d');
  const tex = new THREE.CanvasTexture(sc); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 0.9), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  screen.position.set(0, 0.85, 0.082); lid.add(screen);

  // Glass over the LCD: faint room reflections, plus a soft glare that slides as you move the mouse.
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(2.36, 0.94), new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0.06, envMap: envTex, envMapIntensity: 0.5, transparent: true, opacity: 0.1, depthWrite: false,
  }));
  glass.position.set(0, 0.85, 0.09); lid.add(glass);
  const gc = document.createElement('canvas'); gc.width = 512; gc.height = 128;
  const gg2 = gc.getContext('2d'), streak = gg2.createLinearGradient(0, 0, 512, 0);
  streak.addColorStop(0.3, 'rgba(255,255,255,0)'); streak.addColorStop(0.45, 'rgba(255,255,255,.55)'); streak.addColorStop(0.5, 'rgba(255,255,255,.2)');
  streak.addColorStop(0.56, 'rgba(255,255,255,.4)'); streak.addColorStop(0.7, 'rgba(255,255,255,0)');
  gg2.fillStyle = streak; gg2.fillRect(0, 0, 512, 128);
  const glareTex = new THREE.CanvasTexture(gc);
  const glare = new THREE.Mesh(new THREE.PlaneGeometry(2.36, 0.94), new THREE.MeshBasicMaterial({ map: glareTex, transparent: true, opacity: 0.14, blending: THREE.AdditiveBlending, depthWrite: false }));
  glare.position.set(0, 0.85, 0.092); lid.add(glare);

  // Name plate under the screen, and a printed spec line beside it.
  const plate = (w, h, cw, ch, draw) => {
    const c = document.createElement('canvas'); c.width = cw; c.height = ch;
    draw(c.getContext('2d'), cw, ch);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false }));
  };
  const badge = plate(0.42, 0.08, 256, 48, (c, w, h) => {
    c.fillStyle = '#4a4a42'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#e9e1c6'; c.font = '700 28px "Geist Mono", monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('PK-1100', w / 2, 26);
  });
  badge.position.set(0, 0.2, 0.067); lid.add(badge);
  const spec = plate(0.9, 0.05, 720, 40, (c, w, h) => {
    c.fillStyle = 'rgba(70,64,48,.75)'; c.font = '600 24px "Geist Mono", monospace'; c.textBaseline = 'middle'; c.fillText('PERSONAL COMPUTER', 0, h / 2);
  });
  spec.position.set(-0.86, 0.2, 0.067); lid.add(spec);

  // Glow bleeding off the screen: a light on the keys plus a soft halo, both following how awake it is.
  const screenLight = new THREE.PointLight(0xc4d2b0, 0, 3.2, 2); screenLight.position.set(0, 0.8, 0.5); lid.add(screenLight);
  const hc = document.createElement('canvas'); hc.width = hc.height = 128;
  const hg = hc.getContext('2d'), halo = hg.createRadialGradient(64, 64, 0, 64, 64, 64);
  halo.addColorStop(0, 'rgba(200,214,180,.9)'); halo.addColorStop(1, 'rgba(200,214,180,0)');
  hg.fillStyle = halo; hg.fillRect(0, 0, 128, 128);
  const haloMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.9), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(hc), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  haloMesh.position.set(0, 0.85, 0.1); haloMesh.raycast = () => {}; lid.add(haloMesh);

  // Soft contact shadow.
  const shc = document.createElement('canvas'); shc.width = shc.height = 128;
  const sg = shc.getContext('2d'), grad = sg.createRadialGradient(64, 64, 4, 64, 64, 64);
  grad.addColorStop(0, 'rgba(0,0,0,.65)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
  sg.fillStyle = grad; sg.fillRect(0, 0, 128, 128);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(5, 4), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shc), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -0.01; laptop.add(shadow);

  /* ---------- the LCD picture ---------- */
  const BOOT = [
    'PK Personal Computer                       (PK-1100)',
    'Copyright (C) 2026 Pranshu Kumar',
    '',
    'PK-DOS   Version 1.0',
    'Memory check ............ 640K OK',
    '',
    "Type HELP, or click me to boot the terminal.",
    '',
  ];
  const lcd = { wake: 0.2, flicker: 0, cursor: true, power: 1, shown: BOOT.length, flash: 0 };
  let history = [], input = '';
  const crack = document.createElement('canvas'); crack.width = sc.width; crack.height = sc.height;
  drawCrack(crack.getContext('2d'), crack.width, crack.height);
  const grain = document.createElement('canvas'); grain.width = grain.height = 256;
  const gimg = grain.getContext('2d').createImageData(256, 256);
  for (let i = 0; i < gimg.data.length; i += 4) { const v = Math.random() * 255; gimg.data[i] = gimg.data[i + 1] = gimg.data[i + 2] = v; gimg.data[i + 3] = 255; }
  grain.getContext('2d').putImageData(gimg, 0, 0);
  const ROWS_FIT = 11;
  function drawScreen() {
    const w = sc.width, h = sc.height;
    const awake = Math.max(0, Math.min(1, lcd.wake * (1 - lcd.flicker * Math.random()))) * lcd.power;
    const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
    // off panel -> asleep -> awake
    const bgc = lcd.power < 1 ? mix([58, 64, 54], [118, 128, 108], lcd.power) : mix([118, 128, 108], [170, 182, 155], awake);
    g.fillStyle = `rgb(${bgc})`; g.fillRect(0, 0, w, h);
    const vig = g.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, w * 0.62);
    vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, 'rgba(20,26,16,.32)');
    g.fillStyle = vig; g.fillRect(0, 0, w, h);
    // power-on flash: a bright line that opens out from the middle
    if (lcd.flash > 0) {
      const fh = h * Math.pow(1 - lcd.flash, 2) * 0.9 + 3;
      g.fillStyle = `rgba(235,245,220,${lcd.flash})`; g.fillRect(0, h / 2 - fh / 2, w, fh);
    }
    if (lcd.power > 0.3) {
      g.font = '500 30px "JetBrains Mono", "Geist Mono", monospace'; g.textBaseline = 'top';
      const text = [...BOOT.slice(0, lcd.shown), ...history, ...(lcd.shown >= BOOT.length ? ['A>' + input + (lcd.cursor ? '_' : '')] : [])].slice(-ROWS_FIT);
      for (const [dx, alpha] of [[4, 0.12], [0, 0.25 + 0.7 * awake]]) { // LCD ghosting, then the text
        g.fillStyle = `rgba(30,36,26,${alpha * lcd.power})`;
        text.forEach((t, i) => g.fillText(t, 44 + dx, 34 + i * 43));
      }
    }
    if (lcd.flicker > 0.3) { g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(0, Math.random() * h, w, h * 0.12); }
    g.drawImage(crack, 0, 0);
    g.save(); g.globalAlpha = 0.07; g.globalCompositeOperation = 'overlay';
    g.fillStyle = g.createPattern(grain, 'repeat');
    g.translate(-Math.random() * 256, -Math.random() * 256); g.fillRect(0, 0, w + 256, h + 256);
    g.restore();
    g.fillStyle = 'rgba(0,0,0,.035)';
    for (let y = 0; y < h; y += 4) g.fillRect(0, y, w, 1);
    tex.needsUpdate = true;
  }
  drawScreen();

  /* ---------- typing on the real keyboard ---------- */
  const KEYMAP = { Backspace: '←', Enter: '↵', Tab: 'Tab', Escape: 'Esc', Shift: 'Shift', Control: 'Ctrl', Alt: 'Alt', CapsLock: 'Caps', Delete: 'Del', Insert: 'Ins', ' ': ' ' };
  function run(cmd) {
    const c = cmd.trim().toUpperCase();
    history.push('A>' + cmd);
    if (!c) return;
    if (c === 'CLS' || c === 'CLEAR') { history = []; return; }
    if (c === 'BOOT' || c === 'TERMINAL' || c === 'START') { history.push('Booting...'); canvas.dispatchEvent(new CustomEvent('laptopboot')); return; }
    const OUT = {
      HELP: ['HELP  WHOAMI  DIR  CLS  BOOT', 'BOOT (or a click) opens the full terminal.'],
      WHOAMI: ['pranshu - software developer, Vadodara IN'],
      DIR: ['ABOUT  EDUCATION  EXPERIENCE  SKILLS  PROJECTS  CONTACT'],
      LS: ['ABOUT  EDUCATION  EXPERIENCE  SKILLS  PROJECTS  CONTACT'],
    };
    history.push(...(OUT[c] || ['Bad command or file name']));
    history = history.slice(-40);
  }
  function keyDown(e) {
    if (diving || lcd.shown < BOOT.length) return false;
    const label = KEYMAP[e.key] || (/^F([1-9]|10)$/.test(e.key) ? e.key : e.key.length === 1 ? e.key.toUpperCase() : null);
    if (label) pressKey(label === ' ' ? ' ' : label);
    if (e.key === 'CapsLock') setLed('caps', e.getModifierState?.('CapsLock'));
    blinkDisk(60);
    gsap.to(lcd, { wake: 1, duration: 0.3, overwrite: 'auto' });
    clearTimeout(sleepTimer); sleepTimer = setTimeout(() => { if (!hovering) gsap.to(lcd, { wake: 0.2, duration: 1 }); }, 4000);
    canvas.dispatchEvent(new CustomEvent('laptopkey'));
    if (e.key === 'Enter') { run(input); input = ''; return true; }
    if (e.key === 'Backspace') { input = input.slice(0, -1); return true; }
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && input.length < 34) { input += e.key; return true; }
    return e.key === 'Tab';
  }
  let sleepTimer = 0;

  /* ---------- size, framing, loop ---------- */
  const state = { focus: 1, hover: 0, mx: 0, my: 0 };
  let W = 1, H = 1;
  function resize() {
    W = canvas.clientWidth || innerWidth; H = canvas.clientHeight || innerHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
  }
  // Push the laptop into the right half on desktop (lower half on phones); focus 0 = dead centre for the dive.
  function frame() {
    const wide = W >= 900;
    camera.setViewOffset(W, H, wide ? -0.24 * W * state.focus : 0, wide ? 0 : -0.24 * H * state.focus, W, H);
    camera.zoom = (wide ? 0.68 : 0.46) + (wide ? 0.32 : 0.54) * (1 - state.focus);
    camera.updateProjectionMatrix();
  }

  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  let hovering = false, running = false, raf = 0, last = 0, blinkAt = 0, diving = false;
  // Is the pointer over the laptop? (Also used for clicks, so touch screens with no hover work.)
  function hits(e) {
    const r = canvas.getBoundingClientRect();
    ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    return ray.intersectObject(laptop, true).length > 0;
  }
  function onMove(e) {
    const on = hits(e);
    state.mx = ptr.x; state.my = ptr.y;
    setHover(on);
  }
  function setHover(on) {
    if (on === hovering || diving) return;
    hovering = on;
    canvas.style.cursor = on ? 'pointer' : '';
    canvas.dispatchEvent(new CustomEvent('laptophover', { detail: on }));
    gsap.to(lcd, { wake: on ? 1 : 0.2, duration: on ? 0.9 : 0.6, ease: on ? 'power2.out' : 'power1.inOut' });
    if (on) { gsap.fromTo(lcd, { flicker: 0.9 }, { flicker: 0.1, duration: 0.7, ease: 'power2.out', overwrite: 'auto' }); blinkDisk(500); }
    else gsap.to(lcd, { flicker: 0, duration: 0.3, overwrite: 'auto' });
    gsap.to(state, { hover: on ? 1 : 0, duration: 0.6, ease: 'power3.out' });
  }
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerleave', () => setHover(false));

  function tick(t) {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(0.05, (t - last) / 1000 || 0); last = t;
    if (!diving) {
      const k = 1 - Math.pow(0.001, dt);
      const sway = reduce ? 0 : 1;
      laptop.rotation.y += ((-0.32 + state.mx * 0.18) * sway - laptop.rotation.y) * k;
      laptop.rotation.x += ((state.my * -0.05) * sway - laptop.rotation.x) * k;
      laptop.position.y = (reduce ? 0 : Math.sin(t / 1400) * 0.03) + state.hover * 0.08;
    }
    if (t > blinkAt) { lcd.cursor = !lcd.cursor; blinkAt = t + (hovering ? 260 : 600); }
    // While hovered the old panel never quite settles: a faint constant flutter plus the odd stutter.
    if (hovering && !diving && !reduce && Math.random() < 0.025) {
      gsap.fromTo(lcd, { flicker: 0.55 }, { flicker: 0.1, duration: 0.2, ease: 'power1.out', overwrite: 'auto' });
    }
    // Glare slides across the glass with the mouse; glow follows how awake the screen is.
    glareTex.offset.x = 0.25 - state.mx * 0.35; glareTex.offset.y = state.my * 0.05;
    const glow = lcd.wake * lcd.power;
    screenLight.intensity = 0.4 + glow * 1.6;
    haloMesh.material.opacity = 0.03 + glow * 0.09;
    drawScreen();
    frame();
    camera.lookAt(look);
    renderer.render(scene, camera);
  }

  // Power on: the panel flashes, warms up from dark, and the boot lines type themselves out.
  let bootTl = null;
  function powerOn() {
    bootTl?.kill();
    history = []; input = '';
    if (reduce) { Object.assign(lcd, { power: 1, shown: BOOT.length, flash: 0 }); return; }
    Object.assign(lcd, { power: 0, shown: 0, flash: 0 });
    bootTl = gsap.timeline({ delay: 0.9 })
      .to(lcd, { flash: 1, duration: 0.06 })
      .to(lcd, { flash: 0, duration: 0.45, ease: 'power2.out' })
      .to(lcd, { power: 1, duration: 0.9, ease: 'power2.inOut' }, '<0.1')
      .add(() => blinkDisk(1400), '<0.3');
    BOOT.forEach((_, i) => bootTl.add(() => { lcd.shown = i + 1; blinkDisk(80); canvas.dispatchEvent(new CustomEvent('laptopkey', { detail: 'boot' })); }, `>${i ? 0.13 : 0.2}`));
  }

  const onResize = () => resize();
  return {
    hits,
    keyDown,
    start() { if (running) return; running = true; resize(); addEventListener('resize', onResize); last = performance.now(); raf = requestAnimationFrame(tick); },
    stop() { running = false; cancelAnimationFrame(raf); removeEventListener('resize', onResize); },
    // Entrance: the laptop rises, the lid swings open, then it powers on.
    intro() {
      powerOn();
      if (reduce) return;
      gsap.fromTo(laptop.position, { y: -0.6 }, { y: 0, duration: 1.4, ease: 'expo.out' });
      gsap.fromTo(lid.rotation, { x: 1.35 }, { x: -0.28, duration: 1.6, delay: 0.25, ease: 'expo.out' });
    },
    // Fly the camera square onto the screen until the lid face fills the view.
    dive() {
      diving = true; setHoverForce(false);
      const center = new THREE.Vector3(), normal = new THREE.Vector3(0, 0, 1);
      gsap.killTweensOf(laptop.rotation);
      laptop.rotation.set(0, 0, 0); laptop.position.y = 0.08; laptop.updateMatrixWorld(true);
      screen.getWorldPosition(center);
      normal.applyQuaternion(screen.getWorldQuaternion(new THREE.Quaternion()));
      const half = THREE.MathUtils.degToRad(camera.fov / 2), aspect = W / H;
      const d = Math.max(1.4 / (Math.tan(half) * aspect), 0.68 / Math.tan(half)) * 0.92;
      const to = center.clone().addScaledVector(normal, d);
      bootTl?.progress(1);
      gsap.to(lcd, { wake: 1, flicker: 0, duration: 0.4 });
      return gsap.timeline()
        .to(state, { focus: 0, duration: 1.3, ease: 'power3.inOut' }, 0)
        .to(camera.position, { x: to.x, y: to.y, z: to.z, duration: 1.3, ease: 'power3.inOut' }, 0)
        .to(look, { x: center.x, y: center.y, z: center.z, duration: 1.3, ease: 'power3.inOut' }, 0);
    },
    reset() {
      diving = false;
      gsap.killTweensOf([camera.position, look, state]);
      camera.position.copy(HOME.pos); look.copy(HOME.look); state.focus = 1;
      lcd.wake = 0.2;
    },
  };
  function setHoverForce(on) { hovering = !on; diving = false; setHover(on); diving = true; }
}
