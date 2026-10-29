// The coins BasicSwap supports, for the docs' coin table, read from the
// basicswap repo at the latest release tag at build time: each coin's
// bundled core version and whether BasicSwap uses segwit for it, from
// basicswap/interface/<coin>/core.py.
//
// If GitHub can't be reached, or a file no longer has the expected shape,
// the build uses src/data/coins.json, the snapshot of the last good read,
// and says so in the build log. Refresh the snapshot after a release with
//   node tools/coins-snapshot.mjs
import snapshot from '../data/coins.json';
import { REPO, getLatestRelease } from './release';

export type Coin = {
  name: string;
  ticker: string;
  /** Folder under basicswap/interface/. */
  dir: string;
  /** Core version BasicSwap downloads, as in core.py. */
  version: string;
  segwit: boolean;
  /** Does the chain have scripts (and so secret-hash swaps)? */
  scripts: boolean;
  light?: 'Electrum' | 'Remote node';
  /** For a core.py without a use_segwit setting (Particl always uses it). */
  segwitDefault?: boolean;
};

export type CoinTable = { ref: string; coins: Coin[]; live: boolean };

// What doesn't come from core.py. Order is the docs table's.
export const COIN_LIST: Omit<Coin, 'version' | 'segwit'>[] = [
  { name: 'Particl', ticker: 'PART', dir: 'part', scripts: true, segwitDefault: true },
  { name: 'Bitcoin', ticker: 'BTC', dir: 'btc', scripts: true, light: 'Electrum' },
  { name: 'Litecoin', ticker: 'LTC', dir: 'ltc', scripts: true, light: 'Electrum' },
  { name: 'Monero', ticker: 'XMR', dir: 'xmr', scripts: false, light: 'Remote node' },
  { name: 'Wownero', ticker: 'WOW', dir: 'wow', scripts: false, light: 'Remote node' },
  { name: 'Bitcoin Cash', ticker: 'BCH', dir: 'bch', scripts: true },
  { name: 'Dash', ticker: 'DASH', dir: 'dash', scripts: true },
  { name: 'Decred', ticker: 'DCR', dir: 'dcr', scripts: true },
  { name: 'Dogecoin', ticker: 'DOGE', dir: 'doge', scripts: true },
  { name: 'Firo', ticker: 'FIRO', dir: 'firo', scripts: true },
  { name: 'Namecoin', ticker: 'NMC', dir: 'nmc', scripts: true },
  { name: 'PIVX', ticker: 'PIVX', dir: 'pivx', scripts: true },
];

/** Reads the bundled version and segwit use from a coin's core.py. */
export function parseCore(source: string, segwitDefault = false): { version: string; segwit: boolean } | null {
  const version = source.match(/^[A-Z_]*VERSION = os\.getenv\("[A-Z_]*VERSION", "([^"]+)"\)/m)?.[1];
  const segwit = source.match(/"use_segwit":\s*(True|False)/)?.[1];
  if (!version) return null;
  return { version, segwit: segwit ? segwit === 'True' : segwitDefault };
}

let cached: Promise<CoinTable> | undefined;

export function getCoinTable(): Promise<CoinTable> {
  cached ??= (async () => {
    try {
      const release = await getLatestRelease();
      const ref = release?.tag ?? snapshot.ref;
      const coins = await Promise.all(
        COIN_LIST.map(async (coin) => {
          const url = `https://raw.githubusercontent.com/${REPO}/${ref}/basicswap/interface/${coin.dir}/core.py`;
          const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
          if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
          const parsed = parseCore(await res.text(), coin.segwitDefault);
          if (!parsed) throw new Error(`${url}: no version found`);
          return { ...coin, ...parsed };
        }),
      );
      return { ref, coins, live: true };
    } catch (err) {
      console.warn(`[coins] Using the snapshot from ${snapshot.ref}: ${(err as Error).message}`);
      return { ref: snapshot.ref, coins: snapshot.coins as Coin[], live: false };
    }
  })();
  return cached;
}
