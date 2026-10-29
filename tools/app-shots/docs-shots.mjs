// Screenshots for the docs, taken from BasicSwap's real UI served by
// server.py with example data, so no wallet or funds are involved. Each shot
// loads a page in headless Chrome at 2x and saves the part from the page's
// header down to the element the guide is about, as WebP, into
// src/content/docs/images/. Re-run after a BasicSwap release changes the UI:
//
//   python3 server.py ../basicswap 12799     (in another terminal; needs Jinja2)
//   node tools/app-shots/docs-shots.mjs [MOCK_URL]   (ONLY=smart-buy,wallets for a subset)
import { spawn } from 'node:child_process';
import { rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = join(ROOT, 'src/content/docs/images');
const BASE_URL = process.argv[2] || 'http://127.0.0.1:12799';
const VIEW = { w: 1440, h: 1000 };
const DPR = 2;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const ids = await (await fetch(`${BASE_URL}/mock/ids`)).json();

// name: the file (docs-<name>.webp); from/to: selectors bounding the crop;
// maxHeight: a cap in CSS pixels; prepare: script run before the capture.
const SHOTS = [
  { name: 'order-book', path: '/offers', from: 'section.py-3', to: 'tbody tr:nth-child(6)', wait: 4500 },
  { name: 'new-offer-trade', path: '/newoffer', from: 'section.py-3', to: '#form' },
  { name: 'new-offer-terms', path: '/newoffer?step=terms', from: 'section.py-3', to: '#form' },
  { name: 'send-bid', path: `/offer/${ids.offer}?bid=1`, from: '#bidForm', to: 'button[name=sendbid]', wait: 3500 },
  { name: 'bid-progress', path: `/bid/${ids.bid}?step=3`, from: 'section.py-3', to: 'table', wait: 3000 },
  {
    name: 'smart-buy',
    path: '/smartbuy?defaults=real',
    from: 'section.py-3',
    to: '#sb-panel-buy',
    wait: 3500,
    // Pay Bitcoin for Monero and preview, so the shot shows a filled plan.
    // Smart Buy names its selects from the offer's side: coin_to is what you
    // pay. 0.30 BTC is what the example plan costs.
    prepare: `const pick = (id, name) => { const s = document.getElementById(id); s.value = [...s.options].find((o) => o.text === name).value; s.dispatchEvent(new Event('change', { bubbles: true })); }; pick('coin_to', 'Bitcoin'); pick('coin_from', 'Monero'); const a = document.getElementById('pay_amount'); a.value = '0.30'; a.dispatchEvent(new Event('input', { bubbles: true })); document.getElementById('previewBtn').click();`,
  },
  { name: 'wallets', path: '/wallets', from: 'section.py-3', to: 'section.py-4', wait: 3000, maxHeight: 1030 },
];

const PROFILE = '/tmp/bsx-docs-shots';
rmSync(PROFILE, { recursive: true, force: true });
const chrome = spawn(
  'google-chrome',
  ['--headless=new', '--no-first-run', `--user-data-dir=${PROFILE}`, '--hide-scrollbars', '--force-color-profile=srgb', '--remote-debugging-port=9393', 'about:blank'],
  { stdio: 'ignore' },
);
let targets;
for (let i = 0; i < 60 && !targets; i++) {
  try {
    targets = await (await fetch('http://127.0.0.1:9393/json')).json();
  } catch {
    await sleep(250);
  }
}
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let seq = 0;
const pending = new Map();
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  // A page alert would block every later evaluate, so dismiss it.
  if (d.method === 'Page.javascriptDialogOpening') send('Page.handleJavaScriptDialog', { accept: true });
  if (pending.has(d.id)) {
    pending.get(d.id)(d);
    pending.delete(d.id);
  }
};
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++seq;
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`${method} timed out`));
    }, 20000);
    pending.set(id, (d) => {
      clearTimeout(timer);
      resolve(d);
    });
    ws.send(JSON.stringify({ id, method, params }));
  });
const evaluate = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.result?.value;

await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: VIEW.w, height: VIEW.h, deviceScaleFactor: DPR, mobile: false });
await send('Page.addScriptToEvaluateOnNewDocument', {
  source: "try{localStorage.setItem('color-theme','dark')}catch(e){};document.documentElement.classList.add('dark');",
});

const only = process.env.ONLY?.split(',');
for (const shot of SHOTS.filter((s) => !only || only.includes(s.name))) {
  try {
    await capture(shot);
  } catch (err) {
    console.error(`${shot.name}: ${err.message}`);
  }
}

ws.close();
chrome.kill();

async function capture(shot) {
  await send('Page.navigate', { url: BASE_URL + shot.path });
  await sleep(shot.wait ?? 2500);
  if (shot.prepare) {
    await evaluate(`(() => { ${shot.prepare} })()`);
    await sleep(2500);
  }
  await evaluate(`(() => { const s = document.createElement('style'); s.textContent = '*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}'; document.head.append(s); })()`);
  const box = await evaluate(`(() => {
    const a = document.querySelector(${JSON.stringify(shot.from)});
    // The last visible match, so a hidden template table can't end the crop.
    const b = [...document.querySelectorAll(${JSON.stringify(shot.to)})].filter((e) => e.getClientRects().length).at(-1);
    if (!a || !b) return null;
    const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    return { y: Math.max(0, ra.top + scrollY - 8), bottom: rb.bottom + scrollY + 24 };
  })()`);
  if (!box || box.bottom <= box.y) {
    console.error(`${shot.name}: selector not found`);
    return;
  }
  const height = Math.min(box.bottom - box.y, shot.maxHeight ?? 2400);
  const shotRes = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
    clip: { x: 0, y: box.y, width: VIEW.w, height, scale: 1 },
  });
  const file = join(OUT, `docs-${shot.name}.webp`);
  await sharp(Buffer.from(shotRes.result.data, 'base64')).webp({ quality: 88 }).toFile(file);
  console.log(`docs-${shot.name}.webp  ${VIEW.w}x${Math.round(height)}`);
}
