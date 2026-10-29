// 5. The seller locks their Monero. The ribbon drops the two-keyhole vault
// into the violet haze. The seller rolls their Monero coin in and the door
// slams, and on "both halves" the round and the jagged keyholes light up in
// turn. You run in and try your yellow half on its own: it fits the round
// keyhole, you jiggle it, and the vault buzzes while the jagged keyhole
// blinks at you. The seller smirks and pats their pocket.
import { C, lerp, lerpPt, bump, kick, seg } from '../lib/ink.js';
import { drawCharacter } from '../lib/cast.js';
import { keyHalf, glow } from '../lib/props.js';
import { night, soft, GROUND } from '../lib/night.js';
import { coin, vault } from '../lib/things.js';
import { finish, whip, gait, after, faceAt } from '../lib/film.js';
import { SWAP, progress } from '../lib/timeline.js';

const V = [1000, GROUND - 170];
const ROUND = [V[0] - 58, V[1] + 70];

export default function xmrLock(s) {
  const tVault = s.time('vault'), tBoth = s.time('both'), tHalves = s.time('halves');
  const tOpen = s.time('#open');
  const slam = tVault + 0.3;
  const tryAt = tOpen + 0.2, buzz = tryAt + 0.75;

  const coinX = (t) => lerp(2150, V[0] + 40, seg(t, 0.9, 1.4, 'out'));
  const sellerX = (t) => coinX(t) + 140 + 170 * seg(t, slam + 0.1, 0.7);
  const youX = (t) => lerp(-200, 790, seg(t, tOpen - 0.8, 0.8, 'out'));

  const cam = s.camera([
    { at: 0, x: 1050, y: 600, zoom: 1.4, dur: 0 },
    { at: 1.2, x: 1080, y: 620, zoom: 1.5, dur: 1.0 },
    { at: tBoth - 0.2, x: 1000, y: 700, zoom: 1.9, dur: 0.5 },
    { at: tOpen - 0.6, x: 920, y: 680, zoom: 1.7, dur: 0.6 },
    { at: buzz + 0.6, x: 1030, y: 620, zoom: 1.45, dur: 0.7 },
    whip(s, { x: 1000, y: 600 }),
  ]);

  s.sfx('thud', 1.0, { pitch: 0.8 });
  s.sfx('scribble', 1.0, { dur: 1.0, gain: 0.3 });
  s.sfx('thud', slam, { pitch: 0.7, gain: 0.9 });
  s.sfx('tick', slam + 0.15);
  s.sfx('tick', slam + 0.3);
  s.sfx('blip', tBoth);
  s.sfx('chime', tHalves + 0.1, { gain: 0.6 }); // the jagged keyhole is the orange half's
  s.sfx('scribble', tOpen - 0.8, { dur: 0.7, gain: 0.3 });
  s.sfx('click', tryAt + 0.3);
  s.sfx('error', buzz);
  s.sfx('rise', s.dur - 1.3, { dur: 1.3, gain: 0.5 });

  s.draw({ at: 0, enter: 'none' }, (ctx) => {
    const t = s.t;
    const sh = t > slam ? kick(t - slam, 8) : 0;
    ctx.translate(Math.sin(t * 60) * 7 * sh, 0);
    night(ctx, s, { haze: 1 });
    soft(ctx, 1100, 600, 800, 'rgba(168,85,247,0.12)');

    const drop = seg(t, 0.55, 0.45, 'in');
    const sq = 0.12 * kick(t - 1.0) * after(t, 1.0);
    const door = t < slam - 0.15 ? 1 : 1 - seg(t, slam - 0.15, 0.15, 'in');
    ctx.save();
    ctx.translate(V[0], GROUND);
    ctx.scale(1 + sq * 0.5, 1 - sq);
    ctx.translate(-V[0], -GROUND);
    vault(ctx, s, {
      x: V[0], y: lerp(-400, V[1], drop), open: door,
      dial: seg(t, slam, 0.6, 'out') * 6,
      blink: Math.max(bump(t - tHalves, 0.9), buzz < t && t < buzz + 1.6 ? 0.5 + 0.5 * Math.sin((t - buzz) * 14) : 0),
      glow: 0.25 + 0.5 * kick(t - slam, 3) * after(t, slam),
    });
    ctx.restore();
    // the round keyhole lights up first, on "both"
    const rb = bump(t - tBoth, 0.7);
    if (rb > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, ROUND[0], ROUND[1], 90, C.btc, rb);
      ctx.restore();
    }

    // ---- the Monero coin rolls into the vault ----
    if (t < slam - 0.1) {
      const cx = coinX(t);
      ctx.save();
      if (cx < V[0] + 140) {
        ctx.beginPath();
        ctx.rect(V[0] - 128, -500, 3000, 2000);
        ctx.clip();
      }
      coin(ctx, s, 'xmr', { x: cx, y: GROUND - 62, r: 62, rot: -cx / 62 });
      ctx.restore();
    }

    // ---- characters ----
    const sx = sellerX(t), yx = youX(t);
    const sellerFace = faceAt(t, { look: -1, lookY: 0.4, lids: 0.4, brow: 0.3, mouth: 'flat' }, [
      [slam, { look: -1, lookY: 0, lids: 0.5, brow: 0, mouth: 'smirk' }],
      [tOpen, { look: -1, lookY: 0.4, lids: 0.6, brow: 0.6, mouth: 'smirk' }],
    ]);
    drawCharacter(ctx, s, 'seller', {
      x: sx, y: GROUND, face: -1, ...sellerFace, ...gait(sellerX, t, 70, 200),
      handF: t < slam ? [sx - 90, GROUND - 90] : null,
      handB: s.between(buzz + 0.2, buzz + 1.4) ? [sx + 40 + Math.sin(t * 16) * 6, GROUND - 160] : null,
      lean: 0.25 * (t < slam ? 1 : 0),
      squash: 0.05 * Math.abs(Math.sin(t * 9)) * (s.between(buzz + 0.2, buzz + 1.4) ? 1 : 0),
    });
    if (t > tOpen - 0.9) {
      const jiggle = s.between(tryAt + 0.3, buzz) ? Math.sin(t * 40) * 0.25 : 0;
      const reach = seg(t, tryAt - 0.1, 0.35);
      const hand = lerpPt([yx + 90, GROUND - 130], [ROUND[0] - 56, ROUND[1] + 10], reach * (1 - seg(t, buzz + 0.3, 0.3)));
      const youFace = faceAt(t, { look: 1, lookY: -0.2, brow: 0.3, mouth: 'smile' }, [
        [tryAt, { look: 1, lookY: 0.2, brow: 0.6, mouth: 'flat' }],
        [buzz, { look: 1, lookY: 0, brow: -0.9, mouth: 'o' }],
        [buzz + 0.5, { look: 1, lookY: 0.3, lids: 0.3, brow: 0.7, mouth: 'frown' }],
      ]);
      drawCharacter(ctx, s, 'you', {
        x: yx, y: GROUND, face: 1, ...youFace, ...gait(youX, t),
        handF: hand,
        squash: 0.12 * kick(t - buzz) * after(t, buzz),
        lean: -0.15 * bump(t - buzz, 0.5),
      });
      // your half, held out to the round keyhole
      keyHalf(ctx, s, 'yours', { x: hand[0] + 20, y: hand[1] - 14, rot: jiggle, scale: 0.6, tint: 1 });
    }

    finish(s, ctx, cam, '05 · the seller locks their monero', { timeline: { steps: SWAP, p: progress(t, 3, [[slam, 4]]) } });
  });
}
