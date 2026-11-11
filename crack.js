// A cracked LCD that's part of the screen, not laid over it.
// - buildCrack(): the geometry (seeded, so it's the same crack every time): an impact near the top-right,
//   fractures that wander, branch and thin out, and spider-web rings joining them near the impact.
// - drawCrack(): paints it. Liquid crystal wicks along each fracture as a soft dark seep, the fracture
//   itself is a dark core with a glinting edge, the impact is crushed glass, ink bleeds out from it,
//   and dead pixel lines run the full panel.
// - crackDisplacement(): a displacement map that shifts each glass shard a little in its own direction,
//   so what's under the glass breaks along the fractures (used by an SVG filter on the live terminal).

export function buildCrack(w, h, { seed = 11, ox = 0.9, oy = 0.12 } = {}) {
  let s = seed;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const range = (a, b) => a + (b - a) * rnd();
  const X = w * ox, Y = h * oy, S = Math.min(w, h * 1.6), lw = Math.max(0.8, S * 0.0028);
  const segs = []; // [x0, y0, x1, y1, width, alpha]
  const rays = [];

  function fracture(x, y, ang, len, width, depth) {
    const steps = Math.max(5, Math.round(len / (S * 0.018))), step = len / steps;
    const pts = [[x, y]];
    for (let i = 0; i < steps; i++) {
      ang += range(-0.35, 0.35) * (depth ? 1.3 : 1);
      const nx = x + Math.cos(ang) * step * range(0.7, 1.3), ny = y + Math.sin(ang) * step * range(0.7, 1.3);
      const t = (i + 1) / steps;
      segs.push([x, y, nx, ny, Math.max(0.5, width * (1 - t * 0.85)), 0.9 - t * 0.45]);
      x = nx; y = ny; pts.push([x, y]);
      if (depth < 3 && rnd() < 0.13) fracture(x, y, ang + (rnd() < 0.5 ? -1 : 1) * range(0.35, 1), (len - i * step) * range(0.35, 0.7), width * 0.6, depth + 1);
    }
    return pts;
  }
  const N = 11;
  for (let k = 0; k < N; k++) {
    const ang = (k / N) * Math.PI * 2 + range(-0.2, 0.2);
    const inward = Math.cos(ang) < 0.2 && Math.sin(ang) > -0.5; // heading left or down, into the panel
    rays.push(fracture(X, Y, ang, S * (inward ? range(0.22, 0.62) : range(0.06, 0.16)), lw * range(1.4, 2.2), 0));
  }

  // Spider-web rings: jagged links between neighbouring main fractures at set distances from the impact.
  const RINGS = [0.03, 0.055, 0.09, 0.14].map((r) => r * S);
  const at = (pts, d) => pts.find(([x, y]) => Math.hypot(x - X, y - Y) >= d);
  const order = rays.map((pts, i) => ({ i, a: Math.atan2(pts[1][1] - Y, pts[1][0] - X) })).sort((a, b) => a.a - b.a);
  RINGS.forEach((r, ri) => {
    order.forEach((o, k) => {
      if (rnd() < 0.15 + ri * 0.18) return;
      const p = at(rays[o.i], r), q = at(rays[order[(k + 1) % order.length].i], r);
      if (!p || !q || Math.hypot(p[0] - q[0], p[1] - q[1]) > S * 0.13) return;
      const mx = (p[0] + q[0]) / 2 + range(-1, 1) * S * 0.01, my = (p[1] + q[1]) / 2 + range(-1, 1) * S * 0.01;
      segs.push([p[0], p[1], mx, my, lw * 0.9, 0.75 - ri * 0.12], [mx, my, q[0], q[1], lw * 0.9, 0.75 - ri * 0.12]);
    });
  });
  return { X, Y, S, lw, segs, rays, RINGS, rnd, range };
}

