// Scene transitions, drawn in screen space over the finished frame. Each one
// covers the frame completely at the cut (cover = 1), so the end of one scene
// and the start of the next look the same and the cut doesn't show.
//
// transition(kind, ctx, s, cover, dir) with dir 'out' (the scene ending,
// cover 0 -> 1) or 'in' (the next scene starting, cover 1 -> 0).
//
//   brush  a hand-drawn navy brush stroke sweeps across the frame
//   iris   a cartoon iris closes on the action and opens on the next scene
//   dots   the site's dot pattern grows into solid navy, then shrinks away
//   coin   a giant Bitcoin rolls across painting navy, a Monero rolls it away
//   pan    the camera whips: the picture slides and smears, with speed lines
//   ribbon the homepage hero ribbon (hero.js)
import { C, clamp, lerp } from './ink.js';
import { coin } from './things.js';
import { ribbonPass } from './ribbon.js';

const NAVY = '#111827';
const W = 1920, H = 1080;

// deterministic noise for rough edges, steady across frames
const n1 = (x) => {
  const i = Math.floor(x), f = x - i;
  const r = (k) => {
    const v = Math.sin(k * 127.1 + 311.7) * 43758.5453;
    return v - Math.floor(v);
  };
  const u = f * f * (3 - 2 * f);
  return lerp(r(i), r(i + 1), u) * 2 - 1;
};

export function transition(kind, ctx, s, cover, dir) {
  const c = clamp(cover);
  if (c <= 0.001) return;
  ctx.save();
  if (kind === 'brush') brush(ctx, s, c, dir);
  else if (kind === 'iris') iris(ctx, s, c, dir);
  else if (kind === 'dots') dots(ctx, c, dir);
  else if (kind === 'coin') rollingCoin(ctx, s, c, dir);
  else if (kind === 'pan') pan(ctx, s, c, dir);
  else ribbonPass(ctx, s, c, { dir, u: dir === 'in' ? 1 - c : c - 1 });
  ctx.restore();
}

// ---------- A. ink brush wipe ----------
// One continuous painted stroke, left to right, in deep indigo with
// dry-brush streaks: on the way out everything behind its leading edge is
// paint; on the way in its tail edge uncovers the next scene.
const PAINT = '#1A1745';
function brush(ctx, _s, c, dir) {
  const slant = 0.18;
  const edgeAt = (x0, y) => x0 + (y - H / 2) * slant + n1(y / 70 + 3.1) * 26 + n1(y / 19 + 7.7) * 9;
  const lead = dir === 'out';
  const x0 = lead ? lerp(-320, W + 320, c) : lerp(-320, W + 320, 1 - c);
  const sgn = lead ? 1 : -1;
  const pts = [];
  for (let y = -40; y <= H + 40; y += 12) pts.push([edgeAt(x0, y), y]);
  const region = () => {
    ctx.beginPath();
    if (lead) {
      ctx.moveTo(-200, -40);
      pts.forEach(([x, y]) => ctx.lineTo(x, y));
      ctx.lineTo(-200, H + 40);
    } else {
      ctx.moveTo(W + 200, -40);
      pts.forEach(([x, y]) => ctx.lineTo(x, y));
      ctx.lineTo(W + 200, H + 40);
    }
    ctx.closePath();
  };
  region();
  ctx.fillStyle = PAINT;
  ctx.fill();
  // the stroke's texture: long streaks of lighter paint running along it,
  // brightest near the edge where the brush is still wet
  ctx.save();
  region();
  ctx.clip();
  for (let i = 0; i < 70; i++) {
    const y = (i / 70) * (H + 80) - 40 + n1(i * 2.3) * 6;
    const ex = edgeAt(x0, y);
    const len = 260 + (n1(i * 1.9) * 0.5 + 0.5) * 900;
    const a = 0.08 + (n1(i * 4.7) * 0.5 + 0.5) * 0.14;
    const g = ctx.createLinearGradient(ex, 0, ex - sgn * len, 0);
    g.addColorStop(0, `rgba(99,102,241,${a + 0.12})`);
    g.addColorStop(1, 'rgba(99,102,241,0)');
    ctx.strokeStyle = g;
    ctx.lineWidth = 2 + (i % 4) * 2;
    ctx.beginPath();
    ctx.moveTo(ex, y);
    ctx.lineTo(ex - sgn * len, y + n1(i) * 5);
    ctx.stroke();
  }
  ctx.restore();
  // dry-brush bristles running out ahead of (or trailing from) the edge
  for (let i = 0; i < 46; i++) {
    const y = (i / 46) * (H + 80) - 40 + n1(i * 1.7) * 8;
    const len = 30 + (n1(i * 3.3 + 1) * 0.5 + 0.5) * 130;
    const x = edgeAt(x0, y);
    ctx.strokeStyle = PAINT;
    ctx.lineWidth = 4 + (n1(i * 5.1) * 0.5 + 0.5) * 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - sgn * 6, y);
    ctx.lineTo(x + sgn * len, y + n1(i) * 4);
    ctx.stroke();
  }
  // a wet blue-violet glint along the stroke's edge
  const glint = ctx.createLinearGradient(0, 0, 0, H);
  glint.addColorStop(0, 'rgba(0,115,255,0.7)');
  glint.addColorStop(1, 'rgba(168,85,247,0.7)');
  ctx.strokeStyle = glint;
  ctx.lineWidth = 3;
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x - sgn * 4, y) : ctx.moveTo(x - sgn * 4, y)));
  ctx.stroke();
}

