// The hero's light field: one full-screen shader of folded, flowing bands of blue light ("silk")
// that slowly drift and bend toward the cursor. Its one job is to be the hero's focal image.
// Capped pixel ratio, paused when off-screen or the tab is hidden, a single static frame under
// reduced motion, and it removes itself on WebGL failure or context loss (the CSS poster stays).
import * as THREE from 'three';

const FRAG = /* glsl */`
precision highp float;
uniform float uTime;
uniform vec2 uRes;
uniform vec2 uMouse;
uniform float uIntro;
uniform float uScroll;
varying vec2 vUv;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = m * p; a *= 0.5; }
  return v;
}

void main() {
  float aspect = uRes.x / uRes.y;
  vec2 p = (vUv - 0.5) * vec2(aspect, 1.0);
  vec2 m = (uMouse - 0.5) * vec2(aspect, 1.0);
  float d = length(p - m);
  float t = uTime * 0.05;

  // domain-warped noise, pulled toward the cursor
  vec2 q = vec2(fbm(p * 1.3 + t), fbm(p * 1.3 + vec2(5.2, 1.3) - t));
  q += (m - p) * 0.4 * exp(-d * 2.2);
  vec2 r = vec2(fbm(p * 1.5 + 2.4 * q + vec2(1.7, 9.2) + t * 1.3), fbm(p * 1.5 + 2.4 * q + vec2(8.3, 2.8) - t));
  float f = fbm(p * 1.1 + 2.6 * r + vec2(0.0, uScroll * 0.6));

  // thin bright folds where the field turns over: the "silk"
  float bands = sin((f * 8.0 + r.x * 3.0) * 3.14159);
  float silk = pow(smoothstep(0.62, 1.0, bands), 2.0) * smoothstep(0.32, 0.85, f);
  float sheen = smoothstep(0.5, 1.0, sin((f * 8.0 + r.x * 3.0 + 0.18) * 3.14159)) * smoothstep(0.3, 0.85, f);

  vec3 bg = vec3(0.055);
  vec3 blue = vec3(0.322, 0.153, 1.0);
  vec3 col = bg + blue * smoothstep(0.45, 0.95, f) * 0.28;  // dark, with deep blue where the field gathers
  col += blue * sheen * 0.35;                               // soft body of each fold
  col += blue * silk * 1.15;                                // the bright edge of the fold
  col += vec3(0.95, 0.93, 0.9) * pow(silk, 4.0) * 0.55;     // a white glint on the brightest edges
  col += blue * 0.18 * exp(-d * 3.4);                       // a soft glow where you point

  // keep the left and bottom calmer so the name and copy stay readable
  col *= mix(0.45, 1.0, smoothstep(-0.55, 0.35, p.y + 0.15));
  col *= mix(0.6, 1.0, smoothstep(-0.9, 0.2, p.x));
  col *= smoothstep(1.35, 0.3, length(p * vec2(0.75, 1.0)));
  col += (hash(vUv * uRes + uTime) - 0.5) * 0.03;         // grain
  gl_FragColor = vec4(col * uIntro, 1.0);
}`;

export function createHeroField(canvas, { reduce = false } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
  } catch {
    canvas.remove();
    return null;
  }
  // the field is soft, so it renders below screen resolution and gets scaled up by the browser
  const DPR = Math.min(devicePixelRatio, 1.5) * 0.6;
  renderer.setPixelRatio(DPR);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const uniforms = {
    uTime: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) }, uMouse: { value: new THREE.Vector2(0.65, 0.55) },
    uIntro: { value: 0 }, uScroll: { value: 0 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms, fragmentShader: FRAG,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
  });
  const geometry = new THREE.PlaneGeometry(2, 2);
  scene.add(new THREE.Mesh(geometry, material));

  const target = new THREE.Vector2(0.65, 0.55);
  let raf = 0, running = false, visible = true, start = performance.now(), last = start;

  function size() {
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    uniforms.uRes.value.set(w * DPR, h * DPR);
  }
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    uniforms.uTime.value = (now - start) / 1000;
    uniforms.uMouse.value.lerp(target, 1 - Math.pow(0.02, dt)); // eased cursor
    renderer.render(scene, camera);
  }
  function play() {
    if (running || !visible || document.hidden) return;
    running = true; last = performance.now(); raf = requestAnimationFrame(frame);
  }
  function pause() { running = false; cancelAnimationFrame(raf); }

  // pointer, throttled to one update per frame
  let pending = null;
  const onMove = (e) => {
    if (!pending) requestAnimationFrame(() => {
      const r = canvas.getBoundingClientRect();
      target.set((pending.clientX - r.left) / r.width, 1 - (pending.clientY - r.top) / r.height);
      pending = null;
    });
    pending = e;
  };
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? play() : pause(); });
  const onVis = () => (document.hidden ? pause() : play());
  const onLost = (e) => { e.preventDefault(); destroy(); };

  size();
  addEventListener('resize', size);
  canvas.addEventListener('webglcontextlost', onLost);

  function destroy() {
    pause(); io.disconnect();
    removeEventListener('resize', size); removeEventListener('pointermove', onMove);
    document.removeEventListener('visibilitychange', onVis);
    geometry.dispose(); material.dispose(); renderer.dispose();
    canvas.remove(); // the CSS poster underneath is the fallback
  }

  return {
    start() {
      if (reduce) { uniforms.uIntro.value = 1; renderer.render(scene, camera); return; } // one still frame
      addEventListener('pointermove', onMove, { passive: true });
      document.addEventListener('visibilitychange', onVis);
      io.observe(canvas);
      play();
    },
    uniforms, destroy,
  };
}
