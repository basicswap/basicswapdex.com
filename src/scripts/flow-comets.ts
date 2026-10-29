// The Protocol hero's comets (src/components/backdrops/ProtocolBackdrop.astro):
// messages travelling the flow lines, drawn into a canvas over the still SVG.
// Each frame draws only the comets' short segments (a tail fading in towards
// a bright head with a soft glow), which keeps it at full frame rate where
// animating dashes along the SVG's long curves did not.
//
// The canvas maps the art's W x H frame like the SVG's "xMidYMid slice", so
// the comets sit on their lines. Frames run only while the hero is on screen;
// with reduced motion one frame is drawn and held.

export {};

type Comet = { pts: [number, number][]; dur: number; delay: number; w: number; op: number; tail: number };

/** The comets, read from the still lines they run along (data-comets: "dur,delay;…"). */
function readComets(root: Element): Comet[] {
  return [...root.querySelectorAll<SVGPolylineElement>('polyline[data-comets]')].flatMap((line) => {
    const list = line.dataset.comets;
    if (!list) return [];
    const pts = line
      .getAttribute('points')!
      .trim()
      .split(/\s+/)
      .map((p) => p.split(',').map(Number) as [number, number]);
    const w = Number(line.dataset.w);
    const op = Number(line.dataset.op);
    const tail = Number(line.dataset.tail);
    return list.split(';').map((c) => {
      const [dur, delay] = c.split(',').map(Number);
      return { pts, dur, delay, w, op, tail };
    });
  });
}

/** A soft round glow, drawn once and stamped for every head. */
function glowSprite() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(147, 197, 253, 0.9)');
  grad.addColorStop(0.35, 'rgba(59, 130, 246, 0.35)');
  grad.addColorStop(1, 'rgba(0, 115, 255, 0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return c;
}

// blue (#60a5fa) on the left to violet (#c084fc) on the right
const tint = (x: number, W: number, a: number) => {
  const t = Math.max(0, Math.min(1, x / W));
  return `rgba(${Math.round(96 + 96 * t)}, ${Math.round(165 - 33 * t)}, ${Math.round(250 + 2 * t)}, ${a.toFixed(3)})`;
};

function play(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const W = Number(canvas.dataset.w);
  const H = Number(canvas.dataset.h);
  const comets = readComets(canvas.parentElement!);
  const glow = glowSprite();

  // each line's cumulative lengths, for placing points along it
  const lines = comets.map((c) => {
    const len = [0];
    for (let i = 1; i < c.pts.length; i++) {
      const [x0, y0] = c.pts[i - 1];
      const [x1, y1] = c.pts[i];
      len.push(len[i - 1] + Math.hypot(x1 - x0, y1 - y0));
    }
    return { ...c, len, L: len[len.length - 1] };
  });
  const at = (l: (typeof lines)[number], s: number): [number, number] => {
    if (s <= 0) return l.pts[0];
    if (s >= l.L) return l.pts[l.pts.length - 1];
    let lo = 0;
    let hi = l.len.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (l.len[mid] <= s) lo = mid;
      else hi = mid;
    }
    const f = (s - l.len[lo]) / (l.len[hi] - l.len[lo] || 1);
    const [x0, y0] = l.pts[lo];
    const [x1, y1] = l.pts[hi];
    return [x0 + (x1 - x0) * f, y0 + (y1 - y0) * f];
  };

  let scale = 1;
  const fit = () => {
    const dpr = window.devicePixelRatio || 1;
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) {
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
    }
    scale = Math.max(cw / W, ch / H);
    const ox = (cw - W * scale) / 2;
    const oy = (ch - H * scale) / 2;
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * ox, dpr * oy);
  };

  const SEG = 10; // tail segments
  function draw(ms: number) {
    fit();
    ctx!.save();
    ctx!.setTransform(1, 0, 0, 1, 0, 0);
    ctx!.clearRect(0, 0, canvas.width, canvas.height);
    ctx!.restore();
    ctx!.lineCap = 'round';
    const t = ms / 1000;
    for (const l of lines) {
      const tailLen = l.L * l.tail;
      const p = ((((t - l.delay) / l.dur) % 1) + 1) % 1;
      const head = p * (l.L + tailLen);
      // the tail, fading in towards the head
      ctx!.lineWidth = l.w * 1.6;
      let prev = at(l, head - tailLen);
      for (let i = 1; i <= SEG; i++) {
        const s = head - tailLen + (tailLen * i) / SEG;
        const pt = at(l, s);
        if (s > 0 && s - tailLen / SEG < l.L) {
          ctx!.strokeStyle = tint(pt[0], W, l.op * (i / SEG) * 0.9);
          ctx!.beginPath();
          ctx!.moveTo(prev[0], prev[1]);
          ctx!.lineTo(pt[0], pt[1]);
          ctx!.stroke();
        }
        prev = pt;
      }
      // the head and its glow
      if (head > 0 && head < l.L) {
        const [hx, hy] = at(l, head);
        const r = l.w * 7;
        ctx!.globalAlpha = l.op * 0.8;
        ctx!.drawImage(glow, hx - r, hy - r, r * 2, r * 2);
        ctx!.globalAlpha = l.op;
        ctx!.fillStyle = '#e0ecff';
        ctx!.beginPath();
        ctx!.arc(hx, hy, l.w * 1.25, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.globalAlpha = 1;
      }
    }
  }

  const still = window.matchMedia('(prefers-reduced-motion: reduce)');
  let raf = 0;
  let visible = false;
  const frame = (ms: number) => {
    draw(still.matches ? 3000 : ms);
    raf = visible && !still.matches ? requestAnimationFrame(frame) : 0;
  };
  const start = () => {
    if (!raf) raf = requestAnimationFrame(frame);
  };
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) start();
  }).observe(canvas);
  new ResizeObserver(start).observe(canvas);
  still.addEventListener('change', start);
}

document.querySelectorAll<HTMLCanvasElement>('canvas.comets[data-w]').forEach(play);
