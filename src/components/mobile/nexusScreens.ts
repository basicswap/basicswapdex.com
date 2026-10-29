// The Nexus wallet's BasicSwap screens (nexus, branch mbsx_main at d22f6e23,
// src/features/mbsx), redrawn as SVG for the Mobile hero phone and played as
// one 23.4 s film:
//   Wallet    Nexus's home (screens/NewMain.tsx): balance, chart and the
//             glass buttons; Swap is tapped
//   Starting  BasicSwap starts up (components/StartingScreen.tsx): its mark,
//             the spinner and the startup steps
//   New Swap  0.015 BTC typed in, a saved receiver picked, Get Offers, the
//             Confirm Request card, Get Offers
//   Request   waiting for an offer; a Best Rate offer arrives and is accepted
//   Swap      the progress bar steps through Locked and Redeemed to the
//             Swap Complete receipt
// Sizes, colours and wording come from that code (theme.ts, swapCards.ts,
// each screen's own styles, stateText.ts) for a 393 x 852 pt screen. Text is
// set in the app's Satoshi as glyph outlines, so no font ships with the page.
// Example figures throughout.
import { create, type Font } from 'fontkitten';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Film } from '../desktop/film';

// Read at build time from the project root (the bundled module moves, the root does not).
const asset = (name: string) => join(process.cwd(), 'src/assets/mobile/nexus', name);
const font = create(readFileSync(asset('Satoshi-Variable.ttf'))) as Font; // a single font, not a collection
const dataUri = (name: string) => `data:image/png;base64,${readFileSync(asset(name)).toString('base64')}`;
const COIN_IMG: Record<string, string> = { LTC: dataUri('ltc.png'), BTC: dataUri('btc.png') };

export const W = 393;
export const H = 852;
const r1 = (n: number) => Math.round(n * 10) / 10;

// ---- text as Satoshi glyph outlines -----------------------------------------
const weights = { 400: font.getVariation({ wght: 400 }), 700: font.getVariation({ wght: 700 }) };
type Weight = keyof typeof weights;
const glyphDefs = new Map<string, string>();
const glyphId = (w: Weight, cp: number) => {
  const id = `sg${w}-${cp}`;
  if (!glyphDefs.has(id)) {
    const g = weights[w].glyphForCodePoint(cp);
    glyphDefs.set(id, `<path id="${id}" d="${g.path.toSVG()}"/>`);
  }
  return id;
};
const advance = (w: Weight, cp: number) => weights[w].glyphForCodePoint(cp).advanceWidth;
export const measure = (s: string, size: number, w: Weight = 400) =>
  ([...s].reduce((t, ch) => t + advance(w, ch.codePointAt(0)!), 0) * size) / font.unitsPerEm;

type TextOpts = { size: number; w?: Weight; fill?: string; anchor?: 'start' | 'middle' | 'end'; cls?: string; max?: number };
/** A line of text whose baseline starts at (x, y). */
const text = (s: string, x: number, y: number, o: TextOpts) => {
  const w = o.w ?? 400;
  let k = o.size / font.unitsPerEm;
  let width = measure(s, o.size, w);
  if (o.max && width > o.max) {
    k *= o.max / width; // adjustsFontSizeToFit
    width = o.max;
  }
  const x0 = o.anchor === 'end' ? x - width : o.anchor === 'middle' ? x - width / 2 : x;
  let pen = 0;
  const uses = [...s]
    .map((ch) => {
      const cp = ch.codePointAt(0)!;
      const u = ch === ' ' ? '' : `<use href="#${glyphId(w, cp)}" x="${Math.round(pen)}"/>`;
      pen += advance(w, cp);
      return u;
    })
    .join('');
  return `<g${o.cls ? ` class="${o.cls}"` : ''} fill="${o.fill ?? INK}" transform="translate(${r1(x0)} ${r1(y)}) scale(${k.toFixed(5)} ${(-k).toFixed(5)})">${uses}</g>`;
};

// ---- palette (theme.ts and the screens' own styles) --------------------------
const INK = '#484859';
const GREY = '#747E87';
const BLUE = '#2C72FF';
const HEADER = '#1162E6';
const PAGE = '#F2F8FD';
const FIELD = '#F4F7FB';
const LINE = '#E8E8E8';
const SOFT = '#E4E8EE';
const PLACEHOLDER = '#C5C5CE';

const rect = (x: number, y: number, w: number, h: number, r: number, fill: string, extra = '') =>
  `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${r}" fill="${fill}"${extra}/>`;
const hline = (x1: number, x2: number, y: number, stroke = LINE) =>
  `<path d="M${r1(x1)} ${r1(y)} H${r1(x2)}" stroke="${stroke}" stroke-width="1"/>`;
// Each logo is defined once (in build's <defs>) and placed by reference.
const coin = (ticker: string, cx: number, cy: number, d = 32, ring = false) =>
  `<use href="#coin-${ticker}" transform="translate(${r1(cx - d / 2)} ${r1(cy - d / 2)}) scale(${r1(d / 100)})"/>` +
  (ring ? `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${d / 2 + 1}" fill="none" stroke="#fff" stroke-width="2"/>` : '');
/** The app's forward.png chevron, turned to point down (rotate 90deg). */
const chevronDown = (cx: number, cy: number, color = GREY) =>
  `<path d="M${r1(cx - 4)} ${r1(cy - 2)} l4 4 l4 -4" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`;
const clockIcon = (x: number, cy: number) =>
  `<g transform="translate(${r1(x)} ${r1(cy - 8)}) scale(0.6667)" fill="none" stroke="${GREY}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></g>`;

// ---- layout constants ----------------------------------------------------------
const MD = 13.6; // spacing.md
const HEAD_H = H * 0.13; // headerStyle height
const TOP = HEAD_H + MD; // ScrollView padding
const X0 = MD; // card left
const X1 = W - MD; // card right
const IN0 = X0 + 16; // card padding
const IN1 = X1 - 16;
const BTN_H = H * 0.06;
const FOOT_BTN = H - 34 - BTN_H; // footer button top (bottom inset 34)

/** swapCards.section: 14 bold grey, 4 above, 8 below. Returns the next y. */
const section = (label: string, y: number, out: string[]) => {
  out.push(text(label, X0, y + 4 + 14.5, { size: 14, w: 700, fill: GREY }));
  return y + 4 + 19 + 8;
};
const card = (y: number, h: number, extra = '') => rect(X0, y, X1 - X0, h, 16, '#fff', extra);
/** A 48-high amount row: big amount left, coin pill right. */
const amountRow = (y: number, amount: string, ticker: string, o: { chevron?: boolean; cls?: string; placeholder?: boolean } = {}) => {
  const cy = y + 24;
  const tw = measure(ticker, 14, 700);
  const textEnd = o.chevron ? IN1 - 16 : IN1;
  const out = [
    text(amount, IN0, cy + 12.6, { size: 36, fill: o.placeholder ? PLACEHOLDER : INK, cls: o.cls, max: textEnd - tw - 8 - 32 - 6 - IN0 - 8 }),
    coin(ticker, textEnd - tw - 8 - 16, cy),
    text(ticker, textEnd - tw, cy + 5, { size: 14, w: 700 }),
  ];
  if (o.chevron) out.push(chevronDown(IN1 - 5, cy));
  return out.join('');
};

