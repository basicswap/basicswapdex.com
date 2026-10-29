// 6. The claim. Bitcoin's public square: a board drawn like one of the
// site's cards, and a crowd milling about. The seller strides in, presses
// their orange half into the seal, and the box pops your Bitcoin into their
// arms. To cash the cheque they have to pin it to the public board, broken
// seal and all. The crowd turns to look, and the jagged shape of the seller's
// half rises off the seal for anyone to read.
import { C, lerp, lerpPt, bump, kick, seg } from '../lib/ink.js';
import { drawCharacter } from '../lib/cast.js';
import { keyHalf, glow, sparks } from '../lib/props.js';
import { night, soft, GROUND } from '../lib/night.js';
import { coin, box, cheque, board, crowd, vault } from '../lib/things.js';
import { finish, whip, gait, after, faceAt } from '../lib/film.js';
import { SWAP, progress } from '../lib/timeline.js';

const BOX = [1250, GROUND - 80];
const CLIP = [1420, GROUND - 205];
const BOARD = { x: 260, y: 300, w: 560, h: 360 };
const PIN = [530, 500];
const PIN_K = 0.95;
const SEAL = [PIN[0] + 82 * PIN_K, PIN[1] + 20 * PIN_K];

export default function claim(s) {
  const tHalf = s.time('#half'), tSeal = s.time('seal'), tPins = s.time('pins');
  const tBoard = s.time('#board'), tSeal2 = s.cue('seal', 2), tAnyone = s.time('anyone'), tShape = s.time('#shape');
  const press = tSeal - 0.15, pop = press + 0.35, grab = tPins - 0.5;

  const sellerX = (t) => lerp(2150, 1590, seg(t, 0.9, 1.3, 'out')) - 60 * seg(t, tHalf - 0.2, 0.4)
    - 780 * seg(t, grab + 0.2, tBoard - grab - 0.5, 'inOut') + 230 * seg(t, tBoard + 0.2, 0.5);
  const tNobody = s.time('Nobody'), tOther = s.time('#other'), tPocket = s.time('pocket');
  const youX = (t) => lerp(-200, 170, seg(t, tShape - 0.7, 0.7, 'out')) + 150 * seg(t, tNobody - 0.2, 0.8);
  const MINI = [1100, 300];

  const cam = s.camera([
    { at: 0, x: 960, y: 580, zoom: 1.3, dur: 0 },
    { at: tHalf - 0.6, x: 1440, y: 620, zoom: 1.7, dur: 0.6 },
    { at: grab, x: 1000, y: 580, zoom: 1.3, dur: 0.8 },
    { at: tBoard - 0.3, x: 700, y: 540, zoom: 1.5, dur: 0.6 },
    { at: tSeal2 - 0.3, x: 620, y: 500, zoom: 2.3, dur: 0.6 },
    { at: tAnyone - 0.4, x: 620, y: 600, zoom: 1.35, dur: 0.7 },
    { at: tShape - 0.4, x: 600, y: 470, zoom: 1.85, dur: 0.6 },
    { at: tNobody - 0.3, x: 700, y: 540, zoom: 1.2, dur: 0.8 },
    whip(s, { x: 700, y: 520 }),
  ]);

  s.sfx('scribble', 0.9, { dur: 0.9, gain: 0.3 });
  s.sfx('pop', tHalf);
  s.sfx('thud', press + 0.15, { pitch: 1.4 });
  s.sfx('chime', press + 0.2); // the orange half
  s.sfx('pop', pop, { pitch: 1.2 });
  s.sfx('whoosh', grab + 0.2, { gain: 0.5 });
  s.sfx('scribble', grab + 0.3, { dur: 1.2, gain: 0.3 });
  s.sfx('thud', tBoard, { pitch: 1.6 });
  s.sfx('rise', tAnyone - 0.2, { dur: 0.6, gain: 0.4 });
  s.sfx('chime', tShape + 0.05); // and the orange half again, alone
  s.sfx('sparkle', tShape + 0.1, { gain: 0.6 });
  s.sfx('pop', tNobody, { pitch: 0.9 });
  s.sfx('error', tNobody + 0.6, { gain: 0.5 });
  s.sfx('ding', tOther + 0.2);
  s.sfx('tick', tPocket + 0.2);
  s.sfx('rise', s.dur - 1.3, { dur: 1.3, gain: 0.5 });

  s.draw({ at: 0, enter: 'none' }, (ctx) => {
    const t = s.t;
    const sh = t > tBoard ? kick(t - tBoard, 9) : 0;
    ctx.translate(Math.sin(t * 70) * 6 * sh, 0);
    night(ctx, s, {});
    soft(ctx, 700, 500, 1000, 'rgba(96,165,250,0.08)');
    soft(ctx, 540, 480, 500, 'rgba(59,130,246,0.10)');

    board(ctx, s, { ...BOARD, ground: GROUND });

    // ---- the box and your Bitcoin ----
    const lidPop = seg(t, pop - 0.1, 0.25, 'outBack');
    box(ctx, s, { x: BOX[0], y: BOX[1], open: lidPop });
    const sx = sellerX(t);
    const arms = [sx - 70, GROUND - 210];
    if (t > pop - 0.05 && t <= pop + 0.5) {
      const fly = seg(t, pop, 0.5);
      const p = lerpPt([BOX[0], BOX[1] - 60], arms, fly);
      p[1] -= Math.sin(Math.PI * fly) * 200;
      coin(ctx, s, 'btc', { x: p[0], y: p[1], r: lerp(50, 44, fly), flip: fly < 1 ? Math.cos(t * 14) : 1 });
    }

    // ---- the cheque: on the box, then carried, then pinned ----
    const carry = seg(t, grab, 0.3);
    const pinned = seg(t, tBoard - 0.2, 0.2, 'in');
    const broken = seg(t, press + 0.15, 0.3, 'out');
    const carried = [sx - 40, GROUND - 330];
    const cp = t < tBoard - 0.2 ? lerpPt(CLIP, carried, carry) : lerpPt(carried, PIN, pinned);
    const ck = lerp(lerp(0.62, 0.55, carry), PIN_K, pinned);
    const sealGlow = kick(t - press - 0.15, 3) * after(t, press + 0.15) + bump(t - tSeal2, 1.4) + bump(t - tShape, 1.6);
    cheque(ctx, s, { signed: 1, x: cp[0], y: cp[1], scale: ck, rot: t < grab ? 0.08 : lerp(Math.sin(t * 12) * 0.1, -0.03, pinned), seal: { broken, glow: sealGlow } });
    if (pinned >= 1) {
      // the pushpin
      ctx.fillStyle = C.strike;
      ctx.beginPath();
      ctx.arc(PIN[0] - 100 * PIN_K, PIN[1] - 50 * PIN_K, 10, 0, Math.PI * 2);
      ctx.fill();
    }
    if (t > press + 0.15 && t < press + 0.7) sparks(ctx, s, CLIP[0] + 51, CLIP[1] + 12, seg(t, press + 0.15, 0.5, 'out'), 10, 41);

    // ---- the seller's half: out of the pocket, into the seal ----
    const out = seg(t, tHalf - 0.1, 0.35, 'outBack');
    const into = seg(t, press - 0.2, 0.35, 'in');
    const pocketHalf = (1 - seg(t, pop - 0.1, 0.2)) * out;
    if (pocketHalf > 0.01) {
      const hp = lerpPt([sx - 80, GROUND - 260], [CLIP[0] + 51 + 40, CLIP[1] - 10], into);
      keyHalf(ctx, s, 'theirs', { x: hp[0], y: hp[1], scale: 0.55 * pocketHalf, rot: lerp(-0.4, 0.2, into), tint: 1 });
    }

    // ---- crowd and characters ----
    const turn = seg(t, tAnyone - 0.3, 0.9, 'linear');
    crowd(ctx, s, { x0: 150, x1: 1000, y: GROUND, n: 10, idle: 0.7, look: -0.5, lookY: -1, turn, ooh: t > tAnyone, hop: bump(t - tShape, 1.2) });

    const sellerFace = faceAt(t, { look: -1, lookY: 0.4, lids: 0.5, brow: 0.4, mouth: 'smirk' }, [
      [tHalf, { look: -1, lookY: -0.3, lids: 0.3, brow: 0.7, mouth: 'smirk' }],
      [pop + 0.4, { look: -0.5, lookY: 0.6, lids: 0, brow: -0.3, mouth: 'smile' }],
      [grab, { look: -1, lookY: 0, lids: 0.3, brow: 0.6, mouth: 'flat' }],
      [tBoard + 0.2, { look: -0.8, lookY: -0.6, lids: 0.4, mouth: 'smile' }],
      [tAnyone, { look: -1, lookY: 0.3, lids: 0, brow: -0.6, mouth: 'o' }],
    ]);
    const holding = t > pop + 0.5;
    drawCharacter(ctx, s, 'seller', {
      x: sx, y: GROUND, face: -1, ...sellerFace, ...gait(sellerX, t, 70, 240),
      handF: s.between(tHalf - 0.1, pop) ? lerpPt([sx - 80, GROUND - 240], [CLIP[0] + 100, CLIP[1]], into) : holding ? [arms[0] + 10, arms[1] + 40] : null,
      handB: holding ? [arms[0] + 60, arms[1] + 50] : null,
      squash: 0.12 * kick(t - pop - 0.5) * after(t, pop + 0.5),
      lean: 0.2 * (s.between(grab + 0.2, tBoard - 0.3) ? 1 : 0),
    });
    if (holding) coin(ctx, s, 'btc', { x: arms[0] + 20, y: arms[1] + 10, r: 44 });

    if (t > tShape - 0.8) {
      const youFace = faceAt(t, { look: 0.6, lookY: -1, brow: -0.6, mouth: 'o' }, [
        [tShape + 0.6, { look: 0.7, lookY: -1, brow: 0.6, mouth: 'smile' }],
        [tOther, { look: 0.2, lookY: -1, brow: 0.3, mouth: 'smirk' }],
        [tPocket + 0.3, { look: 1, lookY: -0.3, lids: 0.3, brow: 0.5, mouth: 'smirk' }],
      ]);
      const yx = youX(t);
      drawCharacter(ctx, s, 'you', {
        x: yx, y: GROUND - 60 * bump(t - tShape, 0.5), ground: GROUND, face: 1, ...youFace, ...gait(youX, t),
        handF: s.between(tOther - 0.1, tPocket + 0.4) ? [yx + 60, GROUND - 250] : s.between(tPocket + 0.4, tPocket + 1.2) ? [yx + 36, GROUND - 80 + Math.abs(Math.sin(t * 12)) * 10] : null,
      });

      // "nobody else can use it": a little vault shows why. The jagged keyhole
      // is public now, but the round one still needs your half
      const mv = seg(t, tNobody - 0.1, 0.5, 'outBack');
      if (mv > 0) {
        vault(ctx, s, { x: MINI[0], y: MINI[1], scale: 0.45 * mv, blink: 0.6 + 0.3 * Math.sin(t * 6), glow: 0.3 });
        // a crowd copy of the jagged half bounces off: one half is not enough
        const tryP = seg(t, tNobody + 0.1, 0.5);
        if (s.between(tNobody + 0.1, tNobody + 1.2)) {
          const bounce = seg(t, tNobody + 0.6, 0.6, 'out');
          const cp = lerpPt([820, 760], [MINI[0] + 26, MINI[1] + 32], tryP);
          cp[0] -= bounce * 160;
          cp[1] += bounce * 220;
          keyHalf(ctx, s, 'theirs', { x: cp[0], y: cp[1], scale: 0.3, outline: true, rot: bounce * 3 });
        }
      }
      // your half, held up for a moment and then put back in your pocket
      const up = seg(t, tOther - 0.1, 0.4, 'outBack') * (1 - seg(t, tPocket + 0.3, 0.3, 'in'));
      if (up > 0.01) {
        const hp = [yx + 60, GROUND - 280];
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        glow(ctx, hp[0], hp[1], 130, C.btc, 0.6 * up);
        ctx.restore();
        keyHalf(ctx, s, 'yours', { x: hp[0], y: hp[1] + (1 - up) * 160, scale: 0.55 * up, tint: 1 });
        // and a dotted line from it to the round keyhole it alone fits
        const lp = seg(t, tOther + 0.1, 0.5);
        if (lp > 0) {
          const end = lerpPt(hp, [MINI[0] - 26, MINI[1] + 32], lp);
          ctx.save();
          ctx.setLineDash([10, 10]);
          ctx.strokeStyle = C.btc;
          ctx.globalAlpha *= up;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(hp[0] + 60, hp[1]);
          ctx.lineTo(end[0], end[1]);
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    // ---- the shape of the half, rising off the seal for everyone to read ----
    const rise = seg(t, tShape - 0.1, 0.8, 'out');
    if (rise > 0) {
      const p = lerpPt(SEAL, [SEAL[0] + 40, SEAL[1] - 150], rise);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, p[0], p[1], 160, C.xmr, 0.6 * rise);
      ctx.restore();
      keyHalf(ctx, s, 'theirs', { x: p[0], y: p[1], scale: lerp(0.3, 1.1, rise), tint: 1, alpha: 0.35 + 0.4 * rise, halo: false });
      keyHalf(ctx, s, 'theirs', { x: p[0], y: p[1], scale: lerp(0.3, 1.1, rise), outline: true });
    }

    finish(s, ctx, cam, '06 · the claim', { timeline: { steps: SWAP, p: progress(t, 4, [[press + 0.15, 5]]) } });
  });
}