// ---------- B. cartoon iris ----------
function iris(ctx, _s, c, dir) {
  const cx = W / 2, cy = H / 2 + 20;
  const e = dir === 'out' ? c : c;
  // a little overshoot as it opens or closes, like an old cartoon
  const r = Math.max(0, lerp(1300, 0, e) + Math.sin(Math.PI * e) * 40);
  ctx.fillStyle = NAVY;
  ctx.beginPath();
  ctx.rect(-50, -50, W + 100, H + 100);
  ctx.moveTo(cx + r, cy);
  ctx.arc(cx, cy, r, 0, Math.PI * 2, true);
  ctx.fill('evenodd');
  if (r > 2) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(0,115,255,0.25)';
    ctx.lineWidth = 22;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = C.primary;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// ---------- C. halftone dots ----------
// A grid of dots grows from the bottom-left corner until they merge into
// solid navy; on the way in they shrink away in the same direction.
function dots(ctx, c, dir) {
  const gap = 60, maxR = gap * 0.74;
  const reveal = dir === 'in' ? 1 - c : 0;
  for (let y = -gap; y <= H + gap; y += gap) {
    for (let x = -gap; x <= W + gap; x += gap) {
      const d = ((x / W) * 0.6 + (1 - y / H) * 0.4) * 0.6;
      const grow = dir === 'out' ? clamp(c * 1.6 - d) : 1 - clamp(reveal * 1.6 - d);
      if (grow <= 0) continue;
      const r = maxR * grow;
      // dots still growing pick up the brand blue and violet
      const mid = grow < 0.98;
      ctx.fillStyle = mid ? (x / W > 0.5 ? 'rgba(124,58,237,0.9)' : 'rgba(37,99,235,0.9)') : NAVY;
      if (mid && grow > 0.6) ctx.fillStyle = NAVY;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ---------- D. rolling coin ----------
function rollingCoin(ctx, s, c, dir) {
  const R = 620;
  const cx = lerp(-R - 40, W + R + 40, dir === 'out' ? c : 1 - c);
  const cy = H / 2;
  ctx.fillStyle = NAVY;
  if (dir === 'out') ctx.fillRect(-50, -50, cx + 50, H + 100);
  else ctx.fillRect(cx, -50, W - cx + 100, H + 100);
  coin(ctx, s, dir === 'out' ? 'btc' : 'xmr', { x: cx, y: cy, r: R, rot: cx / R, halo: false });
}

// ---------- E. whip pan ----------
// The camera whips right: the picture itself slides off to the left with a
// real horizontal motion blur, tapered speed lines stream past at different
// depths, and at the cut the frame is solid navy full of streaks. The next
// scene slides in from the right and settles. The progress card and the
// subtitles are drawn after this, so they hold still while the world moves.
let snap;
function pan(ctx, s, c, dir) {
  const cv = ctx.canvas;
  const k = cv.width / W;
  if (!snap) snap = document.createElement('canvas');
  if (snap.width !== cv.width || snap.height !== cv.height) {
    snap.width = cv.width;
    snap.height = cv.height;
  }
  const sx = snap.getContext('2d');
  sx.clearRect(0, 0, snap.width, snap.height);
  sx.drawImage(cv, 0, 0);

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  // how far the picture has travelled, and how hard it is moving
  const travel = Math.pow(c, 2.2) * W * 0.95 * k;
  const shift = dir === 'out' ? -travel : travel;
  const blur = Math.pow(c, 1.1) * 220 * k;
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, 0, cv.width, cv.height);
  // the smeared picture: copies trailing to the right of where it is, as
  // everything is moving left
  const fade = 1 - Math.pow(c, 3);
  const N = 12;
  for (let i = N - 1; i >= 0; i--) {
    ctx.globalAlpha = fade * (i === 0 ? 1 : 0.42 * (1 - i / N));
    ctx.drawImage(snap, shift + (i / N) * blur, 0);
  }
  ctx.globalAlpha = 1;

  // speed lines, tapered: a bright head on the left and a tail that fades out
  const cols = [[0, 115, 255], [168, 85, 247], [229, 231, 235], [96, 165, 250]];
  const strength = Math.sin(Math.PI * 0.5 * Math.min(1, c * 1.25));
  for (let i = 0; i < 64; i++) {
    const depth = (i % 5) / 4;
    const y = (((i * 61.7) % (H - 40)) + 20 + n1(i * 0.7) * 12) * k;
    const len = (180 + depth * 520 + (n1(i * 2.1) * 0.5 + 0.5) * 260) * k;
    const speed = (1800 + depth * 3200) * k;
    const span = cv.width + len + 400 * k;
    const x = (((-s.T * speed + i * 331 * k) % span) + span) % span - len - 200 * k;
    const col = cols[i % cols.length];
    const a = strength * (0.25 + depth * 0.6);
    const g = ctx.createLinearGradient(x, 0, x + len, 0);
    g.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},${Math.min(0.95, a)})`);
    g.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`);
    ctx.strokeStyle = g;
    ctx.lineWidth = (1.2 + depth * 3.4) * k;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y);
    ctx.stroke();
  }
  // a soft darkening at the edges, like a lens moving fast
  const v = ctx.createLinearGradient(0, 0, cv.width, 0);
  v.addColorStop(0, `rgba(11,17,32,${0.5 * strength})`);
  v.addColorStop(0.25, 'rgba(11,17,32,0)');
  v.addColorStop(0.75, 'rgba(11,17,32,0)');
  v.addColorStop(1, `rgba(11,17,32,${0.5 * strength})`);
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.restore();
}
