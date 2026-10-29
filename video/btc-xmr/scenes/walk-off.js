// 8. When someone walks off. Two beats, with a rewind between them.
//
// First, the seller strolls off before claiming. The hourglass wakes and
// drains, the box pops your Bitcoin back to you, and taking it home sends
// your yellow half up onto the public board. The seller comes back with a
// coffee, reads your half off the board and uses it to take their Monero
// back out of the vault.
//
// Then, rewound: you're the one who wandered off, asleep in a hammock. A
// second, smaller hourglass runs out and the seller takes the Bitcoin, waves,
// and you wake up and fall out of the hammock.
import { C, clamp, lerp, lerpPt, bump, kick, seg } from '../lib/ink.js';
import { drawCharacter, bodyY } from '../lib/cast.js';
import { keyHalf, glow, ring } from '../lib/props.js';
import { night, soft, GROUND } from '../lib/night.js';
import { coin, box, board, vault, hourglass, coffee, hammock, hammockBed, envelope } from '../lib/things.js';
import { SWAP, SELLER_LEAVES, YOU_LEAVE, progress } from '../lib/timeline.js';
import { finish, whip, gait, after, faceAt } from '../lib/film.js';

const BOARD = { x: 80, y: 290, w: 460, h: 320 };
const PINNED = [310, 480];
const BOX = [780, GROUND - 80];
const HG = [1130, GROUND - 105];
const V = [1560, GROUND - 170];
const HG2 = [1010, GROUND - 60];
const HAMMOCK = { x0: 70, x1: 560, y: GROUND - 270, ground: GROUND };

// The rewind: scanlines and a big "◀◀" in screen space. p 0..1.
function rewind(ctx, p) {
  if (p <= 0 || p >= 1) return;
  const a = Math.sin(Math.PI * p);
  ctx.save();
  ctx.fillStyle = `rgba(11,17,32,${0.55 * a})`;
  ctx.fillRect(0, 0, 1920, 1080);
  ctx.globalAlpha = a;
  for (let i = 0; i < 26; i++) {
    const y = ((i * 47 + p * 900) % 1080);
    ctx.fillStyle = 'rgba(96,165,250,0.18)';
    ctx.fillRect(0, y, 1920, 3 + (i % 3) * 2);
  }
  ctx.fillStyle = C.link;
  ctx.font = '600 72px "JetBrains Mono"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('◀◀ rewind', 960, 540);
  ctx.restore();
}

