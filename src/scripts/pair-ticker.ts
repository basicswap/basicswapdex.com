// The homepage ticker's live rates. Fetches the markets dashboard's public
// order book snapshot (markets.basicswapdex.com/orderbook.json, rebuilt by its
// scraper about every 15 minutes, served with CORS open) and rebuilds the
// belt from it: every pair quoted by at least MIN_MAKERS different makers,
// the most makers first. A pair's rate is the median across makers of each
// maker's own median, so one maker's ladder of offers counts once.
//
// An offer is live until timestamp + time_valid. Its rate, as quote per base:
// selling base gives amount_to / amount_from, buying base the inverse (the
// dashboard's getBidsAsks does the same).
//
// A pair of two majors is priced by the earlier coin in BASE_ORDER (1 BTC in
// XMR); a pair with one major prices the other coin in it (1 PART in XMR), so
// the difference from market lands on the coin that's thinly traded.
//
// Each pill reads "1 BTC = $80,325.12 (145.5 XMR) 1.67% below market": the base coin's
// price on BasicSwap (the median rate times the quote coin's market price),
// the rate itself, and how far that price sits above (or below) the base
// coin's market price. Market prices come from DefiLlama, as on the
// dashboard; without them a pill shows the rate alone. A pair more than
// MAX_DIFF from market is left out. The static pairs in the markup stay if
// the order book can't be read.

const MIN_MAKERS = 3;
const MAX_DIFF = 10; // percent from market price
const REFRESH_MS = 10 * 60 * 1000;
// Which coin of a pair is the base: the earlier in this list, so rates read as
// "1 BTC = 144.5 XMR" rather than fractions where possible.
const BASE_ORDER = ['BTC', 'BCH', 'XMR', 'DASH', 'LTC', 'DCR', 'FIRO', 'PART', 'PIVX', 'DOGE', 'WOW'];
// Coins with deep markets of their own; any other coin is priced in these.
const MAJORS = new Set(['BTC', 'XMR', 'LTC', 'BCH']);
// Particl's private (blind) balance trades as its own coin; show it as PART.
const ALIAS: Record<string, string> = { PART_BLIND: 'PART', PART_ANON: 'PART' };
// Market prices in USD, by the dashboard's CoinGecko ids.
const PRICES_URL = 'https://coins.llama.fi/prices/current/';
const GECKO: Record<string, string> = {
  BTC: 'bitcoin', XMR: 'monero', LTC: 'litecoin', PART: 'particl', BCH: 'bitcoin-cash', FIRO: 'zcoin',
  DASH: 'dash', PIVX: 'pivx', WOW: 'wownero', DOGE: 'dogecoin', DCR: 'decred',
};

type Offer = {
  coin_from?: string;
  coin_to?: string;
  amount_from_str?: string;
  amount_to_str?: string;
  timestamp?: number;
  time_valid?: number;
  addr_from?: string;
};
type Row = { base: string; quote: string; makers: number; offers: number; median: number };

const SYMBOL = /^[A-Z]{2,6}$/;
const rank = (c: string) => {
  const i = BASE_ORDER.indexOf(c);
  return i < 0 ? BASE_ORDER.length : i;
};

/** [base, quote] for a pair: a lone major is the quote, else BASE_ORDER. */
function orient(a: string, b: string): [string, string] {
  const ma = MAJORS.has(a);
  const mb = MAJORS.has(b);
  if (ma !== mb) return ma ? [b, a] : [a, b];
  return rank(a) < rank(b) || (rank(a) === rank(b) && a < b) ? [a, b] : [b, a];
}

function median(xs: number[]) {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function rows(offers: Offer[], now: number): Row[] {
  // pair -> maker -> that maker's rates
  const pairs = new Map<string, { base: string; quote: string; makers: Map<string, number[]> }>();
  for (const o of offers) {
    if ((o.timestamp ?? 0) + (o.time_valid ?? 0) <= now) continue;
    const from = ALIAS[o.coin_from ?? ''] ?? o.coin_from ?? '';
    const to = ALIAS[o.coin_to ?? ''] ?? o.coin_to ?? '';
    const fa = parseFloat(o.amount_from_str ?? '');
    const ta = parseFloat(o.amount_to_str ?? '');
    if (!SYMBOL.test(from) || !SYMBOL.test(to) || from === to || !(fa > 0) || !(ta > 0)) continue;
    const [base, quote] = orient(from, to);
    const rate = from === base ? ta / fa : fa / ta;
    if (!Number.isFinite(rate)) continue;
    const key = `${base}/${quote}`;
    const p = pairs.get(key) ?? { base, quote, makers: new Map() };
    const maker = o.addr_from || `offer-${p.makers.size}`; // no address: count it alone
    p.makers.set(maker, [...(p.makers.get(maker) ?? []), rate]);
    pairs.set(key, p);
  }
  return [...pairs.values()]
    .filter((p) => p.makers.size >= MIN_MAKERS)
    .map((p) => {
      const perMaker = [...p.makers.values()];
      return {
        base: p.base,
        quote: p.quote,
        makers: perMaker.length,
        offers: perMaker.reduce((n, r) => n + r.length, 0),
        median: median(perMaker.map(median)),
      };
    })
    .sort((a, b) => b.makers - a.makers || b.offers - a.offers);
}

function format(x: number) {
  if (x >= 100000) return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 2 }).format(x);
  return new Intl.NumberFormat('en', { maximumSignificantDigits: 4 }).format(x);
}

