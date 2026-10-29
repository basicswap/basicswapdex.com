// Timeline helpers for the app films: every moving part of a film is written
// as timed states in seconds, then compiled into CSS keyframes on one shared
// loop, so the cursor, clicks and screen changes can never drift apart.

/** [seconds, CSS declarations] — the value holds until the next entry. */
export type Step = [number, string];

/**
 * Modes: how films share one timeline behind tabs. Each tab has two radios
 * (`x` and `x2`) and its label always targets the one that is not checked,
 * so every click is a real change. Each radio gets its own copy of the
 * keyframes: swapping keyframes restarts the loop, at the delay that starts
 * it on that tab's film (see AppTour and SwapTour).
 */
const PLAIN = [{ when: '', delay: 0, suffix: '' }];

export class Film {
  private rules: string[] = [];

  constructor(
    /** Root selector the rules are scoped to. */
    private scope: string,
    /** This film's length in seconds. */
    readonly duration: number,
    /** Where this film sits on the shared loop, and the loop's length. */
    private offset = 0,
    private loop = duration,
    /** The page states it plays under; one plain mode for a lone film. */
    private modes: { when: string; delay: number; suffix: string }[] = PLAIN,
  ) {}

  private pct(t: number) {
    const at = Math.min(Math.max(t, 0), this.duration) + this.offset;
    return +((at / this.loop) * 100).toFixed(3);
  }

  /** Animate `selector` through `steps`, easing between neighbouring entries. */
  track(name: string, selector: string, steps: Step[], easing = 'cubic-bezier(0.45, 0, 0.25, 1)') {
    const s = [...steps].sort((a, b) => a[0] - b[0]);
    if (s[0][0] > 0) s.unshift([0, s[0][1]]);
    if (s[s.length - 1][0] < this.duration) s.push([this.duration, s[s.length - 1][1]]);
    const frames = s.map(([t, d]) => `${this.pct(t)}%{${d}}`);
    // Outside its own stretch of the shared loop, the film holds still.
    if (this.offset > 0) frames.unshift(`0%{${s[0][1]}}`);
    if (this.offset + this.duration < this.loop) frames.push(`100%{${s[s.length - 1][1]}}`);
    const id = `${this.scope.replace(/[^a-z0-9]/gi, '')}-${name}`;
    for (const { when, delay, suffix } of this.modes) {
      this.rules.push(
        `@keyframes ${id}${suffix}{${frames.join('')}}`,
        `${when ? `${when} ` : ''}${this.scope} ${selector}{animation:${id}${suffix} ${this.loop}s ${easing} ${delay}s infinite}`,
      );
    }
    return this;
  }

  /** Shown during each [from, to] window, with a short fade at both ends. */
  show(name: string, selector: string, windows: [number, number][], fade = 0.25) {
    const steps: Step[] = [[0, 'opacity:0']];
    for (const [a, b] of windows) {
      steps.push([Math.max(0, a - fade), 'opacity:0'], [a, 'opacity:1'], [b, 'opacity:1']);
      // A window that runs to the end of the film stays shown to the end.
      if (b < this.duration) steps.push([Math.min(this.duration, b + fade), 'opacity:0']);
    }
    return this.track(name, selector, steps, 'linear');
  }

  /**
   * The cursor: `path` is a list of [seconds, x, y] stops (repeat a point to
   * hold there); `clicks` are the moments it presses.
   */
  cursor(path: [number, number, number][], clicks: number[]) {
    this.track('cursor', '.cursor', path.map(([t, x, y]) => [t, `translate:${x}px ${y}px`]), 'cubic-bezier(0.55, 0, 0.2, 1)');
    const press: Step[] = [[0, 'scale:1']];
    for (const c of clicks) press.push([c - 0.1, 'scale:1'], [c, 'scale:0.82'], [c + 0.16, 'scale:1']);
    this.track('press', '.cursor-tip', press, 'ease-out');
    return this;
  }

  /**
   * The camera: [seconds, centre x, centre y, zoom] stops (repeat a stop to
   * hold). It frames the point at the centre of the screen, clamped so the
   * edges of the app never come into view.
   */
  camera(stops: [number, number, number, number][], w = 800, h = 520) {
    const frame = ([t, cx, cy, z]: [number, number, number, number]): Step => {
      const tx = Math.min(0, Math.max(w - w * z, w / 2 - cx * z));
      const ty = Math.min(0, Math.max(h - h * z, h / 2 - cy * z));
      return [t, `transform:translate(${tx.toFixed(1)}px,${ty.toFixed(1)}px) scale(${z})`];
    };
    return this.track('camera', '.cam', stops.map(frame), 'cubic-bezier(0.65, 0, 0.35, 1)');
  }

  /** A ripple that rings out where the cursor clicks. */
  ripple(name: string, t: number) {
    return this.track(`rp-${name}`, `.ripple.rp-${name}`, [
      [0, 'opacity:0;scale:0.3'],
      [t - 0.01, 'opacity:0;scale:0.3'],
      [t, 'opacity:0.9;scale:0.3'],
      [t + 0.5, 'opacity:0;scale:1.8'],
    ], 'ease-out');
  }

  css() {
    return this.rules.join('\n');
  }
}

/** A deterministic price walk, as an SVG line and its filled area. */
export function priceSeries(seed: number, n: number, box: { x0: number; x1: number; y0: number; y1: number }, drift: number, vol: number) {
  let s = seed;
  const rand = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const vals: number[] = [];
  let v = 0;
  for (let i = 0; i < n; i++) {
    v += drift + (rand() - 0.5) * vol;
    vals.push(v);
  }
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const pts = vals.map((val, i) => [
    box.x0 + ((box.x1 - box.x0) * i) / (n - 1),
    box.y1 - ((val - lo) / (hi - lo || 1)) * (box.y1 - box.y0),
  ]);
  const line = 'M' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L');
  const area = `${line} L${box.x1} ${box.y1 + 6} L${box.x0} ${box.y1 + 6} Z`;
  return { line, area };
}
