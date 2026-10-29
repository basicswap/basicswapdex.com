// Props for the scenes: coins, padlocks, the instruction card, refund
// envelopes, the hourglass, the 2-of-2 box, the cheque and its wax seal, the
// vault, the public board and its crowd, the bridge, and a few small things.
// Everything draws centred on (x, y) unless it says otherwise.
import { C, shape, line, ellipsePts, clamp, lerp, mix, smoothPath } from './ink.js';
import { glow, TEETH } from './props.js';

const rrect = (x, y, w, h, r) => {
  const pts = [];
  const corner = (cx, cy, a0) => {
    for (let i = 0; i <= 3; i++) {
      const a = a0 + (i / 3) * (Math.PI / 2);
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
  };
  corner(x + w - r, y + r, -Math.PI / 2);
  corner(x + w - r, y + h - r, 0);
  corner(x + r, y + h - r, Math.PI / 2);
  corner(x + r, y + r, Math.PI);
  return pts;
};

function place(ctx, o) {
  ctx.save();
  ctx.translate(o.x ?? 0, o.y ?? 0);
  if (o.rot) ctx.rotate(o.rot);
  const k = o.scale ?? 1;
  ctx.scale(k * (o.flip ?? 1), k);
  if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
}

// ---------- coins ----------

// kind 'btc' | 'xmr'. flip (-1..1) squeezes it horizontally for a spin.
export function coin(ctx, s, kind, o = {}) {
  const r = o.r ?? 40;
  place(ctx, o);
  const main = kind === 'btc' ? C.btc : C.xmr;
  if (o.halo !== false) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, 0, 0, r * 2.6, main, 0.28);
    ctx.restore();
  }
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = main;
  ctx.fill();
  ctx.clip();
  if (kind === 'xmr') {
    ctx.fillStyle = C.xmrGrey;
    ctx.fillRect(-r, r * 0.32, r * 2, r);
  }
  ctx.restore();
  ctx.strokeStyle = kind === 'btc' ? C.btcDeep : '#B34700';
  ctx.lineWidth = r * 0.08;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#FFFFFF';
  ctx.fillStyle = '#FFFFFF';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (kind === 'btc') {
    ctx.font = `700 ${r * 1.05}px "Instrument Sans"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.save();
    ctx.rotate(0.2);
    ctx.fillText('B', 0, r * 0.04);
    ctx.lineWidth = r * 0.09;
    for (const dx of [-0.1, 0.12]) {
      ctx.beginPath();
      ctx.moveTo(dx * r, -r * 0.52);
      ctx.lineTo(dx * r, -r * 0.36);
      ctx.moveTo(dx * r, r * 0.38);
      ctx.lineTo(dx * r, r * 0.54);
      ctx.stroke();
    }
    ctx.restore();
  } else {
    ctx.lineWidth = r * 0.14;
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, r * 0.3);
    ctx.lineTo(-r * 0.5, -r * 0.34);
    ctx.lineTo(0, r * 0.1);
    ctx.lineTo(r * 0.5, -r * 0.34);
    ctx.lineTo(r * 0.5, r * 0.3);
    ctx.stroke();
  }
  shape(ctx, s, ellipsePts(0, 0, r, r, 18), { fill: null, seed: kind === 'btc' ? 700 : 710, wob: 0.6 });
  ctx.restore();
}

// ---------- padlocks ----------

// o: { kind 'btc' | 'xmr', open (0..1 shackle up), slot (bool), glow (0..1) }
export function padlock(ctx, s, o = {}) {
  place(ctx, o);
  const w = 200, h = 170;
  const body = o.kind === 'xmr' ? C.xmr : C.btc;
  if (o.glow) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, 0, 0, 260, body, 0.45 * o.glow);
    ctx.restore();
  }
  // shackle
  const up = (o.open ?? 0) * 50;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 22;
  ctx.beginPath();
  ctx.moveTo(-58, -h / 2 + 10 - up * 0.2);
  ctx.lineTo(-58, -h / 2 - 50 - up);
  ctx.arc(0, -h / 2 - 50 - up, 58, Math.PI, 0);
  ctx.lineTo(58, -h / 2 - 10 - up);
  ctx.stroke();
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
  shape(ctx, s, rrect(-w / 2, -h / 2, w, h, 22), { fill: body, seed: o.kind === 'xmr' ? 720 : 730, sharp: true, wob: 0.8 });
  // a darker band and a keyhole
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fillRect(-w / 2 + 6, h / 2 - 40, w - 12, 30);
  ctx.fillStyle = C.ink;
  ctx.beginPath();
  ctx.arc(0, 18, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-5, 22, 10, 32);
  if (o.slot) {
    shape(ctx, s, rrect(-62, -44, 124, 16, 6), { fill: C.ink, stroke: 'none', seed: 740, sharp: true, wob: 0.3 });
  }
  ctx.restore();
}

// The instruction card that goes into a Bitcoin lock: an arrow to a person
// ("who gets paid") and an hourglass with a return arrow ("when it goes back").
// crumple (0..1) scrunches it up.
export function card(ctx, s, o = {}) {
  place(ctx, o);
  const cr = o.crumple ?? 0;
  ctx.scale(1 - cr * 0.55, 1 - cr * 0.5);
  const pts = rrect(-80, -55, 160, 110, 10).map(([x, y], i) => [x + s.rand(i, 750) * cr * 40 - cr * 20, y + s.rand(i, 751) * cr * 40 - cr * 20]);
  shape(ctx, s, pts, { fill: '#F9FAFB', seed: 752, sharp: cr > 0.2, wob: 0.6 });
  if (cr < 0.5) {
    ctx.save();
    ctx.globalAlpha *= 1 - cr * 2;
    // row 1: arrow to a person
    line(ctx, s, [[-56, -22], [6, -22]], { seed: 753, width: 4 });
    line(ctx, s, [[-6, -32], [8, -22], [-6, -12]], { seed: 754, width: 4 });
    shape(ctx, s, ellipsePts(40, -30, 9, 9, 10), { fill: C.ink, stroke: 'none', seed: 755 });
    shape(ctx, s, [[26, -10], [54, -10], [50, -20], [30, -20]], { fill: C.ink, stroke: 'none', seed: 756 });
    // row 2: hourglass and a return arrow
    line(ctx, s, [[-58, 10], [-34, 10], [-46, 25], [-34, 40], [-58, 40], [-46, 25], [-58, 10]], { seed: 757, width: 3.5, sharp: true });
    line(ctx, s, [[-62, 8], [-30, 8]], { seed: 759, width: 4 });
    line(ctx, s, [[-62, 42], [-30, 42]], { seed: 760, width: 4 });
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(20, 26, 20, Math.PI * 1.1, Math.PI * 0.2, false);
    ctx.stroke();
    line(ctx, s, [[-6, 14], [-2, 26], [10, 20]], { seed: 758, width: 4 });
    ctx.restore();
  }
  ctx.restore();
}

// ---------- refunds and time ----------

// o: { open (0..1 flap), signed (0..1 squiggle drawn), sigs (see below) }
export function envelope(ctx, s, o = {}) {
  place(ctx, o);
  const w = 190, h = 116;
  shape(ctx, s, rrect(-w / 2, -h / 2, w, h, 8), { fill: '#F3EBDD', seed: 760, sharp: true, wob: 0.7 });
  // the flap folds up and over as it opens
  const op = clamp(o.open ?? 0);
  const tip = lerp(10, -h / 2 - 70, op);
  shape(ctx, s, [[-w / 2, -h / 2], [0, tip], [w / 2, -h / 2]], { fill: op > 0.5 ? '#E6DCCB' : '#EDE3D2', seed: 761, sharp: true, wob: 0.6 });
  ctx.fillStyle = C.ink;
  ctx.font = '600 22px "JetBrains Mono"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('REFUND', 0, 26);
  // signatures: o.sigs is a list of { p (0..1 drawn), color, side (-1 left
  // half, 1 right half) }; o.signed draws a single full-width one
  const sigs = o.sigs ?? (o.signed ? [{ p: o.signed, color: C.brand, side: 0 }] : []);
  sigs.forEach((g, k) => {
    const sg = clamp(g.p);
    if (sg <= 0) return;
    const pts = [];
    for (let i = 0; i <= 24 * sg; i++) pts.push(sigPoint(g.side, i / 24));
    if (pts.length > 1) line(ctx, s, pts, { stroke: g.color, seed: 762 + k, width: 3, wob: 0.4 });
  });
  ctx.restore();
}

// A point along an envelope's signature, in the envelope's own (unscaled)
// space: side -1 is the left half, 1 the right half, 0 the full width.
export function sigPoint(side, u) {
  if (side === 0) return [-60 + u * 120, 46 + Math.sin(u * 19) * 7 - u * 6];
  const x0 = side < 0 ? -70 : 6;
  return [x0 + u * 62, 46 + Math.sin(u * 13) * 6 - u * 3];
}

// The timelock. o: { sand (0..1 still in the top bulb), awake (0..1),
// wink, scale, rot }
export function hourglass(ctx, s, o = {}) {
  place(ctx, o);
  const sand = clamp(o.sand ?? 1);
  const wood = '#7A5A3C';
  // bulbs: the glass, and the same outline pulled in a little to hold the sand
  const bulb = [[-48, -78], [48, -78], [8, -6], [48, 70], [-48, 70], [-8, -6]];
  const inner = [[-42, -74], [42, -74], [5, -6], [42, 66], [-42, 66], [-5, -6]];
  ctx.save();
  smoothPath(ctx, inner, true);
  ctx.clip();
  ctx.fillStyle = 'rgba(219,234,254,0.10)';
  ctx.fillRect(-60, -90, 120, 170);
  ctx.fillStyle = '#E8C77A';
  // top: everything below a level surface, down to the neck
  const level = -8 - 62 * sand;
  if (sand > 0.005) ctx.fillRect(-60, level, 120, -6 - level);
  // bottom: a mound that grows from the floor of the glass
  const pile = 62 * (1 - sand);
  if (pile > 0.5) {
    ctx.beginPath();
    ctx.moveTo(-60, 70);
    ctx.lineTo(-60, 70 - pile * 0.55);
    ctx.quadraticCurveTo(0, 70 - pile * 1.25, 60, 70 - pile * 0.55);
    ctx.lineTo(60, 70);
    ctx.closePath();
    ctx.fill();
  }
  // the falling stream, only while there is sand left to fall
  if (sand > 0.005 && sand < 0.995) ctx.fillRect(-1.5, -8, 3, 78 - pile);
  ctx.restore();
  shape(ctx, s, bulb, { fill: null, stroke: C.line, seed: 770, wob: 0.6, width: 3 });
  // frame
  for (const y of [-90, 82]) shape(ctx, s, rrect(-64, y - 10, 128, 20, 6), { fill: wood, seed: 771 + y, sharp: true, wob: 0.5 });
  for (const x of [-56, 56]) line(ctx, s, [[x, -80], [x, 72]], { stroke: wood, seed: 773 + x, width: 6 });
  // face on the top bar
  const aw = clamp(o.awake ?? 0);
  for (const side of [-1, 1]) {
    const ex = side * 22, ey = -90;
    if (aw < 0.5 || (o.wink && side > 0)) line(ctx, s, [[ex - 8, ey + 1], [ex, ey + 4], [ex + 8, ey + 1]], { stroke: '#F9FAFB', seed: 775 + side, width: 2.5 });
    else {
      ctx.fillStyle = '#F9FAFB';
      ctx.beginPath();
      ctx.arc(ex, ey, 5.5 * aw, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
  // snores float up from a sleeping hourglass
  if ((o.awake ?? 0) < 0.3 && o.zzz !== false) {
    for (let i = 0; i < 3; i++) {
      const p = ((s.T * 0.5 + i / 3) % 1);
      ctx.save();
      ctx.globalAlpha *= Math.sin(Math.PI * p) * (o.alpha ?? 1);
      ctx.fillStyle = C.link;
      ctx.font = `600 ${18 + p * 16}px "Instrument Sans"`;
      ctx.fillText('z', (o.x ?? 0) + 50 + p * 40 * (o.scale ?? 1), (o.y ?? 0) - 110 * (o.scale ?? 1) - p * 90);
      ctx.restore();
    }
  }
}

// ---------- the Bitcoin lock: a box with two padlocks ----------

// o: { open (0..1 lid), coinIn (bool) }
export function box(ctx, s, o = {}) {
  place(ctx, o);
  const w = 260, h = 160;
  const lid = clamp(o.open ?? 0);
  shape(ctx, s, rrect(-w / 2, -h / 2, w, h, 16), { fill: C.surface, stroke: C.line, seed: 780, sharp: true, wob: 0.8 });
  // lid hinges open at the back
  ctx.save();
  ctx.translate(-w / 2, -h / 2);
  ctx.rotate(-lid * 1.1);
  shape(ctx, s, rrect(-6, -34, w + 12, 40, 12), { fill: '#374151', stroke: C.line, seed: 781, sharp: true, wob: 0.8 });
  ctx.restore();
  // two padlocks on the front: yours and the seller's
  for (const [i, col] of [[-1, C.btc], [1, C.xmr]]) {
    const px = i * 52, py = 20;
    ctx.save();
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(px, py - 22, 16, Math.PI, 0);
    ctx.stroke();
    ctx.restore();
    shape(ctx, s, rrect(px - 26, py - 22, 52, 44, 8), { fill: col, seed: 782 + i, sharp: true, wob: 0.5 });
    ctx.fillStyle = C.ink;
    ctx.beginPath();
    ctx.arc(px, py - 2, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// The wax seal pressed with the orange half's teeth. o: { broken (0..1), glow }
export function seal(ctx, s, o = {}) {
  place(ctx, o);
  if (o.glow) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, 0, 0, 120, C.xmr, 0.6 * o.glow);
    ctx.restore();
  }
  const br = clamp(o.broken ?? 0);
  for (const side of br > 0 ? [-1, 1] : [0]) {
    ctx.save();
    ctx.translate(side * br * 10, side * br * 4);
    ctx.rotate(side * br * 0.25);
    if (side) {
      ctx.beginPath();
      ctx.rect(side < 0 ? -60 : 0, -60, 60, 120);
      ctx.clip();
    }
    const blob = ellipsePts(0, 0, 38, 36, 16).map(([x, y], i) => [x + Math.sin(i * 2.3) * 3, y + Math.cos(i * 1.7) * 3]);
    shape(ctx, s, blob, { fill: C.xmr, seed: 790, wob: 0.6 });
    // the imprint of the three teeth, scaled down
    ctx.save();
    ctx.scale(0.42, 0.42);
    ctx.translate(-82, -30);
    line(ctx, s, TEETH, { stroke: '#8A2E00', seed: 791, width: 6, wob: 0.3 });
    ctx.restore();
    ctx.restore();
  }
  ctx.restore();
}

// The payment to the seller. o: { seal: null | { broken, glow }, signed }
export function cheque(ctx, s, o = {}) {
  place(ctx, o);
  shape(ctx, s, rrect(-130, -62, 260, 124, 8), { fill: '#F9FAFB', seed: 800, sharp: true, wob: 0.6 });
  for (const [i, w] of [[0, 120], [1, 90], [2, 140]]) line(ctx, s, [[-110, -30 + i * 24], [-110 + w, -30 + i * 24]], { stroke: '#9CA3AF', seed: 801 + i, width: 3 });
  coin(ctx, s, 'btc', { x: -96, y: 38, r: 14, halo: false });
  ctx.fillStyle = C.ink;
  ctx.font = '500 16px "JetBrains Mono"';
  ctx.textBaseline = 'middle';
  ctx.fillText('pay: seller', -74, 39);
  // your signature, written along the last line. signed (0..1) draws it in
  const sg = clamp(o.signed ?? 0);
  if (sg > 0) {
    const pts = [];
    for (let i = 0; i <= 24 * sg; i++) {
      const u = i / 24;
      pts.push([-104 + u * 96, 11 + Math.sin(u * 17) * 4.5 - u * 3]);
    }
    if (pts.length > 1) line(ctx, s, pts, { stroke: C.brand, seed: 960, width: 3, wob: 0.3 });
  }
  if (o.seal) seal(ctx, s, { x: 82, y: 20, ...o.seal });
  ctx.restore();
}

// ---------- the Monero vault ----------

// o: { open (0..1 door), blink (0..1 jagged keyhole glow), glow, dial }
export function vault(ctx, s, o = {}) {
  place(ctx, o);
  const w = 300, h = 340;
  const iw = w - 44, ih = h - 44, hinge = -w / 2 + 22;
  if (o.glow) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, 0, 0, 340, C.violet, 0.35 * o.glow);
    ctx.restore();
  }
  shape(ctx, s, rrect(-w / 2, -h / 2, w, h, 26), { fill: '#2A3344', stroke: C.line, seed: 810, sharp: true, wob: 0.9 });
  // the bolt studs round the frame
  ctx.fillStyle = '#4B5563';
  for (const [x, y] of [[-w / 2 + 11, -h / 2 + 11], [w / 2 - 11, -h / 2 + 11], [-w / 2 + 11, h / 2 - 11], [w / 2 - 11, h / 2 - 11]]) {
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // the door swings out on its left hinge, up to about 110 degrees
  const op = clamp(o.open ?? 0);
  const a = op * 1.92;
  const sx = Math.cos(a);
  if (op > 0) {
    // a dark cavity with two shelves, lit softly from inside
    ctx.save();
    shape(ctx, s, rrect(-iw / 2, -ih / 2, iw, ih, 14), { fill: '#120D1F', stroke: '#4B5563', seed: 811, sharp: true, wob: 0.4, width: 2 });
    ctx.beginPath();
    ctx.rect(-iw / 2 + 4, -ih / 2 + 4, iw - 8, ih - 8);
    ctx.clip();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, 0, 30, 120, C.violet, 0.55 * op);
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = '#2E2448';
    ctx.lineWidth = 5;
    for (const y of [-40, 70]) {
      ctx.beginPath();
      ctx.moveTo(-iw / 2, y);
      ctx.lineTo(iw / 2, y);
      ctx.stroke();
    }
    // the inner shadow at the top
    const sh = ctx.createLinearGradient(0, -ih / 2, 0, -ih / 2 + 60);
    sh.addColorStop(0, 'rgba(0,0,0,0.6)');
    sh.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sh;
    ctx.fillRect(-iw / 2, -ih / 2, iw, 60);
    ctx.restore();
  }

  ctx.save();
  ctx.translate(hinge, 0);
  // the free edge comes toward us as it opens, so the door grows a little
  ctx.scale(Math.abs(sx) < 0.03 ? 0.03 * Math.sign(sx || 1) : sx, 1 + 0.12 * Math.sin(a));
  ctx.translate(-hinge, 0);
  const front = sx > 0;
  shape(ctx, s, rrect(hinge, -ih / 2, iw, ih, 16), { fill: front ? '#374151' : '#2B3442', stroke: C.line, seed: 812, sharp: true, wob: 0.6, width: 2.5 });
  // turning away from us, the door darkens
  if (op > 0) {
    ctx.fillStyle = `rgba(0,0,0,${0.45 * Math.sin(Math.min(a, Math.PI / 2))})`;
    ctx.fillRect(hinge, -ih / 2, iw, ih);
  }
  if (front) {
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -70, 42, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 12; i++) {
      const d = (i / 12) * Math.PI * 2 + (o.dial ?? 0);
      ctx.beginPath();
      ctx.moveTo(Math.cos(d) * 34, -70 + Math.sin(d) * 34);
      ctx.lineTo(Math.cos(d) * 42, -70 + Math.sin(d) * 42);
      ctx.stroke();
    }
    // two keyholes: round (yours) and jagged (the seller's)
    ctx.fillStyle = C.ink;
    ctx.beginPath();
    ctx.arc(-58, 70, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = C.btc;
    ctx.stroke();
    ctx.save();
    ctx.translate(58, 70);
    ctx.scale(0.5, 0.5);
    ctx.translate(-82, -30);
    const jag = [[52, -6], ...TEETH.slice(1, -1), [112, -6]];
    shape(ctx, s, jag, { fill: C.ink, stroke: C.xmr, seed: 813, sharp: true, wob: 0.3, width: 5 });
    if (o.blink) {
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, 82, 20, 90, C.xmr, o.blink);
    }
    ctx.restore();
  } else {
    // the back of the door: a handle wheel and the bolts
    ctx.strokeStyle = '#9CA3AF';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 3; i++) {
      const d = (i / 3) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(Math.cos(d) * 36, Math.sin(d) * 36);
      ctx.lineTo(-Math.cos(d) * 36, -Math.sin(d) * 36);
      ctx.stroke();
    }
    ctx.fillStyle = '#6B7280';
    for (const y of [-100, 0, 100]) ctx.fillRect(iw / 2 - 30, y - 7, 24, 14);
  }
  ctx.restore();
  ctx.restore();
}

// ---------- the public board ----------

// Drawn like one of the site's cards. Top-left at (x, y). o: { w, h, rows }
export function board(ctx, s, o = {}) {
  const x = o.x ?? 0, y = o.y ?? 0, w = o.w ?? 520, h = o.h ?? 340;
  ctx.save();
  if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
  // posts
  for (const px of [x + 40, x + w - 40]) line(ctx, s, [[px, y + h], [px, o.ground ?? y + h + 200]], { stroke: '#4B5563', seed: 820 + px, width: 10 });
  shape(ctx, s, rrect(x, y, w, h, 14), { fill: 'rgba(31,41,55,0.96)', stroke: '#4B5563', seed: 822, sharp: true, wob: 0.4, width: 2 });
  ctx.strokeStyle = C.primary;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 28, y + 34);
  ctx.lineTo(x + 58, y + 34);
  ctx.stroke();
  ctx.fillStyle = C.link;
  ctx.font = '400 20px "JetBrains Mono"';
  ctx.textBaseline = 'middle';
  ctx.fillText('bitcoin · public', x + 70, y + 35);
  // faint rows of earlier transactions
  const rows = o.rows ?? 5;
  for (let i = 0; i < rows; i++) {
    ctx.fillStyle = 'rgba(156,163,175,0.35)';
    ctx.fillRect(x + 28, y + 70 + i * 26, 60 + s.rand(i, 823) * 180, 8);
    ctx.fillRect(x + w - 120, y + 70 + i * 26, 80, 8);
  }
  ctx.restore();
}

// Small round onlookers. o: { x0, x1, y (ground), n, look (-1..1 where their
// eyes go), turn (0..1 how many have turned, left to right), lookY, hop }
export function crowd(ctx, s, o = {}) {
  const n = o.n ?? 9;
  for (let i = 0; i < n; i++) {
    const x = lerp(o.x0 ?? 0, o.x1 ?? 1000, n === 1 ? 0.5 : i / (n - 1)) + s.rand(i, 830) * 30;
    const r = 30 + s.rand(i, 831) * 14;
    const turned = clamp((o.turn ?? 0) * (n + 3) - i);
    const hop = (o.hop ?? 0) * Math.abs(Math.sin(s.T * 9 + i)) * 14;
    const y = (o.y ?? 860) - r - 10 - hop;
    const tone = mix('#9CA3AF', '#6B7280', s.rand(i, 832));
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(x, o.y ?? 860, r, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    shape(ctx, s, ellipsePts(x, y, r, r + 6, 14), { fill: tone, seed: 833 + i, wob: 0.8 });
    const look = lerp(o.idle ?? 0, o.look ?? 0, turned);
    for (const side of [-1, 1]) {
      ctx.fillStyle = C.ink;
      ctx.beginPath();
      ctx.arc(x + side * 10 + look * 9, y - 6 + (o.lookY ?? 0) * 5 * turned, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    if (o.ooh && turned > 0.5) {
      shape(ctx, s, ellipsePts(x + look * 6, y + 14, 4, 5, 8), { fill: C.ink, stroke: 'none', seed: 850 + i });
    }
  }
}

// ---------- the cold open ----------

// A plank bridge from x0 to x1 at height y. fall (0..1) drops the planks.
export function bridge(ctx, s, o = {}) {
  const x0 = o.x0, x1 = o.x1, y = o.y, n = 9;
  const fall = clamp(o.fall ?? 0);
  const sag = (u) => Math.sin(Math.PI * u) * 26;
  // ropes
  if (fall < 0.15) {
    ctx.save();
    ctx.globalAlpha *= 1 - fall / 0.15;
    for (const dy of [-70, -2]) {
      const pts = [];
      for (let i = 0; i <= 12; i++) pts.push([lerp(x0, x1, i / 12), y + dy + sag(i / 12)]);
      line(ctx, s, pts, { stroke: '#A78B6D', seed: 860 + dy, width: 3 });
    }
    ctx.restore();
  }
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n;
    const drop = fall * fall * (500 + s.rand(i, 861) * 400);
    const px = lerp(x0, x1, u) + (s.rand(i, 862) - 0.5) * 80 * fall, py = y + sag(u) + drop;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate((s.rand(i, 863) - 0.5) * 4 * fall);
    const pw = (x1 - x0) / n - 6;
    shape(ctx, s, rrect(-pw / 2, -6, pw, 16, 3), { fill: '#8A6A4A', stroke: C.ink, seed: 864 + i, sharp: true, wob: 0.6, width: 2.5 });
    ctx.restore();
  }
}

// The toll keeper's tip jar, with whatever coins went in.
export function jar(ctx, s, o = {}) {
  place(ctx, o);
  const coins = o.coins ?? [];
  coins.forEach((k, i) => coin(ctx, s, k, { x: -14 + i * 26, y: 18 - i * 6, r: 18, halo: false }));
  shape(ctx, s, rrect(-42, -40, 84, 92, 16), { fill: 'rgba(219,234,254,0.15)', stroke: C.line, seed: 870, sharp: true, wob: 0.5 });
  shape(ctx, s, rrect(-46, -52, 92, 16, 5), { fill: '#6B7280', stroke: C.line, seed: 871, sharp: true, wob: 0.4 });
  ctx.restore();
}

// ---------- small things ----------

export function table(ctx, s, o = {}) {
  place(ctx, o);
  for (const x of [-150, 150]) line(ctx, s, [[x, 0], [x + Math.sign(x) * 8, 120]], { stroke: C.line, seed: 880 + x, width: 6 });
  shape(ctx, s, rrect(-200, -14, 400, 24, 8), { fill: '#374151', stroke: C.line, seed: 882, sharp: true, wob: 0.6 });
  ctx.restore();
}

export function pen(ctx, s, o = {}) {
  place(ctx, o);
  shape(ctx, s, [[-6, -60], [6, -60], [6, 10], [0, 26], [-6, 10]], { fill: C.brand, stroke: C.line, seed: 885, sharp: true, wob: 0.3, width: 2 });
  ctx.restore();
}

// A takeaway coffee: white cup, brown lid, kraft sleeve with a coffee bean,
// and soft wavy steam rising and fading.
export function coffee(ctx, s, o = {}) {
  place(ctx, o);
  // steam: three S-shaped wisps drifting up, each fading in and out
  ctx.save();
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const p = (s.T * 0.45 + i / 3) % 1;
    const x0 = -12 + i * 12, y0 = -52 - p * 46;
    const sway = Math.sin(s.T * 2.2 + i * 2) * 5;
    ctx.globalAlpha = Math.sin(Math.PI * p) * 0.75;
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 4.5 - p * 2;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.bezierCurveTo(x0 - 9 + sway, y0 - 10, x0 + 9 + sway, y0 - 20, x0 + sway, y0 - 32);
    ctx.stroke();
  }
  ctx.restore();
  // cup body, narrowing toward the bottom
  shape(ctx, s, [[-23, -36], [23, -36], [17, 30], [-17, 30]], { fill: '#F9FAFB', seed: 893, sharp: true, wob: 0.4 });
  // kraft sleeve with a coffee bean
  shape(ctx, s, [[-21.5, -18], [21.5, -18], [19, 12], [-19, 12]], { fill: '#A8733F', seed: 894, sharp: true, wob: 0.3, width: 2.5 });
  ctx.save();
  ctx.translate(0, -3);
  ctx.rotate(-0.5);
  ctx.fillStyle = '#4A2C17';
  ctx.beginPath();
  ctx.ellipse(0, 0, 6, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#A8733F';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(0, -7);
  ctx.quadraticCurveTo(-3, 0, 0, 7);
  ctx.stroke();
  ctx.restore();
  // the lid, with its rim and sip hole
  shape(ctx, s, [[-27, -36], [27, -36], [25, -44], [-25, -44]], { fill: '#5B3A22', seed: 895, sharp: true, wob: 0.3, width: 2.5 });
  shape(ctx, s, [[-19, -44], [19, -44], [15, -52], [-15, -52]], { fill: '#6B4529', seed: 896, sharp: true, wob: 0.3, width: 2.5 });
  ctx.fillStyle = '#1F1209';
  ctx.fillRect(4, -50, 7, 3);
  ctx.restore();
}

// A hammock between two posts. Draw it twice: layer 'back' (posts, ropes and
// the far side of the sling) before whoever lies in it, and layer 'front'
// (the near lip of the sling) after, so they sit inside it. y is the height
// of the post tops. hammockBed(o) gives the point a lying body's centre
// should sit at.
export const hammockBed = (o) => [(o.x0 + o.x1) / 2, o.y + 100];

export function hammock(ctx, s, o = {}) {
  const { x0, x1, y } = o;
  const sway = Math.sin(s.T * 1.2) * 6;
  const e0 = [x0 + 70, y + 46], e1 = [x1 - 70, y + 46];
  const mid = (x0 + x1) / 2;
  // a curve from end to end through a low point
  const curve = (dy, n = 16) => {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      pts.push([lerp(e0[0], e1[0], u), lerp(e0[1], e1[1], u) + Math.sin(Math.PI * u) * (dy + sway)]);
    }
    return pts;
  };
  if (o.layer !== 'front') {
    for (const [px, dir] of [[x0, 1], [x1, -1]]) {
      line(ctx, s, [[px, GROUND_Y(o)], [px, y - 10]], { stroke: '#8A6A4A', seed: 895 + px, width: 12 });
      shape(ctx, s, ellipsePts(px, y - 14, 9, 9, 10), { fill: '#A07C56', seed: 897 + px, wob: 0.3 });
      // the ropes fan out from the post top to the end of the sling
      const end = dir > 0 ? e0 : e1;
      for (const dy of [-8, 0, 8]) line(ctx, s, [[px, y - 4], [end[0], end[1] + dy]], { stroke: '#C8B08A', seed: 899 + px + dy, width: 2 });
    }
    // the far side of the sling, in shadow
    const back = [...curve(40), ...curve(150).reverse()];
    shape(ctx, s, back, { fill: '#3B1F6B', stroke: C.ink, seed: 902, wob: 0.6 });
  } else {
    // the near lip, striped, covering the lower half of whoever is inside
    const front = [...curve(96), ...curve(156).reverse()];
    shape(ctx, s, front, { fill: C.violet, stroke: C.ink, seed: 903, wob: 0.6 });
    ctx.save();
    smoothPath(ctx, front, true);
    ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 7;
    for (let i = -6; i <= 6; i++) {
      const x = mid + i * 40;
      ctx.beginPath();
      ctx.moveTo(x - 30, y);
      ctx.lineTo(x + 30, y + 260);
      ctx.stroke();
    }
    ctx.restore();
  }
}
const GROUND_Y = (o) => o.ground ?? o.y + 200;

// A red strike-through drawn in from left to right. p 0..1.
export function strike(ctx, x0, y0, x1, y1, p) {
  if (p <= 0) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = 'rgba(239,89,68,0.35)';
  ctx.lineWidth = 34;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(lerp(x0, x1, p), lerp(y0, y1, p));
  ctx.stroke();
  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = C.strike;
  ctx.lineWidth = 12;
  ctx.stroke();
  ctx.restore();
}

// How long Monero waited for a cross-chain swap, as a timeline from its
// launch (April 2014) through the first swap design on paper (h4sh3d's
// draft, December 2017) to the first working swaps (2020: the paper on
// eprint.iacr.org/2020/1126 and BasicSwap's first implementation). p (0..1)
// moves the marker along; each event's label appears as the marker reaches it.
const EVENTS = [[2014.3, 'Monero launches'], [2017.95, 'First swap design, on paper'], [2020.7, 'First working swaps']];

export function history(ctx, x0, x1, y, p) {
  if (p <= 0) return;
  const Y0 = 2014, Y1 = 2021;
  const xAt = (yr) => lerp(x0, x1, (yr - Y0) / (Y1 - Y0));
  const now = lerp(Y0, 2020.75, clamp(p));
  ctx.save();
  ctx.globalAlpha *= Math.min(1, p * 8);
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x1, y);
  ctx.stroke();
  ctx.strokeStyle = C.link;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(xAt(now), y);
  ctx.stroke();
  ctx.font = '400 26px "JetBrains Mono"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let yr = Y0; yr <= 2020; yr++) {
    const x = xAt(yr);
    ctx.fillStyle = now >= yr ? '#E5E7EB' : '#6B7280';
    ctx.fillRect(x - 1, y + 6, 2, 12);
    ctx.fillText(String(yr), x, y + 42);
  }
  EVENTS.forEach(([yr, label], i) => {
    const a = clamp((now - yr) * 3 + 1);
    if (a <= 0) return;
    const x = xAt(yr);
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.fillStyle = i === 2 ? C.xmr : i === 1 ? C.violet : C.link;
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#F9FAFB';
    ctx.font = '400 27px "JetBrains Mono"';
    ctx.fillText(label, x, y - 38 - (1 - a) * 10);
    ctx.restore();
  });
  // the marker
  const mx = xAt(now);
  const g = ctx.createRadialGradient(mx, y, 0, mx, y, 30);
  g.addColorStop(0, 'rgba(96,165,250,0.9)');
  g.addColorStop(1, 'rgba(96,165,250,0)');
  ctx.fillStyle = g;
  ctx.fillRect(mx - 30, y - 30, 60, 60);
  ctx.restore();
}