/** The blue drawer header, status bar included. */
const header = (title: string, back: boolean) => {
  const cy = 54 + (HEAD_H - 54) / 2;
  const icon = back
    ? `<path d="M30 ${r1(cy - 8)} l-8 8 l8 8" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`
    : [0, 5.5, 11].map((d) => rect(19, cy - 6.6 + d, 15.3, 2.2, 1.1, '#fff')).join('');
  const tor = 'Tor On';
  const tw = measure(tor, H * 0.013, 700);
  const pillW = tw + W * 0.04;
  const pillH = H * 0.035;
  const pillX = W - W * 0.04 - pillW;
  return [
    rect(0, 0, W, HEAD_H, 0, HEADER),
    icon,
    text(title, 56, cy + 8, { size: H * 0.026, w: 700, fill: '#fff' }),
    rect(pillX, cy - pillH / 2, pillW, pillH, H * 0.01, 'rgba(216,216,216,0.2)'),
    text(tor, pillX + pillW / 2, cy + 4, { size: H * 0.013, w: 700, fill: '#fff', anchor: 'middle' }),
  ].join('');
};

/** The flip divider between the two cards. */
const flip = (y: number) => {
  const cy = y + 4 + 22;
  return [
    hline(X0 + 28, X1 - 28, cy, SOFT),
    `<circle cx="${W / 2}" cy="${r1(cy)}" r="21" fill="#fff" stroke="${SOFT}"/>`,
    // switch-arrow.png (up and down arrows) turned 90deg
    `<g transform="translate(${W / 2} ${r1(cy)}) rotate(90)" fill="none" stroke="#8B93A7" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M-4 6 V-6 M-7 -3 l3 -3 l3 3 M4 -6 V6 M1 3 l3 3 l3 -3"/></g>`,
  ].join('');
};

const button = (y: number, label: string, o: { secondary?: boolean; x?: number; w?: number; cls?: string; labelCls?: string } = {}) => {
  const x = o.x ?? X0;
  const w = o.w ?? X1 - X0;
  return [
    o.secondary ? rect(x, y, w, BTN_H, H * 0.012, '#fff', ' stroke="#e5e5e5" stroke-width="1.5"') : rect(x, y, w, BTN_H, H * 0.012, BLUE, o.cls ? ` class="${o.cls}"` : ''),
    text(label, x + w / 2, y + BTN_H / 2 + 6, { size: H * 0.02, w: 700, fill: o.secondary ? '#000' : '#fff', anchor: 'middle', cls: o.labelCls }),
  ].join('');
};

// ---- figures ------------------------------------------------------------------
const SEND = '13.06428';
const GET = '0.015';
const RATE = '1 LTC ≈ 0.00114817 BTC';
const ADDRESS = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';

