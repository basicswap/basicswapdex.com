// 3. Sign the way out first. The ribbon drops a table with two REFUND
// envelopes and plonks the sleepy hourglass beside them. You both dash in and
// sign furiously, swap envelopes and sign again, and the hourglass dozes off.
// On "stalls" you both look worried and the hourglass gives a shake, then
// the envelopes take off on their own, each one home to its owner's side.
// The hourglass winks.
import { C, lerp, lerpPt, bump, kick, seg } from '../lib/ink.js';
import { drawCharacter } from '../lib/cast.js';
import { night, soft, GROUND } from '../lib/night.js';
import { glow } from '../lib/props.js';
import { table, envelope, hourglass, pen, sigPoint } from '../lib/things.js';
import { finish, whip, gait, after, faceAt } from '../lib/film.js';
import { SWAP, progress } from '../lib/timeline.js';

const TOP = GROUND - 120;
const ENV_A = [860, TOP - 62], ENV_B = [1060, TOP - 62];
const HG = [960, TOP - 70];

export default function refunds(s) {
  const tLocks = s.time('locks'), tSign = s.time('sign');
  const tStalls = s.time('stalls'), tRef = s.time('refunds'), tAround = s.time('#around');
  // sign the envelope in front of you, swap, then countersign the other one;
  // every squiggle is drawn by a pen, and nothing is written mid-swap
  const swap = tSign + 0.6, swapEnd = swap + 0.35;
  const sign2 = swapEnd + 0.05, signEnd = Math.min(sign2 + 0.6, tStalls - 0.25);
  const settle = tAround + 0.45;

  const cam = s.camera([
    { at: 0, x: 960, y: 620, zoom: 1.5, dur: 0 },
    { at: tSign - 0.3, x: 960, y: 650, zoom: 1.85, dur: 0.6 },
    { at: tStalls - 0.2, x: 1060, y: 640, zoom: 1.7, dur: 0.5 },
    { at: tRef - 0.1, x: 960, y: 580, zoom: 1.25, dur: 0.7 },
    { at: tRef + 1.0, x: 840, y: 650, zoom: 1.6, dur: 0.8 },
    { at: tAround - 0.5, x: 900, y: 650, zoom: 1.85, dur: 0.5 },
    { at: settle, x: 980, y: 620, zoom: 1.45, dur: 0.6 },
    whip(s, { x: 960, y: 600 }),
  ]);

  s.sfx('thud', 1.0, { pitch: 1.1 });
  s.sfx('thud', 1.3, { pitch: 1.6, gain: 0.6 });
  s.sfx('scribble', tLocks - 0.2, { dur: 0.9, gain: 0.3 });
  s.sfx('scribble', tSign, { dur: swap - 0.05 - tSign });
  s.sfx('whoosh', swap, { gain: 0.4, pitch: 1.5 });
  s.sfx('scribble', sign2, { dur: signEnd - sign2 });
  s.sfx('ding', signEnd);
  s.sfx('error', tStalls, { gain: 0.4, pitch: 0.8 });
  s.sfx('whoosh', tRef, { gain: 0.6 });
  s.sfx('blip', tAround, { pitch: 1.4 });
  s.sfx('rise', s.dur - 1.3, { dur: 1.3, gain: 0.5 });

  const youX = (t) => lerp(-200, 690, seg(t, tLocks - 0.3, 1.0, 'out'));
  const sellerX = (t) => lerp(2150, 1230, seg(t, tLocks - 0.2, 1.1, 'out'));

  s.draw({ at: 0, enter: 'none' }, (ctx) => {
    const t = s.t;
    night(ctx, s, {});
    soft(ctx, 500, 640, 700, 'rgba(247,181,0,0.06)');
    soft(ctx, 1450, 640, 700, 'rgba(168,85,247,0.09)');

    const yx = youX(t), sx = sellerX(t);
    const drop = seg(t, 0.55, 0.45, 'in');
    const tableY = lerp(-400, TOP, drop);

    // ---- the envelopes: signed, swapped, signed again, then flying off ----
    const sw = seg(t, swap, swapEnd - swap);
    const fly = seg(t, tRef, 1.1, 'in');
    const envPos = (from, to, side) => {
      const p = lerpPt(from, to, sw);
      p[1] -= Math.sin(Math.PI * sw) * 60;
      p[1] += tableY - TOP;
      const lift = seg(t, tRef - 0.3, 0.3, 'out');
      p[1] -= lift * 70;
      p[0] += side * fly * 1400;
      p[1] -= fly * 200;
      return p;
    };
    const a = envPos(ENV_A, ENV_B, -1), b = envPos(ENV_B, ENV_A, 1);
    const p1 = seg(t, tSign, swap - 0.05 - tSign, 'linear');
    const p2 = seg(t, sign2, signEnd - sign2, 'linear');
    const sealed = seg(t, signEnd, 0.25);
    // your signatures are blue, the seller's violet; each envelope ends up
    // with both
    const sigsA = [{ p: p1, color: C.brand, side: -1 }, { p: p2, color: C.violet, side: 1 }];
    const sigsB = [{ p: p1, color: C.violet, side: -1 }, { p: p2, color: C.brand, side: 1 }];

    // ---- table, envelopes and hourglass, drawn between your body and your
    // arms, so your signing arm goes over the envelope (and the seller,
    // drawn after, reaches over it too) ----
    const props = (c) => {
      table(c, s, { x: 960, y: tableY });
      for (const [p, sigs] of [[a, sigsA], [b, sigsB]]) {
        if (fly > 0 || sealed > 0) {
          c.save();
          c.globalCompositeOperation = 'lighter';
          glow(c, p[0], p[1], 150, C.brand, 0.5 * Math.max(fly > 0 ? 1 : 0, kick(t - signEnd, 3)));
          c.restore();
        }
        envelope(c, s, { x: p[0], y: p[1], scale: 0.8, open: 0, sigs, rot: Math.sin(t * 6) * 0.08 * fly });
      }
      const hgDrop = seg(t, 1.0, 0.3, 'in');
      const wink = s.between(tAround - 0.1, tAround + 0.8);
      hourglass(c, s, {
        x: HG[0], y: lerp(-300, HG[1] + (tableY - TOP), hgDrop), scale: 0.62,
        sand: 1 - seg(t, 1.3, s.dur, 'linear') * 0.3,
        awake: wink ? 1 : 1 - seg(t, tSign + 0.3, 0.8),
        wink,
        rot: 0.08 * Math.sin(t * 9) * kick(t - 1.3, 4) * after(t, 1.3) + 0.14 * Math.sin((t - tStalls) * 18) * kick(t - tStalls, 3) * after(t, tStalls),
        zzz: !wink,
      });
    };

    // ---- characters stand behind the table ----
    const signing = s.between(tSign, signEnd + 0.1);
    // each pen's tip sits at the end of the squiggle being drawn on the
    // envelope in front of its writer, and the hand grips the pen just above
    // the tip. During the swap both pens lift and hover over their side.
    const left = a[0] < b[0] ? a : b, right = a[0] < b[0] ? b : a;
    const tipOn = (env, side, u) => {
      const q = sigPoint(side, u);
      return [env[0] + q[0] * 0.8, env[1] + q[1] * 0.8];
    };
    const hover = (home) => {
      const q = sigPoint(1, 0);
      return [home[0] + q[0] * 0.8, home[1] + (tableY - TOP) + q[1] * 0.8 - Math.sin(Math.PI * Math.min(1, (t - swap + 0.05) / 0.5)) * 55];
    };
    const youTip = t < swap - 0.05 ? tipOn(left, -1, p1) : t < sign2 ? hover(ENV_A) : tipOn(left, 1, p2);
    const sellerTip = t < swap - 0.05 ? tipOn(right, -1, p1) : t < sign2 ? hover(ENV_B) : tipOn(right, 1, p2);
    const youGrip = [youTip[0] + 8, youTip[1] - 19], sellerGrip = [sellerTip[0] - 8, sellerTip[1] - 19];
    const youFace = faceAt(t, { look: 1, lookY: 0, mouth: 'smile' }, [
      [tSign, { look: 0.5, lookY: 1, brow: 0.8, mouth: 'flat' }],
      [signEnd, { look: 0.4, lookY: 0.2, mouth: 'smile' }],
      [tStalls, { look: 0.3, lookY: 0.5, brow: -0.8, mouth: 'o' }],
      [tRef, { look: -0.8, lookY: -0.5, brow: -0.4, mouth: 'smile' }],
      [tAround - 0.4, { look: 1, lookY: -0.3, brow: 0.2, mouth: 'smile' }],
    ]);
    drawCharacter(ctx, s, 'you', {
      x: yx, y: GROUND, face: 1, ...youFace, ...gait(youX, t),
      handF: signing ? youGrip : null,
      underArms: props,
      // no lean while writing, so the hand stays on the pen
      lean: -0.15 * bump(t - tLocks - 0.7, 0.4),
      squash: 0.05 * Math.abs(Math.sin(t * 14)) * (signing ? 1 : 0),
    });
    const sellerFace = faceAt(t, { look: -1, lookY: 0, lids: 0.4, mouth: 'smirk' }, [
      [tSign, { look: -0.5, lookY: 1, lids: 0.3, brow: 0.8, mouth: 'flat' }],
      [signEnd, { look: -1, lookY: 0.3, lids: 0.45, mouth: 'smirk' }],
      [tStalls, { look: -0.3, lookY: 0.6, lids: 0, brow: -0.8, mouth: 'o' }],
      [tRef, { look: 0.8, lookY: -0.5, lids: 0.2, brow: -0.3, mouth: 'flat' }],
      [tAround - 0.4, { look: -1, lookY: -0.2, lids: 0.45, brow: 0.2, mouth: 'smirk' }],
    ]);
    drawCharacter(ctx, s, 'seller', {
      x: sx, y: GROUND, face: -1, ...sellerFace, ...gait(sellerX, t, 70, 200),
      handF: signing ? sellerGrip : null,
      lean: -0.15 * bump(t - tLocks - 0.8, 0.4) - 0.08 * bump(t - tStalls, 0.6),
      squash: 0.05 * Math.abs(Math.sin(t * 13 + 1)) * (signing ? 1 : 0),
    });

    if (signing) {
      // each pen gripped in its writer's hand, its tip on the signature
      pen(ctx, s, { x: youGrip[0], y: youGrip[1], scale: 0.8, rot: 0.4 });
      pen(ctx, s, { x: sellerGrip[0], y: sellerGrip[1], scale: 0.8, rot: -0.4 });
    }

    finish(s, ctx, cam, '03 · sign the way out first', { timeline: { steps: SWAP, p: progress(t, 1, [[signEnd, 2]]) } });
  });
}
