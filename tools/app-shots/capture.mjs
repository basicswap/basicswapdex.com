// Captures BasicSwap's real UI, served by server.py with example data, for the
// homepage app tour. For each scene (scenes.mjs) it loads the page in headless
// Chrome at 2x, saves the whole page once as the scene's base image, then
// plays the scene's steps (scroll, hover, click, type) and, at each snap,
// keeps only the part of the screen that differs from the base, as a patch
// placed in page coordinates. It also records where the elements the cursor
// aims at sit. Everything lands in src/assets/app-tour/ and tour.json.
//
//   node capture.mjs [MOCK_URL]        (default http://127.0.0.1:12799)
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, readdirSync, unlinkSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { SCENES, VIEW } from './scenes.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = join(ROOT, 'src/assets/app-tour');
const BASE_URL = process.argv[2] || 'http://127.0.0.1:12799';
const DPR = 2;
const PAD = 4; // css px around each patch
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- a minimal CDP client ------------------------------------------------------
// A fresh browser profile each run: the pages keep choices in localStorage
// (the last bid address, for one), which must not leak between captures.
const PROFILE = '/tmp/bsx-app-shots';
rmSync(PROFILE, { recursive: true, force: true });
const chrome = spawn('google-chrome', ['--headless=new', '--no-first-run', `--user-data-dir=${PROFILE}`, '--hide-scrollbars', '--force-color-profile=srgb', '--font-render-hinting=none', '--remote-debugging-port=9391', 'about:blank'], { stdio: 'ignore' });
let targets;
for (let i = 0; i < 60 && !targets; i++) {
  try {
    targets = await (await fetch('http://127.0.0.1:9391/json')).json();
  } catch {
    await sleep(250);
  }
}
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let seq = 0;
const pending = new Map();
const errors = [];
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails.exception?.description?.split('\n')[0]);
  if (pending.has(d.id)) {
    pending.get(d.id)(d);
    pending.delete(d.id);
  }
};
const send = (method, params = {}) => new Promise((r) => { pending.set(++seq, r); ws.send(JSON.stringify({ id: seq, method, params })); });
const evaluate = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.result?.exceptionDetails) throw new Error(`${expr.slice(0, 80)}: ${r.result.exceptionDetails.exception?.description}`);
  return r.result?.result?.value;
};
await send('Runtime.enable');
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: VIEW.w, height: VIEW.h, deviceScaleFactor: DPR, mobile: false });
await send('Page.addScriptToEvaluateOnNewDocument', {
  source: "try{localStorage.setItem('color-theme','dark')}catch(e){};document.documentElement.classList.add('dark');",
});
// no caret blink, no transitions mid-capture
const QUIET = `(() => { const s = document.createElement('style'); s.textContent = '*,*::before,*::after{transition:none!important;animation-duration:0s!important;caret-color:transparent!important}'; document.head.append(s); })()`;

