// Props shared across scenes: the Monero key and its two halves, sparks and
// glows. The stage itself is in night.js.
import { C, LINE, shape, line, mix, lerp } from './ink.js';

// ---------- the key ----------
//
// Drawn horizontally around (0, 0) at scale 1, about 270 px long. The yellow
// half has the round bow, the orange half has the three jagged teeth, and the
// break between them is a zigzag. The wax seal and the vault's second keyhole
// must copy TEETH exactly.

const ZIG = [[-4, -12], [7, -4], [-6, 4], [5, 12]];
export const TEETH = [[52, 12], [58, 44], [70, 24], [82, 48], [94, 26], [106, 44], [112, 12]];
const BOW = { x: -100, r: 40, hole: 15 };

const YELLOW_SHAFT = [[-66, -12], ...ZIG, [-66, 12]];
const ORANGE_SHAPE = [...ZIG, ...TEETH, [112, -12]];

// The yellow half's centre and the orange half's, so they can spin in place.
export const HALF_CENTER = { yours: [-56, 0], theirs: [58, 14] };

// One half of the key. which: 'yours' | 'theirs'. o: { x, y, rot, scale,
// tint (0 = steel grey, 1 = full colour), fill (overrides tint), alpha,
// outline (dashed ghost), halo }.
export function keyHalf(ctx, s, which, o = {}) {
  const [cx, cy] = HALF_CENTER[which];
  ctx.save();
  ctx.translate(o.x ?? 0, o.y ?? 0);
  ctx.rotate(o.rot ?? 0);
  ctx.scale(o.scale ?? 1, o.scale ?? 1);
  ctx.translate(-cx, -cy);
  if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
  const tint = o.tint ?? 1;
  const style = o.outline
    ? { fill: null, dash: [10, 9], width: LINE }
    : { fill: o.fill ?? mix(C.steel, which === 'yours' ? C.btc : C.xmr, tint), width: LINE };
  const seed = which === 'yours' ? 300 : 400;
  // coloured halves give off a little light of their own
  if (!o.outline && tint > 0 && o.halo !== false) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, cx, cy, 120, which === 'yours' ? C.btc : C.xmr, 0.32 * tint);
    ctx.restore();
  }
  if (which === 'yours') {
    shape(ctx, s, YELLOW_SHAFT, { ...style, seed, sharp: true, wob: 0.7 });
    // the bow is a ring; even-odd leaves the hole see-through
    ctx.beginPath();
    ctx.arc(BOW.x, 0, BOW.r, 0, Math.PI * 2);
    ctx.moveTo(BOW.x + BOW.hole, 0);
    ctx.arc(BOW.x, 0, BOW.hole, 0, Math.PI * 2, true);
    if (style.fill) {
      ctx.fillStyle = style.fill;
      ctx.fill('evenodd');
    }
    if (style.dash) ctx.setLineDash(style.dash);
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = LINE;
    ctx.stroke();
    ctx.setLineDash([]);
  } else {
    shape(ctx, s, ORANGE_SHAPE, { ...style, seed, sharp: true, wob: 0.7 });
  }
  ctx.restore();
}

const WHOLE_SHAFT = [[-66, -12], [112, -12], ...[...TEETH].reverse(), [-66, 12]];

// The whole key before it splits: both halves in steel grey, pressed together.
// `gap` pushes them apart along the shaft, `spin` tips them away from each
// other. With no gap it is one piece, and `crack` (0..1) draws the break line
// in from the top.
export function wholeKey(ctx, s, o = {}) {
  const gap = o.gap ?? 0, spin = o.spin ?? 0, tint = o.tint ?? 0;
  ctx.save();
  ctx.translate(o.x ?? 0, o.y ?? 0);
  ctx.rotate(o.rot ?? 0);
  ctx.scale(o.scale ?? 1, o.scale ?? 1);
  if (gap === 0 && spin === 0 && tint === 0) {
    keyHalf(ctx, s, 'yours', { x: HALF_CENTER.yours[0], y: HALF_CENTER.yours[1], tint: 0 });
    shape(ctx, s, WHOLE_SHAFT, { fill: C.steel, seed: 410, sharp: true, wob: 0.7 });
    const c = o.crack ?? 0;
    if (c > 0) {
      const n = ZIG.length - 1, upto = c * n;
      const pts = ZIG.slice(0, Math.floor(upto) + 1);
      const i = Math.floor(upto);
      if (i < n) pts.push([lerp(ZIG[i][0], ZIG[i + 1][0], upto - i), lerp(ZIG[i][1], ZIG[i + 1][1], upto - i)]);
      line(ctx, s, pts, { seed: 420, width: LINE - 0.5, wob: 0.4 });
    }
    ctx.restore();
    return;
  }
  for (const which of ['yours', 'theirs']) {
    const [cx, cy] = HALF_CENTER[which];
    const dir = which === 'yours' ? -1 : 1;
    keyHalf(ctx, s, which, { x: cx + dir * gap, y: cy - gap * 0.2, rot: dir * spin, tint });
  }
  ctx.restore();
}

// Short light strokes flying out from a point, for the crack.
export function sparks(ctx, s, x, y, p, n = 8, seed = 0) {
  if (p <= 0 || p >= 1) return;
  ctx.save();
  ctx.globalAlpha *= 1 - p;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + s.rand(i, seed) * 0.5;
    const r1 = 40 + p * 70, r2 = r1 + 26 * (1 - p) + 8;
    line(ctx, s, [[x + Math.cos(a) * r1, y + Math.sin(a) * r1], [x + Math.cos(a) * r2, y + Math.sin(a) * r2]], { stroke: C.line, seed: seed + i, width: LINE });
  }
  ctx.restore();
}

// A soft glow behind something important.
export function glow(ctx, x, y, r, color, alpha) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}

// The crack's shockwave: two rings in BasicSwap Blue and violet.
export function ring(ctx, x, y, p) {
  if (p <= 0 || p >= 1) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const [col, lag] of [['0,115,255', 0], ['168,85,247', 0.12]]) {
    const q = Math.max(0, p - lag) / (1 - lag);
    if (q <= 0) continue;
    ctx.strokeStyle = `rgba(${col},${0.9 * (1 - q)})`;
    ctx.lineWidth = 2 + 10 * (1 - q);
    ctx.beginPath();
    ctx.arc(x, y, 30 + q * 520, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

// Stars circling a bonked head. p runs 0..1 over the daze.
export function dizzy(ctx, s, x, y, p) {
  if (p <= 0 || p >= 1) return;
  ctx.save();
  ctx.globalAlpha *= Math.min(1, (1 - p) * 4);
  for (let i = 0; i < 4; i++) {
    const a = s.T * 7 + (i * Math.PI) / 2;
    const sx = x + Math.cos(a) * 58, sy = y + Math.sin(a) * 15;
    star(ctx, sx, sy, Math.sin(a) > 0 ? 11 : 8, i % 2 ? C.btc : C.line);
  }
  ctx.restore();
}

function star(ctx, x, y, r, color) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const rr = i % 2 ? r * 0.38 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}