export default function walkOff(s) {
  const w = (word, n = 1) => s.cue(word, n);
  const tNow = w('Now'), introEnd = s.time('#purpose') + 0.9;
  const wander = w('wanders') - 0.2;
  const tTime = s.time('#timelock'), tOut = w('out'), tComes = w('comes');
  const tPuts = w('puts'), tBoard = w('board'), tSo = w('so'), tStill = w('still'), tBack = s.time('#back');
  const b2 = w('If') - 0.4;
  const tNever = w('never'), tRefund = w('refund'), tClaim = w('take'), tWait = s.time('#wait');
  const tBoth = s.time('#both'), tMercy = s.time('#mercy'), tLate = w('late');
  const tEither = w('Either'), tCost = w('cost');
  const ding = tOut + 0.15, pop = tComes - 0.2, caught = pop + 0.6;
  const halfFly = tPuts - 0.1, pinned = tBoard + 0.05;
  const take = tWait + 0.15, fall = tCost - 0.3;

  // beat 1
  const sellerX1 = (t) => lerp(1300, 2250, seg(t, wander, 2.2, 'in')) - 560 * seg(t, tSo - 0.5, 1.3, 'out');
  // beat 2
  const sellerX2 = (t) => lerp(2250, 1120, seg(t, tRefund - 0.4, 1.8, 'out'));

  const cam = s.camera([
    { at: 0, x: 1050, y: 560, zoom: 1.15, dur: 0 },
    { at: wander + 0.3, x: 1500, y: 600, zoom: 1.35, dur: 1.2 },
    { at: tTime - 0.3, x: 1130, y: 640, zoom: 1.9, dur: 0.6 },
    { at: pop - 0.3, x: 720, y: 640, zoom: 1.6, dur: 0.6 },
    { at: halfFly + 0.3, x: 420, y: 520, zoom: 1.55, dur: 0.9 },
    { at: tSo - 0.3, x: 1550, y: 620, zoom: 1.45, dur: 0.9 },
    { at: b2, x: 760, y: 580, zoom: 1.2, dur: 0.01 },
    { at: tNever - 0.3, x: 330, y: 640, zoom: 1.75, dur: 0.8 },
    { at: tClaim - 0.6, x: 1000, y: 640, zoom: 1.6, dur: 0.8 },
    { at: tBoth - 0.4, x: 1280, y: 620, zoom: 1.35, dur: 0.6 },
    { at: tMercy - 0.3, x: 760, y: 600, zoom: 1.2, dur: 0.8 },
    { at: tEither - 0.2, x: 720, y: 600, zoom: 1.25, dur: 0.7 },
    { at: fall - 0.3, x: 360, y: 680, zoom: 1.7, dur: 0.5 },
    whip(s, { x: 500, y: 600 }),
  ]);

  s.sfx('whoosh', 0.2, { pitch: 0.6, gain: 0.6 });
  s.sfx('rise', tTime, { dur: 0.6, gain: 0.4 });
  s.sfx('ding', ding);
  s.sfx('pop', pop);
  s.sfx('pop', caught, { pitch: 1.3 });
  s.sfx('whoosh', halfFly, { gain: 0.5 });
  s.sfx('thud', pinned, { pitch: 1.5 });
  s.sfx('blip', tStill);
  s.sfx('thud', tBack, { pitch: 0.8 });
  s.sfx('sparkle', tBack + 0.05);
  s.sfx('swipe', b2 - 0.3, { gain: 0.8 });
  s.sfx('whoosh', b2 - 0.25, { pitch: 0.5 });
  s.sfx('ding', tWait);
  s.sfx('pop', take + 0.1);
  s.sfx('error', tBoth, { gain: 0.5 });
  s.sfx('chime', tMercy); // the orange half, on its way to you
  s.sfx('pop', tLate, { pitch: 1.2 });
  s.sfx('thud', fall + 0.45, { pitch: 0.7 });
  s.sfx('rise', s.dur - 1.3, { dur: 1.3, gain: 0.5 });

  s.draw({ at: 0, enter: 'none' }, (ctx) => {
    const t = s.t;
    const beat2 = t >= b2;
    night(ctx, s, {});
    soft(ctx, 450, 500, 800, 'rgba(96,165,250,0.08)');
    soft(ctx, 1550, 600, 800, 'rgba(168,85,247,0.12)');

    board(ctx, s, { ...BOARD, ground: GROUND });
    if (beat2) hammock(ctx, s, { ...HAMMOCK, layer: 'back' });

    if (!beat2) {
      // ================= beat 1: the seller wanders off =================
      const sx = sellerX1(t);
      const lid = seg(t, pop - 0.1, 0.25, 'outBack');
      box(ctx, s, { x: BOX[0], y: BOX[1], open: lid });
      vault(ctx, s, { x: V[0], y: V[1], open: seg(t, tBack, 0.4, 'outBack'), glow: 0.25 + kick(t - tBack, 2) * after(t, tBack) });
      ring(ctx, V[0], V[1], clamp((t - tBack) / 0.9));
      ring(ctx, HG[0], HG[1], clamp((t - ding) / 0.8));

      // the hourglass wakes on "timelock" and drains
      const drain = seg(t, tTime + 0.1, tOut - tTime, 'linear');
      hourglass(ctx, s, {
        x: HG[0], y: HG[1] - 20 * bump(t - tTime, 0.5), scale: 0.95,
        sand: 1 - drain, awake: seg(t, tTime - 0.1, 0.3), zzz: t < tTime - 0.1,
        rot: 0.12 * Math.sin((t - ding) * 18) * kick(t - ding, 4) * after(t, ding),
      });

      // your Bitcoin pops back to you
      const youX1 = (tt) => 560 - 150 * seg(tt, caught + 0.2, 1.1);
      const yx = youX1(t);
      if (t > pop && t <= caught) {
        const f = seg(t, pop, 0.6);
        const p = lerpPt([BOX[0], BOX[1] - 60], [yx + 70, GROUND - 170], f);
        p[1] -= Math.sin(Math.PI * f) * 180;
        coin(ctx, s, 'btc', { x: p[0], y: p[1], r: 42, flip: f < 1 ? Math.cos(t * 14) : 1 });
      }
      const youFace = faceAt(t, { look: 1, lookY: 0, brow: 0.3, mouth: 'flat' }, [
        [wander, { look: 1, lookY: -0.2, brow: 0.6, mouth: 'frown' }],
        [ding, { look: 1, lookY: -0.4, brow: -0.6, mouth: 'o' }],
        [caught, { look: 0.3, lookY: 0.5, brow: -0.2, mouth: 'smile' }],
        [halfFly, { look: -1, lookY: -0.8, brow: -0.4, mouth: 'o' }],
        [tSo, { look: 1, lookY: -0.2, brow: 0.2, mouth: 'smile' }],
      ]);
      drawCharacter(ctx, s, 'you', {
        x: yx, y: GROUND, face: 1, ...youFace, ...gait(youX1, t, 46, 200),
        handF: t > caught ? [yx + 60, GROUND - 120] : null,
        handB: t > caught ? [yx + 100, GROUND - 120] : null,
        squash: 0.12 * kick(t - caught) * after(t, caught) + 0.04 * Math.abs(Math.sin(t * 7)) * (s.between(wander + 1, tTime) ? 1 : 0),
      });

      // your half rises out of your pocket and onto the board
      const hf = seg(t, halfFly, pinned - halfFly);
      if (hf > 0) {
        const p = lerpPt([yx + 20, GROUND - 120], PINNED, hf);
        p[1] -= Math.sin(Math.PI * hf) * 220;
        keyHalf(ctx, s, 'yours', { x: p[0], y: p[1], scale: lerp(0.4, 0.8, hf), rot: (1 - hf) * 6, tint: 1 });
        if (hf >= 1) {
          ctx.fillStyle = C.strike;
          ctx.beginPath();
          ctx.arc(PINNED[0] - 70, PINNED[1] - 26, 9, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (t > caught) coin(ctx, s, 'btc', { x: yx + 80, y: GROUND - 140, r: 42 });

      // the seller: off for a coffee, back with it, reads your half, opens the vault
      const back = t > tSo - 0.5;
      const sellerFace = faceAt(t, { look: -1, lookY: 0, lids: 0.4, mouth: 'smirk' }, [
        [wander, { look: 1, lookY: -0.5, lids: 1, mouth: 'smile' }],
        [tSo - 0.5, { look: -1, lookY: -0.2, lids: 0.5, mouth: 'flat' }],
        [tStill - 0.2, { look: -1, lookY: -0.8, lids: 0.7, brow: -0.4, mouth: 'frown' }],
        [tBack, { look: -1, lookY: 0.2, lids: 0.4, brow: 0, mouth: 'smirk' }],
      ]);
      if (sx < 2200) {
        drawCharacter(ctx, s, 'seller', {
          x: sx, y: GROUND, face: back ? -1 : 1, ...sellerFace, ...gait(sellerX1, t, 70, 160),
          handB: back ? [sx + 40, GROUND - 170] : [sx - 50, GROUND - 120],
          handF: back ? null : [sx - 30, GROUND - 120],
          squash: 0.1 * kick(t - tBack - 0.6) * after(t, tBack + 0.6),
        });
        if (back) coffee(ctx, s, { x: sx + 48, y: GROUND - 200, scale: 0.9 });
      }
      // your half's shape copied over to the seller, then the Monero comes out
      const copy = seg(t, tStill - 0.1, 0.8);
      if (copy > 0 && t < tBack + 0.1) {
        const p = lerpPt(PINNED, [V[0] + 40, V[1] + 70], copy);
        p[1] -= Math.sin(Math.PI * copy) * 160;
        keyHalf(ctx, s, 'yours', { x: p[0], y: p[1], scale: 0.5, outline: true });
      }
      if (t > tBack + 0.1) {
        const f = seg(t, tBack + 0.1, 0.6);
        const p = lerpPt([V[0], V[1] + 60], [sx - 60, GROUND - 200], f);
        p[1] -= Math.sin(Math.PI * f) * 140;
        coin(ctx, s, 'xmr', { x: p[0], y: p[1], r: 40, flip: f < 1 ? Math.cos(t * 14) : 1 });
      }
    } else {
      // ================= beat 2: you're the one who wandered off =================
      const sx = sellerX2(t);
      const lid = seg(t, take - 0.05, 0.25, 'outBack');
      box(ctx, s, { x: BOX[0], y: BOX[1], open: lid });
      vault(ctx, s, { x: V[0], y: V[1], glow: 0.2 });
      // the unclaimed refund, glowing next to the box
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, BOX[0] - 30, BOX[1] - 150, 120, C.brand, 0.35 + 0.15 * Math.sin(t * 5));
      ctx.restore();
      envelope(ctx, s, { x: BOX[0] - 30, y: BOX[1] - 150 - Math.sin(t * 3) * 6, scale: 0.55, signed: 1, rot: -0.1 });
      // the second hourglass, smaller, counting from the refund
      const drain2 = seg(t, tClaim - 0.4, tWait - tClaim + 0.4, 'linear');
      hourglass(ctx, s, {
        x: HG2[0], y: HG2[1], scale: 0.5, sand: 1 - drain2, awake: 1,
        rot: 0.12 * Math.sin((t - tWait) * 18) * kick(t - tWait, 4) * after(t, tWait),
      });
      ring(ctx, HG2[0], HG2[1], clamp((t - tWait) / 0.7));

      // you, asleep in the hammock in a nightcap, until the fall
      const falling = seg(t, fall, 0.45, 'in');
      const bed = hammockBed(HAMMOCK);
      const sway = Math.sin(s.T * 1.2) * 6;
      const youFace = faceAt(t, { look: 0, lookY: 0, lids: 1, brow: 0, mouth: 'smile' }, [
        [tCost - 0.6, { look: 0.4, lookY: -0.4, lids: 0, brow: -0.9, mouth: 'o' }],
        // up, groggy: a huge yawn, then a dazed look at the seller
        [fall + 0.5, { look: 0.2, lookY: -0.3, groggy: true, brow: -0.4, mouth: 'yawn' }],
        [fall + 1.7, { look: 0.8, lookY: -0.1, groggy: true, brow: -0.2, mouth: 'wavy' }],
      ]);
      if (falling > 0) hammock(ctx, s, { ...HAMMOCK, layer: 'front' });
      drawCharacter(ctx, s, 'you', {
        x: bed[0] + 10 + 40 * falling, y: lerp(bed[1] - bodyY('you') - 10 + sway, GROUND, falling), ground: GROUND, face: 1, ...youFace,
        rot: lerp(-0.95, 0, seg(t, fall + 0.25, 0.3)),
        nightcap: true,
        flail: s.between(tCost - 0.6, fall + 0.45),
        squash: 0.18 * kick(t - fall - 0.45) * after(t, fall + 0.45) - 0.08 * bump(t - fall - 0.55, 1.1),
        // a big arms-up stretch through the yawn
        handF: s.between(fall + 0.55, fall + 1.6) ? [bed[0] + 10 + 40 + 70, GROUND - 285] : null,
        handB: s.between(fall + 0.55, fall + 1.6) ? [bed[0] + 10 + 40 - 70, GROUND - 285] : null,
      });
      if (falling === 0) hammock(ctx, s, { ...HAMMOCK, layer: 'front' });
      if (t < tCost - 0.6) {
        for (let i = 0; i < 3; i++) {
          const p = (s.T * 0.5 + i / 3) % 1;
          ctx.save();
          ctx.globalAlpha = Math.sin(Math.PI * p);
          ctx.fillStyle = C.link;
          ctx.font = `600 ${22 + p * 18}px "Instrument Sans"`;
          ctx.fillText('z', bed[0] - 60 - p * 40, bed[1] - 90 - p * 100);
          ctx.restore();
        }
      }

      // the seller waits out the second hourglass, takes the Bitcoin, waves
      const sellerFace = faceAt(t, { look: -1, lookY: 0, lids: 0.5, mouth: 'smirk' }, [
        [tClaim - 0.4, { look: -0.4, lookY: 0.6, lids: 0.6, brow: 0.3, mouth: 'flat' }],
        [tWait, { look: -1, lookY: 0, lids: 0.2, brow: -0.2, mouth: 'smile' }],
        [tBoth - 0.2, { look: 1, lookY: 0, lids: 0.3, brow: -0.6, mouth: 'frown' }],
        [tMercy - 0.2, { look: -1, lookY: -0.2, lids: 0.4, brow: 0, mouth: 'smile' }],
        [tEither, { look: -1, lookY: 0.2, lids: 0.5, brow: 0.4, mouth: 'smirk' }],
      ]);
      const wave = s.between(tEither, tCost + 1);
      if (sx < 2200) {
        drawCharacter(ctx, s, 'seller', {
          x: sx, y: GROUND, face: -1, ...sellerFace, ...gait(sellerX2, t, 70, 200),
          handF: wave ? [sx - 90, GROUND - 330 + Math.sin(t * 14) * 18] : null,
          handB: t > take + 0.6 ? [sx + 30, GROUND - 150] : null,
          squash: 0.04 * Math.abs(Math.sin(t * 6)) * (s.between(tClaim - 0.4, tWait) ? 1 : 0),
        });
      }
      if (t > take) {
        const f = seg(t, take, 0.6);
        const p = lerpPt([BOX[0], BOX[1] - 60], [sx + 40, GROUND - 170], f);
        p[1] -= Math.sin(Math.PI * f) * 160;
        coin(ctx, s, 'btc', { x: p[0], y: p[1], r: 40, flip: f < 1 ? Math.cos(t * 14) : 1 });
      }

      // "they never end up with both": the vault stays shut without your half
      const no = seg(t, tBoth - 0.1, 0.3, 'outBack') * (1 - seg(t, tBoth + 1.4, 0.4));
      if (no > 0) {
        ctx.save();
        ctx.translate(V[0], V[1]);
        ctx.scale(no, no);
        ctx.lineCap = 'round';
        ctx.strokeStyle = C.strike;
        ctx.lineWidth = 16;
        ctx.beginPath();
        ctx.moveTo(-70, -70);
        ctx.lineTo(70, 70);
        ctx.moveTo(70, -70);
        ctx.lineTo(-70, 70);
        ctx.stroke();
        ctx.restore();
      }

      // the mercy: the seller's half drifts over to you as a courtesy, and
      // with it the Monero can still come your way, only late
      const drift = seg(t, tMercy - 0.2, 1.3);
      const gone = seg(t, fall, 0.3);
      if (drift > 0 && gone < 1) {
        const p = lerpPt([sx - 60, GROUND - 260], [bed[0] + 40, bed[1] - 170], drift);
        p[1] -= Math.sin(Math.PI * drift) * 120;
        ctx.save();
        ctx.globalAlpha *= 1 - gone;
        ctx.globalCompositeOperation = 'lighter';
        glow(ctx, p[0], p[1], 120, C.xmr, 0.5);
        ctx.restore();
        keyHalf(ctx, s, 'theirs', { x: p[0], y: p[1] + Math.sin(t * 3) * 6, scale: 0.5, rot: (1 - drift) * 4, tint: 1, alpha: 1 - gone });
        const late = seg(t, tLate - 0.2, 0.5, 'outBack');
        if (late > 0) coin(ctx, s, 'xmr', { x: bed[0] - 70, y: bed[1] - 170 - late * 20 + Math.sin(t * 3 + 1) * 6, r: 34 * late, alpha: 1 - gone });
      }
    }

    // the swap progress: the finished swap, then one amber track per failure
    const track = t < introEnd
      ? { steps: SWAP, p: 6, title: 'Swap progress' }
      : t < b2
        ? { steps: SELLER_LEAVES, p: progress(t, 1, [[wander + 1.6, 2], [ding, 3], [caught, 4], [tBack + 0.5, 5]]), title: 'Seller walks off', accent: '#F59E0B' }
        : { steps: YOU_LEAVE, p: progress(t, 2, [[tNever, 3], [tWait, 4], [take + 0.6, 5], [tLate, 6]]), title: 'You walk off', accent: '#F59E0B' };

    finish(s, ctx, cam, '08 · when someone walks off', {
      timeline: track,
      extra: () => {
        // "now for the cases where someone doesn't": a title card over the stage
        const card = seg(t, tNow - 0.2, 0.5) * (1 - seg(t, introEnd - 0.4, 0.4));
        if (card > 0) {
          ctx.save();
          ctx.fillStyle = `rgba(11,17,32,${0.75 * card})`;
          ctx.fillRect(0, 0, 1920, 1080);
          ctx.globalAlpha = card;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#F59E0B';
          ctx.font = '400 30px "JetBrains Mono"';
          ctx.fillText('the edge cases', 960, 430);
          ctx.fillStyle = '#F9FAFB';
          ctx.font = '700 84px "Instrument Sans"';
          ctx.fillText('What if someone walks off?', 960, 520 + (1 - card) * 16);
          ctx.restore();
        }
        rewind(ctx, clamp((t - introEnd + 0.3) / 0.9));
        rewind(ctx, clamp((t - b2 + 0.35) / 0.7));
      },
    });
  });
}