// =================================================================================
// Wallet home (screens/NewMain.tsx, folded): LiquidGlassBackdrop's gradient
// card, GlassBalanceGraphics, the glass tab row with SwapEntryRow in its
// fourth slot, and the transaction sheet below
// =================================================================================
const INSET = 59; // iPhone 15 Pro top safe area
const FOLD = INSET + H * 0.5; // FOLD_SHEET_POINT: the card's bottom edge
const homeScreen = () => {
  const o: string[] = [];
  const cardR = H * 0.037;
  o.push(`<defs><radialGradient id="home-bg" gradientUnits="userSpaceOnUse" cx="${W / 2}" cy="${r1(FOLD)}" r="${r1(FOLD * 1.0365)}" gradientTransform="translate(${W / 2} 0) scale(${r1((W * 3.6453) / (FOLD * 1.0365))} 1) translate(${-W / 2} 0)">` +
    [['#000001', 0], ['#08208A', 0.285], ['#1249EA', 0.503], ['#60A2F9', 0.756], ['#8FBCFB', 1]].map(([c, p]) => `<stop offset="${p}" stop-color="${c}"/>`).join('') +
    `</radialGradient><linearGradient id="home-glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgb(238,235,235)" stop-opacity="0.67"/><stop offset="0.49" stop-color="rgb(227,223,223)" stop-opacity="0.06"/><stop offset="1" stop-color="rgb(216,210,210)" stop-opacity="0.25"/></linearGradient>` +
    `<linearGradient id="home-chart" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.28"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>`);
  // the sheet behind, then the card
  o.push(rect(0, 0, W, H, 0, '#f7f7f7'));
  o.push(`<path d="M0 0 H${W} V${r1(FOLD - cardR)} a${cardR} ${cardR} 0 0 1 ${-cardR} ${cardR} H${cardR} a${cardR} ${cardR} 0 0 1 ${-cardR} ${-cardR} Z" fill="url(#home-bg)"/>`);
  // header pills: settings, wallet, alerts
  const pillY = INSET + 2;
  const pill = (x: number, w: number) => rect(x, pillY, w, 34, 17, 'rgba(255,255,255,0.14)', ' stroke="url(#home-glass)" stroke-width="0.6"');
  const walletW = measure('Main Wallet', 14, 700) + 44;
  o.push(pill(W * 0.05, 34) + `<g transform="translate(${r1(W * 0.05 + 9)} ${pillY + 9})" fill="none" stroke="#fff" stroke-width="1.6"><circle cx="8" cy="8" r="2.6"/><path d="M8 1.5 v2 M8 12.5 v2 M1.5 8 h2 M12.5 8 h2 M3.4 3.4 l1.4 1.4 M11.2 11.2 l1.4 1.4 M3.4 12.6 l1.4 -1.4 M11.2 4.8 l1.4 -1.4"/></g>`);
  o.push(pill((W - walletW) / 2, walletW) + text('Main Wallet', (W - walletW) / 2 + 16, pillY + 22, { size: 14, w: 700, fill: '#fff' }) + chevronDown((W + walletW) / 2 - 16, pillY + 17, '#fff'));
  o.push(pill(W * 0.95 - 34, 34) + `<g transform="translate(${r1(W * 0.95 - 26)} ${pillY + 8})" fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"><path d="M9 2 a5 5 0 0 1 5 5 v4 l1.5 2.5 h-13 L4 11 V7 a5 5 0 0 1 5 -5Z M7 15.5 a2 2 0 0 0 4 0"/></g>`);
  // balance
  const amountTop = INSET + H * 0.05;
  o.push(text('25.4', W / 2, amountTop + (H * 0.06) / 2 + H * 0.05 * 0.36, { size: H * 0.05, fill: '#fff', anchor: 'middle' }));
  const fiatCy = amountTop + H * 0.06 + (H * 0.02) / 2;
  const fs = H * 0.015;
  const fiat = '$2,855.12';
  const pct = '2.41%';
  const ind = H * 0.02;
  const rowW = measure(fiat, fs, 700) + 7 + ind + 7 + measure(pct, fs, 700);
  const x0 = (W - rowW) / 2;
  const icx = x0 + measure(fiat, fs, 700) + 7 + ind / 2;
  o.push(text(fiat, x0, fiatCy + fs * 0.36, { size: fs, w: 700, fill: '#fff' }));
  o.push(`<circle cx="${r1(icx)}" cy="${r1(fiatCy)}" r="${r1(ind / 2)}" fill="#20BB74"/><path d="M${r1(icx)} ${r1(fiatCy - ind * 0.24)} L${r1(icx - ind * 0.29)} ${r1(fiatCy + ind * 0.24)} H${r1(icx + ind * 0.29)} Z" fill="#fff"/>`);
  o.push(text(pct, icx + ind / 2 + 7, fiatCy + fs * 0.36, { size: fs, w: 700, fill: '#fff' }));
  // chart and date picker
  const balanceBottom = INSET + H * 0.13;
  const chartH = H * 0.15;
  const gapC = H * 0.05;
  const btnH = H * 0.057;
  const foldedGap = (FOLD - balanceBottom - (chartH + gapC + H * 0.03) - btnH) / 3;
  const chartTop = balanceBottom + foldedGap;
  let seed = 11;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  let v = 0.45;
  const pts = Array.from({ length: 42 }, (_, i) => {
    v = Math.min(0.92, Math.max(0.08, v + (rnd() - 0.44) * 0.11));
    return [(W * i) / 41, chartTop + chartH * (1 - v)];
  });
  const line = 'M' + pts.map(([x, y]) => `${r1(x)} ${r1(y)}`).join(' L');
  o.push(`<path d="${line} L${W} ${r1(chartTop + chartH)} L0 ${r1(chartTop + chartH)} Z" fill="url(#home-chart)"/><path d="${line}" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>`);
  const dpY = chartTop + chartH + gapC;
  const margin = H * 0.03;
  const itemW = Math.min(W * 0.11, H * 0.05);
  const gapD = (W - margin * 2 - itemW * 6) / 7;
  ['1D', '1W', '1M', '3M', '1Y', 'ALL'].forEach((label, i) => {
    const x = margin + gapD * (i + 1) + itemW * i;
    if (label === '1M') o.push(rect(x, dpY, itemW, H * 0.03, H * 0.015, 'rgba(255,255,255,0.18)'));
    o.push(text(label, x + itemW / 2, dpY + H * 0.015 + 4.3, { size: 12, w: 700, fill: '#fff', anchor: 'middle' }));
  });
  // the glass row: Trade, Send, Receive, and Swap
  const rowY = FOLD - foldedGap - btnH;
  const bw = W * 0.2013;
  const icon = (kind: string, cx: number, cy: number) => {
    const s = H * 0.022;
    const g = (d: string) => `<g transform="translate(${r1(cx - s / 2)} ${r1(cy - s / 2)}) scale(${r1(s / 24)})" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</g>`;
    if (kind === 'Trade') return g('<path d="M4 8 h14 l-4 -4 M20 16 H6 l4 4"/>');
    if (kind === 'Send') return g('<path d="M12 19 V5 M6 11 l6 -6 l6 6"/>');
    if (kind === 'Receive') return g('<path d="M12 5 v14 M6 13 l6 6 l6 -6"/>');
    return g('<path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>');
  };
  [
    ['Trade', 0.0587],
    ['Send', 0.2867],
    ['Receive', 0.5147],
    ['Swap', 0.7427],
  ].forEach(([label, left]) => {
    const x = W * (left as number);
    const lw = measure(label as string, H * 0.013, 700);
    const cw = H * 0.022 + W * 0.012 + lw;
    const cx0 = x + (bw - cw) / 2;
    o.push(
      `<g class="${label === 'Swap' ? 'home-swap' : ''}">` +
        rect(x + 0.25, rowY + 0.25, bw - 0.5, btnH - 0.5, Math.min(26, btnH / 2), label === 'Trade' ? 'rgba(255,255,255,0.12)' : 'none', ' stroke="url(#home-glass)" stroke-width="0.6"') +
        icon(label as string, cx0 + (H * 0.022) / 2, rowY + btnH / 2) +
        text(label as string, cx0 + H * 0.022 + W * 0.012, rowY + btnH / 2 + 4, { size: H * 0.013, w: 700, fill: '#fff' }) +
        '</g>',
    );
  });
  // transactions: a finished swap first (SwapHistoryPreview, pinned above
  // the list), then the wallet's own
  let ty = FOLD + 14;
  o.push(rect(W / 2 - 18, FOLD + 6, 36, 4, 2, '#d5d5da'));
  o.push(rect(0, ty, W, 70, 0, '#fff') + hline(0, W, ty + 70, '#ececec'));
  o.push(coinPair(20, ty + 12, 36));
  o.push(text('+ 0.0213 BTC', 20 + 36 + 12, ty + 12 + 15, { size: 16, w: 700, fill: '#1162E6' }));
  o.push(text('Swap Complete', 20 + 36 + 12, ty + 12 + 33, { size: 12, fill: GREY }));
  o.push(text('− 18.5 LTC', W - 20, ty + 12 + 13, { size: 13, fill: GREY, anchor: 'end' }));
  o.push(text('2 days ago', W - 20, ty + 12 + 13 + 18, { size: 11, fill: '#979797', anchor: 'end' }));
  ty += 71;
  const rows: [string, string, string, string, boolean][] = [
    ['Received', 'Today, 09:14', '+3.2 LTC', '$359.68', true],
    ['Sent', 'Yesterday, 18:02', '-0.84 LTC', '$94.42', false],
    ['Received', '12 Oct, 11:47', '+10.0 LTC', '$1,124.00', true],
  ];
  rows.forEach(([title, meta, crypto, usd, inn]) => {
    o.push(rect(0, ty, W, 66, 0, '#fff') + hline(0, W, ty + 66, '#ececec'));
    o.push(`<circle cx="40" cy="${r1(ty + 33)}" r="18" fill="${inn ? '#1162E6' : '#000'}"/>`);
    o.push(`<g transform="translate(40 ${r1(ty + 33)}) rotate(${inn ? 0 : 180})" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M0 -7 V7 M-5 2 L0 7 L5 2"/></g>`);
    o.push(text(title, 70, ty + 29, { size: 15, w: 700 }) + text(meta, 70, ty + 47, { size: 12, w: 700, fill: '#9AA0AE' }));
    o.push(text(crypto, W - 20, ty + 29, { size: 15, w: 700, fill: inn ? '#20BB74' : INK, anchor: 'end' }) + text(usd, W - 20, ty + 47, { size: 12, w: 700, fill: '#9AA0AE', anchor: 'end' }));
    ty += 67;
  });
  return { svg: o.join(''), swapTap: [W * 0.7427 + bw / 2, rowY + btnH / 2] };
};

