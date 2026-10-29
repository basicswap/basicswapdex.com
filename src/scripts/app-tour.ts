// The homepage app tour's player (src/components/tour/AppTour.astro): draws
// each frame of the film into a canvas from the timeline in data-tour.
//
// Why a canvas: the images are resampled every frame at that frame's zoom with
// high-quality smoothing (mipmapped), so text stays anti-aliased while the
// camera moves. CSS-scaled layers are rasterised once and shrunk on the GPU
// with plain bilinear filtering, which ripples small text as the zoom changes.
//
// Time comes from a CSS-animated clock element, so the canvas, the tabs and
// the address bar share one loop; picking a tab restarts it for all of them.
// The first page's images load with the tour and each later page's a few
// seconds before the loop reaches it, so the homepage doesn't fetch the whole
// film up front; pointing at or focusing the tabs loads the rest, ready for a
// jump. Frames are drawn only while the tour is on screen. With reduced
// motion, the first frame is drawn and held.

type Frames = [number, ...number[]][];
type Patch = { src: string; x: number; y: number; w: number; h: number; win: [number, number, number] };
type Page = { id: string; base: { src: string; h: number }; win: [number, number]; scroll: [number, number][]; patches: Patch[] };
type Tour = {
  W: number;
  H: number;
  loop: number;
  fade: number;
  pages: Page[];
  cursor: [number, number, number][];
  presses: number[];
  ripples: [number, number, number][];
  camera: [number, number, number, number][];
};

/** CSS cubic-bezier easing. */
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const a = (p1: number, p2: number) => 1 - 3 * p2 + 3 * p1;
  const b = (p1: number, p2: number) => 3 * p2 - 6 * p1;
  const c = (p1: number) => 3 * p1;
  const at = (t: number, p1: number, p2: number) => ((a(p1, p2) * t + b(p1, p2)) * t + c(p1)) * t;
  const slope = (t: number, p1: number, p2: number) => 3 * a(p1, p2) * t * t + 2 * b(p1, p2) * t + c(p1);
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const d = at(t, x1, x2) - x;
      const s = slope(t, x1, x2);
      if (Math.abs(d) < 1e-6 || s === 0) break;
      t -= d / s;
    }
    return at(Math.min(1, Math.max(0, t)), y1, y2);
  };
}
const EASE = {
  scroll: bezier(0.45, 0, 0.25, 1),
  cursor: bezier(0.55, 0, 0.2, 1),
  camera: bezier(0.65, 0, 0.35, 1),
  out: bezier(0, 0, 0.58, 1),
};

/** Values at time t, easing between neighbouring keyframes and holding outside them. */
function sample(frames: Frames, t: number, ease: (p: number) => number): number[] {
  if (t <= frames[0][0]) return frames[0].slice(1);
  const last = frames[frames.length - 1];
  if (t >= last[0]) return last.slice(1);
  let i = 0;
  while (frames[i + 1][0] <= t) i++;
  const [t0, ...a] = frames[i];
  const [t1, ...b] = frames[i + 1];
  const p = ease(t1 > t0 ? (t - t0) / (t1 - t0) : 1);
  return a.map((v, k) => v + (b[k] - v) * p);
}

/** Shown over [a, b], fading in and out over f (no fade out at the loop's end). */
function shown(t: number, a: number, b: number, f: number, loop: number) {
  if (a > 0 && t < a) return Math.max(0, 1 - (a - t) / f);
  if (t <= b) return t >= a ? 1 : 0;
  if (b >= loop) return 1;
  return Math.max(0, 1 - (t - b) / f);
}

/** The cursor, tip at (0, 0), in its own 12 x 18 units. */
const CURSOR = new Path2D('M0 0 L0 15.5 L4 11.8 L6.7 18 L9.4 16.8 L6.8 10.8 L12 10.6 Z');

