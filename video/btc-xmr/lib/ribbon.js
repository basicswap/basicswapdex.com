// The BasicSwap line ribbon, drawn on the canvas. It is the same curve as the
// site's src/lib/ribbon.ts and the v0.19.0 release animation: two banks of
// fine strands, the upper bank in BasicSwap Blue and the lower one shading to
// violet. Each strand is a faint wide stroke for the bloom under a thin bright
// core, and every fourth strand carries a travelling light.
import { smoothPath, lerp } from './ink.js';
import { heroRibbon } from './hero.js';

const BLUE = [0, 115, 255];
const VIOLET = [168, 85, 247];
const WHITE = [255, 255, 255];

const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${Math.max(0, Math.min(1, a))})`;

// o: { x, y, w, h } the box the ribbon fills, phase (drifts over time),
// strands per bank, amp (vertical stretch), intensity, bloom, pulse (0..1
// extra brightness for a beat), lights (false hides the travelling lights).
export function ribbon(ctx, s, o = {}) {
  const X = o.x ?? 0, Y = o.y ?? 0, W = o.w ?? 1920, H = o.h ?? 1080;
  const phase = o.phase ?? 0.55;
  const n = o.strands ?? 16;
  const amp = o.amp ?? 1;
  const pulse = o.pulse ?? 0;
  const intensity = (o.intensity ?? 1) * (1 + pulse * 0.9);
  const bloom = o.bloom ?? 1;
  const k = W / 1600;
  const aspect = W / H;
  const samples = 40;
  // the strands fade out over this fraction of the width at each end, so the
  // ribbon never shows a cut-off edge
  const fe = o.fadeEnds ?? 0;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let bank = 0; bank < 2; bank++) {
    const side = bank === 0 ? 1 : -1;
    for (let i = 0; i < n; i++) {
      const f = i / (n - 1);
      const flow = phase + side * 0.45;
      const pts = [];
      for (let j = 0; j <= samples; j++) {
        const x = -aspect * 1.12 + (2.24 * aspect * j) / samples;
        let y =
          side * 0.21 +
          (0.27 + 0.035 * Math.cos(phase)) * Math.sin(x * 1.5 + flow) +
          0.11 * Math.sin(x * 2.8 - phase + f * 0.7) +
          side * 0.1 * pulse * Math.sin(x * 3);
        y += (f - 0.5) * (0.25 + 0.13 * Math.sin(x + phase + side));
        y *= amp;
        pts.push([X + ((x + aspect) / (2 * aspect)) * W, Y + (1 - (y + 1) / 2) * H]);
      }
      const tint = mix(BLUE, VIOLET, bank === 0 ? f * 0.38 : 0.62 + f * 0.38);
      const energy = (0.55 + 0.45 * Math.pow(0.5 + 0.5 * Math.cos(f * 2.6 + bank), 2)) * intensity;

      smoothPath(ctx, pts, false);
      ctx.strokeStyle = paint(ctx, X, W, fe, tint, 0.11 * bloom * energy);
      ctx.lineWidth = 9 * k;
      ctx.stroke();
      ctx.strokeStyle = paint(ctx, X, W, fe, tint, 0.2 * energy);
      ctx.lineWidth = 3 * k;
      ctx.stroke();
      ctx.strokeStyle = paint(ctx, X, W, fe, mix(tint, WHITE, 0.15), 0.95 * energy);
      ctx.lineWidth = 1.4 * k;
      ctx.stroke();

      if (o.lights !== false && i % 4 === 1) {
        const u = (((s.T * (o.lightSpeed ?? 1) + i * 1.7 + bank * 5.3) / 9) % 1 + 1) % 1;
        // keep the travelling lights inside the faded ends
        const lu = fe ? fe + u * (1 - 2 * fe - 0.07) : u;
        light(ctx, pts, lu, 0.07, mix(tint, WHITE, 0.55), k, intensity);
      }
    }
  }
  ctx.restore();
}

// A stroke colour, or a gradient that fades it to nothing at both ends.
function paint(ctx, X, W, fe, c, a) {
  if (!fe) return rgba(c, a);
  const g = ctx.createLinearGradient(X, 0, X + W, 0);
  g.addColorStop(0, rgba(c, 0));
  g.addColorStop(fe, rgba(c, a));
  g.addColorStop(1 - fe, rgba(c, a));
  g.addColorStop(1, rgba(c, 0));
  return g;
}

// A short bright dash at fraction u along the polyline.
function light(ctx, pts, u, len, c, k, intensity) {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = cum[cum.length - 1];
  const a = u * total, b = Math.min(total, (u + len) * total);
  const seg = [];
  for (let i = 0; i < pts.length; i++) {
    if (cum[i] >= a && cum[i] <= b) seg.push(pts[i]);
  }
  if (seg.length < 2) return;
  smoothPath(ctx, seg, false);
  ctx.strokeStyle = rgba(c, 0.14 * intensity);
  ctx.lineWidth = 7 * k;
  ctx.stroke();
  ctx.strokeStyle = rgba(c, 0.9 * intensity);
  ctx.lineWidth = 2.2 * k;
  ctx.stroke();
}

// The scene change, drawn with the homepage hero's own shader (hero.js).
// The ribbon rises up through the frame and fills it, the camera follows it,
// and the next scene opens on it carrying on upward and out of the frame.
// Draw it in screen space. cover (0..1) is how much of the frame it fills;
// at 1 the end of one scene and the start of the next look the same, so the
// cut doesn't show. o: { dir 'in' | 'out', u (-1..1, how far through the
// hand-off we are, 0 at the cut: it drives the shader's phase through PI so
// the hero's pulse flares right at the cut) }
export function ribbonPass(ctx, s, cover, o = {}) {
  if (cover <= 0.001) return;
  const c = Math.min(1, cover);
  ctx.save();
  ctx.fillStyle = `rgba(17,24,39,${0.97 * Math.pow(c, 1.6)})`;
  ctx.fillRect(-60, -60, 2040, 1200);
  // taller than the frame, so the strands never reach its top or bottom edge
  const H = 1440;
  const img = heroRibbon(1920, H, Math.PI + (o.u ?? 0) * 1.1, { intensity: 0.9 + 0.5 * c, amp: lerp(0.7, 1.15, c) });
  if (img) {
    const off = (1 - c) * 1500 * (o.dir === 'in' ? -1 : 1);
    ctx.drawImage(img, 0, (1080 - H) / 2 + off, 1920, H);
  } else {
    // no WebGL: the canvas version of the same curve
    const from = o.dir === 'in' ? [1160, -820] : [760, 1900];
    ctx.translate(lerp(from[0], 960, c), lerp(from[1], 540, c));
    const h = 420 + c * 2700, w = 4200;
    ribbon(ctx, s, { x: -w / 2, y: -h / 2, w, h, fadeEnds: 0.14, phase: 0.55 + (o.u ?? 0) * 2, strands: 22, intensity: 0.8 + 0.5 * c, bloom: 1.3, lightSpeed: 3 });
  }
  ctx.restore();
}