export function drawCrack(g, w, h, opts) {
  const c = buildCrack(w, h, opts);
  const { X, Y, S, lw, segs, rnd, range } = c;
  const line = (sg, width, color, dx = 0) => {
    g.strokeStyle = color; g.lineWidth = width; g.lineCap = 'round';
    g.beginPath(); g.moveTo(sg[0] + dx, sg[1] + dx); g.lineTo(sg[2] + dx, sg[3] + dx); g.stroke();
  };

  g.save();
  // 1. Ink bleed from the impact, blurred into one uneven stain (mostly down and left).
  g.filter = `blur(${Math.max(2, S * 0.012)}px)`; // shortcut: Safari < 18 ignores canvas filters; the stain is just crisper there
  for (let i = 0; i < 34; i++) {
    const a = range(Math.PI * 0.45, Math.PI * 1.15), d = Math.pow(rnd(), 1.6) * S * 0.2;
    const x = X + Math.cos(a) * d, y = Y + Math.sin(a) * d * 0.8, r = Math.max(2, S * range(0.012, 0.06) * (1 - d / (S * 0.3)));
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, `rgba(12,16,10,${range(0.35, 0.7)})`); grd.addColorStop(1, 'rgba(12,16,10,0)');
    g.fillStyle = grd; g.beginPath(); g.ellipse(x, y, r, Math.max(2, r * range(0.5, 1)), range(0, Math.PI), 0, Math.PI * 2); g.fill();
  }
  // 2. Liquid crystal wicking along every fracture: a soft dark seep either side of the line.
  g.filter = `blur(${Math.max(1.5, lw * 2.2)}px)`;
  for (const sg of segs) line(sg, sg[4] * 4, `rgba(14,18,12,${sg[5] * 0.28})`);
  g.filter = 'none';
  // 3. The fractures: dark core, then a thin glint offset where the broken edge catches light.
  for (const sg of segs) line(sg, sg[4], `rgba(16,20,13,${sg[5]})`);
  for (const sg of segs) line(sg, sg[4] * 0.45, `rgba(255,255,255,${sg[5] * 0.55})`, sg[4] * 0.7);
  g.restore();

  // 4. Dead pixel lines driven from the broken spot, across the whole panel.
  const col = (x, color, width) => { g.fillStyle = color; g.fillRect(x, 0, width, h); };
  col(X - S * 0.004, 'rgba(14,18,12,.30)', Math.max(1, lw * 1.2));
  col(X - S * 0.03, 'rgba(255,255,255,.22)', Math.max(1, lw * 0.7));
  col(X - S * 0.052, 'rgba(14,18,12,.16)', Math.max(1, lw * 2.2));
  g.fillStyle = 'rgba(14,18,12,.12)'; g.fillRect(0, Y + S * 0.018, w, Math.max(1, lw * 0.9));

  // 5. Crushed glass at the impact: a pale bruise, a dark core, a mess of tiny shards.
  const bruise = g.createRadialGradient(X, Y, 0, X, Y, S * 0.035);
  bruise.addColorStop(0, 'rgba(255,255,255,.55)'); bruise.addColorStop(0.4, 'rgba(230,236,220,.25)'); bruise.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = bruise; g.beginPath(); g.arc(X, Y, S * 0.035, 0, Math.PI * 2); g.fill();
  for (let i = 0; i < 40; i++) {
    const a = range(0, Math.PI * 2), d = Math.pow(rnd(), 1.5) * S * 0.025, l = S * range(0.003, 0.012);
    const x = X + Math.cos(a) * d, y = Y + Math.sin(a) * d, b = a + range(-1.2, 1.2);
    line([x, y, x + Math.cos(b) * l, y + Math.sin(b) * l], lw * range(0.4, 0.9), rnd() < 0.6 ? 'rgba(16,20,13,.8)' : 'rgba(255,255,255,.7)');
  }
  g.fillStyle = 'rgba(14,18,12,.85)'; g.beginPath(); g.arc(X, Y, Math.max(1.5, S * 0.004), 0, Math.PI * 2); g.fill();
  return c;
}

// Displacement map (R = x shift, G = y shift, 128 = none) at 1/`down` resolution. Each shard, a cell
// bounded by two neighbouring fractures and two web rings, gets its own small shift that fades with
// distance from the impact, so lines of text visibly break where they cross a fracture.
export function crackDisplacement(w, h, opts, { down = 2, maxShift = 5 } = {}) {
  const { X, Y, S, rays, RINGS } = buildCrack(w, h, opts);
  const mw = Math.ceil(w / down), mh = Math.ceil(h / down);
  const cv = document.createElement('canvas'); cv.width = mw; cv.height = mh;
  const g = cv.getContext('2d');
  g.fillStyle = 'rgb(128,128,128)'; g.fillRect(0, 0, mw, mh);
  const R = S * 0.42;
  // Angle of each fracture at every distance (in map pixels) from the impact; null once it has ended.
  const BUCKETS = Math.ceil(R / down);
  const table = rays.map((pts) => {
    const out = new Array(BUCKETS).fill(null);
    let j = 0;
    for (let b = 0; b < BUCKETS; b++) {
      const d = b * down;
      while (j < pts.length && Math.hypot(pts[j][0] - X, pts[j][1] - Y) < d) j++;
      if (j < pts.length) out[b] = Math.atan2(pts[j][1] - Y, pts[j][0] - X);
    }
    return out;
  });
  const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const x0 = Math.max(0, Math.floor((X - R) / down)), x1 = Math.min(mw, Math.ceil((X + R) / down));
  const y0 = Math.max(0, Math.floor((Y - R) / down)), y1 = Math.min(mh, Math.ceil((Y + R) / down));
  const img = g.getImageData(x0, y0, x1 - x0, y1 - y0), px = img.data;
  for (let my = y0; my < y1; my++) {
    for (let mx = x0; mx < x1; mx++) {
      const x = mx * down, y = my * down, d = Math.hypot(x - X, y - Y);
      if (d > R) continue;
      const b = Math.min(BUCKETS - 1, Math.floor(d / down)), a = Math.atan2(y - Y, x - X);
      // Which fracture is just counter-clockwise of this point? That fracture names the shard.
      let best = -1, bestGap = Infinity;
      for (let r = 0; r < table.length; r++) {
        const ra = table[r][b];
        if (ra === null) continue;
        let gap = a - ra; while (gap < 0) gap += Math.PI * 2; while (gap >= Math.PI * 2) gap -= Math.PI * 2;
        if (gap < bestGap) { bestGap = gap; best = r; }
      }
      if (best < 0) continue;
      const ring = RINGS.findIndex((rr) => d < rr);
      const cell = best * 10 + (ring < 0 ? RINGS.length : ring);
      const fade = Math.pow(1 - d / R, 0.8);
      const ang = hash(cell) * Math.PI * 2, mag = maxShift * fade * (0.35 + 0.65 * hash(cell + 0.5));
      const i = ((my - y0) * (x1 - x0) + (mx - x0)) * 4;
      px[i] = 128 + (Math.cos(ang) * mag / maxShift) * 127;
      px[i + 1] = 128 + (Math.sin(ang) * mag / maxShift) * 127;
      px[i + 2] = 128; px[i + 3] = 255;
    }
  }
  g.putImageData(img, x0, y0);
  return cv;
}
