// 9. Outro. You and the seller walk away from each other, each with the
// other's coin. A gust spins you both like tops and you come out wearing each
// other's scarves; you shrug and keep walking. Then the camera lifts into a
// hero like the site's: the ribbon behind the BasicSwap logo, whose two arrows
// swap places on "both directions", and the page's address underneath.
import { C, clamp, lerp, bump, kick, seg, line } from '../lib/ink.js';
import { drawCharacter } from '../lib/cast.js';
import { night, soft, GROUND } from '../lib/night.js';
import { coin } from '../lib/things.js';
import { ribbon } from '../lib/ribbon.js';
import { heroRibbon } from '../lib/hero.js';
import { logo } from '../lib/logo.js';
import { finish, gait, faceAt } from '../lib/film.js';
import { YOU_LEAVE } from '../lib/timeline.js';

export default function outro(s) {
  const tSettled = s.time('settled'), tSwaps = s.time('swaps'), tBoth = s.time('both'), tSince = s.time('since');
  // the gust comes early, under the lead-in, so the celebration has room
  const gust = 1.0, swapAt = gust + 0.35, party = swapAt + 0.4;
  void tSettled;
  const lift = tSwaps - 0.3;

  const youX = (t) => lerp(840, 600, seg(t, 0.2, lift - 0.2, 'linear')) - 900 * seg(t, lift - 0.1, 1.0, 'in');
  const sellerX = (t) => lerp(1080, 1320, seg(t, 0.2, lift - 0.2, 'linear')) + 900 * seg(t, lift - 0.1, 1.0, 'in');

  const cam = s.camera([
    { at: 0, x: 960, y: 640, zoom: 1.5, dur: 0 },
    { at: 0.4, x: 960, y: 620, zoom: 1.35, dur: gust },
    { at: lift, x: 960, y: 200, zoom: 1.0, dur: 1.0, ease: 'in' },
  ]);

  s.sfx('whoosh', gust, { gain: 0.8, pitch: 0.8 });
  s.sfx('sparkle', swapAt);
  s.sfx('pop', party, { pitch: 1.4 });
  s.sfx('sparkle', party + 0.05);
  // confetti in the brand and coin colours over both of you
  const colors = ['#0073FF', '#A855F7', '#F7B500', '#FF6600'];
  s.burst({ x: youX(party), y: GROUND - 300, at: party, count: 50, colors });
  s.burst({ x: sellerX(party), y: GROUND - 380, at: party + 0.12, count: 50, colors });
  s.sfx('whoosh', lift, { gain: 0.5 });
  s.sfx('whoosh', tBoth, { pitch: 1.4, gain: 0.6 });
  s.sfx('click', tBoth + 0.5);
  s.sfx('ding', tSince, { gain: 0.6 });

  s.draw({ at: 0, enter: 'none' }, (ctx) => {
    const t = s.t;
    night(ctx, s, {});
    soft(ctx, 400, 600, 800, 'rgba(168,85,247,0.08)');
    soft(ctx, 1500, 600, 800, 'rgba(247,181,0,0.06)');

    // the gust: streaks of light blowing across
    const g = bump(t - gust, 0.9);
    if (g > 0) {
      ctx.save();
      ctx.globalAlpha = g;
      for (let i = 0; i < 9; i++) {
        const y = 420 + i * 46 + Math.sin(i * 2.1) * 20;
        const x = lerp(-400, 2300, clamp((t - gust) / 0.9)) - i * 90;
        line(ctx, s, [[x, y], [x + 260, y - 6], [x + 420, y + 4]], { stroke: C.line, seed: 990 + i, width: 2.5 });
      }
      ctx.restore();
    }

    const spin = Math.PI * 2 * seg(t, gust, 0.7);
    const swapped = t > swapAt;
    // the celebration: unhinged joy, hopping, jittering, coins held high
    const joy = seg(t, party, 0.25) * (1 - seg(t, lift - 0.3, 0.3));
    const hop = (ph) => joy * Math.abs(Math.sin(t * 11 + ph)) * 46;
    const jit = (ph) => joy * Math.sin(t * 57 + ph) * 4;
    const yx = youX(t) + jit(0), sx = sellerX(t) + jit(2);
    const youFace = faceAt(t, { look: -1, lookY: 0, lids: 0.3, brow: 0.6, mouth: 'flat' }, [
      [gust, { look: 0, lookY: -0.5, brow: -0.8, mouth: 'o' }],
      [swapAt + 0.1, { look: 0.4, lookY: 1, brow: -0.4, mouth: 'o' }],
      [party, { look: 0.6, lookY: -0.6, joy: 1, brow: 0, mouth: 'yay' }],
      [lift - 0.3, { look: -1, lookY: 0, lids: 0.2, brow: 0, mouth: 'smile' }],
    ]);
    const yy = GROUND - hop(0);
    drawCharacter(ctx, s, 'you', {
      x: yx, y: yy, ground: GROUND, face: -1, ...youFace, joy: youFace.joy ? joy : 0, ...gait(youX, t, 46, 400),
      rot: spin + joy * Math.sin(t * 9) * 0.12,
      scarf: swapped ? C.xmr : C.btc, stripe: swapped ? C.xmrGrey : null,
      flail: joy > 0.5,
      handF: joy > 0.5 ? null : [yx - 60, GROUND - 130],
      squash: -0.08 * joy * Math.cos(t * 22),
    });
    coin(ctx, s, 'xmr', joy > 0.5
      ? { x: yx + Math.sin(t * 7) * 20, y: yy - 290 - Math.abs(Math.sin(t * 11)) * 30, r: 38, flip: Math.cos(t * 12) }
      : { x: yx - 70, y: GROUND - 150, r: 34 });
    const sellerFace = faceAt(t, { look: 1, lookY: 0, lids: 0.6, brow: 0.6, mouth: 'smirk' }, [
      [gust, { look: 0, lookY: -0.5, lids: 0, brow: -0.8, mouth: 'o' }],
      [swapAt + 0.1, { look: -0.4, lookY: 1, lids: 0, brow: -0.4, mouth: 'o' }],
      [party, { look: -0.6, lookY: -0.6, lids: 0, joy: 1, brow: 0, mouth: 'yay' }],
      [lift - 0.3, { look: 1, lookY: 0, lids: 0.5, brow: 0, mouth: 'smirk' }],
    ]);
    const sy = GROUND - hop(1.3);
    drawCharacter(ctx, s, 'seller', {
      x: sx, y: sy, ground: GROUND, face: 1, ...sellerFace, joy: sellerFace.joy ? joy : 0, ...gait(sellerX, t, 70, 400),
      rot: -spin - joy * Math.sin(t * 8 + 1) * 0.12,
      scarf: swapped ? C.btc : C.xmr, stripe: swapped ? null : C.xmrGrey,
      flail: joy > 0.5,
      handF: joy > 0.5 ? null : [sx + 60, GROUND - 200],
      squash: -0.08 * joy * Math.cos(t * 22 + 1),
    });
    coin(ctx, s, 'btc', joy > 0.5
      ? { x: sx + Math.sin(t * 7 + 1) * 20, y: sy - 380 - Math.abs(Math.sin(t * 11 + 1.3)) * 30, r: 38, flip: Math.cos(t * 12 + 1) }
      : { x: sx + 74, y: GROUND - 220, r: 34 });

    // ---- the end card, in screen space ----
    finish(s, ctx, cam, null, {
      out: false,
      // the last failure track from scene 8, fading as the ribbon pulls away
      timeline: { steps: YOU_LEAVE, p: 6, title: 'You walk off', accent: '#F59E0B', alpha: 1 - seg(t, 0.2, 0.9) },
      extra: () => {
        const card = seg(t, lift + 0.4, 0.8);
        if (card <= 0) return;
        ctx.save();
        ctx.fillStyle = `rgba(17,24,39,${card})`;
        ctx.fillRect(0, 0, 1920, 1080);
        ctx.globalAlpha = card;
        // the homepage hero itself: the site's shader, drifting at its own
        // pace, with the pulse flaring as the logo's arrows swap and the
        // centre dimmed for the logo, as the hero dims behind its title
        const pulseAt = tBoth + 0.5;
        const phase = Math.PI + (t - pulseAt) * 0.45;
        const hero = heroRibbon(1920, 1080, phase, { intensity: 1, zone: 0.75 });
        if (hero) ctx.drawImage(hero, 0, 0, 1920, 1080);
        else {
          ribbon(ctx, s, { x: -160, y: -40, w: 2240, h: 1160, phase: 0.55 + s.T * 0.05, intensity: 0.95, pulse: kick(t - pulseAt, 2.5) * (t > pulseAt ? 1 : 0) });
          const dim = ctx.createRadialGradient(960, 520, 60, 960, 520, 700);
          dim.addColorStop(0, 'rgba(17,24,39,0.85)');
          dim.addColorStop(1, 'rgba(17,24,39,0)');
          ctx.fillStyle = dim;
          ctx.fillRect(0, 0, 1920, 1080);
        }
        const lk = seg(t, lift + 0.8, 0.6, 'outBack');
        const h = 150 * lk;
        if (h > 1) {
          logo(ctx, 960 - (121 * h) / 64, 470 - h / 2, h, {
            spin: Math.PI * seg(t, tBoth - 0.1, 0.7, 'inOut'),
            word: seg(t, lift + 1.1, 0.5),
          });
        }
        const url = seg(t, tSince - 0.1, 0.5);
        if (url > 0) {
          ctx.globalAlpha = card * url;
          ctx.fillStyle = C.link;
          ctx.font = '400 38px "JetBrains Mono"';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('basicswapdex.com/bitcoin-to-monero', 960, 640 + (1 - url) * 20);
        }
        ctx.restore();
      },
    });
  });
}
