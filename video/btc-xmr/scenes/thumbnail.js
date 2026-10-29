// The thumbnail: one frame, not part of the film (scenes.js leaves it out).
// The two traders, each holding their own coin and side-eyeing the other
// over their shoulder, under the title. thumbnail.sh renders it to out/thumbnail.png.
import { C } from '../lib/ink.js';
import { drawCharacter } from '../lib/cast.js';
import { night, soft, vignette, GROUND } from '../lib/night.js';
import { coin } from '../lib/things.js';
import { logo } from '../lib/logo.js';

// The stage is drawn larger than in the film, so the characters read at
// thumbnail size: scaled by K about (960, AY), which puts the floor at y 1000.
const K = 1.7, AY = 660;
const SELLER = 740, YOU = 1150;

// Lettering in the subtitles' style: filled type over a dark ink outline.
function letter(ctx, parts, y, size) {
  ctx.save();
  ctx.font = `700 ${size}px "Instrument Sans"`;
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  const widths = parts.map(([t]) => ctx.measureText(t).width);
  let x = 960 - widths.reduce((a, b) => a + b, 0) / 2;
  parts.forEach(([text, color], i) => {
    ctx.save();
    ctx.shadowColor = 'rgba(5,8,16,0.85)';
    ctx.shadowBlur = size * 0.3;
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = size * 0.14;
    ctx.strokeText(text, x, y);
    ctx.restore();
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    x += widths[i];
  });
  ctx.restore();
}

export default function thumbnail(s) {
  s.camera([]);
  s.draw({ at: 0, enter: 'none' }, (ctx) => {
    ctx.save();
    ctx.translate(960, AY);
    ctx.scale(K, K);
    ctx.translate(-960, -AY);
    night(ctx, s, {});
    soft(ctx, SELLER, 600, 680, 'rgba(168,85,247,0.18)');
    soft(ctx, YOU, 640, 620, 'rgba(0,115,255,0.16)');

    // The side-eye from the vault scene, where they pass each other: each
    // turns away and looks back over their shoulder. Here they still hold
    // their own coins. The seller, on the left, looks back down at you.
    drawCharacter(ctx, s, 'seller', {
      x: SELLER, y: GROUND, face: -1, look: 1, lookY: 0.4, lids: 0.6, brow: 0.7, mouth: 'smirk',
      handF: [SELLER - 84, GROUND - 150], handB: [SELLER - 30, GROUND - 146],
    });
    coin(ctx, s, 'xmr', { x: SELLER - 64, y: GROUND - 160, r: 40 });

    // you, on the right, face away and squint back up at the seller
    drawCharacter(ctx, s, 'you', {
      x: YOU, y: GROUND, face: 1, look: -1, lookY: -0.5, squint: 0.5, brow: 1, mouth: 'flat',
      handF: [YOU + 70, GROUND - 92], handB: [YOU + 122, GROUND - 92],
    });
    coin(ctx, s, 'btc', { x: YOU + 96, y: GROUND - 108, r: 42 });
    ctx.restore();

    vignette(ctx);
    letter(ctx, [['BTC', C.btc], [' <> ', '#F9FAFB'], ['XMR', C.xmr]], 180, 156);
    letter(ctx, [['Atomic Swaps Explained', '#F9FAFB']], 296, 96);
    logo(ctx, 1640, 1010, 40, { word: 1 });
  });
}
