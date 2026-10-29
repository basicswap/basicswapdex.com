// Colours for the line ribbon, shared by the live shader (src/scripts/ribbon.ts)
// and its static SVG fallback (src/lib/ribbon.ts). `a` tints the upper bank of
// strands and `b` the lower one; `blend` is how far each bank shades towards
// the other's colour; `glint` is the travelling sparkle's tint; `bloom`
// scales the soft glow round each strand.

export type Rgb = [number, number, number];
export type Palette = { a: Rgb; b: Rgb; glint: Rgb; blend: number; bloom: number };

export const PALETTES = {
  // BasicSwap Blue shading to Violet, as in the release animation.
  brand: { a: [0, 115, 255], b: [168, 85, 247], glint: [59, 130, 246], blend: 0.38, bloom: 1 },
  // The Bitcoin to Monero page: a Bitcoin yellow bank over a Monero orange
  // one, each keeping its own colour. Warm colours glow brighter than blue,
  // so the bloom is turned down a little.
  'btc-xmr': { a: [255, 184, 28], b: [255, 102, 0], glint: [255, 196, 92], blend: 0.1, bloom: 0.7 },
} satisfies Record<string, Palette>;

export type PaletteName = keyof typeof PALETTES;
