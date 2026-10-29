// 1. Two kinds of lock. The ribbon drops a Bitcoin padlock and a Monero
// padlock, and you both run in. You hold up an instruction card (who gets
// paid, when the coins go back) and feed it into the Bitcoin lock's slot,
// which glows and clicks shut. The seller tries the same on the Monero lock,
// which has no slot: the card crumples, the seller shoves the lock and
// regrets it. A dashed trade arc between the locks gets a red X, and the
// years tick by.
import { C, lerp, lerpPt, bump, kick, seg, line } from '../lib/ink.js';
import { drawCharacter } from '../lib/cast.js';
import { night, soft, GROUND } from '../lib/night.js';
import { glow } from '../lib/props.js';
import { padlock, card, history, coin } from '../lib/things.js';
import { finish, whip, gait, after, faceAt } from '../lib/film.js';

const BTC = [620, GROUND - 85], XMR = [1300, GROUND - 85];
const SLOT = [BTC[0], BTC[1] - 36];

export default function locks(s) {
  const tInstr = s.time('#instructions'), tWho = s.time('who'), tBack = s.time('back');
  const tMon = s.time('Monero'), tCant = s.time('#cant'), tKept = s.time('kept');
  const tCross = s.cue('cross-chain'), tTrades = s.time('trades');
  const show = tInstr - 0.2, insert = tBack + 0.35, shove = tKept - 0.2;

  const cam = s.camera([
    { at: 0, x: 960, y: 560, zoom: 1.2, dur: 0 },
    { at: show, x: 640, y: 470, zoom: 1.55, dur: 0.6 },
    { at: show + 0.6, x: 640, y: 420, zoom: 1.8, dur: insert - show - 0.6, ease: 'inOutSine' },
    { at: insert, x: 700, y: 600, zoom: 1.4, dur: 0.6 },
    { at: tMon - 0.3, x: 1280, y: 610, zoom: 1.45, dur: 0.8 },
    { at: tKept - 0.4, x: 960, y: 470, zoom: 1.12, dur: 0.8 },
    whip(s, { x: 960, y: 560 }),
  ]);

  s.sfx('thud', 0.95, { pitch: 1.2 });
  s.sfx('thud', 1.25, { pitch: 0.9 });
  s.sfx('scribble', 0.9, { dur: 0.8, gain: 0.3 });
  s.sfx('whoosh', show, { gain: 0.5 });
  s.sfx('blip', tWho);
  s.sfx('blip', s.time('when'), { pitch: 1.2 });
  s.sfx('click', insert + 0.35);
  s.sfx('ding', insert + 0.5);
  s.sfx('error', tCant + 0.05);
  s.sfx('thud', shove + 0.25, { pitch: 0.7 });
  s.sfx('error', tTrades + 0.05, { gain: 0.7 });
  s.sfx('blip', tKept + 0.1, { gain: 0.5 });
  s.sfx('blip', tKept + 2.0, { gain: 0.5, pitch: 1.2 });
  s.sfx('blip', tKept + 3.6, { gain: 0.5, pitch: 1.4 });
  s.sfx('rise', s.dur - 1.3, { dur: 1.3, gain: 0.5 });

  const youX = (t) => lerp(-200, 380, seg(t, 0.8, 1.0, 'out'));
  const sellerX = (t) => lerp(2150, 1530, seg(t, 1.2, 1.3, 'out')) - 110 * seg(t, tCant - 0.6, 0.5)
    + 50 * seg(t, shove + 0.3, 0.3, 'out');

  s.draw({ at: 0, enter: 'none' }, (ctx) => {
    const t = s.t;
    night(ctx, s, {});
    soft(ctx, 500, 640, 700, 'rgba(247,181,0,0.07)');
    soft(ctx, 1450, 640, 700, 'rgba(168,85,247,0.12)');

    const yx = youX(t), sx = sellerX(t);

    // ---- padlocks drop in with the ribbon ----
    const dropB = seg(t, 0.5, 0.5, 'in'), dropX = seg(t, 0.8, 0.5, 'in');
    const sqB = 0.15 * kick(t - 1.0) * after(t, 1.0), sqX = 0.15 * kick(t - 1.3) * after(t, 1.3);
    const wobble = Math.sin((t - shove - 0.25) * 30) * 0.12 * kick(t - shove - 0.25, 4) * after(t, shove + 0.25);
    const shut = seg(t, insert + 0.3, 0.15, 'in');
    padlock(ctx, s, { kind: 'btc', x: BTC[0], y: lerp(-300, BTC[1], dropB), slot: true, open: 1 - shut, glow: kick(t - insert - 0.45, 2.5) * after(t, insert + 0.45) + 0.25 * after(t, insert + 0.45), scale: 1 });
    ctx.save();
    ctx.translate(XMR[0], GROUND);
    ctx.rotate(wobble);
    ctx.scale(1 + sqX * 0.5, 1 - sqX);
    ctx.translate(-XMR[0], -GROUND);
    padlock(ctx, s, { kind: 'xmr', x: XMR[0], y: lerp(-300, XMR[1], dropX) });
    ctx.restore();
    void sqB;

    // ---- the trade arc that can't happen ----
    const arcP = seg(t, tCross, 0.6);
    if (arcP > 0) {
      const pts = [];
      for (let i = 0; i <= 30 * arcP; i++) {
        const u = i / 30;
        pts.push([lerp(BTC[0], XMR[0], u), BTC[1] - 230 - Math.sin(Math.PI * u) * 170]);
      }
      ctx.save();
      ctx.setLineDash([14, 12]);
      if (pts.length > 1) line(ctx, s, pts, { stroke: C.link, seed: 900, width: 4, wob: 0.4 });
      ctx.restore();
      const xp = seg(t, tTrades, 0.3, 'outBack');
      if (xp > 0) {
        const mx = (BTC[0] + XMR[0]) / 2, my = BTC[1] - 400;
        ctx.save();
        ctx.translate(mx, my);
        ctx.scale(xp, xp);
        ctx.lineCap = 'round';
        ctx.strokeStyle = C.strike;
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.moveTo(-34, -34);
        ctx.lineTo(34, 34);
        ctx.moveTo(34, -34);
        ctx.lineTo(-34, 34);
        ctx.stroke();
        ctx.restore();
      }
    }
    history(ctx, 360, 1560, 190, seg(t, tKept - 0.1, 3.8, 'inOut'));

    // ---- characters ----
    const youFace = faceAt(t, { look: 1, lookY: -0.2, mouth: 'smile' }, [
      [show, { look: 0.6, lookY: -0.8, brow: 0.2, mouth: 'smile' }],
      [insert, { look: 0.8, lookY: 0, brow: 0, mouth: 'smile' }],
      [tCant, { look: 1, lookY: 0, brow: -0.4, mouth: 'o' }],
      [shove + 0.4, { look: 1, lookY: 0, lids: 0.3, brow: 0.4, mouth: 'smirk' }],
      [tCross, { look: 1, lookY: -1, brow: -0.2, mouth: 'flat' }],
    ]);
    const sellerFace = faceAt(t, { look: -1, lookY: 0, lids: 0.4, mouth: 'smirk' }, [
      [insert, { look: -1, lookY: 0, lids: 0.2, brow: 0.4, mouth: 'flat' }],
      [tCant - 0.6, { look: -1, lookY: 0.4, lids: 0.3, brow: 0.6, mouth: 'smirk' }],
      [tCant + 0.1, { look: -0.5, lookY: 0.6, lids: 0, brow: -0.8, mouth: 'o' }],
      [shove, { look: -1, lookY: 0.3, lids: 0.1, brow: 1, mouth: 'frown' }],
      [shove + 0.3, { look: 0, lookY: -0.4, lids: 0.7, brow: -1, mouth: 'o' }],
      [shove + 0.35, { xeyes: true, mouth: 'o' }],
    ]);
    const youHand = s.between(show - 0.3, insert + 0.2) ? [yx + 92, GROUND - 160] : null;
    drawCharacter(ctx, s, 'you', {
      x: yx, y: GROUND, face: 1, ...youFace, ...gait(youX, t),
      handF: youHand,
      lean: -0.15 * bump(t - 1.75, 0.4),
      squash: 0.06 * Math.abs(Math.sin(t * 8)) * (s.between(shove + 0.4, tCross) ? 1 : 0),
    });
    const sellerHand = s.between(tCant - 0.6, tCant + 0.15) ? [lerp(sx - 70, XMR[0] + 110, seg(t, tCant - 0.6, 0.6)), GROUND - 140] : null;
    drawCharacter(ctx, s, 'seller', {
      x: sx, y: GROUND, face: -1, ...sellerFace, ...gait(sellerX, t, 70, 200),
      handF: sellerHand,
      flail: s.between(shove + 0.3, shove + 1.0),
      lean: 0.3 * bump(t - shove, 0.35) - 0.12 * bump(t - shove - 0.35, 0.6) - 0.15 * bump(t - 2.4, 0.4),
      squash: 0.1 * kick(t - shove - 1.0) * after(t, shove + 1.0),
    });

    // ---- your card: held up big, then fed into the slot ----
    const display = [640, 380];
    const inHand = [yx + 92, GROUND - 190];
    const up = seg(t, show, 0.5, 'outBack'), into = seg(t, insert, 0.35, 'in');
    if (t > show - 0.3 && into < 1) {
      let p = t < show ? inHand : lerpPt(inHand, display, up);
      let k = lerp(0.5, 1.9, up);
      if (into > 0) {
        p = lerpPt(display, [SLOT[0], SLOT[1] - 30 + 60 * into], into);
        k = lerp(1.9, 0.7, Math.min(1, into * 1.6));
      }
      ctx.save();
      if (into > 0.5) {
        ctx.beginPath();
        ctx.rect(0, 0, 1920, SLOT[1]);
        ctx.clip();
      }
      // light up the row the narration is talking about
      if (up > 0.9 && into === 0) {
        const row = t > s.time('when') ? 1 : t > tWho ? 0 : -1;
        if (row >= 0) {
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          glow(ctx, p[0], p[1] + (row ? 26 : -24) * k, 150, C.brand, 0.7);
          ctx.restore();
        }
      }
      card(ctx, s, { x: p[0], y: p[1], scale: k, rot: (1 - up) * -0.3 });
      // a little coin acts the card out: off to the person, then back home
      if (up > 0.9 && into === 0) {
        const tWhen = s.time('when');
        const go = seg(t, tWho - 0.1, 0.7), back = seg(t, tWhen, 0.9);
        let c = null;
        if (back > 0) {
          const a = lerp(0.2, 1.15, back) * Math.PI;
          c = [20 + Math.cos(a) * 20, 26 + Math.sin(a) * 20 - Math.sin(Math.PI * back) * 10];
        } else if (go > 0) c = [lerp(-56, 26, go), -22 - Math.sin(Math.PI * go) * 14];
        if (c) coin(ctx, s, 'btc', { x: p[0] + c[0] * k, y: p[1] + c[1] * k, r: 9 * k, halo: false });
      }
      ctx.restore();
    }

    // ---- the seller's card, which has nowhere to go ----
    if (t > tCant - 0.6) {
      const cr = seg(t, tCant, 0.4, 'out');
      const fall = seg(t, tCant + 0.45, 0.5, 'in');
      const hand = [lerp(sx - 70, XMR[0] + 110, seg(t, tCant - 0.6, 0.6)), GROUND - 140];
      const p = lerpPt([hand[0] - 40, hand[1] - 10], [XMR[0] + 150, GROUND - 22], fall);
      card(ctx, s, { x: p[0], y: p[1], scale: 0.7, crumple: cr, rot: fall * 2 });
    }

    finish(s, ctx, cam, '01 · two kinds of lock');
  });
}