// =================================================================================
// Starting BasicSwap (components/StartingScreen.tsx)
// =================================================================================
// Laid over the swap screens, under the header, while the swap core starts:
// the BasicSwap mark (168 wide), the spinner, the title and the startup step.
const LOGO = readFileSync(asset('basicswap-logo.svg'), 'utf8').replace(/^[\s\S]*?<svg[^>]*>|<\/svg>\s*$/g, '');
const STARTUP_STEPS = ['Loading block headers', 'Connecting to servers', 'Connecting to the swap server'];
const starting = () => {
  const logoW = 168;
  const logoH = (logoW * 32) / 121;
  const SPIN = 37; // a large ActivityIndicator
  const block = logoH + 28 + SPIN + 16 + 23 + 6 + 19;
  const top = (HEAD_H + H) / 2 - block / 2;
  const spinY = top + logoH + 28 + SPIN / 2;
  const titleY = spinY + SPIN / 2 + 16 + 17;
  const stepY = titleY + 6 + 19;
  // iOS's spinner: twelve spokes, fading round the dial.
  const spokes = Array.from({ length: 12 }, (_, i) =>
    `<path d="M0 -10 V-17.5" transform="rotate(${i * 30})" stroke-opacity="${r1(1 - ((12 - i) % 12) * 0.07)}"/>`).join('');
  return [
    rect(0, HEAD_H, W, H - HEAD_H, 0, PAGE),
    `<g transform="translate(${r1(W / 2 - logoW / 2)} ${r1(top)}) scale(${(logoW / 121).toFixed(5)})">${LOGO}</g>`,
    `<g transform="translate(${r1(W / 2)} ${r1(spinY)})"><g class="boot-spin" stroke="${HEADER}" stroke-width="3.6" stroke-linecap="round">${spokes}</g></g>`,
    text('Starting BasicSwap', W / 2, titleY, { size: 17, w: 700, anchor: 'middle' }),
    ...STARTUP_STEPS.map((t, i) => text(t, W / 2, stepY, { size: 14, fill: GREY, anchor: 'middle', cls: `boot-s${i}` })),
  ].join('');
};

// =================================================================================
// New Swap (screens/CreateSwap.tsx)
// =================================================================================
const newSwap = () => {
  const o: string[] = [rect(0, 0, W, H, 0, PAGE)];
  let y = section('Send', TOP, o);
  const sendTop = y;
  o.push(card(y, 146));
  o.push(amountRow(y + 14, '0', 'LTC', { placeholder: true, cls: 'ns-send-ph' }));
  o.push(`<g class="ns-send">${amountRow(y + 14, SEND, 'LTC')}</g>`);
  const metaY = y + 14 + 48 + 8 + 14.5;
  o.push(text('0 USD', IN0, metaY, { size: 14, fill: GREY, cls: 'ns-send-ph' }));
  o.push(text('1,468.42 USD', IN0, metaY, { size: 14, fill: GREY, cls: 'ns-send' }));
  o.push(text('Max. 25.4 LTC', IN1, metaY, { size: 14, w: 700, fill: BLUE, anchor: 'end' }));
  o.push(hline(IN0, IN1, metaY + 4.5 + 12));
  o.push(text('From Nexus Wallet', IN0, metaY + 4.5 + 12 + 12 + 14.5, { size: 14 }));
  y = sendTop + 146;
  o.push(flip(y));
  y = section('Receive', y + 4 + 44, o);
  const recvTop = y;
  o.push(card(y, 210));
  const ay = y + 14;
  o.push(rect(IN0 - 4, ay, 210, 48, 8, 'none', ' class="ns-focus" stroke="#2C72FF" stroke-width="1.5"'));
  o.push(amountRow(ay, '', 'BTC', { chevron: true }));
  o.push(text('0', IN0, ay + 24 + 12.6, { size: 36, fill: PLACEHOLDER, cls: 'ns-get-ph' }));
  ['0', '0.', '0.0', '0.01', GET].forEach((v, i) => o.push(text(v, IN0, ay + 24 + 12.6, { size: 36, cls: `ns-type ns-t${i}` })));
  o.push(`<rect x="${r1(IN0 + 2)}" y="${r1(ay + 10)}" width="1.6" height="28" fill="${BLUE}" class="ns-caret"/>`);
  const fiatY = ay + 48 + 6 + 14.5;
  o.push(text('0 USD', IN0, fiatY, { size: 14, fill: GREY, cls: 'ns-get-ph' }));
  o.push(text('1,461.18 USD', IN0, fiatY, { size: 14, fill: GREY, cls: 'ns-send' }));
  const inputY = fiatY + 4.5 + 16;
  o.push(rect(IN0, inputY, IN1 - IN0, 39.6, 22, FIELD));
  o.push(text('Receive Address', IN0 + 14, inputY + 24.5, { size: 14, w: 700, fill: '#9AA0AE', cls: 'ns-addr-ph' }));
  o.push(`<g class="ns-addr"><clipPath id="ns-addr-clip"><rect x="${IN0 + 14}" y="${inputY}" width="${IN1 - IN0 - 28}" height="39.6"/></clipPath><g clip-path="url(#ns-addr-clip)">${text(ADDRESS, IN0 + 14, inputY + 24.5, { size: 14, w: 700 })}</g></g>`);
  const pickY = inputY + 39.6 + 10;
  const pickW = IN1 - IN0 - 2 * 44;
  o.push(rect(IN0, pickY, pickW, 39.6, 22, '#fff', ` stroke="${BLUE}" stroke-width="1"`));
  o.push(text('Select Receiver', IN0 + 14, pickY + 24.5, { size: 14, w: 700, fill: BLUE, cls: 'ns-pick-ph' }));
  o.push(text('Ledger', IN0 + 14, pickY + 24.5, { size: 14, w: 700, fill: BLUE, cls: 'ns-pick' }));
  o.push(chevronDown(IN0 + pickW - 18, pickY + 19.8));
  const icon = (cx: number, inner: string) =>
    `<circle cx="${r1(cx)}" cy="${r1(pickY + 19.8)}" r="18" fill="${FIELD}"/><g transform="translate(${r1(cx - 9)} ${r1(pickY + 10.8)})" fill="none" stroke="${INK}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${inner}</g>`;
  o.push(icon(IN0 + pickW + 8 + 18, '<path d="M9 2 v9 M5.5 7.5 L9 11 l3.5 -3.5 M2 16 h14"/>'));
  o.push(icon(IN1 - 18, '<rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1"/><rect x="11" y="1.5" width="5.5" height="5.5" rx="1"/><rect x="1.5" y="11" width="5.5" height="5.5" rx="1"/><path d="M11 11 h2.5 v2.5 M16.5 11 v5.5 h-3 M11 16.5 v-1"/>'));
  y = recvTop + 210;
  // the quote, once both amounts are in
  const qy = y + 8;
  const qRows: [string, string][] = [
    ['Rate', RATE],
    ['CoinGecko rate', '1 LTC ≈ 0.00115389 BTC'],
  ];
  o.push(
    `<g class="ns-quote">${rect(X0, qy, X1 - X0, 129, 16, '#fff')}` +
      qRows
        .map(([l, v], i) => (i ? hline(IN0, IN1, qy + 43 * i, '#EEF1F5') : '') + text(l, IN0, qy + 43 * i + 26.5, { size: 14, w: 700, fill: GREY }) + text(v, IN1, qy + 43 * i + 26.5, { size: 14, w: 700, anchor: 'end' }))
        .join('') +
      hline(IN0, IN1, qy + 86, '#EEF1F5') +
      text('Swap fee 0.5% (0.06532 LTC)', IN0, qy + 86 + 26.5, { size: 13, fill: GREY }) +
      '</g>',
  );
  // the saved receivers menu, opened from Select Receiver
  const menuY = pickY + 39.6 + 8;
  const menuSvg =
    `<g class="ns-menu">${rect(IN0, menuY, IN1 - IN0, 92, 12, FIELD, ' filter="url(#ns-shadow)"')}` +
      text('Ledger', IN0 + 14, menuY + 27, { size: 14, w: 700 }) +
      text('bc1qxy2kgdyg…wlh', IN0 + 14 + measure('Ledger', 14, 700) + 8, menuY + 27, { size: 13, fill: GREY }) +
      hline(IN0 + 14, IN1 - 14, menuY + 44, '#E4E8EE') +
      text('Manage Addresses', IN0 + 14, menuY + 71, { size: 14, w: 700, fill: BLUE }) +
      '</g>';
  o.push(menuSvg); // over the quote card
  // footer: Get Offers, and the Confirm Request card above it
  const conf = ['Send 13.06428 LTC', 'Receive 0.015 BTC', `To ${ADDRESS}`, RATE, 'Swap fee 0.5% (0.06532 LTC)'];
  const cardH = 14 + 22 + conf.length * 22.5 + 14;
  const cardY = FOOT_BTN - 8 - cardH;
  o.push(
    `<g class="ns-footer">${rect(0, FOOT_BTN - 8, W, H - FOOT_BTN + 8, 0, PAGE)}${button(FOOT_BTN, 'Get Offers', { cls: 'ns-get', labelCls: 'ns-get-label' })}${text('Requesting…', W / 2, FOOT_BTN + BTN_H / 2 + 6, { size: H * 0.02, w: 700, fill: '#fff', anchor: 'middle', cls: 'ns-requesting' })}</g>`,
  );
  const half = (X1 - X0 - 10) / 2;
  o.push(
    `<g class="ns-confirm">${rect(0, cardY - 8, W, H - cardY + 8, 0, PAGE)}${rect(X0, cardY, X1 - X0, cardH, 16, '#fff')}` +
      text('Confirm Request', IN0, cardY + 14 + 16, { size: 16, w: 700 }) +
      conf.map((l, i) => text(l, IN0, cardY + 14 + 22 + 4 + i * 22.5 + 14, { size: 14, max: IN1 - IN0 })).join('') +
      button(FOOT_BTN, 'Cancel', { secondary: true, w: half }) +
      button(FOOT_BTN, 'Get Offers', { x: X0 + half + 10, w: half, cls: 'ns-get2', labelCls: 'ns-get2-label' }) +
      text('Requesting…', X0 + half + 10 + half / 2, FOOT_BTN + BTN_H / 2 + 6, { size: H * 0.02, w: 700, fill: '#fff', anchor: 'middle', cls: 'ns-requesting2' }) +
      '</g>',
  );
  o.push(header('New Swap', false));
  return {
    svg: o.join(''),
    taps: {
      amount: [IN0 + 60, ay + 24],
      pick: [IN0 + 70, pickY + 19.8],
      saved: [IN0 + 60, menuY + 22],
      get: [W / 2, FOOT_BTN + BTN_H / 2],
      get2: [X0 + half + 10 + half / 2, FOOT_BTN + BTN_H / 2],
    },
  };
};

