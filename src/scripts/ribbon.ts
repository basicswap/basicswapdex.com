// Runs the release-animation shader in every <canvas data-ribbon>.
//
// Progressive enhancement: visitors without JS see the static SVG ribbon
// (Ribbon.astro). With JS the ribbon starts empty, and the canvas fades in
// once its first frame draws; if WebGL2 isn't available, fallback() brings
// the SVG back instead. Where WebGL would run in software (no GPU, or a
// blocklisted one) the shader would tie up the main thread, so those
// browsers get the static ribbon too. The loop runs only while the canvas is
// on screen and the tab is visible, at most 30 frames a second; with reduced
// motion, or with the browser's data saver on, it draws one still frame. Low-end
// devices (few cores or little memory) draw fewer pixels, at 24 frames a second.
// The canvas size is measured only when it changes, never inside the loop.

import { vertex, fragment, LOOP_MS } from './ribbon-shader';
import { PALETTES, type PaletteName } from '../lib/ribbon-palettes';

const STILL_PHASE = 2.4;
const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
const LOW_END = (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4;
const SAVE_DATA = nav.connection?.saveData === true;
const MAX_PIXELS = LOW_END ? 1_200_000 : 2_400_000;
// The loop takes 40 s, so the strands move a fraction of a pixel per frame:
// 30 frames a second looks the same as 60 and halves the work.
const FRAME_MS = 1000 / (LOW_END ? 24 : 30);
// Software rasterisers that browsers fall back to without a usable GPU.
const SOFTWARE_GL = /swiftshader|llvmpipe|softpipe|software|basic render/i;

function isSoftware(gl: WebGL2RenderingContext) {
  const info = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? '');
  return SOFTWARE_GL.test(renderer);
}
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
}

/** Shows the static SVG ribbon when the shader can't run. */
function fallback(canvas: HTMLCanvasElement) {
  canvas.parentElement?.setAttribute('data-fallback', '');
}

function start(canvas: HTMLCanvasElement) {
  // Never run two loops on one canvas (e.g. after a dev hot reload).
  if ('ribbon' in canvas.dataset && canvas.dataset.ribbon === 'running') return;
  canvas.dataset.ribbon = 'running';
  // failIfMajorPerformanceCaveat: no context at all when the browser would
  // render in software, rather than a slow one.
  const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, failIfMajorPerformanceCaveat: true });
  if (!gl || isSoftware(gl)) return fallback(canvas);
  const vs = compile(gl, gl.VERTEX_SHADER, vertex);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fragment);
  if (!vs || !fs) return fallback(canvas);
  const program = gl.createProgram()!;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return fallback(canvas);
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const u = (name: string) => gl.getUniformLocation(program, name);
  const uSize = u('size');
  const uPhase = u('phase');
  const uIntensity = u('intensity');
  gl.uniform1f(u('zone'), Number(canvas.dataset.zone ?? 0));
  gl.uniform1f(u('amp'), Number(canvas.dataset.amp ?? 1));
  const palette = PALETTES[(canvas.dataset.palette as PaletteName) ?? 'brand'] ?? PALETTES.brand;
  const rgb = (c: number[]) => [c[0] / 255, c[1] / 255, c[2] / 255] as const;
  gl.uniform3f(u('colA'), ...rgb(palette.a));
  gl.uniform3f(u('colB'), ...rgb(palette.b));
  gl.uniform3f(u('glint'), ...rgb(palette.glint));
  gl.uniform1f(u('blend'), palette.blend);
  gl.uniform1f(u('bloomScale'), palette.bloom);

  const root = document.documentElement;
  let visible = false;
  let raf = 0;

  // the canvas's CSS size, kept up to date by the ResizeObserver below
  let cssW = canvas.clientWidth;
  let cssH = canvas.clientHeight;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = cssW * dpr;
    let h = cssH * dpr;
    const scale = Math.min(1, Math.sqrt(MAX_PIXELS / Math.max(1, w * h)));
    w = Math.max(1, Math.round(w * scale));
    h = Math.max(1, Math.round(h * scale));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    // The browser may allocate a different buffer than requested; draw to
    // the one it actually gave us. The shader only needs the CSS size.
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.uniform2f(uSize, Math.max(1, cssW), Math.max(1, cssH));
  };
  resize();

  const draw = (phase: number) => {
    // Light backgrounds need more of the light to read.
    gl.uniform1f(uIntensity, root.dataset.theme === 'light' ? 1.9 : 1);
    gl.uniform1f(uPhase, phase);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    if (!('live' in canvas.dataset)) canvas.dataset.live = '';
  };

  let last = -Infinity;
  const tick = (now: number) => {
    // Small slack so a 60 Hz display reliably draws every second frame.
    if (now - last >= FRAME_MS - 4) {
      last = now;
      draw(((now % LOOP_MS) / LOOP_MS) * Math.PI * 2);
    }
    raf = requestAnimationFrame(tick);
  };

  const update = () => {
    cancelAnimationFrame(raf);
    raf = 0;
    if (!visible) return;
    if (reduceMotion.matches || SAVE_DATA || document.hidden) {
      draw(STILL_PHASE);
    } else {
      raf = requestAnimationFrame(tick);
    }
  };

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    update();
  }).observe(canvas);
  document.addEventListener('visibilitychange', update);
  reduceMotion.addEventListener('change', update);
  // A new size is measured here, and still frames redraw for it.
  new ResizeObserver(([entry]) => {
    cssW = entry.contentRect.width;
    cssH = entry.contentRect.height;
    resize();
    if (!raf && visible) draw(STILL_PHASE);
  }).observe(canvas);
  // Still frames also redraw when the theme changes.
  new MutationObserver(() => !raf && visible && draw(STILL_PHASE)).observe(root, { attributeFilter: ['data-theme'] });
}

document.querySelectorAll<HTMLCanvasElement>('canvas[data-ribbon]').forEach((canvas) => {
  try {
    start(canvas);
  } catch {
    fallback(canvas);
  }
});
