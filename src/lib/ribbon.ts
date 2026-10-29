// The BasicSwap line ribbon, as static SVG: the fallback for the live shader
// (src/scripts/ribbon.ts), shown without JS or WebGL2 and before its first frame.
//
// Same curve as the v0.19.0 release animation (basicswap-blog
// .local/remotion-ribbon-v0190/src/shader.ts, mode 5): two banks of fine
// strands, the upper bank in BasicSwap Blue, the lower one shading to Violet.
// The shader is sampled once at a fixed phase and each strand becomes a
// smooth cubic path. Each strand is drawn twice, a faint wide stroke for the
// bloom and a thin bright core, which reads as glow without an SVG filter
// (filters re-rasterise on every animation frame).
//
// Motion lives inside the SVG: the banks drift slowly and light pulses travel
// along a few strands. All of it stops under prefers-reduced-motion.

import { PALETTES, type Palette } from './ribbon-palettes';

type Options = {
  width: number;
  height: number;
  strands: number;
  banks: 1 | 2;
  phase: number;
  /** Multiplies every opacity. Light backgrounds want less bloom. */
  intensity: number;
  bloom: number;
  /** Vertical stretch of the waves, 1 = shader proportions. */
  amplitude: number;
  animate: boolean;
  palette: Palette;
};

const mix = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgb = (c: number[]) => `rgb(${c.join(' ')})`;
const r1 = (n: number) => Math.round(n * 10) / 10;

/** Catmull-Rom through the points, emitted as cubic Bezier segments. */
function smoothPath(pts: [number, number][]): string {
  let d = `M${r1(pts[0][0])} ${r1(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${r1(c1[0])} ${r1(c1[1])} ${r1(c2[0])} ${r1(c2[1])} ${r1(p2[0])} ${r1(p2[1])}`;
  }
  return d;
}

export function ribbonSvg(o: Options): string {
  const { width: W, height: H, phase } = o;
  const aspect = W / H;
  const samples = 20;
  const paths: string[] = [];
  const defs: string[] = [];

  for (let bank = 0; bank < o.banks; bank++) {
    const side = bank === 0 ? 1 : -1;
    const strands: string[] = [];
    const bankPulses: string[] = [];
    for (let i = 0; i < o.strands; i++) {
      const f = i / (o.strands - 1);
      const flow = phase + side * 0.45;
      const pts: [number, number][] = [];
      // Overshoot the edges so drifting never reveals a strand's end.
      for (let s = 0; s <= samples; s++) {
        const x = -aspect * 1.12 + (2.24 * aspect * s) / samples;
        let y =
          side * 0.21 +
          (0.27 + 0.035 * Math.cos(phase)) * Math.sin(x * 1.5 + flow) +
          0.11 * Math.sin(x * 2.8 - phase + f * 0.7);
        y += (f - 0.5) * (0.25 + 0.13 * Math.sin(x + phase + side));
        y *= o.amplitude;
        pts.push([((x + aspect) / (2 * aspect)) * W, (1 - (y + 1) / 2) * H]);
      }
      // Each strand's geometry is defined once and drawn by reference: a faint
      // wide stroke (bloom), a thin bright core, and sometimes a pulse.
      const id = `s${bank}-${i}`;
      defs.push(`<path id="${id}" pathLength="100" d="${smoothPath(pts)}"/>`);
      const { a: colA, b: colB, blend } = o.palette;
      const tintRgb = mix(colA, colB, bank === 0 ? f * blend : 1 - blend + f * blend);
      const tint = rgb(tintRgb);
      const energy = 0.55 + 0.45 * Math.pow(0.5 + 0.5 * Math.cos(f * 2.6 + bank), 2);
      const a = (n: number) => r1(n * energy * o.intensity * 100) / 100;
      strands.push(
        `<use href="#${id}" stroke="${tint}" stroke-opacity="${a(0.11 * o.bloom * o.palette.bloom)}" stroke-width="8"/>` +
          `<use href="#${id}" stroke="${tint}" stroke-opacity="${a(1)}" stroke-width="1.3"/>`,
      );
      // A travelling light on every fourth strand.
      if (o.animate && i % 4 === 1) {
        const delay = r1(-(i * 1.7 + bank * 5.3));
        bankPulses.push(
          `<use href="#${id}" class="pulse" stroke="${rgb(mix(tintRgb, [255, 255, 255], 0.55))}" style="animation-delay:${delay}s"/>`,
        );
      }
    }
    // Pulses sit inside their bank so they drift with the strands they ride.
    paths.push(`<g class="bank b${bank}">${strands.join('')}${bankPulses.join('')}</g>`);
  }

  const style = o.animate
    ? `<style>
.bank{transform-box:view-box;transform-origin:50% 50%;animation:drift 22s ease-in-out infinite alternate}
.b1{animation-duration:27s;animation-direction:alternate-reverse}
@keyframes drift{from{transform:translateX(-2.5%) scaleY(.96)}to{transform:translateX(2.5%) scaleY(1.04)}}
.pulse{stroke-width:1.6;stroke-dasharray:6 94;stroke-linecap:round;opacity:${r1(0.9 * o.intensity * 10) / 10};animation:travel 9s linear infinite}
@keyframes travel{from{stroke-dashoffset:100}to{stroke-dashoffset:0}}
@media (prefers-reduced-motion:reduce){.bank,.pulse{animation:none}.pulse{display:none}}
</style>`
    : '';

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" fill="none" stroke-linecap="round">` +
    style +
    `<defs>${defs.join('')}</defs>` +
    paths.join('') +
    `</svg>`
  );
}

const SHAPES = {
  'hero-dark': { width: 1600, height: 900, strands: 18, banks: 2, phase: 0.55, intensity: 1, bloom: 1, amplitude: 1, animate: true },
  'hero-light': { width: 1600, height: 900, strands: 18, banks: 2, phase: 0.55, intensity: 0.8, bloom: 0.6, amplitude: 1, animate: true },
  'band-dark': { width: 1600, height: 500, strands: 10, banks: 2, phase: 2.1, intensity: 0.7, bloom: 0.8, amplitude: 0.62, animate: true },
  'band-light': { width: 1600, height: 500, strands: 10, banks: 2, phase: 2.1, intensity: 0.55, bloom: 0.5, amplitude: 0.62, animate: true },
} satisfies Record<string, Omit<Options, 'palette'>>;

/** /ribbon/<shape>.svg in the brand colours, /ribbon/<shape>-<palette>.svg in the others. */
export const ribbonFile = (shape: string, palette: string) => (palette === 'brand' ? shape : `${shape}-${palette}`);

export const RIBBONS: Record<string, Options> = Object.fromEntries(
  Object.entries(SHAPES).flatMap(([shape, o]) =>
    Object.entries(PALETTES).map(([name, palette]) => [ribbonFile(shape, name), { ...o, palette }]),
  ),
);

export type RibbonName = keyof typeof RIBBONS;
