// Font registry. The site uses one sans family and one mono family.
//
// To switch the production font, change ACTIVE_SANS or ACTIVE_MONO below.
// To try one without editing anything:
//   FONT_SANS=geist npm run dev
//   FONT_SANS=geist FONT_MONO=fira-code npm run build
//
// Every candidate is an npm package, so fonts are self-hosted from
// node_modules: no request to Google or a CDN at build time or at runtime.
// Package versions are pinned in package-lock.json.
// To add a candidate, `npm i -D @fontsource-variable/<id>` and add a row.
//
// /font-lab (dev server only) shows every candidate side by side.

import { fontProviders } from 'astro/config';

export const ACTIVE_SANS = 'instrument-sans';
export const ACTIVE_MONO = 'jetbrains-mono';

export const SANS = {
  'instrument-sans': { name: 'Instrument Sans Variable', package: '@fontsource-variable/instrument-sans' },
  'inter': { name: 'Inter Variable', package: '@fontsource-variable/inter' },
  'ibm-plex-sans': { name: 'IBM Plex Sans Variable', package: '@fontsource-variable/ibm-plex-sans' },
  'hanken-grotesk': { name: 'Hanken Grotesk Variable', package: '@fontsource-variable/hanken-grotesk' },
  'schibsted-grotesk': { name: 'Schibsted Grotesk Variable', package: '@fontsource-variable/schibsted-grotesk' },
  'geist': { name: 'Geist Variable', package: '@fontsource-variable/geist' },
  'manrope': { name: 'Manrope Variable', package: '@fontsource-variable/manrope' },
  'figtree': { name: 'Figtree Variable', package: '@fontsource-variable/figtree' },
  'space-grotesk': { name: 'Space Grotesk Variable', package: '@fontsource-variable/space-grotesk' },
  'bricolage-grotesque': { name: 'Bricolage Grotesque Variable', package: '@fontsource-variable/bricolage-grotesque' },
  'onest': { name: 'Onest Variable', package: '@fontsource-variable/onest' },
  'sora': { name: 'Sora Variable', package: '@fontsource-variable/sora' },
};

export const MONO = {
  'jetbrains-mono': { name: 'JetBrains Mono Variable', package: '@fontsource-variable/jetbrains-mono' },
  'geist-mono': { name: 'Geist Mono Variable', package: '@fontsource-variable/geist-mono' },
  'fira-code': { name: 'Fira Code Variable', package: '@fontsource-variable/fira-code' },
  'ibm-plex-mono': { name: 'IBM Plex Mono', package: '@fontsource/ibm-plex-mono', weights: [400, 500, 600] },
};

function pick(table, envVar, fallback) {
  const id = process.env[envVar] || fallback;
  if (!table[id]) {
    throw new Error(`${envVar}="${id}" is not in src/config/fonts.mjs. Options: ${Object.keys(table).join(', ')}`);
  }
  return id;
}

// Only the Latin file of each family ships. Astro's npm provider would emit
// every subset without tagging which is which, so the preload could not be
// limited to Latin. Pointing the local provider at the one file fixes that:
// one preload, no wasted bytes. Characters outside Latin (rare on this
// English site) fall back to the metric-matched system font.
function latinVariants(id, entry) {
  if (entry.weights) {
    return entry.weights.map((weight) => ({
      src: [`${entry.package}/files/${id}-latin-${weight}-normal.woff2`],
      weight,
      style: 'normal',
    }));
  }
  return [{ src: [`${entry.package}/files/${id}-latin-wght-normal.woff2`], style: 'normal' }];
}

function family(id, entry, cssVariable, fallbacks) {
  return {
    provider: fontProviders.local(),
    name: entry.name,
    cssVariable,
    fallbacks,
    options: { variants: latinVariants(id, entry) },
  };
}

const SANS_FALLBACKS = ['ui-sans-serif', 'system-ui', 'sans-serif'];
const MONO_FALLBACKS = ['ui-monospace', 'monospace'];

/** The fonts Astro loads. `withLab` adds every candidate for /font-lab. */
export function fontFamilies({ withLab = false } = {}) {
  const sans = pick(SANS, 'FONT_SANS', ACTIVE_SANS);
  const mono = pick(MONO, 'FONT_MONO', ACTIVE_MONO);
  const families = [
    family(sans, SANS[sans], '--font-sans', SANS_FALLBACKS),
    family(mono, MONO[mono], '--font-mono', MONO_FALLBACKS),
  ];
  if (withLab) {
    for (const [id, entry] of Object.entries(SANS)) families.push(family(id, entry, `--lab-${id}`, SANS_FALLBACKS));
    for (const [id, entry] of Object.entries(MONO)) families.push(family(id, entry, `--lab-${id}`, MONO_FALLBACKS));
  }
  return families;
}