const usd = (x: number) =>
  new Intl.NumberFormat('en', {
    style: 'currency',
    currency: 'USD',
    ...(x >= 1 ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : { maximumSignificantDigits: 4 }),
  }).format(x);

/** How far the base coin's price on BasicSwap sits from market, in percent. */
function diff(r: Row, usdOf: Record<string, number>) {
  const q = usdOf[r.quote];
  const b = usdOf[r.base];
  return q && b ? ((r.median * q) / b - 1) * 100 : null;
}

/** USD prices for the coins in `list`, or {} if they can't be had. */
async function prices(list: Row[]): Promise<Record<string, number>> {
  const ids = [...new Set(list.flatMap((r) => [r.base, r.quote]).map((c) => GECKO[c]).filter(Boolean))];
  if (!ids.length) return {};
  try {
    const res = await fetch(PRICES_URL + ids.map((id) => `coingecko:${id}`).join(','));
    if (!res.ok) return {};
    const bag = (await res.json())?.coins ?? {};
    const out: Record<string, number> = {};
    for (const [sym, id] of Object.entries(GECKO)) {
      const p = bag[`coingecko:${id}`]?.price;
      if (typeof p === 'number' && p > 0) out[sym] = p;
    }
    return out;
  } catch {
    return {};
  }
}

/** A coin icon on its own disc (see .pair-coin in Hero.astro). */
function coin(sym: string, icons: Record<string, string>) {
  const disc = document.createElement('span');
  disc.className = 'pair-coin';
  const img = document.createElement('img');
  img.width = 22;
  img.height = 22;
  img.alt = '';
  if (icons[sym]) img.src = icons[sym];
  disc.append(img);
  return disc;
}

function pill(r: Row, icons: Record<string, string>, usdOf: Record<string, number>) {
  const li = document.createElement('li');
  const coins = document.createElement('span');
  coins.className = 'pair-coins';
  coins.append(coin(r.base, icons), coin(r.quote, icons));
  const rate = document.createElement('span');
  rate.className = 'pair-rate data';
  const value = document.createElement('b');
  const quoteUsd = usdOf[r.quote];
  const baseUsd = usdOf[r.base];
  if (quoteUsd) {
    // the base coin's price on BasicSwap, then the rate it comes from
    const dexUsd = r.median * quoteUsd;
    value.textContent = usd(dexUsd);
    rate.append(`1 ${r.base} = `, value, ` (${format(r.median)} ${r.quote})`);
    const pct = diff(r, usdOf);
    if (baseUsd && pct !== null) {
      const diff = document.createElement('span');
      // Against the market price, not a change over time: cheaper on
      // BasicSwap reads green, dearer red.
      const above = pct > 0;
      diff.className = `pair-diff ${above ? 'above' : 'below'}`;
      diff.textContent = `${Math.abs(pct).toFixed(2)}% ${above ? 'above' : 'below'} market`;
      diff.title = `The ${r.base} market price is ${usd(baseUsd)}`;
      rate.append(' ', diff);
    }
  } else {
    value.textContent = format(r.median);
    rate.append(`1 ${r.base} = `, value, ` ${r.quote}`);
  }
  li.append(coins, rate);
  li.title = `Median of ${r.makers} makers' prices (${r.offers} live offers)`;
  return li;
}

async function load(box: HTMLElement) {
  const track = box.querySelector<HTMLElement>('.pairs-track');
  const src = box.dataset.src;
  if (!track || !src) return;
  let icons: Record<string, string> = {};
  try {
    icons = JSON.parse(box.dataset.icons ?? '{}');
  } catch {
    /* no icons: the pills still read */
  }
  try {
    const res = await fetch(src, { cache: 'no-cache' });
    if (!res.ok) return;
    const data = await res.json();
    const now = Math.floor(Date.now() / 1000);
    const all = rows(Array.isArray(data?.offers) ? data.offers : [], now);
    if (!all.length) return;
    const usdOf = await prices(all);
    const list = all.filter((r) => {
      const pct = diff(r, usdOf);
      return pct === null || Math.abs(pct) <= MAX_DIFF;
    });
    if (!list.length) return;

    // Two copies back to back, so the belt loops seamlessly; only the first is
    // read out.
    const first = list.map((r) => pill(r, icons, usdOf));
    const second = list.map((r) => {
      const li = pill(r, icons, usdOf);
      li.setAttribute('aria-hidden', 'true');
      return li;
    });
    track.replaceChildren(...first, ...second);
    track.removeAttribute('aria-hidden');
    track.setAttribute('aria-label', 'Median offer rates by pair');
    track.style.setProperty('--pairs-dur', `${Math.max(30, list.length * 7)}s`);
  } catch {
    /* offline or blocked: keep the static pairs */
  }
}

document.querySelectorAll<HTMLElement>('.pairs[data-src]').forEach((box) => {
  load(box);
  setInterval(() => {
    if (!document.hidden) load(box);
  }, REFRESH_MS);
});