// =================================================================================
// Request (screens/RequestDetail.tsx)
// =================================================================================
const request = () => {
  const o: string[] = [];
  let y = section('Send', TOP, o);
  o.push(card(y, 236));
  o.push(amountRow(y + 14, SEND, 'LTC'));
  const st = y + 14 + 48 + 8 + 14.5;
  o.push(text('Waiting for an offer', IN0, st, { size: 14, w: 700, cls: 'rq-wait' }));
  o.push(text('An offer is ready to accept', IN0, st, { size: 14, w: 700, cls: 'rq-ready' }));
  o.push(text('The offer is being accepted', IN0, st, { size: 14, w: 700, cls: 'rq-accepting' }));
  o.push(hline(IN0, IN1, st + 4.5 + 12));
  const created = st + 4.5 + 12 + 12 + 14.5;
  o.push(text('Created 2026-10-14 12:41', IN0, created, { size: 14 }));
  o.push(clockIcon(IN0, created + 4.5 + 6 + 9.5));
  o.push(text('Expires 2026-10-14 13:41', IN0 + 24, created + 4.5 + 6 + 14.5, { size: 14, fill: GREY }));
  const idY = created + 4.5 + 6 + 19 + 12;
  o.push(rect(IN0, idY, IN1 - IN0 - 44, 46, 12, FIELD));
  o.push(text('Request', IN0 + 12, idY + 17, { size: 12, w: 700, fill: GREY }));
  o.push(text('69a1c0d2b71e…8f1', IN0 + 12, idY + 35, { size: 14, w: 700 }));
  o.push(`<circle cx="${r1(IN1 - 18)}" cy="${r1(idY + 23)}" r="18" fill="${FIELD}"/>`);
  o.push(`<g transform="translate(${r1(IN1 - 26)} ${r1(idY + 15)})" fill="none" stroke="${INK}" stroke-width="1.5"><rect x="5" y="5" width="10" height="11" rx="2"/><path d="M3 12 V3 a1.5 1.5 0 0 1 1.5 -1.5 H11"/></g>`);
  y = TOP + 31 + 236;
  o.push(flip(y));
  y = section('Receive', y + 4 + 44, o);
  o.push(card(y, 101));
  o.push(amountRow(y + 14, GET, 'BTC'));
  o.push(text('Offers below this need your approval', IN0, y + 14 + 48 + 6 + 14.5, { size: 14, fill: GREY }));
  y = section('Fees', y + 101 + 4, o);
  o.push(card(y, 104));
  o.push(text('Total', IN0, y + 14 + 24, { size: 14, w: 700 }));
  o.push(text('0.5%', IN1 - 118, y + 14 + 24, { size: 14, fill: GREY, anchor: 'end' }));
  o.push(text('0.06532 LTC', IN1, y + 14 + 24, { size: 14, w: 700, anchor: 'end' }));
  o.push(text('Added to the LTC you send. The exact amount', IN0, y + 14 + 39 + 18, { size: 13, fill: GREY }));
  o.push(text('follows the offer you accept.', IN0, y + 14 + 39 + 35, { size: 13, fill: GREY }));
  y = section('Offers', y + 104, o);
  // waiting
  o.push(
    `<g class="rq-waiting">${card(y, 94)}${clockIcon(IN0, y + 14 + 9.5)}${text('Waiting for an offer', IN0 + 24, y + 14 + 14.5, { size: 14 })}` +
      text('Offers usually arrive within a few minutes. You', IN0, y + 14 + 19 + 8 + 14.5, { size: 14, fill: GREY }) +
      text('can leave this screen.', IN0, y + 14 + 19 + 8 + 33, { size: 14, fill: GREY }) +
      '</g>',
  );
  // the offer
  const oy = y;
  const head = oy + 14 + 13;
  const amt = oy + 14 + 17 + 8;
  const meta = amt + 48 + 6 + 14.5;
  const rateY = meta + 4.5 + 4 + 12;
  const fromY = rateY + 17;
  const relY = fromY + 17;
  const barY = relY + 6;
  const acceptY = barY + 4 + 12;
  const confirmLines = ['Send 13.06428 LTC for 0.015 BTC. The swap starts', 'on its own once the offer is set up.'];
  const offerH = acceptY + BTN_H + 14 - oy;
  o.push(
    `<g class="rq-offer">${card(oy, offerH, ' class="rq-offer-card"')}` +
      text('Best Rate', IN0, head, { size: 13, w: 700, fill: BLUE }) +
      text('Bridged', IN0 + measure('Best Rate', 13, 700) + 8, head, { size: 13, fill: GREY }) +
      text('in 9 minutes', IN1, head, { size: 13, fill: GREY, anchor: 'end' }) +
      amountRow(amt, GET, 'BTC') +
      text('for 13.06428 LTC', IN0, meta, { size: 14, fill: GREY }) +
      text(RATE, IN0, rateY, { size: 11.9 }) +
      text('From bsx1qe7m2xkp…f7a', IN0, fromY, { size: 11.9 }) +
      text('Reliability 98', IN0, relY, { size: 11.9, w: 700, fill: '#1162E6' }) +
      rect(IN0, barY, IN1 - IN0, 4, 2, SOFT) +
      rect(IN0, barY, (IN1 - IN0) * 0.98, 4, 2, '#1162E6') +
      `<g class="rq-accept">${button(acceptY, 'Accept')}</g>` +
      `<g class="rq-confirm">${rect(IN0 - 2, acceptY - 4, IN1 - IN0 + 4, BTN_H + 8, 0, '#fff')}` +
      confirmLines.map((l, i) => text(l, IN0, acceptY - 40 + i * 18 + 46, { size: 14, w: 700 })).join('') +
      '</g>' +
      '</g>',
  );
  // the confirm buttons sit below the note, growing the card
  const half = (IN1 - IN0 - 10) / 2;
  const cbY = acceptY + 46;
  o.push(
    `<g class="rq-confirm">${rect(X0, acceptY + 40, X1 - X0, BTN_H + 28, 16, '#fff')}` +
      button(cbY, 'Cancel', { secondary: true, x: IN0, w: half }) +
      button(cbY, 'Accept', { x: IN0 + half + 10, w: half, labelCls: 'rq-acc-label' }) +
      text('Accepting…', IN0 + half + 10 + half / 2, cbY + BTN_H / 2 + 6, { size: H * 0.02, w: 700, fill: '#fff', anchor: 'middle', cls: 'rq-accepting-label' }) +
      '</g>',
  );
  const scroll = 300;
  return {
    svg: `${rect(0, 0, W, H, 0, PAGE)}<g class="rq-scroll">${o.join('')}</g>${header('Request', true)}`,
    scroll,
    taps: {
      accept: [W / 2, acceptY + BTN_H / 2 - scroll],
      accept2: [IN0 + half + 10 + half / 2, cbY + BTN_H / 2 - scroll],
    },
  };
};

