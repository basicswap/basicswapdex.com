// 4. You lock your Bitcoin. You roll a big gold coin in like a wheel and it
// hops into the 2-of-2 box, whose two padlocks click shut. You pull out a
// cheque to the seller, sign it, and a wax seal stamps down on it. While you
// fix your scarf, the seller sneaks over and tries to peel the cheque off;
// the seal glows and zaps them, and they whistle innocently. Then they hold
// their orange half up to the seal: the shapes match.
import { C, lerp, lerpPt, bump, kick, seg } from '../lib/ink.js';
import { drawCharacter } from '../lib/cast.js';
import { keyHalf, glow, sparks } from '../lib/props.js';
import { night, soft, GROUND } from '../lib/night.js';
import { coin, box, cheque, seal, pen } from '../lib/things.js';
import { finish, whip, gait, faceAt } from '../lib/film.js';
import { SWAP, progress } from '../lib/timeline.js';

const BOX = [880, GROUND - 80];
const CLIP = [1050, GROUND - 205];

// Two notes floating up from a whistle.
function notes(ctx, x, y, p) {
  if (p <= 0 || p >= 1) return;
  ctx.save();
  ctx.fillStyle = C.link;
  ctx.font = '600 34px "Instrument Sans"';
  for (let i = 0; i < 2; i++) {
    const q = (p * 2 + i * 0.5) % 1;
    ctx.globalAlpha = Math.sin(Math.PI * q);
    ctx.fillText(i ? '♫' : '♪', x - 20 * q + i * 16, y - 70 * q);
  }
  ctx.restore();
}