// ---- page helpers the scenes use ----------------------------------------------
const page = {
  async goto(path, wait = 2500) {
    await send('Page.navigate', { url: BASE_URL + path });
    await sleep(wait);
    await evaluate(QUIET);
  },
  eval: evaluate,
  wait: sleep,
  /** The current scene's named scroll positions. */
  views: async () => current.views,
  async scroll(y) {
    await evaluate(`window.scrollTo(0, ${y}); 1`);
    await sleep(120);
  },
  /** An element's box in page coordinates (css px). */
  async rect(sel) {
    return evaluate(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY, w: r.width, h: r.height }; })()`);
  },
  async mouse(x, y, type = 'mouseMoved') {
    const sy = await evaluate('scrollY');
    await send('Input.dispatchMouseEvent', { type, x, y: y - sy, button: 'left', clickCount: type === 'mouseMoved' ? 0 : 1 });
  },
  async hover(sel) {
    const r = await page.rect(sel);
    if (!r) throw new Error(`no ${sel}`);
    await page.mouse(r.x + r.w / 2, r.y + r.h / 2);
    await sleep(150);
    return r;
  },
  async click(sel, wait = 400) {
    const r = await page.hover(sel);
    await page.mouse(r.x + r.w / 2, r.y + r.h / 2, 'mousePressed');
    await page.mouse(r.x + r.w / 2, r.y + r.h / 2, 'mouseReleased');
    await sleep(wait);
    await evaluate(QUIET);
    return r;
  },
  async type(text) {
    for (const ch of text) {
      await send('Input.dispatchKeyEvent', { type: 'keyDown', text: ch, key: ch });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key: ch });
    }
    await sleep(150);
  },
  async away() {
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 2, y: VIEW.h - 2 });
    await sleep(120);
  },
};

// ---- capture -------------------------------------------------------------------
async function shot(full) {
  if (full) {
    const { cssContentSize } = await send('Page.getLayoutMetrics').then((r) => r.result);
    const h = Math.ceil(cssContentSize.height);
    const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: VIEW.w, height: h, scale: 1 } });
    return { png: Buffer.from(r.result.data, 'base64'), h };
  }
  const r = await send('Page.captureScreenshot', { format: 'png' });
  return { png: Buffer.from(r.result.data, 'base64') };
}

/** Bounding box (device px) of pixels that differ between two raw RGBA images. */
function diffBox(a, b, w, h) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    const row = y * w * 4;
    for (let x = 0; x < w; x++) {
      const i = row + x * 4;
      if (Math.abs(a[i] - b[i]) > 6 || Math.abs(a[i + 1] - b[i + 1]) > 6 || Math.abs(a[i + 2] - b[i + 2]) > 6) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  return x1 < 0 ? null : { x0, y0, x1, y1 };
}

let current = null;
const ids = await (await fetch(`${BASE_URL}/mock/ids`)).json();
// Files are overwritten in place (and leftovers removed at the end) rather than
// the folder being recreated: a dev server's file watcher loses track of a
// deleted folder and keeps serving the old tour.json.
mkdirSync(OUT, { recursive: true });
const written = new Set(['tour.json']);
const tour = { view: VIEW, dpr: DPR, ids, scenes: {} };

for (const scene of SCENES) {
  console.log(`scene ${scene.id}`);
  const out = { base: null, height: 0, rects: {}, views: {}, snaps: {} };
  current = out;
  let baseRaw = null;
  let baseW = 0;
  const ctx = {
    page,
    ids,
    async base(maxHeight) {
      await page.away();
      const { png, h } = await shot(true);
      const height = Math.min(h, maxHeight || h);
      const img = sharp(png).extract({ left: 0, top: 0, width: VIEW.w * DPR, height: height * DPR });
      const file = `${scene.id}-base.webp`;
      await img.clone().webp({ quality: 78, smartSubsample: true }).toFile(join(OUT, file));
      written.add(file);
      const raw = await img.clone().raw().ensureAlpha().toBuffer({ resolveWithObject: true });
      baseRaw = raw.data;
      baseW = raw.info.width;
      out.base = file;
      out.height = height;
    },
    /** A named scroll position (clamped to the page). */
    async view(name, y) {
      const max = Math.max(0, out.height - VIEW.h);
      out.views[name] = Math.max(0, Math.min(max, Math.round(y)));
    },
    async rect(name, sel) {
      out.rects[name] = await page.rect(sel);
      if (!out.rects[name]) throw new Error(`${scene.id}: no element for ${name} (${sel})`);
    },
    /** Keep what differs from the base in the current viewport as `name`. */
    async snap(name) {
      const sy = Math.round(await evaluate('scrollY'));
      const { png } = await shot(false);
      const view = await sharp(png).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
      const W = view.info.width;
      const H = view.info.height;
      const top = sy * DPR;
      const rows = Math.min(H, baseRaw.length / (baseW * 4) - top);
      const baseRegion = baseRaw.subarray(top * baseW * 4, (top + rows) * baseW * 4);
      const box = diffBox(baseRegion, view.data, W, rows);
      if (!box) {
        console.log(`  ${name}: no change`);
        out.snaps[name] = null;
        return;
      }
      const p = PAD * DPR;
      const left = Math.max(0, box.x0 - p);
      const topPx = Math.max(0, box.y0 - p);
      const width = Math.min(W, box.x1 + p + 1) - left;
      const height = Math.min(rows, box.y1 + p + 1) - topPx;
      // even device edges, so the patch sits on whole css pixels
      const even = (v, up) => (up ? v + (v % 2) : v - (v % 2));
      const l2 = even(left, false), t2 = even(topPx, false);
      const w2 = Math.min(W, even(left + width, true)) - l2;
      const h2 = Math.min(rows - (rows % 2), even(topPx + height, true)) - t2;
      const file = `${scene.id}-${name}.webp`;
      await sharp(png).extract({ left: l2, top: t2, width: w2, height: h2 }).webp({ quality: 84, smartSubsample: true }).toFile(join(OUT, file));
      written.add(file);
      out.snaps[name] = { file, x: l2 / DPR, y: sy + t2 / DPR, w: w2 / DPR, h: h2 / DPR };
      console.log(`  ${name}: ${w2 / DPR}x${h2 / DPR} at ${l2 / DPR},${sy + t2 / DPR}`);
    },
  };
  await scene.run(ctx);
  tour.scenes[scene.id] = out;
}

writeFileSync(join(OUT, 'tour.json'), JSON.stringify(tour, null, 2));
for (const f of readdirSync(OUT)) if (!written.has(f)) unlinkSync(join(OUT, f));
if (errors.length) console.log('page errors:\n ' + [...new Set(errors)].join('\n '));
ws.close();
chrome.kill();
