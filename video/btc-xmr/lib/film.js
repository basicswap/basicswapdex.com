// Things every scene uses: the ribbon hand-off at both ends, the screen-space
// finish (vignette, kicker, ribbons), and helpers for moving characters.
import { clamp, lerp, lerpPt, seg } from './ink.js';
import { transition } from './transitions.js';
import { onScreen, vignette, kicker } from './night.js';
import { timeline } from './timeline.js';
import { subtitles } from './subtitles.js';

// Every scene opens on the ribbon carrying on up and out of the frame, and
// ends on the next stretch of it rising in from below, with the camera
// following it. The shader's phase runs continuously across the cut.
export const RIBBON_IN = 1.25, RIBBON_OUT = 1.3;

// Which transition the film uses between sections; see transitions.js.
export const TRANSITION = 'pan';

// The film's major sections. The whip pan only plays where one section
// hands over to the next; inside a section the scenes crossfade (set per
// scene with {transition=fade} in script.md).
//   the problem: open, locks          the setup: split, refunds
//   the swap: btc-lock, xmr-lock, claim, vault
//   the edge cases: walk-off          the outro
const OPENS_SECTION = new Set(['split', 'btc-lock', 'walk-off', 'outro']);
const CLOSES_SECTION = new Set(['locks', 'refunds', 'vault', 'walk-off']);
export const opensSection = (s) => OPENS_SECTION.has(s.id);
export const closesSection = (s) => CLOSES_SECTION.has(s.id);

export function ribbonIn(s, ctx) {
  transition(TRANSITION, ctx, s, 1 - seg(s.t, 0, RIBBON_IN, 'inOut'), 'in');
}

export function ribbonOut(s, ctx) {
  transition(TRANSITION, ctx, s, seg(s.t, s.dur - RIBBON_OUT, RIBBON_OUT, 'inOut'), 'out');
}

// The screen-space layer every scene ends with. o.in / o.out turn the ribbon
// hand-offs off for the first and last scenes, and o.timeline ({ steps, p,
// title, accent, alpha }) draws the swap progress on top of everything, with
// the subtitles above it.
export function finish(s, ctx, cam, label, o = {}) {
  const tOut = s.dur - RIBBON_OUT;
  const hasIn = o.in !== false && opensSection(s), hasOut = o.out !== false && closesSection(s);
  onScreen(ctx, cam, () => {
    vignette(ctx);
    if (label) kicker(ctx, label, seg(s.t, hasIn ? RIBBON_IN : 0.2, 0.6) * (hasOut ? 1 - seg(s.t, tOut - 0.4, 0.4) : 1));
    if (o.extra) o.extra();
    if (hasIn) ribbonIn(s, ctx);
    if (hasOut) ribbonOut(s, ctx);
    if (o.timeline) timeline(ctx, s, o.timeline);
    // subtitles sit just above the progress card, or lower without it
    if (o.subtitles !== false) subtitles(ctx, s, o.timeline && (o.timeline.alpha ?? 1) > 0.5 ? 924 : 990);
  });
}

// The camera's last move: whip right along the incoming ribbon.
// The camera's last move in a scene: a gentle push-in. Where a section
// ends, the whip pan itself moves the picture (transitions.js).
export const whip = (s, from = { x: 965, y: 560 }) =>
  ({ at: s.dur - RIBBON_OUT, x: from.x, y: from.y, zoom: 1.45, dur: RIBBON_OUT, ease: 'inOut' });

// A value that moves through steps: [at, to, dur, ease]. Works for numbers
// and [x, y] points. Takes the time, so it can be asked about any moment.
export function moves(t, start, steps) {
  let v = start;
  for (const [at, to, dur = 0.4, e = 'inOut'] of steps) {
    const p = seg(t, at, dur, e);
    v = Array.isArray(v) ? lerpPt(v, to, p) : lerp(v, to, p);
  }
  return v;
}

// Speed (px/s) of a position function at time t.
export const speed = (fx, t) => Math.abs(fx(t) - fx(t - 1 / 30)) * 30;

// Leg cycle for a character whose x is fx(t): feet keep pace with the ground.
export const gait = (fx, t, stepLen = 46, run = 260) => ({ walk: fx(t) / stepLen, stride: clamp(speed(fx, t) / run) });

// 1 after time a, 0 before.
export const after = (t, a) => (t > a ? 1 : 0);

// Pick a face from a list of [from-time, face] entries; the latest that has
// started wins.
export function faceAt(t, base, list) {
  let f = base;
  for (const [at, face] of list) if (t >= at) f = face;
  return f;
}