// =================================================================================
// Swap (screens/SwapDetail.tsx, components/SwapProgress.tsx)
// =================================================================================
const STEPS = ['Offer', 'Locked', 'Redeemed', 'Complete'];
export const SWAP_STATES = [
  { k: 'accepted', step: 1, sub: 'The swap has been accepted', at: 11.6 },
  { k: 'locked', step: 1, sub: 'Litecoin is locked', at: 12.9 },
  { k: 'released', step: 2, sub: 'Litecoin can be redeemed', at: 14.2 },
];
const coinPair = (x: number, y: number, size = 40) => {
  const d = Math.round(size * 0.68);
  return coin('BTC', x + size - d / 2, y + size - d / 2, d) + coin('LTC', x + d / 2, y + d / 2, d, true);
};
const swap = () => {
  const o: string[] = [rect(0, 0, W, H, 0, PAGE)];
  let y = TOP;
  o.push(card(y, 112));
  o.push(coinPair(IN0, y + 14));
  const mid = IN0 + 40 + 12;
  o.push(text('Swap in progress', mid, y + 14 + 15, { size: 15, w: 700 }));
  SWAP_STATES.forEach(({ k, sub }) => o.push(text(sub, mid, y + 14 + 32, { size: 12, fill: GREY, cls: `sw-sub sw-sub-${k}` })));
  const barY = y + 14 + 40 + 14;
  const segW = (IN1 - IN0 - 12) / 4;
  STEPS.forEach((_, i) => {
    o.push(rect(IN0 + i * (segW + 4), barY, segW, 3, 1.5, SOFT));
    SWAP_STATES.forEach(({ k, step }) => {
      if (i <= step) o.push(rect(IN0 + i * (segW + 4), barY, segW, 3, 1.5, '#1162E6', ` class="sw-seg sw-seg-${k}"${i === step ? ' opacity="0.55"' : ''}`));
    });
  });
  SWAP_STATES.forEach(({ k, step }) => o.push(text(`Step ${step + 1} of 4 · ${STEPS[step]}`, IN0, barY + 3 + 8 + 12, { size: 12, fill: GREY, cls: `sw-sub sw-sub-${k}` })));
  y = section('Send', y + 112, o);
  o.push(card(y, 186));
  o.push(coin('LTC', IN0 + 16, y + 14 + 16) + text('13.06428 LTC', IN0 + 40, y + 14 + 21, { size: 15, w: 700 }));
  o.push(text('Bridged', IN0, y + 14 + 32 + 6 + 14.5, { size: 14, fill: GREY }));
  const cl = y + 14 + 32 + 6 + 19 + 12;
  o.push(hline(IN0, IN1, cl));
  o.push(text('Created 2026-10-14 12:42', IN0, cl + 12 + 14.5, { size: 14 }));
  o.push(button(cl + 12 + 19 + 12, 'View Request', { secondary: true, x: IN0, w: IN1 - IN0 }));
  y += 186;
  o.push(flip(y));
  y = section('Receive', y + 4 + 44, o);
  o.push(card(y, 85));
  o.push(coin('BTC', IN0 + 16, y + 14 + 16) + text('0.015 BTC', IN0 + 40, y + 14 + 21, { size: 15, w: 700 }));
  o.push(text(RATE, IN0, y + 14 + 32 + 6 + 14.5, { size: 14, fill: GREY }));
  y = section('Fees', y + 85, o);
  o.push(card(y, 47));
  o.push(text('Total', IN0, y + 28, { size: 14, w: 700 }) + text('0.5%', IN1 - 118, y + 28, { size: 14, fill: GREY, anchor: 'end' }) + text('0.06532 LTC', IN1, y + 28, { size: 14, w: 700, anchor: 'end' }));
  o.push(header('Swap', true));
  return o.join('');
};

