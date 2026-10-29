// 0. Cold open. You and the seller stand on either side of a gap with a rope
// bridge across it. A toll keeper drops onto the bridge with a tip jar, you
// both toss your coins in, and the keeper cackles and vanishes in a puff of
// smoke, jar and all. You both roll your eyes at the risks and hold it. On "nobody" a red strike slashes the bridge, it collapses, and you
// both scramble back to your own side as the ribbon sweeps across the gap.
import { C, clamp, lerp, lerpPt, bump, kick, seg } from '../lib/ink.js';
import { drawCharacter } from '../lib/cast.js';
import { night, soft, GROUND } from '../lib/night.js';
import { coin, bridge, jar, strike } from '../lib/things.js';
import { sparks } from '../lib/props.js';
import { finish, whip, gait, after, faceAt } from '../lib/film.js';

const EDGE_L = 700, EDGE_R = 1220;

// What can happen to coins left with a middleman: badges that rise out of the
// gap one by one as the narration names them.
const RISKS = [['#hack', 'hacked', 800, 600], ['#theft', 'stole the coins', 1110, 560], ['#freeze', 'account frozen', 840, 500], ['#terms', 'terms changed', 1080, 450]];

// A magician's puff: grey-white balls of smoke swelling, drifting up and
// fading. p 0..1.
function smoke(ctx, x, y, p) {
  if (p <= 0 || p >= 1) return;
  ctx.save();
  ctx.globalAlpha *= Math.min(1, (1 - p) * 1.6);
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * Math.PI * 2 + 0.3;
    const r = 40 + p * 130;
    const bx = x + Math.cos(a) * r * 0.9, by = y + Math.sin(a) * r * 0.75 - p * 70;
    const br = (52 + ((i * 37) % 23)) * (1 - p * 0.35);
    ctx.fillStyle = i % 3 ? '#D1D5DB' : '#F3F4F6';
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  // a soft core so the outlines read as one cloud
  ctx.fillStyle = '#E5E7EB';
  ctx.beginPath();
  ctx.arc(x, y - p * 70, 70 + p * 110, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function badge(ctx, text, x, y, a) {
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.font = '500 30px "JetBrains Mono"';
  const w = ctx.measureText(text).width + 64;
  ctx.fillStyle = 'rgba(17,24,39,0.92)';
  ctx.strokeStyle = C.strike;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - 26, w, 52, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = C.strike;
  ctx.beginPath();
  ctx.arc(x - w / 2 + 24, y, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#F9FAFB';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x - w / 2 + 42, y + 1);
  ctx.restore();
}

export default function open(s) {
  const w = (word) => s.time(word);
  const tMon = w('Monero'), tStr = w('stranger'), tUsual = w('usual'), tHand = w('hand');
  const tSome = w('someone'), tHope = w('hope'), tAlong = w('along');
  const tNobody = s.time('#nobody');
  const tossY = tSome, tossS = tSome + 0.35;
  const laugh = tossS + 0.6, poof = tAlong - 0.15;
  const scram = tNobody + 0.1;

  const cam = s.camera([
    { at: 0, x: 430, y: 640, zoom: 1.6, dur: 0 },
    { at: tMon - 0.25, x: 1480, y: 620, zoom: 1.6, dur: 0.8 },
    { at: tStr, x: 960, y: 620, zoom: 1.25, dur: 0.9 },
    { at: tUsual, x: 960, y: 650, zoom: 1.45, dur: 0.6 },
    { at: tHope, x: 960, y: 690, zoom: 1.7, dur: 1.0, ease: 'inOutSine' },
    { at: poof - 0.25, x: 960, y: 640, zoom: 1.5, dur: 0.5 },
    { at: s.time('#hack') - 0.3, x: 960, y: 620, zoom: 1.3, dur: 0.8 },
    { at: tNobody - 0.4, x: 960, y: 650, zoom: 1.3, dur: 0.6 },
    whip(s, { x: 960, y: 600 }),
  ]);

  s.sfx('whoosh', 0.3, { gain: 0.4, pitch: 1.4 });
  s.sfx('tick', 1.1);
  s.sfx('thud', tUsual + 0.45, { pitch: 1.1 });
  s.sfx('ding', tossY + 0.5, { pitch: 1.8, gain: 0.5 });
  s.sfx('ding', tossS + 0.5, { pitch: 2.1, gain: 0.5 });
  // the cackle, then the magician's exit
  for (let i = 0; i < 5; i++) s.sfx('blip', laugh + i * 0.22, { pitch: 0.7 + (i % 2) * 0.25, gain: 0.5 });
  s.sfx('pop', poof, { pitch: 0.55 });
  s.sfx('sparkle', poof + 0.05);
  s.sfx('error', s.time('#hack'), { gain: 0.35, pitch: 0.9 });
  s.sfx('error', s.time('#theft'), { gain: 0.35, pitch: 0.9 });
  s.sfx('error', s.time('#freeze'), { gain: 0.35, pitch: 0.9 });
  s.sfx('error', s.time('#terms'), { gain: 0.35, pitch: 0.9 });
  s.sfx('swipe', tNobody - 0.3, { gain: 0.8 });
  s.sfx('thud', tNobody + 0.15, { pitch: 0.6 });
  s.sfx('rise', s.dur - 1.3, { dur: 1.3, gain: 0.5 });

  // ---- positions ----
  const youX = (t) => lerp(420, 770, seg(t, tHand - 0.3, 1.3)) - 230 * seg(t, scram, 0.55, 'out');
  const sellerX = (t) => lerp(1500, 1165, seg(t, tHand - 0.2, 1.4)) + 230 * seg(t, scram, 0.6, 'out');
  const hopArc = (t, a, d, h) => Math.sin(Math.PI * clamp((t - a) / d)) * h;
  const keeperY = (t) => lerp(-500, GROUND, seg(t, tUsual, 0.45, 'in'));

  s.draw({ at: 0, enter: 'none' }, (ctx) => {
    const t = s.t;
    night(ctx, s, {});
    // Bitcoin's side glows gold, Monero's side violet
    soft(ctx, 300, 640, 700, 'rgba(247,181,0,0.07)');
    soft(ctx, 1650, 640, 700, 'rgba(168,85,247,0.10)');

    // the gap
    const g = ctx.createLinearGradient(0, GROUND, 0, GROUND + 500);
    g.addColorStop(0, '#070B16');
    g.addColorStop(1, '#03050B');
    ctx.fillStyle = g;
    ctx.fillRect(EDGE_L, GROUND, EDGE_R - EDGE_L, 900);
    ctx.strokeStyle = 'rgba(59,130,246,0.6)';
    ctx.lineWidth = 2;
    for (const x of [EDGE_L, EDGE_R]) {
      ctx.beginPath();
      ctx.moveTo(x, GROUND);
      ctx.lineTo(x, GROUND + 400);
      ctx.stroke();
    }

    const yx = youX(t), sx = sellerX(t);
    const kx = 960, ky = keeperY(t);
    const youLift = hopArc(t, scram, 0.55, 90), sellerLift = hopArc(t, scram, 0.6, 70);

    // ---- coins ----
    const youHand = [yx + 84, GROUND - youLift - 96];
    const sellerHand = [sx - 64, GROUND - sellerLift - 150];
    const jarAt = [kx, ky - 300];
    const flip = (t0) => Math.sin(Math.PI * seg(t, t0, 0.8, 'linear')) * 150;
    const tossArc = (from, t0) => {
      const p = seg(t, t0, 0.5);
      const pt = lerpPt(from, jarAt, p);
      pt[1] -= Math.sin(Math.PI * p) * 130;
      return pt;
    };
    const youCoin = t < tossY ? [youHand[0], youHand[1] - 30 - flip(0.3)] : tossArc([youHand[0], youHand[1] - 30], tossY);
    const sellerCoin = t < tossS ? [sellerHand[0], sellerHand[1] - 30 - flip(tMon + 0.3)] : tossArc([sellerHand[0], sellerHand[1] - 30], tossS);
    const inJar = [...(t > tossY + 0.5 ? ['btc'] : []), ...(t > tossS + 0.5 ? ['xmr'] : [])];

    // ---- characters ----
    const youFace = faceAt(t, { look: 0.3, lookY: -0.6, mouth: 'smile' }, [
      [tMon, { look: 1, lookY: 0, mouth: 'smile' }],
      [tStr, { look: 1, lookY: -0.3, brow: -0.3, mouth: 'flat' }],
      [tUsual + 0.4, { look: 1, lookY: -0.4, brow: -0.6, mouth: 'o' }],
      [tHand, { look: 1, lookY: -0.4, mouth: 'smile' }],
      [tHope, { look: 1, lookY: -0.5, brow: -0.4, mouth: 'smile' }],
      [poof, { look: 0.9, lookY: -0.4, brow: -0.9, mouth: 'o' }],
      [tNobody, { look: 1, lookY: 0.3, brow: -0.8, mouth: 'o' }],
      [scram + 1.0, { look: 1, lookY: -0.3, brow: 0.5, mouth: 'flat' }],
    ]);
    const sellerFace = faceAt(t, { look: -1, lookY: -0.2, mouth: 'smirk' }, [
      [tMon + 0.3, { look: -1, lookY: -0.6, lids: 0.3, mouth: 'smirk' }],
      [tStr, { look: -1, lookY: 0.3, lids: 0.5, brow: 0.4, mouth: 'flat' }],
      [tUsual + 0.4, { look: -1, lookY: -0.2, lids: 0, brow: -0.6, mouth: 'o' }],
      [tHand, { look: -1, lookY: -0.2, lids: 0.3, mouth: 'smirk' }],
      [poof, { look: -0.9, lookY: -0.4, lids: 0, brow: -0.9, mouth: 'o' }],
      [tNobody, { look: -1, lookY: 0.3, lids: 0, brow: -0.8, mouth: 'o' }],
      [scram + 1.1, { look: -1, lookY: 0.3, lids: 0.45, brow: 0.4, mouth: 'smirk' }],
    ]);
    const handsOut = s.between(tHope, poof + 0.3);
    // the risks get one big eye roll from both of you: the pupils sweep
    // over the top and stay up under heavy lids, with the head tipped, until
    // the bridge breaks
    const rollAt = s.time('#hack');
    // lidMax: how far the lids drop. The seller's eyes have whites, so their
    // lids stay higher and the raised pupils still show just under them.
    const eyeRoll = (face, delay, lidMax) => {
      const start = rollAt + delay;
      if (t < start || t >= tNobody) return face;
      const p = seg(t, start, 0.8);
      return {
        ...face, look: -Math.cos(Math.PI * p) * 0.8, lookY: -Math.min(1, Math.sin(Math.PI * p) * 0.55 + 0.8 * p),
        lids: 0.1 + (lidMax - 0.1) * p, brow: -0.7, mouth: 'flat', tilt: seg(t, start, 0.6) * 0.6,
      };
    };
    const youRoll = eyeRoll(youFace, 0, 0.57), sellerRoll = eyeRoll(sellerFace, 0.15, 0.24);
    drawCharacter(ctx, s, 'you', {
      x: yx, y: GROUND - youLift, ground: GROUND, face: 1, ...youRoll,
      ...gait(youX, t, 46, 220),
      handF: t < tossY + 0.15 ? youHand : handsOut ? [yx + 104, GROUND - 124] : null,
      squash: 0.1 * kick(t - tUsual - 0.45) * after(t, tUsual + 0.45) + 0.12 * kick(t - scram - 0.55) * after(t, scram + 0.55),
      lean: -0.15 * bump(t - tNobody, 0.6) - 0.1 * (youRoll.tilt ?? 0),
    });
    drawCharacter(ctx, s, 'seller', {
      x: sx, y: GROUND - sellerLift, ground: GROUND, face: -1, ...sellerRoll,
      ...gait(sellerX, t, 70, 200),
      handF: t < tossS + 0.15 ? sellerHand : handsOut ? [sx - 100, GROUND - 170] : null,
      flail: s.between(scram, scram + 0.6),
      lean: -0.15 * bump(t - tNobody, 0.6) - 0.08 * (sellerRoll.tilt ?? 0),
    });

    // the keeper, the jar, and the coins in flight
    const keeperFace = faceAt(t, { look: 0, lookY: 0, mouth: 'grin' }, [
      [tossY, { look: -1, lookY: -0.3, mouth: 'grin' }],
      [tossS, { look: 1, lookY: -0.3, mouth: 'grin' }],
      // the dishonest cackle: brows down, eyes narrowed, mouth wide open
      [laugh, { look: 0, lookY: -0.4, lids: 0.6, brow: 1, mouth: 'yay' }],
    ]);
    const cackling = s.between(laugh, poof);
    if (t < poof + 0.08) {
      ctx.save();
      ctx.globalAlpha *= 1 - seg(t, poof - 0.05, 0.12);
      drawCharacter(ctx, s, 'keeper', {
        x: kx + (cackling ? Math.sin(t * 40) * 3 : 0), y: ky, ground: GROUND, face: 1, ...keeperFace,
        handF: [jarAt[0] + 48, jarAt[1] + 30], handB: [jarAt[0] - 48, jarAt[1] + 30],
        squash: 0.14 * kick(t - tUsual - 0.45) * after(t, tUsual + 0.45) + (cackling ? 0.07 * Math.abs(Math.sin(t * 17)) : 0),
        lean: cackling ? -0.12 + Math.sin(t * 9) * 0.05 : 0,
      });
      jar(ctx, s, { x: jarAt[0], y: jarAt[1] - (cackling ? Math.abs(Math.sin(t * 17)) * 8 : 0), coins: inJar });
      ctx.restore();
    }
    // "HA!" popping up as the keeper cackles
    if (cackling) {
      for (let i = 0; i < 4; i++) {
        const p = clamp((t - laugh - i * 0.28) / 0.9);
        if (p <= 0 || p >= 1) continue;
        ctx.save();
        ctx.globalAlpha *= Math.sin(Math.PI * p);
        ctx.translate(kx + (i % 2 ? 90 : -90) + (i % 2 ? 1 : -1) * p * 30, ky - 360 - p * 70);
        ctx.rotate((i % 2 ? 0.2 : -0.2) * (1 - p * 0.5));
        ctx.fillStyle = '#F9FAFB';
        ctx.strokeStyle = C.ink;
        ctx.lineWidth = 6;
        ctx.font = `700 ${34 + p * 10}px "Instrument Sans"`;
        ctx.textAlign = 'center';
        ctx.strokeText('HA!', 0, 0);
        ctx.fillText('HA!', 0, 0);
        ctx.restore();
      }
    }
    // the magician's exit: a puff of smoke and a spray of sparkles
    smoke(ctx, kx, ky - 170, clamp((t - poof + 0.05) / 1.0));
    sparks(ctx, s, kx, ky - 200, clamp((t - poof) / 0.6), 12, 51);
    if (t < tossY + 0.5) coin(ctx, s, 'btc', { x: youCoin[0], y: youCoin[1], r: 26, flip: Math.cos(t * 9) });
    if (t < tossS + 0.5) coin(ctx, s, 'xmr', { x: sellerCoin[0], y: sellerCoin[1], r: 26, flip: Math.cos(t * 9 + 1) });

    // the bridge
    bridge(ctx, s, { x0: EDGE_L, x1: EDGE_R, y: GROUND, fall: seg(t, tNobody + 0.1, 1.1, 'in') });
    const sp = seg(t, tNobody - 0.3, 0.35, 'out');
    strike(ctx, EDGE_L - 60, GROUND - 120, EDGE_R + 60, GROUND + 40, sp * (1 - seg(t, tNobody + 0.8, 0.5)));

    // the risks of trusting a middleman, rising out of the gap
    for (const [mark, text, bx, by] of RISKS) {
      const at = s.time(mark);
      const up = seg(t, at - 0.15, 0.45, 'outBack');
      const gone = seg(t, tNobody - 0.25, 0.3);
      badge(ctx, text, bx + Math.sin(t * 2 + bx) * 4, lerp(GROUND + 120, by, up), Math.min(1, up * 1.4) * (1 - gone));
    }

    finish(s, ctx, cam, 'btc · xmr', { in: false });
  });
}