function play(view: HTMLElement) {
  const tour: Tour = JSON.parse(view.dataset.tour!);
  const canvas = view.querySelector('canvas')!;
  const clock = view.querySelector<HTMLElement>('.clock')!;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return;
  const { W, H, loop } = tour;

  // ---- images: each page's set loaded shortly before it plays ----
  const images = new Map<string, HTMLImageElement>();
  const ready = (src: string) => {
    const img = images.get(src);
    return img && img.complete && img.naturalWidth ? img : null;
  };
  const load = (src: string) => {
    if (images.has(src)) return;
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
    images.set(src, img);
  };
  const loadPage = (page: Page) => {
    load(page.base.src);
    page.patches.forEach((p) => load(p.src));
  };
  const loadAll = () => tour.pages.forEach(loadPage);
  // Seconds of look-ahead: enough for a page's images to arrive on a slow
  // connection before it fades in.
  const AHEAD = 6;
  const loadNear = (t: number) => {
    for (const page of tour.pages) {
      const until = (page.win[0] - t + loop) % loop;
      if (until <= AHEAD || (t >= page.win[0] && t <= page.win[1])) loadPage(page);
    }
  };
  loadPage(tour.pages[0]);

  // ---- time: the CSS clock's place in the loop ----
  const now = () => {
    const anim = clock.getAnimations()[0];
    const p = anim?.effect?.getComputedTiming().progress;
    return typeof p === 'number' ? p * loop : 0;
  };

  // keyframes, in the sampler's shape
  const camera: Frames = tour.camera;
  const cursor: Frames = tour.cursor;
  const fadeAll: Frames = [[0, 0], [0.4, 1], [loop - 0.4, 1], [loop, 0]];
  const press = (t: number) => {
    for (const c of tour.presses) {
      if (t >= c - 0.1 && t < c) return 1 - 0.18 * EASE.out((t - (c - 0.1)) / 0.1);
      if (t >= c && t < c + 0.16) return 0.82 + 0.18 * EASE.out((t - c) / 0.16);
    }
    return 1;
  };

  // ---- size: the canvas matches the box in device pixels ----
  let k = 1;
  const fit = () => {
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(view.clientWidth * dpr);
    const h = Math.round(view.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    k = w / W;
  };

  let drawn = false;
  function draw(t: number) {
    const all = sample(fadeAll, t, (p) => p)[0];
    // After a jump to a page whose images are still on their way, hold the
    // last frame rather than flash an empty one.
    const waiting = tour.pages.some((page) => shown(t, page.win[0], page.win[1], tour.fade, loop) * all > 0 && !ready(page.base.src));
    if (waiting && drawn) return;
    drawn ||= !waiting;
    fit();
    ctx!.setTransform(1, 0, 0, 1, 0, 0);
    ctx!.globalAlpha = 1;
    ctx!.fillStyle = '#1f2937';
    ctx!.fillRect(0, 0, canvas.width, canvas.height);
    ctx!.imageSmoothingEnabled = true;
    ctx!.imageSmoothingQuality = 'high';

    const [tx, ty, z] = sample(camera, t, EASE.camera);
    ctx!.setTransform(k * z, 0, 0, k * z, k * tx, k * ty);
    // what the camera sees, in page-view coordinates
    const vx = -tx / z;
    const vy = -ty / z;
    const vw = W / z;
    const vh = H / z;

    for (const page of tour.pages) {
      const a = shown(t, page.win[0], page.win[1], tour.fade, loop) * all;
      if (a <= 0) continue;
      const base = ready(page.base.src);
      if (!base) continue;
      const sy = sample(page.scroll, t, EASE.scroll)[0];
      const r = base.naturalWidth / W; // image pixels per capture pixel
      const y0 = Math.max(0, sy + vy);
      const y1 = Math.min(page.base.h, sy + vy + vh);
      ctx!.globalAlpha = a;
      if (y1 > y0) ctx!.drawImage(base, vx * r, y0 * r, vw * r, (y1 - y0) * r, vx, y0 - sy, vw, y1 - y0);
      for (const p of page.patches) {
        const pa = shown(t, p.win[0], p.win[1], p.win[2], loop);
        const img = pa > 0 ? ready(p.src) : null;
        if (!img) continue;
        ctx!.globalAlpha = a * pa;
        ctx!.drawImage(img, p.x, p.y - sy, p.w, p.h);
      }
    }

    // clicks ring out where the cursor presses
    ctx!.globalAlpha = 1;
    for (const [c, x, y] of tour.ripples) {
      if (t < c || t > c + 0.5) continue;
      const p = EASE.out((t - c) / 0.5);
      ctx!.globalAlpha = 0.9 * (1 - p) * all;
      ctx!.beginPath();
      ctx!.arc(x, y, 16 * (0.3 + 1.5 * p), 0, Math.PI * 2);
      ctx!.lineWidth = 2.4;
      ctx!.strokeStyle = '#fff';
      ctx!.stroke();
    }

    // the cursor rides the camera, like the page
    const [cx, cy] = sample(cursor, t, EASE.cursor);
    const s = 1.7 * press(t);
    ctx!.globalAlpha = all;
    ctx!.save();
    ctx!.translate(cx, cy);
    ctx!.scale(s, s);
    ctx!.shadowColor = 'rgb(0 0 0 / 0.5)';
    ctx!.shadowBlur = 3 * k * z * s;
    ctx!.shadowOffsetY = 2 * k * z * s;
    ctx!.fillStyle = '#fff';
    ctx!.fill(CURSOR);
    ctx!.shadowColor = 'transparent';
    ctx!.lineWidth = 1.3 / s;
    ctx!.lineJoin = 'round';
    ctx!.strokeStyle = '#111827';
    ctx!.stroke(CURSOR);
    ctx!.restore();
  }

  // ---- run: frames only while on screen; held still with reduced motion ----
  const still = window.matchMedia('(prefers-reduced-motion: reduce)');
  let raf = 0;
  let visible = false;
  const frame = () => {
    const t = still.matches ? 0 : now();
    loadNear(t);
    draw(t);
    raf = visible && !still.matches ? requestAnimationFrame(frame) : 0;
  };
  const start = () => {
    if (!raf) raf = requestAnimationFrame(frame);
  };

  const tabs = view.closest('.tour')?.querySelector('.tabs');
  tabs?.addEventListener('pointerover', loadAll, { once: true });
  view.closest('.tour')?.addEventListener('focusin', loadAll, { once: true });
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) start();
  }).observe(view);
  new ResizeObserver(() => start()).observe(view);
  still.addEventListener('change', start);
  images.get(tour.pages[0].base.src)!.addEventListener('load', start);

  view.classList.add('live');
  start();
}

document.querySelectorAll<HTMLElement>('.view[data-tour]').forEach(play);