/** The Swap Complete receipt that replaces the swap screen at the end. */
const receipt = () => {
  const o: string[] = [rect(0, 0, W, H, 0, PAGE)];
  let y = TOP;
  o.push(card(y, 68));
  o.push(coinPair(IN0, y + 14));
  const mid = IN0 + 52;
  o.push(text('Swap Complete', mid, y + 14 + 15, { size: 15, w: 700 }));
  o.push(text('2026-10-14 12:42', mid, y + 14 + 32, { size: 12, fill: GREY }));
  y = section('Sent', y + 68, o);
  o.push(card(y, 60) + coin('LTC', IN0 + 16, y + 30) + text('13.06428 LTC', IN0 + 40, y + 35, { size: 15, w: 700 }));
  y += 60;
  o.push(flip(y));
  y = section('Received', y + 4 + 44, o);
  o.push(card(y, 85) + coin('BTC', IN0 + 16, y + 14 + 16) + text('0.015 BTC', IN0 + 40, y + 14 + 21, { size: 15, w: 700 }) + text(RATE, IN0, y + 14 + 32 + 6 + 14.5, { size: 14, fill: GREY }));
  y = section('Fees', y + 85, o);
  o.push(card(y, 47) + text('Total', IN0, y + 28, { size: 14, w: 700 }) + text('0.5%', IN1 - 118, y + 28, { size: 14, fill: GREY, anchor: 'end' }) + text('0.06532 LTC', IN1, y + 28, { size: 14, w: 700, anchor: 'end' }));
  y = section('Receive Address', y + 47, o);
  o.push(card(y, 68) + rect(IN0, y + 14, IN1 - IN0 - 70, 40, 10, FIELD) + text('bc1qxy2kgdygjrsqtzq2n0yrf…', IN0 + 12, y + 14 + 25, { size: 13, w: 700, max: IN1 - IN0 - 94 }) + rect(IN1 - 62, y + 14, 62, 40, 10, '#fff', ' stroke="#e5e5e5" stroke-width="1.5"') + text('Copy', IN1 - 31, y + 14 + 25, { size: 14, w: 700, fill: '#000', anchor: 'middle' }));
  o.push(button(FOOT_BTN, 'Done'));
  o.push(header('Swap', true));
  return o.join('');
};

/** iOS's status bar, Dynamic Island and home indicator, in white over the blue header. */
const statusBar = () =>
  text('9:41', 44, 40, { size: 16.5, w: 700, fill: '#fff' }) +
  `<g transform="translate(300 28)" fill="#fff"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/>` +
  `<path d="M32 11.5 29.6 9a3.4 3.4 0 0 1 4.8 0Z M27.3 6.8a6.6 6.6 0 0 1 9.4 0l-1.5 1.5a4.5 4.5 0 0 0-6.4 0Z M25 4.5a9.9 9.9 0 0 1 14 0L37.5 6A7.8 7.8 0 0 0 26.5 6Z"/>` +
  `<rect x="45.5" y="0.5" width="23" height="12" rx="3.5" fill="none" stroke="#fff" stroke-opacity="0.45"/><rect x="47" y="2" width="17" height="9" rx="2"/></g>` +
  `<rect x="133.5" y="11" width="126" height="37" rx="18.5" fill="#000"/><circle cx="241" cy="29.5" r="6" fill="#0b1020"/>` +
  `<rect x="129.5" y="${H - 13}" width="134" height="5" rx="2.5" fill="#000"/>`;

