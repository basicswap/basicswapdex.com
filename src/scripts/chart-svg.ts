// Draws a small bar or line chart as an SVG string. Used at build time for a
// post's static charts, and in the browser for the showcase's live chart.
export interface Dataset {
  label: string;
  data: number[];
  backgroundColor?: string;
  borderColor?: string;
}

const PALETTE = ['#3b82f6', '#a855f7', '#2ad168', '#f59e0b', '#60a5fa'];
const W = 640;
const H = 300;
const PAD = { l: 56, r: 16, t: 16, b: 34 };

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** Round tick steps (1, 2, 5 × 10^n) from 0 to the data's top. */
function ticks(max: number) {
  if (max <= 0) return [0, 1];
  const raw = max / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw)!;
  const out = [];
  for (let v = 0; v <= max + step * 0.001; v += step) out.push(v);
  if (out[out.length - 1] < max) out.push(out[out.length - 1] + step);
  return out;
}

const compact = (v: number) => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(v);

export function chartSvg(type: 'bar' | 'line', labels: string[], datasets: Dataset[], title?: string) {
  const max = Math.max(0, ...datasets.flatMap((d) => d.data));
  const ys = ticks(max);
  const top = ys[ys.length - 1];
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const y = (v: number) => PAD.t + ih - (v / top) * ih;
  const band = iw / labels.length;
  const color = (d: Dataset, i: number) => d.borderColor ?? d.backgroundColor?.replace(/,\s*[\d.]+\)$/, ', 1)') ?? PALETTE[i % PALETTE.length];

  const grid = ys
    .map((v) => `<line class="grid" x1="${PAD.l}" x2="${W - PAD.r}" y1="${y(v)}" y2="${y(v)}"/><text class="tick" x="${PAD.l - 8}" y="${y(v) + 4}" text-anchor="end">${compact(v)}</text>`)
    .join('');
  const every = Math.ceil(labels.length / 8);
  const xLabels = labels
    .map((l, i) => (i % every ? '' : `<text class="tick" x="${PAD.l + band * (i + 0.5)}" y="${H - 10}" text-anchor="middle">${esc(l)}</text>`))
    .join('');

  let marks = '';
  if (type === 'bar') {
    const bw = (band * 0.7) / datasets.length;
    marks = datasets
      .map((d, k) =>
        d.data
          .map((v, i) => {
            const x = PAD.l + band * i + band * 0.15 + bw * k;
            return `<rect x="${x}" y="${y(v)}" width="${bw}" height="${PAD.t + ih - y(v)}" rx="3" fill="${color(d, k)}" fill-opacity="0.8"><title>${esc(labels[i])}: ${v}</title></rect>`;
          })
          .join(''),
      )
      .join('');
  } else {
    marks = datasets
      .map((d, k) => {
        const pts = d.data.map((v, i) => `${PAD.l + band * (i + 0.5)},${y(v)}`).join(' ');
        return `<polyline points="${pts}" fill="none" stroke="${color(d, k)}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
      })
      .join('');
  }

  const legend = datasets
    .map((d, k) => `<span class="key"><i style="background:${color(d, k)}"></i>${esc(d.label)}</span>`)
    .join('');

  return {
    svg: `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title ?? datasets.map((d) => d.label).join(', '))}">${grid}${marks}${xLabels}</svg>`,
    legend,
  };
}
