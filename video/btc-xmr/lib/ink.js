// Palette and hand-drawn line helpers shared by every scene. The colours are
// the table in ANIMATION_GUIDE.md; change them there and here together.

export const C = {
  btc: '#F7B500',
  btcDeep: '#C98A00',
  xmr: '#FF6600',
  xmrDeep: '#C44E00',
  xmrGrey: '#4C4C4C',
  ink: '#111827',
  // the site's dark theme and brand colours (src/styles/tokens.css)
  navy: '#111827',
  navyDeep: '#0B1120',
  floor: '#0D1322',
  surface: '#1F2937',
  brand: '#0073FF',
  primary: '#3B82F6',
  violet: '#A855F7',
  link: '#60A5FA',
  line: '#E5E7EB',
  strike: '#EF5944',
  youBody: '#FFF6E4',
  sellerBody: '#ECE6DD',
  eyeWhite: '#FFFDF8',
  steel: '#CFCAC2',
};

export const LINE = 3;

// Lines redraw eight times a second with a little jitter, like hand-drawn
// animation shot on twos.
const BOIL_FPS = 8;

export const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const lerp = (a, b, p) => a + (b - a) * p;
export const lerpPt = (a, b, p) => [lerp(a[0], b[0], p), lerp(a[1], b[1], p)];

export const ease = {
  linear: (p) => p,
  in: (p) => p * p * p,
  out: (p) => 1 - (1 - p) ** 3,
  inOut: (p) => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2),
  outBack: (p) => 1 + 2.7 * (p - 1) ** 3 + 1.7 * (p - 1) ** 2,
};

// Eased 0..1 progress of a move that starts at `a` and lasts `d`, at time t.
// Unlike s.p it takes the time, so a scene can ask where something was a
// moment ago (for speed, trails and footsteps).
export const seg = (t, a, d, e = 'inOut') => ease[e](clamp((t - a) / d));

// 0 -> 1 -> 0 over `len` seconds starting at dt = 0.
export const bump = (dt, len) => (dt < 0 || dt > len ? 0 : Math.sin((Math.PI * dt) / len));

// A quick hit that decays, for squash on landing.
export const kick = (dt, decay = 9) => (dt < 0 ? 0 : Math.exp(-dt * decay));

export function mix(a, b, p) {
  const pa = hex(a), pb = hex(b);
  const c = pa.map((v, i) => Math.round(lerp(v, pb[i], clamp(p))));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
function hex(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function ellipsePts(cx, cy, rx, ry, n = 20) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return pts;
}

export function jitter(s, pts, amount, seed) {
  const tick = Math.floor(s.T * BOIL_FPS);
  return pts.map(([x, y], i) => [
    x + s.noise(i * 1.37 + seed * 7.1 + tick * 3.3, 11) * amount,
    y + s.noise(i * 1.91 + seed * 5.3 + tick * 2.7, 23) * amount,
  ]);
}

const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

// A smooth path through the points, closed or open.
export function smoothPath(ctx, pts, closed = true) {
  const n = pts.length;
  ctx.beginPath();
  if (closed) {
    const m = mid(pts[n - 1], pts[0]);
    ctx.moveTo(m[0], m[1]);
    for (let i = 0; i < n; i++) {
      const p = pts[i], q = mid(p, pts[(i + 1) % n]);
      ctx.quadraticCurveTo(p[0], p[1], q[0], q[1]);
    }
    ctx.closePath();
  } else {
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < n - 1; i++) {
      const q = mid(pts[i], pts[i + 1]);
      ctx.quadraticCurveTo(pts[i][0], pts[i][1], q[0], q[1]);
    }
    ctx.lineTo(pts[n - 1][0], pts[n - 1][1]);
  }
}

// A straight-edged path through the points, for sharp corners like key teeth.
export function polyPath(ctx, pts, closed = true) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  if (closed) ctx.closePath();
}

function paint(ctx, o) {
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (o.fill) {
    ctx.fillStyle = o.fill;
    ctx.fill(o.rule ?? 'nonzero');
  }
  if (o.stroke !== 'none') {
    ctx.strokeStyle = o.stroke ?? C.ink;
    ctx.lineWidth = o.width ?? LINE;
    if (o.dash) ctx.setLineDash(o.dash);
    ctx.stroke();
    if (o.dash) ctx.setLineDash([]);
  }
}

// A filled, outlined shape with a hand-drawn wobble. `sharp` keeps corners.
export function shape(ctx, s, pts, o = {}) {
  const p = jitter(s, pts, o.wob ?? 1.1, o.seed ?? 0);
  if (o.sharp) polyPath(ctx, p, o.closed ?? true);
  else smoothPath(ctx, p, o.closed ?? true);
  paint(ctx, o);
}

// An open stroke with the same wobble.
export function line(ctx, s, pts, o = {}) {
  shape(ctx, s, pts, { ...o, closed: false, fill: null });
}
