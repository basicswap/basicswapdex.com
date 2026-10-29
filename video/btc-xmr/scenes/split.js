// 2. The split key. See STORYBOARD.md.
import { clamp, lerp, lerpPt, bump, kick, seg } from '../lib/ink.js';
import { drawCharacter, bodyY, spec } from '../lib/cast.js';
import { keyHalf, wholeKey, sparks, glow, ring, dizzy } from '../lib/props.js';
import { night, GROUND } from '../lib/night.js';
import { RIBBON_OUT, finish, speed } from '../lib/film.js';
import { SWAP, progress } from '../lib/timeline.js';

// 2. The split key. The ribbon drops a Monero key into the haze. You run in
// from the left and the seller strolls in from the right, and you both
// lunge for it. It cracks, throws you both back, and the two halves come
// down: yours bonks you on the head, the seller's lands in a flashy catch.
// You pocket them, sidle up to each other and keep a close eye.
export default function split(s) {
  const tS = s.time('#split'), tY = s.time('#yours'), tT = s.time('#theirs'), tG = s.time('#together');
  const tOut = s.dur - RIBBON_OUT;
  const K = [965, 470];
  const lunge = tS - 0.55;
  const youPocket = tY + 1.0, sellerPocket = tT + 1.25;
  const sidle = tT + 1.6, dart = sidle + 1.25, guard = dart + 0.25;
  const youTop = bodyY('you') - spec('you').ry;

  const cam = s.camera([
    { at: 0, x: 265, y: 420, zoom: 1.7, dur: 0 },
    { at: 0, x: 965, y: 560, zoom: 1.35, dur: 1.5, ease: 'out' },
    { at: 1.4, x: 965, y: 600, zoom: 1.18, dur: 1.2 },
    { at: 2.7, x: 965, y: 580, zoom: 1.32, dur: Math.max(0.5, lunge - 2.8), ease: 'inOutSine' },
    { at: lunge, x: 965, y: 530, zoom: 1.55, dur: 0.45, ease: 'out' },
    { at: tS + 0.05, x: 965, y: 590, zoom: 1.12, dur: 0.6, ease: 'out' },
    { at: tY - 0.45, x: 850, y: 640, zoom: 1.32, dur: 0.6 },
    { at: tT - 0.45, x: 1070, y: 610, zoom: 1.28, dur: 0.6 },
    { at: sidle, x: 965, y: 700, zoom: 1.5, dur: 1.6, ease: 'inOutSine' },
    { at: tG - 0.2, x: 965, y: 600, zoom: 1.3, dur: 0.9 },
    { at: tOut, x: 1765, y: 480, zoom: 1.8, dur: RIBBON_OUT, ease: 'in' },
  ]);

  s.sfx('whoosh', 0.55, { gain: 0.6 });
  s.sfx('pop', 1.5, { pitch: 1.3 });
  s.sfx('scribble', 1.05, { dur: 0.9, gain: 0.35 }); // your running feet
  s.sfx('whoosh', lunge, { gain: 0.5, pitch: 1.3 });
  s.sfx('thud', tS, { pitch: 1.6, gain: 0.9 });
  s.sfx('click', tS + 0.02, { pitch: 0.7 });
  s.sfx('thud', tS + 0.55, { pitch: 0.8, gain: 0.6 });
  s.sfx('thud', tY + 0.05, { pitch: 2, gain: 0.7 }); // bonk
  s.sfx('pop', tY + 0.5);
  s.sfx('chime', tT + 0.1); // the orange half's sound, every time it appears
  s.sfx('whoosh', tT + 0.4, { gain: 0.35, pitch: 1.6 });
  s.sfx('tick', youPocket + 0.35, { gain: 0.6 });
  s.sfx('tick', sellerPocket + 0.35, { gain: 0.6 });
  s.sfx('click', tG + 0.6);
  s.sfx('rise', tOut, { dur: RIBBON_OUT, gain: 0.5 });

  // ---- where everyone is, as functions of time ----
  const youX = (t) => lerp(-220, 640, seg(t, 1.0, 1.1, 'out')) + 120 * seg(t, lunge, 0.45, 'out')
    - 230 * seg(t, tS, 0.6, 'out') + 150 * seg(t, sidle, 1.4);
  const youLift = (t) => {
    if (t < tS) return 130 * Math.sin((Math.PI / 2) * seg(t, lunge, 0.5, 'out'));
    const u = (t - tS) / 0.55;
    return u >= 1 ? 0 : Math.max(0, 130 + 70 * u - 200 * u * u);
  };
  const sellerX = (t) => lerp(2150, 1300, seg(t, 1.3, 1.5, 'out')) - 90 * seg(t, lunge + 0.05, 0.4, 'out')
    + 200 * seg(t, tS, 0.8, 'out') - 160 * seg(t, sidle + 0.2, 1.4);

  // hands in world space; null lets the character swing or rest them
  const youHandFor = (t) => {
    const x = youX(t), y = GROUND - youLift(t);
    if (t > lunge && t < tS) return lerpPt([x + 84, y - 70], [K[0] - 80, K[1] + 14], seg(t, lunge, 0.4, 'out'));
    if (t > tY + 0.1 && t < youPocket + 0.5) return lerpPt([x + 84, y - 70], [x + 92, y - 236], seg(t, tY + 0.1, 0.25));
    if (t > youPocket + 0.5 && t < youPocket + 0.9) return [x + 38, y - 76];
    if (t > guard && t < tG - 0.1) return [x + 38, y - 76];
    return null;
  };
  const sellerHandFor = (t) => {
    const x = sellerX(t), y = GROUND;
    if (t > 2.9 && t < lunge) return lerpPt([x - 64, y - 122], [K[0] + 170, K[1] + 90], seg(t, 2.9, lunge - 2.9));
    if (t >= lunge && t < tS) return lerpPt([K[0] + 170, K[1] + 90], [K[0] + 90, K[1] + 14], seg(t, lunge, 0.45, 'out'));
    if (t > tT - 0.4 && t < sellerPocket + 0.5) return lerpPt([x - 64, y - 122], [x - 70, y - 320], seg(t, tT - 0.4, 0.3));
    if (t > sellerPocket + 0.5 && t < sellerPocket + 0.9) return [x - 30, y - 150];
    return null;
  };

  s.draw({ at: 0, enter: 'none' }, (ctx) => {
    const t = s.t;
    // a short shake when the key cracks
    const sh = t >= tS ? kick(t - tS, 7) : 0;
    ctx.translate(Math.sin(t * 70) * 9 * sh, Math.cos(t * 55) * 6 * sh);

    night(ctx, s, { haze: 1 });

    const yx = youX(t), ylift = youLift(t), sx = sellerX(t);

    // ---- the key: delivered by the ribbon, cracking, then two halves ----
    const arrive = seg(t, 0.6, 0.9, 'out');
    const bob = Math.sin(s.T * 2) * 8 * seg(t, 1.5, 0.5);
    const shake = s.between(tS - 0.4, tS) ? Math.sin(t * 90) * 4 : 0;
    const kp = [lerp(1650, K[0], arrive) + shake, lerp(120, K[1], arrive) - Math.sin(Math.PI * arrive) * 60 + bob];
    const crack = seg(t, tS, 0.45, 'outBack');
    const tint = seg(t, tS + 0.1, 0.5);

    const apexY = [K[0] - 190, K[1] - 200], apexT = [K[0] + 200, K[1] - 220];
    const fling = seg(t, tS, 0.6, 'out');
    const yoursAt = (() => {
      const hang = lerpPt([K[0] - 56, K[1]], apexY, fling);
      hang[1] += Math.sin(s.T * 3) * 6 * seg(t, tS + 0.6, 0.3);
      const head = [yx + 4, GROUND - ylift + youTop - 18];
      const hand = youHandFor(t) ?? [yx + 92, GROUND - 236];
      let p = lerpPt(hang, head, seg(t, tY - 0.35, 0.4, 'in'));
      const bounce = seg(t, tY + 0.05, 0.45);
      if (bounce > 0) {
        p = lerpPt(head, [hand[0], hand[1] - 22], bounce);
        p[1] -= Math.sin(Math.PI * bounce) * 90;
      }
      return p;
    })();
    const theirsAt = (() => {
      const hang = lerpPt([K[0] + 58, K[1] + 14], apexT, fling);
      hang[1] += Math.sin(s.T * 3 + 1) * 6 * seg(t, tS + 0.6, 0.3);
      const hand = sellerHandFor(t) ?? [sx - 70, GROUND - 320];
      const p = lerpPt(hang, [hand[0], hand[1] - 24], seg(t, tT - 0.4, 0.5, 'in'));
      // the show-off flip: toss it up and catch it again
      p[1] -= Math.sin(Math.PI * seg(t, tT + 0.4, 0.6, 'linear')) * 110;
      return p;
    })();
    const yoursRot = -0.22 * crack - Math.PI * 4 * fling - Math.PI * 2 * seg(t, tY + 0.05, 0.45);
    const theirsRot = 0.22 * crack + Math.PI * 4 * fling + Math.PI * 2 * seg(t, tT + 0.4, 0.6) - 0.3 * seg(t, tT - 0.4, 0.5);
    const yoursScale = (1 - 0.4 * seg(t, tY + 0.05, 0.45)) * (1 - seg(t, youPocket + 0.15, 0.25, 'in'));
    const theirsScale = (1 - 0.4 * seg(t, tT - 0.4, 0.5)) * (1 - seg(t, sellerPocket + 0.15, 0.25, 'in'));

    // ---- faces ----
    const startled = bump(t - tS, 0.7);
    const watching = s.between(tG, tG + 1.5);
    const youFace = (() => {
      if (watching) return { look: 0.9, lookY: -0.9, brow: 0, mouth: 'smile' };
      if (s.between(guard, tG)) return { look: 1, lookY: -0.5, brow: 1, mouth: 'frown' };
      if (t > youPocket + 0.4) return { look: 1, lookY: -0.5, brow: 0.8, mouth: 'flat' };
      if (s.between(tY + 0.05, tY + 0.5)) return { look: 0, lookY: -0.2, lids: 0.6, brow: -0.6, mouth: 'o' };
      if (t > tY - 0.6) return { look: 0.2, lookY: -1, brow: -0.6, mouth: 'o' };
      if (startled > 0) return { look: 1, lookY: -0.8, brow: -0.8, mouth: 'o' };
      if (t > lunge) return { look: 1, lookY: -1, brow: 0.9, mouth: 'flat' };
      if (t > tS - 1.4) return { look: 1, lookY: -0.6, brow: 0.6, mouth: 'flat' };
      return { look: 1, lookY: -0.9, brow: 0, mouth: 'smile' };
    })();
    const sellerFace = (() => {
      if (watching) return { look: -0.8, lookY: -0.9, lids: 0.3, brow: 0, mouth: 'smirk' };
      if (s.between(dart, dart + 0.6)) return { look: -1, lookY: 1, lids: 0.5, brow: 0.3, mouth: 'smirk' };
      if (t > sidle) return { look: -1, lookY: 0.7, lids: 0.62, brow: 0.7, mouth: 'smirk' };
      if (t > tT - 0.6) return { look: -0.3, lookY: -0.9, lids: 0.2, brow: 0, mouth: 'smirk' };
      if (s.between(tY - 0.5, tY + 0.8)) return { look: -1, lookY: 0.3, lids: 0.5, brow: 0, mouth: 'smirk' };
      if (startled > 0) return { look: -0.6, lookY: -0.8, lids: 0, brow: -0.8, mouth: 'o' };
      return { look: -1, lookY: -0.7, lids: 0.35, brow: 0.2, mouth: 'smirk' };
    })();

    // ---- the "both halves together" vision ----
    const gIn = seg(t, tG, 0.6);
    const gAlpha = t >= tG ? (1 - seg(t, tG + 1.6, 0.5)) * 0.85 : 0;
    if (gAlpha > 0) {
      glow(ctx, 965, 430, 240, 'rgba(96,165,250,0.9)', 0.6 * gAlpha * kick(t - tG - 0.6, 3));
      ctx.save();
      ctx.globalAlpha *= gAlpha;
      wholeKey(ctx, s, { x: 965, y: 430, gap: 60 * (1 - gIn), tint: 1, scale: 0.75 });
      ctx.restore();
    }

    // ---- characters ----
    const landed = tS + 0.55;
    const after = (a) => (t > a ? 1 : 0);
    drawCharacter(ctx, s, 'you', {
      x: yx, y: GROUND - ylift, ground: GROUND, face: 1, ...youFace,
      handF: youHandFor(t),
      walk: yx / 46,
      stride: ylift > 0 ? 0 : clamp(speed(youX, t) / 260),
      rot: -Math.PI * 2 * seg(t, tS, 0.55),
      lean: -0.18 * bump(t - 2.0, 0.45) + 0.12 * seg(t, lunge, 0.3) * (t < tS ? 1 : 0),
      squash: 0.16 * kick(t - landed) * after(landed) + 0.12 * kick(t - tY - 0.05) * after(tY + 0.05)
        + 0.05 * kick(t - guard - 0.2) * after(guard) - 0.1 * bump(t - lunge, 0.25),
    });
    drawCharacter(ctx, s, 'seller', {
      x: sx, y: GROUND, face: -1, ...sellerFace,
      handF: sellerHandFor(t),
      flail: s.between(tS, tS + 0.9),
      walk: -sx / 70,
      stride: clamp(speed(sellerX, t) / 200) * 0.9,
      lean: 0.28 * seg(t, lunge, 0.4) * (t < tS ? 1 : 0) + 0.12 * seg(t, 2.9, lunge - 2.9) * (t < lunge ? 1 : 0)
        - 0.25 * bump(t - tS, 0.9),
      squash: 0.08 * kick(t - tT - 0.1) * after(tT + 0.1),
    });
    dizzy(ctx, s, yx + 4, GROUND + youTop - 22, clamp((t - tY - 0.05) / 1.5));

    // ---- the key, over the characters ----
    if (t < tS) {
      glow(ctx, kp[0], kp[1], 220, 'rgba(96,165,250,0.9)', 0.35 * arrive);
      wholeKey(ctx, s, { x: kp[0], y: kp[1], rot: (1 - arrive) * Math.PI * 3, scale: lerp(0.3, 1, arrive), crack: seg(t, tS - 0.4, 0.4, 'in') });
    } else {
      ring(ctx, K[0], K[1], clamp((t - tS) / 0.8));
      if (yoursScale > 0.01) keyHalf(ctx, s, 'yours', { x: yoursAt[0], y: yoursAt[1], rot: yoursRot, scale: yoursScale, tint });
      if (theirsScale > 0.01) keyHalf(ctx, s, 'theirs', { x: theirsAt[0], y: theirsAt[1], rot: theirsRot, scale: theirsScale, tint });
      sparks(ctx, s, K[0], K[1], seg(t, tS, 0.45, 'out'), 9, 7);
    }

    finish(s, ctx, cam, '02 · the split key', { timeline: { steps: SWAP, p: progress(t, 0, [[tS + 0.5, 1]]), alpha: seg(t, 0.6, 0.8) } });
  });
}
