// The two leads. Both are built from simple shapes so every scene draws the
// same characters; see "Characters" in ANIMATION_GUIDE.md.
//
// drawCharacter(ctx, s, 'you' | 'seller', pose) draws one at pose.x, pose.y
// (the point between the feet, on the ground). Pose fields, all optional:
//   face     1 faces right, -1 faces left
//   look     -1..1 pupils left/right, lookY -1..1 up/down
//   lids     0 open .. 1 closed (the seller rests at 0.45)
//   brow     -1 worried .. 1 suspicious
//   mouth    'smile' | 'flat' | 'o' | 'smirk' | 'frown'
//   lean     radians, positive tips forward
//   squash   0.1 is a 10% squash, negative stretches
//   handF    [x, y] world position of the hand on the facing side, or null
//   handB    [x, y] world position of the other hand, or null
//   wind     pushes the scarf tails back, in pixels
//   walk     step phase, counts up one per stride; use distance / stepLen
//   stride   0 standing .. 1 full run, scales the leg swing and body bob
//   rot      radians, spins the whole character about the body's centre
//   flail    true waves both arms over the head
//   ground   the floor's y, when pose.y is off the floor (jumping)
//   scarf    scarf colour override, stripe its stripe (null for none)
//   joy      0..1 the unhinged celebration face: huge sparkly eyes, brows up
//            (pair it with mouth 'yay')
//   nightcap true puts a sleeping cap on
//   xeyes    true swaps the eyes for stunned crosses
//   groggy   true gives just-woken eyes (pair with mouth 'yawn' or 'wavy')
//   squint   0..1 narrows dot eyes under a lid line, for a suspicious look
//   underArms (ctx) => draws something held against the body, between the
//            body and the arms, in world coordinates
import { C, LINE, shape, line, ellipsePts } from './ink.js';

const SPECS = {
  you: {
    body: C.youBody, rx: 72, ry: 82, legLen: 30, legX: 0.36, footR: 16,
    eyeY: -0.42, eyeGap: 22, eye: 'dot', mouthY: -0.12,
    scarfTop: 0.02, scarfBot: 0.24, scarf: C.btc, stripe: null,
    lids: 0, seed: 1, blink: 4.1,
  },
  seller: {
    body: C.sellerBody, rx: 52, ry: 112, legLen: 66, legX: 0.34, footR: 15,
    eyeY: -0.56, eyeGap: 18, eye: 'lid', mouthY: -0.36,
    scarfTop: -0.26, scarfBot: -0.08, scarf: C.xmr, stripe: C.xmrGrey,
    lids: 0.45, seed: 2, blink: 4.9,
  },
  // the toll keeper in the cold open: wide, short, top hat, no scarf
  keeper: {
    body: '#D9CCB4', rx: 80, ry: 64, legLen: 26, legX: 0.4, footR: 15,
    eyeY: -0.4, eyeGap: 22, eye: 'dot', mouthY: -0.02,
    scarfTop: 0.3, scarfBot: 0.3, scarf: null, stripe: null, hat: true,
    lids: 0, seed: 3, blink: 3.7,
  },
};

export const spec = (who) => SPECS[who];

// Where the body's centre sits above the feet.
export const bodyY = (who) => -(SPECS[who].legLen + SPECS[who].ry);

// The resting hand positions, in world coordinates, for a pose.
export function restHands(who, pose) {
  const k = SPECS[who], f = pose.face ?? 1, cy = pose.y + bodyY(who);
  return {
    front: [pose.x + f * (k.rx + 12), cy + k.ry * 0.5],
    back: [pose.x - f * (k.rx + 12), cy + k.ry * 0.5],
  };
}

// Half the body's width at a height dy from its centre.
const widthAt = (k, dy) => k.rx * Math.sqrt(Math.max(0, 1 - (dy / k.ry) ** 2));

