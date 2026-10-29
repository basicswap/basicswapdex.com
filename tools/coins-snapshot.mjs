// Refreshes src/data/coins.json, the fallback for the docs' coin table
// (src/lib/coins.ts), from basicswap at a release tag. Run after a release:
//
//   node tools/coins-snapshot.mjs [TAG]              (default: latest release)
//   node tools/coins-snapshot.mjs --local PATH       (a basicswap checkout)
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO = 'basicswap/basicswap';
// Keep in step with COIN_LIST in src/lib/coins.ts.
const COINS = [
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

function parseCore(source, segwitDefault = false) {
  const version = source.match(/^[A-Z_]*VERSION = os\.getenv\("[A-Z_]*VERSION", "([^"]+)"\)/m)?.[1];
  const segwit = source.match(/"use_segwit":\s*(True|False)/)?.[1];
  if (!version) throw new Error('no version found');
  return { version, segwit: segwit ? segwit === 'True' : segwitDefault };
}

let ref;
let read;
if (process.argv[2] === '--local') {
  const repo = process.argv[3];
  ref = execFileSync('git', ['-C', repo, 'describe', '--tags', '--exact-match'], { encoding: 'utf8' }).trim();
  read = async (dir) => readFileSync(join(repo, 'basicswap/interface', dir, 'core.py'), 'utf8');
} else {
  ref = process.argv[2] ?? (await (await fetch(`https://api.github.com/repos/${REPO}/releases/latest`)).json()).tag_name;
  read = async (dir) => {
    const res = await fetch(`https://raw.githubusercontent.com/${REPO}/${ref}/basicswap/interface/${dir}/core.py`);
    if (!res.ok) throw new Error(`${dir}: HTTP ${res.status}`);
    return res.text();
  };
}

const coins = [];
for (const coin of COINS) coins.push({ ...coin, ...parseCore(await read(coin.dir), coin.segwitDefault) });
writeFileSync('src/data/coins.json', `${JSON.stringify({ ref, coins }, null, 2)}\n`);
console.log(`src/data/coins.json: ${coins.length} coins at ${ref}`);
