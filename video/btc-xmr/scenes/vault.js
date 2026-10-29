// 7. You open the vault. At the public board you trace the jagged shape off
// the seal and snip out a paper copy. The camera whips over to the vault as
// you run; your yellow half and the copy click together, the copy turns
// orange, and the vault bursts open. The Monero coin rolls into your arms.
// Then you and the seller pass each other, each carrying the other's coin,
// side-eyeing all the way and never shaking hands.
import { C, clamp, lerp, lerpPt, kick, seg } from '../lib/ink.js';
import { drawCharacter } from '../lib/cast.js';
import { keyHalf, glow, ring, TEETH } from '../lib/props.js';
import { night, soft, GROUND } from '../lib/night.js';
import { coin, cheque, board, vault, pen } from '../lib/things.js';
import { finish, whip, gait, after, faceAt } from '../lib/film.js';
import { SWAP, progress } from '../lib/timeline.js';

const BOARD = { x: 150, y: 300, w: 520, h: 340 };
const PIN = [420, 480], PIN_K = 0.85;
const V = [1500, GROUND - 170];

// The notepad you copy the seller's half onto: a small pad with a blue
// binding, and the jagged shape sketched in as p goes 0..1.
function notepad(ctx, x, y, p, rot = 0, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#F9FAFB';
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-48, -58, 96, 116, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = C.brand;
  ctx.fillRect(-48, -58, 96, 16);
  ctx.fillStyle = '#F9FAFB';
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(-34 + i * 17, -50, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(156,163,175,0.6)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(-38, -24 + i * 22);
    ctx.lineTo(38, -24 + i * 22);
    ctx.stroke();
  }
  // the sketch of the three teeth, drawn in pencil as you copy
  if (p > 0) {
    const n = TEETH.length - 1, upto = p * n, i = Math.floor(upto);
    const pts = TEETH.slice(0, i + 1);
    if (i < n) pts.push([lerp(TEETH[i][0], TEETH[i + 1][0], upto - i), lerp(TEETH[i][1], TEETH[i + 1][1], upto - i)]);
    ctx.save();
    ctx.translate(-34, -12);
    ctx.scale(0.62, 0.62);
    ctx.translate(-52, 0);
    ctx.strokeStyle = C.xmrDeep;
    ctx.lineWidth = 5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    pts.forEach(([px, py], j) => (j ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

export default function vaultScene(s) {
  const tJoin = s.time('join'), tOwn = s.time('#own');
  const tOpens = s.time('#opens'), tAt = s.time('At'), tEither = s.time('either');
  // you start copying as soon as the ribbon has gone, before the narration
  const copyStart = 1.0, snip = tJoin - 0.25, run = tJoin - 0.1, click = tOwn + 0.05;
  const insert = tOpens - 0.35, open = tOpens, caught = open + 0.7;

  const youX = (t) => 760 + 520 * seg(t, run, tOwn - run, 'inOut') + 420 * seg(t, tAt - 0.2, 2.6, 'inOut');
  const sellerX = (t) => lerp(2200, 1300, seg(t, tAt - 0.3, 2.7, 'inOut'));

  const cam = s.camera([
    { at: 0, x: 560, y: 560, zoom: 1.6, dur: 0 },
    { at: copyStart - 0.2, x: 600, y: 650, zoom: 1.6, dur: 0.6 },
    { at: run, x: 1420, y: 620, zoom: 1.55, dur: tOwn - run + 0.1, ease: 'inOut' },
    { at: insert, x: 1460, y: 640, zoom: 1.75, dur: 0.4 },
    { at: caught + 0.2, x: 1500, y: 600, zoom: 1.35, dur: 0.7 },
    { at: tEither - 0.4, x: 1560, y: 640, zoom: 1.6, dur: 1.0, ease: 'inOutSine' },
    whip(s, { x: 1500, y: 600 }),
  ]);

  s.sfx('scribble', copyStart + 0.2, { dur: snip - copyStart - 0.4 });
  s.sfx('click', snip, { pitch: 1.6 });
  s.sfx('click', snip + 0.12, { pitch: 1.8 });
  s.sfx('whoosh', run, { gain: 0.7 });
  s.sfx('chime', click); // the orange half, now yours to use
  s.sfx('click', click + 0.02);
  s.sfx('thud', open, { pitch: 0.8 });
  s.sfx('sparkle', open + 0.05);
  s.sfx('pop', caught);
  s.sfx('rise', s.dur - 1.3, { dur: 1.3, gain: 0.5 });

  s.draw({ at: 0, enter: 'none' }, (ctx) => {
    const t = s.t;
    const sh = t > open ? kick(t - open, 8) : 0;
    ctx.translate(Math.sin(t * 60) * 7 * sh, 0);
    night(ctx, s, {});
    soft(ctx, 450, 480, 700, 'rgba(96,165,250,0.08)');
    soft(ctx, 1550, 600, 900, 'rgba(168,85,247,0.12)');

    // ---- the board with the pinned cheque ----
    board(ctx, s, { ...BOARD, ground: GROUND });
    // the seal glows each time you glance up at it
    const glance = t > copyStart && t < snip && Math.floor((t - copyStart) / 0.5) % 2 === 0;
    cheque(ctx, s, { signed: 1, x: PIN[0], y: PIN[1], scale: PIN_K, rot: -0.03, seal: { broken: 1, glow: glance ? 0.8 : 0 } });

    // ---- the vault ----
    vault(ctx, s, {
      x: V[0], y: V[1], open: seg(t, open, 0.4, 'outBack'),
      glow: 0.25 + kick(t - open, 2) * after(t, open),
      dial: seg(t, insert + 0.2, 0.4) * 4,
    });
    ring(ctx, V[0], V[1], clamp((t - open) / 0.9));

    const yx = youX(t), sx = sellerX(t);

    // ---- the Monero coin rolls out into your arms ----
    if (t > open + 0.1 && t <= caught) {
      const f = seg(t, open + 0.1, 0.6);
      const p = lerpPt([V[0], V[1] + 60], [yx + 70, GROUND - 170], f);
      p[1] -= Math.sin(Math.PI * f) * 150;
      coin(ctx, s, 'xmr', { x: p[0], y: p[1], r: lerp(30, 42, f), flip: f < 1 ? Math.cos(t * 14) : 1 });
    }

    // ---- characters ----
    // the pad held at your waist, the pen gripped in the other hand, scribbling on it
    // the pad held against your belly at the waist by its right edge, and
    // the pen in your left hand writing on it, both arms over the pad
    const PAD = (x) => [x - 34, GROUND - 80];
    const PAD_HAND = (x) => [x + 4, GROUND - 66];
    const PEN_HAND = (x, tt) => [x - 58 + Math.sin(tt * 22) * 12, GROUND - 106 + Math.cos(tt * 17) * 5];
    // copying: eyes up to the seal, down to the pad, and back again
    const crossed = t > tAt - 0.3 && sx < yx;
    const youFace = faceAt(t, { look: -1, lookY: -0.6, brow: 0.6, mouth: 'flat' }, [
      [copyStart, glance ? { look: -1, lookY: -1, brow: 0.7, mouth: 'flat' } : { look: -0.6, lookY: 1, brow: 0.5, mouth: 'flat' }],
      [snip + 0.2, { look: 1, lookY: 0, brow: 0.2, mouth: 'smile' }],
      [click, { look: 0.6, lookY: -0.6, brow: -0.6, mouth: 'o' }],
      [caught, { look: 0, lookY: 0.4, brow: -0.2, mouth: 'smile' }],
      // and the same distrust the seller shows you: side-eye, all the way
      [tAt, { look: crossed ? -1 : 1, lookY: -0.5, squint: 0.5, brow: 1, mouth: 'flat' }],
    ]);
    const holdingCoin = t > caught;
    drawCharacter(ctx, s, 'you', {
      x: yx, y: GROUND, face: t < snip ? -1 : 1, ...youFace, ...gait(youX, t, 46, 300),
      handF: t > copyStart && t < snip ? PEN_HAND(yx, t) : t < snip ? PAD_HAND(yx) : s.between(snip, open) ? [yx + 100, GROUND - 190] : holdingCoin ? [yx + 50, GROUND - 120] : null,
      handB: t < snip ? PAD_HAND(yx) : holdingCoin ? [yx + 100, GROUND - 120] : null,
      underArms: t < snip + 0.15 ? (c) => {
        const pd = PAD(yx);
        notepad(c, pd[0], pd[1], t < snip ? seg(t, copyStart + 0.2, snip - copyStart - 0.5, 'linear') : 0, 0.06, 0.78);
      } : null,
      lean: 0.22 * (s.between(run, tOwn) ? 1 : 0),
      squash: 0.12 * kick(t - caught) * after(t, caught),
    });
    if (t > copyStart && t < snip) {
      // the pen, gripped in your left hand with its tip on the page
      const pp = PEN_HAND(yx, t);
      pen(ctx, s, { x: pp[0], y: pp[1], scale: 0.75, rot: -0.5 });
    }
    if (holdingCoin) coin(ctx, s, 'xmr', { x: yx + 75, y: GROUND - 140, r: 42 });

    if (t > tAt - 0.3) {
      const sellerFace = faceAt(t, { look: -1, lookY: 0.4, lids: 0.6, brow: 0.7, mouth: 'smirk' }, [
      ]);
      // past each other, the eyes follow: look back once you've crossed
      const crossed = sx < yx;
      drawCharacter(ctx, s, 'seller', {
        x: sx, y: GROUND, face: -1, ...sellerFace, look: crossed ? 1 : -1,
        ...gait(sellerX, t, 70, 220),
        handF: [sx - 60, GROUND - 190], handB: [sx - 10, GROUND - 190],
      });
      coin(ctx, s, 'btc', { x: sx - 40, y: GROUND - 210, r: 40 });
    }

    // ---- the halves: the paper copy, the click, the key in the lock ----
    const yourHalf = (1 - seg(t, open - 0.05, 0.1));
    if (t > snip - 0.1 && yourHalf > 0) {
      const hand = [yx + 100, GROUND - 210];
      const join = seg(t, click - 0.3, 0.3, 'in');
      const toLock = seg(t, insert, 0.3);
      const base = lerpPt([hand[0] + 30, hand[1] - 30], [V[0] - 58 - 40, V[1] + 70], toLock);
      const k = lerp(0.55, 0.45, toLock);
      // yours, from your scarf
      keyHalf(ctx, s, 'yours', { x: base[0] - 56 * k - lerp(50, 0, join), y: base[1], scale: k, tint: 1 });
      // the copy: white paper until it clicks, then the real orange
      const paper = 1 - seg(t, click, 0.3);
      keyHalf(ctx, s, 'theirs', {
        x: base[0] + 58 * k + lerp(60, 0, join), y: base[1] + 14 * k, scale: k, tint: 1,
        fill: paper > 0.5 ? '#F9FAFB' : undefined, halo: paper < 0.5,
      });
      if (t > click && t < click + 0.6) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        glow(ctx, base[0], base[1], 160, '#FFFFFF', 0.8 * (1 - (t - click) / 0.6));
        ctx.restore();
      }
    }

    finish(s, ctx, cam, '07 · you open the vault', { timeline: { steps: SWAP, p: progress(t, 5, [[open, 6]]) } });
  });
}
