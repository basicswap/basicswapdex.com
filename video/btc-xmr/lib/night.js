// The stage every scene stands on, in the site's dark theme: a navy sky, a
// floor of the site's faint dot pattern, and the mono kicker in the corner.
// The ribbon is not part of the stage; it carries the film from one scene to
// the next (ribbonPass in ribbon.js).
import { C } from './ink.js';

export const GROUND = 860;

// o: { haze } where haze (0..1) tints the air violet, for the Monero side.
export function night(ctx, s, o = {}) {
  const X0 = -400, X1 = 2320, Y0 = -400, Y1 = 1500;

  const sky = ctx.createLinearGradient(0, -200, 0, GROUND);
  sky.addColorStop(0, C.navyDeep);
  sky.addColorStop(1, C.navy);
  ctx.fillStyle = sky;
  ctx.fillRect(X0, Y0, X1 - X0, GROUND - Y0);

  // the shader's soft centre light
  soft(ctx, 960, 420, 900, 'rgba(0,115,255,0.07)');

  motes(ctx, s);

  if (o.haze) {
    ctx.save();
    ctx.globalAlpha = o.haze;
    for (const [i, y, h] of [[0, 520, 260], [1, 700, 200]]) {
      for (let j = 0; j < 3; j++) {
        const x = ((s.T * (9 + i * 5) + j * 900 + i * 400) % 2700) - 400;
        soft(ctx, x, y + Math.sin(s.T * 0.4 + j) * 10, 520, 'rgba(168,85,247,0.10)', h / 520);
      }
    }
    ctx.restore();
  }

  floor(ctx, X0, X1, Y1);
}

// Specks of light drifting slowly up through the dark.
function motes(ctx, s) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 28; i++) {
    const x = s.rand(i, 901) * 2100 - 90 + Math.sin(s.T * 0.3 + i) * 20;
    const y = GROUND - ((s.rand(i, 902) * 700 + s.T * (8 + s.rand(i, 903) * 10)) % 700);
    const tw = 0.5 + 0.5 * Math.sin(s.T * (1 + s.rand(i, 904) * 2) + i);
    ctx.fillStyle = i % 3 ? `rgba(96,165,250,${0.35 * tw})` : `rgba(192,132,252,${0.35 * tw})`;
    ctx.beginPath();
    ctx.arc(x, y, 1.6 + s.rand(i, 905) * 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function floor(ctx, X0, X1, Y1) {
  ctx.fillStyle = C.floor;
  ctx.fillRect(X0, GROUND, X1 - X0, Y1 - GROUND);
  // the sky's glow, reflected on a glossy floor
  soft(ctx, 960, GROUND, 900, 'rgba(59,130,246,0.10)', 0.22);

  // the site's dot pattern laid flat, shrinking toward the horizon
  const VPY = GROUND - 520;
  ctx.fillStyle = 'rgba(156,163,175,0.55)';
  for (let r = 0; r < 11; r++) {
    const y = GROUND + 14 * Math.pow(r + 1, 1.45);
    const depth = (y - VPY) / (GROUND - VPY);
    const gap = 46 * depth, rad = 1.6 * depth;
    ctx.globalAlpha = Math.min(1, 0.35 + r * 0.07);
    for (let x = 960 - Math.ceil(1500 / gap) * gap; x < 2400; x += gap) {
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  // a horizon line in BasicSwap Blue that fades out toward the edges
  const g = ctx.createLinearGradient(-200, 0, 2120, 0);
  g.addColorStop(0, 'rgba(59,130,246,0)');
  g.addColorStop(0.5, 'rgba(59,130,246,0.85)');
  g.addColorStop(1, 'rgba(59,130,246,0)');
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = g;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-200, GROUND);
  ctx.lineTo(2120, GROUND);
  ctx.stroke();
  ctx.globalAlpha = 0.25;
  ctx.lineWidth = 10;
  ctx.stroke();
  ctx.restore();
}

// A round soft light. `squash` flattens it vertically.
export function soft(ctx, x, y, r, color, squash = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, squash);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-r, -r, r * 2, r * 2);
  ctx.restore();
}

// Runs fn with the canvas in screen pixels, undoing the scene camera, for the
// kicker and the vignette. cam is what s.camera() returned.
export function onScreen(ctx, cam, fn) {
  ctx.save();
  ctx.translate(cam.x, cam.y);
  ctx.scale(1 / cam.zoom, 1 / cam.zoom);
  ctx.translate(-960, -540);
  fn();
  ctx.restore();
}

export function vignette(ctx) {
  const g = ctx.createRadialGradient(960, 540, 420, 960, 540, 1150);
  g.addColorStop(0, 'rgba(5,8,16,0)');
  g.addColorStop(1, 'rgba(5,8,16,0.55)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1920, 1080);
}

// The site's section kicker: a short blue rule and a lowercase mono label.
export function kicker(ctx, text, alpha = 1) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = C.primary;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(110, 100);
  ctx.lineTo(150, 100);
  ctx.stroke();
  ctx.fillStyle = C.link;
  ctx.font = '400 26px "JetBrains Mono"';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 166, 101);
  ctx.restore();
}