export default function btcLock(s) {
  // the cheque comes out just before "sign", and gets signed through "payment"
  const tTwo = s.time('#two'), tPay = s.time('#sign') - 0.3, tSigned = s.time('#sign') + 0.1;
  const tSealed = s.time('#sealed'), tIt = s.time('Only');
  const tPresses = s.time('break'), tSeal = s.time('#seal');
  const roll = [0.5, 1.6], hop = 1.6, slam = 2.05;
  const clip = tSealed + 0.5;
  const zap = tPresses + 0.35, turnBack = zap + 0.55;

  const coinX = (t) => lerp(-180, BOX[0] - 120, seg(t, roll[0], roll[1] - roll[0], 'out'));
  const youX = (t) => coinX(t) - 120 + 60 * seg(t, hop, 0.5) - 40 * seg(t, tIt, 0.4);
  const sellerX = (t) => lerp(2150, CLIP[0] + 150, seg(t, tIt - 0.2, 1.6, 'inOut')) + 90 * seg(t, zap, 0.3, 'out');

  const cam = s.camera([
    { at: 0, x: 700, y: 620, zoom: 1.4, dur: 0 },
    { at: 0.6, x: 860, y: 640, zoom: 1.5, dur: 1.4 },
    { at: tTwo - 0.3, x: 880, y: 700, zoom: 1.9, dur: 0.5 },
    { at: tPay - 0.2, x: 860, y: 520, zoom: 1.8, dur: 0.6 },
    { at: clip, x: 980, y: 620, zoom: 1.45, dur: 0.6 },
    { at: tPresses - 0.4, x: 1080, y: 600, zoom: 1.6, dur: 0.6 },
    { at: tSeal - 0.4, x: 1090, y: 560, zoom: 2.0, dur: 0.5 },
    whip(s, { x: 1000, y: 580 }),
  ]);

  s.sfx('scribble', 0.6, { dur: 1.0, gain: 0.3 });
  s.sfx('whoosh', hop, { gain: 0.4, pitch: 1.4 });
  s.sfx('thud', slam);
  s.sfx('click', slam + 0.2);
  s.sfx('click', slam + 0.32, { pitch: 1.2 });
  s.sfx('pop', tPay);
  s.sfx('blip', tTwo);
  s.sfx('blip', tTwo + 0.3, { pitch: 1.3 });
  s.sfx('scribble', tSigned, { dur: 0.5 });
  s.sfx('thud', tSealed, { pitch: 1.3 });
  s.sfx('whoosh', clip, { gain: 0.3 });
  s.sfx('error', zap, { gain: 0.7 });
  s.sfx('sparkle', zap);
  s.sfx('chime', tSeal + 0.1); // the orange half
  s.sfx('rise', s.dur - 1.3, { dur: 1.3, gain: 0.5 });

  s.draw({ at: 0, enter: 'none' }, (ctx) => {
    const t = s.t;
    const sh = t > tSealed ? kick(t - tSealed, 9) : 0;
    ctx.translate(Math.sin(t * 70) * 6 * sh, Math.cos(t * 50) * 4 * sh);
    night(ctx, s, {});
    soft(ctx, 700, 600, 900, 'rgba(247,181,0,0.07)');
    soft(ctx, 960, 300, 900, 'rgba(96,165,250,0.06)');

    const yx = youX(t), sx = sellerX(t);

    // ---- the box ----
    const lid = 1 - seg(t, slam - 0.1, 0.12, 'in');
    box(ctx, s, { x: BOX[0], y: BOX[1], open: t < slam ? 1 : lid, scale: 1 });
    // "opening it takes two signatures": both padlocks light up, yours and the seller's
    const two = bump(t - tTwo + 0.1, 1.5);
    if (two > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, BOX[0] - 52, BOX[1] + 20, 90, C.btc, two);
      glow(ctx, BOX[0] + 52, BOX[1] + 20, 90, C.xmr, two * seg(t, tTwo + 0.2, 0.3));
      ctx.restore();
    }

    // ---- the cheque: pulled out, signed, sealed, clipped on ----
    const out = seg(t, tPay - 0.1, 0.45, 'outBack');
    const toClip = seg(t, clip, 0.5);
    const held = [yx + 150, GROUND - 330];
    const cp = lerpPt(lerpPt([yx + 60, GROUND - 120], held, out), CLIP, toClip);
    const ck = lerp(lerp(0.3, 1.1, out), 0.62, toClip);
    const stamp = seg(t, tSealed - 0.25, 0.25, 'in');
    const peel = s.between(tPresses, zap) ? Math.sin(t * 40) * 0.05 : 0;
    const sealOn = t > tSealed;
    if (t > tPay - 0.1) {
      cheque(ctx, s, {
        signed: seg(t, tSigned, 0.5, 'linear'),
        x: cp[0], y: cp[1], scale: ck, rot: lerp(-0.05, 0.08, toClip) + peel,
        seal: sealOn ? { glow: kick(t - tSealed, 3) * 0.8 + bump(t - tPresses, zap - tPresses + 0.3) + bump(t - tSeal, 1.2) } : null,
      });
    }
    // the seal coming down from above
    if (stamp > 0 && stamp < 1) {
      seal(ctx, s, { x: cp[0] + 82 * ck, y: lerp(cp[1] - 400, cp[1] + 20 * ck, stamp), scale: ck * 1.3 });
    }
    if (t > tSealed && t < tSealed + 0.5) sparks(ctx, s, cp[0] + 82 * ck, cp[1] + 20 * ck, seg(t, tSealed, 0.4, 'out'), 8, 12);
    if (t > zap && t < zap + 0.6) sparks(ctx, s, CLIP[0] + 50, CLIP[1] + 12, seg(t, zap, 0.5, 'out'), 10, 31);

    // ---- the big coin ----
    if (t < hop + 0.45) {
      const h = seg(t, hop, 0.45);
      const cx = lerp(coinX(t), BOX[0], h);
      const cy = lerp(GROUND - 70, BOX[1] - 40, h) - Math.sin(Math.PI * h) * 180;
      ctx.save();
      if (h > 0.6) {
        ctx.beginPath();
        ctx.rect(-500, -500, 3000, BOX[1] - 80 + 500);
        ctx.clip();
      }
      coin(ctx, s, 'btc', { x: cx, y: cy, r: 70, rot: coinX(t) / 70 + h * 4 });
      ctx.restore();
    }

    // ---- characters ----
    const fixingScarf = s.between(tIt, turnBack);
    const youFace = faceAt(t, { look: 1, lookY: 0, brow: 0.5, mouth: 'flat' }, [
      [slam, { look: 1, lookY: 0.2, mouth: 'smile' }],
      [tPay, { look: 1, lookY: -0.8, mouth: 'smile' }],
      [tSigned, { look: 1, lookY: -0.5, brow: 0.6, mouth: 'flat' }],
      [tSealed + 0.1, { look: 1, lookY: -0.3, brow: 0, mouth: 'smile' }],
      [tIt, { look: 0, lookY: 1, lids: 0.3, mouth: 'flat' }],
      [turnBack, { look: 1, lookY: -0.2, brow: 0.9, mouth: 'flat' }],
    ]);
    drawCharacter(ctx, s, 'you', {
      x: yx, y: GROUND, face: fixingScarf ? -1 : 1, ...youFace, ...gait(youX, t, 40, 220),
      handF: s.between(tPay - 0.1, clip) ? [held[0] - 60, held[1] + 70] : fixingScarf ? [yx - 30 + Math.sin(t * 14) * 10, GROUND - 120] : null,
      handB: s.between(tSigned - 0.1, tSigned + 0.6) ? [held[0] - 30 + Math.sin(t * 30) * 25, held[1] + 20] : fixingScarf ? [yx + 30 + Math.cos(t * 14) * 10, GROUND - 120] : null,
      lean: 0.18 * (t < hop ? 1 : 0) * seg(t, roll[0], 0.3),
    });
    if (s.between(tSigned - 0.1, tSigned + 0.6)) {
      pen(ctx, s, { x: held[0] - 30 + Math.sin(t * 30) * 25, y: held[1] - 10, scale: 0.8, rot: 0.5 });
    }
    const whistle = s.between(turnBack - 0.1, tSeal - 0.3);
    const sellerFace = faceAt(t, { look: -1, lookY: 0.4, lids: 0.55, brow: 0.6, mouth: 'smirk' }, [
      [tPresses, { look: -1, lookY: 0.3, lids: 0.2, brow: 0.9, mouth: 'flat' }],
      [zap, { look: 0, lookY: -0.6, lids: 0, brow: -1, mouth: 'o' }],
      [turnBack - 0.1, { look: 0.4, lookY: -0.9, lids: 1, brow: -0.2, mouth: 'o' }],
      [tSeal - 0.3, { look: -1, lookY: 0.2, lids: 0.4, brow: 0.3, mouth: 'smirk' }],
    ]);
    if (sx < 2100) {
      drawCharacter(ctx, s, 'seller', {
        x: sx, y: GROUND, face: -1, ...sellerFace,
        ...gait(sellerX, t, 90, 160),
        handF: s.between(tPresses - 0.1, zap + 0.1) ? [CLIP[0] + 60, CLIP[1]] : t > tSeal - 0.4 ? [CLIP[0] + 160, CLIP[1] - 20] : whistle ? [sx + 30, GROUND - 120] : null,
        handB: whistle ? [sx + 50, GROUND - 130] : null,
        flail: s.between(zap, zap + 0.5),
        lean: 0.25 * (t < tPresses ? seg(t, tIt - 0.2, 0.3) : 0) + 0.2 * (s.between(tPresses, zap) ? 1 : 0) - 0.2 * bump(t - zap, 0.5),
        squash: -0.12 * bump(t - zap, 0.3),
      });
    }
    notes(ctx, sx - 20, GROUND - 260, whistle ? ((t - turnBack) / 1.6) % 1 : 0);

    // ---- the match: the orange half held up next to the seal ----
    const show = seg(t, tSeal - 0.4, 0.4, 'outBack');
    if (show > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, CLIP[0] + 120, CLIP[1] - 50, 140, C.xmr, 0.5 * show);
      ctx.restore();
      keyHalf(ctx, s, 'theirs', { x: CLIP[0] + 125, y: CLIP[1] - 62, scale: 0.6 * show, rot: -0.15, tint: 1 });
    }

    finish(s, ctx, cam, '04 · you lock your bitcoin', { timeline: { steps: SWAP, p: progress(t, 2, [[slam + 0.3, 3]]) } });
  });
}