export function drawCharacter(ctx, s, who, pose) {
  const k = SPECS[who];
  const f = pose.face ?? 1;
  const seed = k.seed * 100;
  const breath = Math.sin(s.T * (who === 'you' ? 2.3 : 1.7) + k.seed) * 0.015;
  const sq = (pose.squash ?? 0) - breath;
  const cy = bodyY(who);
  const stride = pose.stride ?? 0;
  const ph = (pose.walk ?? 0) * Math.PI * 2;
  const bob = Math.abs(Math.sin(ph)) * stride * 10;

  // contact shadow on the floor, smaller and fainter the higher we are
  const lift = Math.max(0, (pose.ground ?? pose.y) - pose.y);
  const sh = 1 / (1 + lift / 160);
  ctx.save();
  ctx.fillStyle = `rgba(0,0,0,${0.45 * sh})`;
  ctx.beginPath();
  ctx.ellipse(pose.x, (pose.ground ?? pose.y) + 2, k.rx * 1.05 * sh, 9 * sh, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // the canvas as it was before the character, for pose.underArms
  const base = ctx.getTransform();
  ctx.save();
  ctx.translate(pose.x, pose.y);
  if (pose.rot) {
    ctx.translate(0, cy);
    ctx.rotate(pose.rot * f);
    ctx.translate(0, -cy);
  }
  ctx.rotate((pose.lean ?? 0) * f);
  ctx.scale(1 + sq * 0.6, 1 - sq);

  // legs and feet in light line so they read on navy; walking swings them
  for (const side of [-1, 1]) {
    const lx = side * k.rx * k.legX;
    const a = ph + (side > 0 ? 0 : Math.PI);
    const swing = Math.sin(a) * stride * k.rx * 0.5 * f;
    const up = Math.max(0, Math.cos(a)) * stride * 16;
    const foot = [lx + f * 4 + swing, -4 - up];
    line(ctx, s, [[lx, -k.legLen - 6 - bob], [(lx + foot[0]) / 2 + f * 3, (-k.legLen - bob + foot[1]) / 2], foot], { stroke: C.line, seed: seed + 10 + side, width: LINE + 1 });
    shape(ctx, s, ellipsePts(foot[0] + f * 5, foot[1] - 1, k.footR, 7, 12), { fill: C.line, stroke: 'none', seed: seed + 12 + side, wob: 0.6 });
  }
  ctx.translate(0, -bob);

  // hands: given in world space, or resting, swinging while walking, or flailing
  const restF = [f * (k.rx + 12), cy + k.ry * 0.5], restB = [-f * (k.rx + 12), cy + k.ry * 0.5];
  const swingH = Math.sin(ph) * stride * 22 * f;
  const flail = (side, n) => [side * (k.rx + 26) + Math.sin(s.T * 18 + n) * 10, cy - k.ry * 0.75 + Math.cos(s.T * 18 + n) * 14];
  const handF = pose.handF ? toLocal(pose, pose.handF, sq, bob) : pose.flail ? flail(f, 0) : [restF[0] - swingH, restF[1]];
  const handB = pose.handB ? toLocal(pose, pose.handB, sq, bob) : pose.flail ? flail(-f, 2) : [restB[0] + swingH, restB[1]];

  // scarf tails hang behind the body, so they go first
  const sMid = cy + k.ry * (k.scarfTop + k.scarfBot) / 2;
  const sW = widthAt(k, k.ry * (k.scarfTop + k.scarfBot) / 2);
  const scarf = pose.scarf ?? k.scarf, stripe = pose.stripe !== undefined ? pose.stripe : k.stripe;
  if (scarf) for (const i of [0, 1]) tail(ctx, s, k, f, [-f * sW * 0.55, sMid + 4], i, pose.wind ?? 0, seed + 20 + i, scarf);

  // body
  const bodyPts = ellipsePts(0, cy, k.rx, k.ry, 22);
  shape(ctx, s, bodyPts, { fill: k.body, seed: seed + 1, wob: 1.3 });

  // scarf band
  const yT = cy + k.ry * k.scarfTop, yB = cy + k.ry * k.scarfBot;
  if (scarf) shape(ctx, s, band(k, cy, yT, yB), { fill: scarf, seed: seed + 30 });
  if (scarf && stripe) {
    const yM = (yT + yB) / 2;
    shape(ctx, s, band(k, cy, yM - 2.5, yM + 2.5, 0.98), { fill: stripe, stroke: 'none', seed: seed + 31, wob: 0.6 });
  }

  face(ctx, s, k, f, cy, pose, seed);
  if (pose.nightcap) {
    // a floppy cap in BasicSwap Blue: it hugs the top of the head, its tip
    // curls up and back, and a pom-pom sits on the tip
    const top = cy - k.ry;
    const yb = top + k.ry * 0.32;
    const hw = widthAt(k, yb - cy) * 1.04;
    const back = -f;
    const cap = [
      [f * hw, yb],
      [f * k.rx * 0.7, top + k.ry * 0.06],
      [f * k.rx * 0.15, top - 14],
      [back * k.rx * 0.5, top - 24],
      [back * k.rx * 0.86, top - 50],
      [back * k.rx * 0.86, top - 30],
      [back * k.rx * 0.8, top + k.ry * 0.12],
      [back * hw, yb],
    ];
    shape(ctx, s, cap, { fill: C.brand, seed: seed + 72, wob: 0.6 });
    shape(ctx, s, band(k, cy, yb - 9, yb + 7, 1.06), { fill: '#F9FAFB', seed: seed + 73, wob: 0.4 });
    shape(ctx, s, ellipsePts(back * k.rx * 0.92, top - 52, 12, 12, 12), { fill: '#F9FAFB', seed: seed + 74, wob: 0.4 });
  }
  if (k.hat) {
    const hy = cy - k.ry + 8;
    shape(ctx, s, [[-56, hy], [56, hy], [56, hy - 10], [-56, hy - 10]], { fill: C.ink, stroke: C.line, seed: seed + 70, sharp: true, wob: 0.5, width: 2 });
    shape(ctx, s, [[-34, hy - 8], [34, hy - 8], [30, hy - 70], [-30, hy - 70]], { fill: C.ink, stroke: C.line, seed: seed + 71, sharp: true, wob: 0.5, width: 2 });
    ctx.fillStyle = C.brand;
    ctx.fillRect(-33, hy - 26, 66, 9);
  }

  // anything held against the body (a notepad) goes between body and arms,
  // drawn in world coordinates
  if (pose.underArms) {
    ctx.save();
    ctx.setTransform(base);
    pose.underArms(ctx);
    ctx.restore();
  }
  // arms go on top of the body
  arm(ctx, s, k, [f * k.rx * 0.8, yB + 4], handF, seed + 40);
  arm(ctx, s, k, [-f * k.rx * 0.8, yB + 4], handB, seed + 41);

  ctx.restore();
}

// World point to the character's local space (ignores lean and rot).
function toLocal(pose, [hx, hy], sq, bob) {
  return [(hx - pose.x) / (1 + sq * 0.6), (hy - pose.y) / (1 - sq) + bob];
}

function band(k, cy, yT, yB, inset = 1.06) {
  const pts = [];
  const n = 6;
  for (let i = 0; i <= n; i++) {
    const u = -1 + (2 * i) / n;
    const w = widthAt(k, yT - cy) * inset;
    pts.push([u * w, yT + 5 * (1 - u * u)]);
  }
  for (let i = n; i >= 0; i--) {
    const u = -1 + (2 * i) / n;
    const w = widthAt(k, yB - cy) * inset;
    pts.push([u * w, yB + 7 * (1 - u * u)]);
  }
  return pts;
}

function tail(ctx, s, k, f, [bx, by], i, wind, seed, color) {
  const sway = Math.sin(s.T * 2.6 + i * 1.3 + k.seed) * 5;
  const back = -f * (10 + i * 14 + wind);
  const spine = [
    [bx, by],
    [bx + back * 0.6 + sway * 0.3, by + 26],
    [bx + back + sway, by + 56 + i * 6],
  ];
  const wide = [10, 8, 6];
  const left = [], right = [];
  spine.forEach(([x, y], j) => {
    const [nx, ny] = j < spine.length - 1 ? spine[j + 1] : spine[j];
    const [px, py] = j > 0 ? spine[j - 1] : spine[j];
    let dx = nx - px, dy = ny - py;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len; dy /= len;
    left.push([x - dy * wide[j], y + dx * wide[j]]);
    right.push([x + dy * wide[j], y - dx * wide[j]]);
  });
  shape(ctx, s, [...left, ...right.reverse()], { fill: color, seed, sharp: true });
  // fringe
  const [ex, ey] = spine[2];
  for (const d of [-5, 0, 5]) line(ctx, s, [[ex + d, ey + 4], [ex + d + sway * 0.2, ey + 13]], { seed: seed + d, width: 2 });
}

function face(ctx, s, k, f, cy, pose, seed) {
  const fx = f * k.rx * 0.2;
  const ey = cy + k.ry * k.eyeY;
  const look = pose.look ?? 0, lookY = pose.lookY ?? 0;
  const blinking = (s.T + k.seed * 1.7) % k.blink < 0.13;
  const lids = blinking ? 1 : pose.lids ?? k.lids;
  const joy = pose.joy ?? 0;
  const brow = pose.brow ?? 0;

  for (const side of [-1, 1]) {
    const ex = fx + side * k.eyeGap;
    if (pose.xeyes) {
      // stunned: a cross for each eye, and no brows
      const r = k.eye === 'dot' ? 9 : 11;
      line(ctx, s, [[ex - r, ey - r], [ex + r, ey + r]], { seed: seed + 56 + side, width: LINE + 0.5, wob: 0.4 });
      line(ctx, s, [[ex + r, ey - r], [ex - r, ey + r]], { seed: seed + 58 + side, width: LINE + 0.5, wob: 0.4 });
      continue;
    }
    if (k.eye === 'dot') {
      const px = ex + look * 6, py = ey + lookY * 5;
      const er = 7.5 * (1 + 0.9 * joy);
      if (pose.groggy || pose.squint) {
        // lidded eyes: only the part of each pupil below the lid is drawn,
        // so nothing is painted over the face. groggy has one eye more shut
        // than the other and bags underneath; squint narrows both evenly
        // and keeps the pupils where they are looking.
        const r = 8.5;
        const gl = pose.groggy ? (side < 0 ? 0.64 : 0.4) : pose.squint;
        const lidY = py - r + r * 2 * gl;
        ctx.save();
        ctx.beginPath();
        ctx.rect(px - r - 2, lidY, r * 2 + 4, r * 2 + 2);
        ctx.clip();
        ctx.fillStyle = C.ink;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        const tilt = side * (pose.squint ? 2.5 : 1);
        line(ctx, s, [[px - r - 4, lidY + tilt], [px + r + 4, lidY - tilt]], { seed: seed + 62 + side, width: 3, wob: 0.3 });
        if (pose.groggy) line(ctx, s, [[px - 9, py + 12], [px, py + 16], [px + 9, py + 12]], { stroke: '#A79BB8', seed: seed + 64 + side, width: 2.2, wob: 0.3 });
      } else if (lids > 0.8) line(ctx, s, [[px - 7, py], [px + 7, py]], { seed: seed + 50 + side, width: LINE });
      else {
        const open = 1 - lids;
        shape(ctx, s, ellipsePts(px, py, er, er * open + 1, 10), { fill: C.ink, seed: seed + 50 + side, wob: 0.4 });
        ctx.fillStyle = C.eyeWhite;
        ctx.beginPath();
        ctx.arc(px + er * 0.33, py - er * 0.33 * open, 2.2 + 2 * joy, 0, Math.PI * 2);
        ctx.fill();
        if (joy > 0) sparkle(ctx, px - er * 0.3, py + er * 0.25, 3.5 * joy, s.T * 6 + side);
      }
    } else {
      const rx = 12 * (1 + 0.45 * joy), ry = 11 * (1 + 0.45 * joy);
      shape(ctx, s, ellipsePts(ex, ey, rx, ry, 12), { fill: C.eyeWhite, width: 2.5, seed: seed + 50 + side, wob: 0.5 });
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(ex, ey, rx - 1, ry - 1, 0, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = C.ink;
      ctx.beginPath();
      // pupils travel further up and down than sideways, so an eye roll reads
      ctx.arc(ex + look * 5, ey + lookY * 6 + 1, 5.5 * (1 + 0.5 * joy), 0, Math.PI * 2);
      ctx.fill();
      if (joy > 0) sparkle(ctx, ex + look * 5 + 2, ey + lookY * 4 - 1, 3 * joy, s.T * 6 + side);
      const lidY = ey - ry + lids * ry * 2;
      ctx.fillStyle = k.body;
      ctx.fillRect(ex - rx - 2, ey - ry - 2, rx * 2 + 4, lidY - (ey - ry) + 2);
      ctx.restore();
      if (lids > 0.02) line(ctx, s, [[ex - rx, lidY], [ex, lidY + 1], [ex + rx, lidY]], { seed: seed + 52 + side, width: 2.5 });
    }
    // brow: positive tips the inner end down
    const by = ey - (k.eye === 'dot' ? 18 : 20) - joy * 12;
    const inner = -side; // the inner end points toward the other eye
    const x1 = ex + inner * 10, x2 = ex - inner * 9;
    line(ctx, s, [[x1, by + brow * 6], [x2, by - brow * 3]], { seed: seed + 54 + side, width: 2.5 });
  }

  const my = cy + k.ry * k.mouthY, mx = fx;
  const m = pose.mouth ?? (k.eye === 'dot' ? 'smile' : 'smirk');
  const mw = 12;
  const o = { seed: seed + 60, width: 2.5 };
  if (m === 'smile') line(ctx, s, [[mx - mw, my], [mx, my + 6], [mx + mw, my]], o);
  else if (m === 'frown') line(ctx, s, [[mx - mw, my + 5], [mx, my - 2], [mx + mw, my + 5]], o);
  else if (m === 'flat') line(ctx, s, [[mx - mw, my + 2], [mx + mw, my + 1]], o);
  else if (m === 'smirk') line(ctx, s, [[mx - mw * f, my + 2], [mx + mw * 0.3 * f, my + 3], [mx + mw * f, my - 4]], o);
  else if (m === 'yay') {
    // a big open D of a mouth, tongue and all
    const yw = 22, yh = 26;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(mx - yw, my - 4);
    ctx.lineTo(mx + yw, my - 4);
    ctx.quadraticCurveTo(mx + yw, my + yh, mx, my + yh);
    ctx.quadraticCurveTo(mx - yw, my + yh, mx - yw, my - 4);
    ctx.closePath();
    ctx.fillStyle = '#3B0A16';
    ctx.fill();
    ctx.clip();
    ctx.fillStyle = '#F472B6';
    ctx.beginPath();
    ctx.ellipse(mx + 2, my + yh - 2, 13, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(mx - yw, my - 4, yw * 2, 6);
    ctx.restore();
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(mx - yw, my - 4);
    ctx.lineTo(mx + yw, my - 4);
    ctx.quadraticCurveTo(mx + yw, my + yh, mx, my + yh);
    ctx.quadraticCurveTo(mx - yw, my + yh, mx - yw, my - 4);
    ctx.stroke();
  } else if (m === 'grin') {
    const gw = 26;
    shape(ctx, s, [[mx - gw, my - 4], [mx - gw * 0.5, my + 10], [mx + gw * 0.5, my + 10], [mx + gw, my - 4]], { fill: '#FFFFFF', seed: seed + 60, wob: 0.4, width: 2.5 });
    line(ctx, s, [[mx - gw * 0.8, my + 2], [mx + gw * 0.8, my + 2]], { seed: seed + 61, width: 1.5 });
  } else if (m === 'yawn') {
    // a huge yawn: a tall dark oval with the tongue at the bottom
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(mx, my + 8, 13, 19, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#3B0A16';
    ctx.fill();
    ctx.clip();
    ctx.fillStyle = '#F472B6';
    ctx.beginPath();
    ctx.ellipse(mx, my + 25, 10, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    shape(ctx, s, ellipsePts(mx, my + 8, 13, 19, 14), { fill: null, seed: seed + 60, wob: 0.4, width: 2.5 });
  } else if (m === 'wavy') {
    // dazed: a wobbly little line
    line(ctx, s, [[mx - 12, my + 2], [mx - 6, my - 1], [mx, my + 3], [mx + 6, my - 1], [mx + 12, my + 2]], { ...o, wob: 0.3 });
  } else if (m === 'o') shape(ctx, s, ellipsePts(mx, my + 2, 6, 7, 10), { fill: C.ink, seed: seed + 60, wob: 0.4 });
}

// A four-point twinkle, for the celebration eyes.
function sparkle(ctx, x, y, r, a) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a * 0.3);
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const rr = i % 2 ? r * 0.3 : r;
    const ang = (i * Math.PI) / 4;
    ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function arm(ctx, s, k, sh, hand, seed) {
  const [sx, sy] = sh, [hx, hy] = hand;
  const elbow = [(sx + hx) / 2 + (hx - sx) * 0.1, (sy + hy) / 2 + 12];
  line(ctx, s, [sh, elbow, hand], { stroke: C.line, seed, width: LINE + 1 });
  shape(ctx, s, ellipsePts(hx, hy, 9, 9, 10), { fill: k.body, seed: seed + 1, wob: 0.5, width: 2.5 });
}