// =================================================================================
// The film, 23.4 s
// =================================================================================
const SCREENS = 19; // the swap screens' own timeline
const START = 2.4; // the wallet home holds this long before Swap is tapped
const BOOT = 2; // then BasicSwap starts up over New Swap
export const D = START + BOOT + SCREENS;
export const build = () => {
  glyphDefs.clear();
  const home = homeScreen();
  const ns = newSwap();
  const rq = request();
  const sw = swap();
  const rc = receipt();
  const boot = starting();

  const plain = [{ when: '', delay: 0, suffix: '' }];
  // The wallet home, the slide into the swap screens and the startup run on
  // the whole loop; the swap screens' film is the same timeline shifted by
  // START + BOOT (Film's offset), held still before it.
  const homeFilm = new Film('.nx', D, 0, D, plain);
  homeFilm
    .track('fade', '.screen-all', [[0, 'opacity:0'], [0.3, 'opacity:1'], [D - 0.4, 'opacity:1'], [D - 0.05, 'opacity:0']], 'linear')
    .track('home', '.sc-home', [[0, 'translate:0 0;opacity:1'], [START, 'translate:0 0;opacity:1'], [START + 0.42, `translate:${-W * 0.3}px 0;opacity:0`]], 'cubic-bezier(0.3, 0, 0.1, 1)')
    .track('home-swap', '.home-swap', [[0, 'opacity:1'], [START - 0.12, 'opacity:1'], [START - 0.06, 'opacity:0.7'], [START + 0.2, 'opacity:1']], 'linear')
    .track('screens-in', '.screen', [[0, `translate:${W}px 0`], [START, `translate:${W}px 0`], [START + 0.42, 'translate:0 0']], 'cubic-bezier(0.3, 0, 0.1, 1)')
    .track('boot', '.boot', [[0, 'opacity:1'], [START + BOOT - 0.3, 'opacity:1'], [START + BOOT, 'opacity:0']], 'ease-in')
    .show('boot-s0', '.boot-s0', [[0, START + 0.6]], 0.12)
    .show('boot-s1', '.boot-s1', [[START + 0.6, START + 1.2]], 0.12)
    .show('boot-s2', '.boot-s2', [[START + 1.2, D]], 0.12)
    .track('tap-swap', '.tap-swap', [[0, 'opacity:0;scale:1.4'], [START - 0.35, 'opacity:0;scale:1.4'], [START - 0.1, 'opacity:1;scale:0.9'], [START + 0.25, 'opacity:0;scale:1.15']], 'ease-out');
  const film = new Film('.nx', SCREENS, START + BOOT, D, plain);
  const slide = (name: string, sel: string, inAt: number, outAt: number | null) => {
    const steps: [number, string][] = [[0, `translate:${inAt > 0 ? W : 0}px 0;opacity:${inAt > 0 ? 0 : 1}`]];
    if (inAt > 0) steps.push([inAt - 0.01, `translate:${W}px 0;opacity:0`], [inAt, `translate:${W}px 0;opacity:1`], [inAt + 0.42, 'translate:0 0;opacity:1']);
    if (outAt) steps.push([outAt, 'translate:0 0;opacity:1'], [outAt + 0.42, `translate:${-W * 0.3}px 0;opacity:0`]);
    film.track(name, sel, steps, 'cubic-bezier(0.3, 0, 0.1, 1)');
  };
  slide('s-new', '.sc-new', 0, 6.6); // slid in with .screen
  slide('s-req', '.sc-req', 6.6, 11.4);
  slide('s-swap', '.sc-swap', 11.4, null);
  film
    // New Swap: type the amount; everything that follows from it appears
    .show('focus', '.ns-focus', [[0.65, 2.2]], 0.12)
    .show('caret', '.ns-caret', [[0.65, 0.9]], 0.02)
    .show('get-ph', '.ns-get-ph', [[0, 0.95]], 0.02)
    .show('send-ph', '.ns-send-ph', [[0, 1.95]], 0.12);
  [0.95, 1.15, 1.35, 1.55, 1.75].forEach((at, i, all) => film.show(`t${i}`, `.ns-t${i}`, [[at, all[i + 1] ?? D]], 0.01));
  film
    .show('send', '.ns-send', [[1.95, D]], 0.2)
    .show('quote', '.ns-quote', [[2.15, D]], 0.3)
    // pick a saved receiver
    .track('menu', '.ns-menu', [[0, 'opacity:0;translate:0 -6px'], [2.85, 'opacity:0;translate:0 -6px'], [3.05, 'opacity:1;translate:0 0'], [3.6, 'opacity:1;translate:0 0'], [3.8, 'opacity:0;translate:0 -6px']], 'ease-out')
    .show('pick-ph', '.ns-pick-ph', [[0, 3.6]], 0.05)
    .show('pick', '.ns-pick', [[3.6, D]], 0.05)
    .show('addr-ph', '.ns-addr-ph', [[0, 3.6]], 0.05)
    .show('addr', '.ns-addr', [[3.6, D]], 0.12)
    // Get Offers, confirm, Get Offers
    .track('confirm', '.ns-confirm', [[0, 'opacity:0;translate:0 24px'], [4.55, 'opacity:0;translate:0 24px'], [4.85, 'opacity:1;translate:0 0']], 'cubic-bezier(0.2, 0.8, 0.2, 1)')
    .show('get-label', '.ns-get2-label', [[0, 5.75]], 0.05)
    .show('requesting', '.ns-requesting2', [[5.75, D]], 0.05)
    .track('get2', '.ns-get2', [[0, 'opacity:1'], [5.7, 'opacity:1'], [5.76, 'opacity:0.7'], [6.0, 'opacity:1']], 'linear')
    // Request: the offer arrives, scroll to it, Accept, confirm
    .show('wait', '.rq-wait', [[0, 7.8]], 0.15)
    .show('ready', '.rq-ready', [[7.8, 10.5]], 0.15)
    .show('accepting', '.rq-accepting', [[10.5, D]], 0.15)
    .show('waiting', '.rq-waiting', [[0, 7.8]], 0.2)
    .track('offer', '.rq-offer', [[0, 'opacity:0;translate:0 10px'], [7.8, 'opacity:0;translate:0 10px'], [8.2, 'opacity:1;translate:0 0']], 'cubic-bezier(0.2, 0.8, 0.2, 1)')
    .track('scroll', '.rq-scroll', [[0, 'translate:0 0'], [8.3, 'translate:0 0'], [9.0, `translate:0 ${-rq.scroll}px`]], 'cubic-bezier(0.45, 0, 0.2, 1)')
    .show('accept', '.rq-accept', [[0, 9.6]], 0.08)
    .show('confirm-rq', '.rq-confirm', [[9.6, D]], 0.2)
    .show('acc-label', '.rq-acc-label', [[0, 10.5]], 0.05)
    .show('accepting-label', '.rq-accepting-label', [[10.5, D]], 0.05)
    // Swap: the progress bar steps through, then the receipt
    .show('receipt', '.sc-receipt', [[15.6, D]], 0.35);
  SWAP_STATES.forEach(({ k, at }, i) => {
    const until = SWAP_STATES[i + 1]?.at ?? D;
    film.show(`sub-${k}`, `.sw-sub-${k}`, [[i === 0 ? 0 : at, until]], 0.15);
    film.show(`seg-${k}`, `.sw-seg-${k}`, [[i === 0 ? 0 : at, until]], 0.2);
  });
  const taps = [
    { k: 'amount', at: 0.6, xy: ns.taps.amount },
    { k: 'pick', at: 2.85, xy: ns.taps.pick },
    { k: 'saved', at: 3.55, xy: ns.taps.saved },
    { k: 'get', at: 4.5, xy: ns.taps.get },
    { k: 'get2', at: 5.7, xy: ns.taps.get2 },
    { k: 'accept', at: 9.55, xy: rq.taps.accept },
    { k: 'accept2', at: 10.45, xy: rq.taps.accept2 },
  ];
  taps.forEach(({ k, at }) =>
    film.track(`tap-${k}`, `.tap-${k}`, [
      [0, 'opacity:0;scale:1.4'],
      [at - 0.25, 'opacity:0;scale:1.4'],
      [at, 'opacity:1;scale:0.9'],
      [at + 0.35, 'opacity:0;scale:1.15'],
    ], 'ease-out'),
  );

  const tapDots = taps.map(({ k, xy: [x, y] }) => `<circle class="tap tap-${k}" cx="${r1(x)}" cy="${r1(y)}" r="20"/>`).join('');

  const svg =
    `<defs>${[...glyphDefs.values()].join('')}${Object.entries(COIN_IMG).map(([t, uri]) => `<image id="coin-${t}" href="${uri}" width="100" height="100"/>`).join('')}<filter id="ns-shadow" x="-10%" y="-20%" width="120%" height="160%"><feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.12"/></filter></defs>` +
    `<g class="screen-all"><g class="sc sc-home">${home.svg}</g><g class="screen"><g class="sc sc-new">${ns.svg}<g class="boot">${boot}</g></g><g class="sc sc-req">${rq.svg}</g><g class="sc sc-swap">${sw}<g class="sc-receipt">${rc}</g></g></g></g>` +
    statusBar() +
    `<circle class="tap tap-swap" cx="${r1(home.swapTap[0])}" cy="${r1(home.swapTap[1])}" r="20"/>` +
    tapDots;
  const spin = '.nx .boot-spin{transform-box:fill-box;transform-origin:center;animation:nx-spin 1s steps(12) infinite}@keyframes nx-spin{to{rotate:360deg}}';
  return { svg, css: homeFilm.css() + film.css() + spin };
};
