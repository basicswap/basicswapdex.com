// The swap's progress, along the bottom of the screen in a card like the
// site's. It appears when the swap starts (the key split), fills in step by
// step, and stays on top through the ribbon hand-offs, so a viewer can always
// see where in the swap they are. The walk-off scene swaps in amber tracks
// for the two failure paths. Draw it in screen space.
import { C, clamp, lerp } from './ink.js';

export const SWAP = ['Keys split', 'Refunds signed', 'Bitcoin locked', 'Monero locked', 'Seller claims BTC', 'You claim XMR'];
export const SELLER_LEAVES = ['Both locked', 'Seller walks off', 'Timelock ends', 'Your BTC back', 'Seller takes XMR back'];
export const YOU_LEAVE = ['Both locked', 'Timelock ends', 'Refund unclaimed', 'Second timelock', 'Seller takes BTC', 'Mercy: XMR to you'];

const X0 = 300, X1 = 1620, Y0 = 968, Y1 = 1046;
const N0 = 620, N1 = 1540, NY = 1022;

// o: { steps, p (0..steps.length, how many are done; fractions fill the line
// toward the next), title, accent (a CSS colour), alpha }
export function timeline(ctx, s, o) {
  const a = clamp(o.alpha ?? 1);
  if (a <= 0) return;
  const steps = o.steps, n = steps.length;
  const p = clamp(o.p ?? 0, 0, n);
  const accent = o.accent ?? C.brand;
  const nx = (i) => (n === 1 ? N0 : lerp(N0, N1, i / (n - 1)));
  ctx.save();
  ctx.globalAlpha *= a;

  // the card
  ctx.fillStyle = 'rgba(17,24,39,0.9)';
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(X0, Y0, X1 - X0, Y1 - Y0, 12);
  ctx.fill();
  ctx.stroke();

  // the title on the left, the site's kicker style
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(X0 + 24, NY - 6);
  ctx.lineTo(X0 + 44, NY - 6);
  ctx.stroke();
  ctx.fillStyle = C.link;
  ctx.font = '400 18px "JetBrains Mono"';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(o.title ?? 'Swap progress', X0 + 54, NY - 5);

  // the track, then the filled part
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(nx(0), NY);
  ctx.lineTo(nx(n - 1), NY);
  ctx.stroke();
  const reach = p <= 1 ? nx(0) : lerp(nx(0), nx(n - 1), Math.min(1, (p - 1) / (n - 1)));
  if (reach > nx(0)) {
    const g = ctx.createLinearGradient(nx(0), 0, nx(n - 1), 0);
    g.addColorStop(0, accent);
    g.addColorStop(1, o.accent ? accent : C.violet);
    ctx.strokeStyle = g;
    ctx.beginPath();
    ctx.moveTo(nx(0), NY);
    ctx.lineTo(reach, NY);
    ctx.stroke();
  }

  // the steps
  steps.forEach((label, i) => {
    const x = nx(i);
    const done = p >= i + 1;
    const current = !done && Math.floor(p) === i;
    if (done) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const gl = ctx.createRadialGradient(x, NY, 0, x, NY, 26);
      gl.addColorStop(0, accent);
      gl.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha *= 0.45;
      ctx.fillStyle = gl;
      ctx.fillRect(x - 26, NY - 26, 52, 52);
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(x, NY, 8, 0, Math.PI * 2);
    ctx.fillStyle = done ? accent : '#111827';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = done ? accent : current ? C.link : '#4B5563';
    ctx.stroke();
    if (current) {
      const pulse = (s.T * 1.2) % 1;
      ctx.save();
      ctx.globalAlpha *= 1 - pulse;
      ctx.strokeStyle = C.link;
      ctx.beginPath();
      ctx.arc(x, NY, 8 + pulse * 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = done ? '#E5E7EB' : current ? C.link : '#6B7280';
    ctx.font = '400 15px "JetBrains Mono"';
    ctx.textAlign = 'center';
    // keep every label inside the card, however long it is
    const half = ctx.measureText(label).width / 2;
    const lx = Math.min(X1 - 18 - half, Math.max(X0 + 18 + half, x));
    ctx.fillText(label, lx, NY - 30);
  });
  ctx.restore();
}

// A step count that ticks over at the given times: [[t, p], ...] eases each
// change over 0.4 s.
export function progress(t, start, marks) {
  let p = start;
  for (const [at, to] of marks) p = lerp(p, to, clamp((t - at) / 0.4));
  return p;
}
