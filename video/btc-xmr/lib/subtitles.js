// Subtitles, drawn by the film itself so they sit just above the swap
// progress card instead of on top of it (explainroo's own captions always
// take the bottom of a 16:9 frame). They're lettered like the rest of the
// art: white type with the characters' dark ink outline and no box, words
// not yet said dimmed, and a hand-drawn blue underline under the word being
// said. The words and timings come from s.words. Draw in screen space.
import { C, clamp } from './ink.js';

const SIZE = 42;
const MAX_W = 1240;

// Groups the scene's words into short phrases: a phrase ends at a full stop,
// at a comma once it has a few words, or when it would get too wide.
function phrases(ctx, words) {
  const out = [];
  let cur = [];
  const width = (ws) => ctx.measureText(ws.map((w) => w.text).join(' ')).width;
  words.forEach((w, i) => {
    if (cur.length && width([...cur, w]) > MAX_W) {
      out.push(cur);
      cur = [];
    }
    cur.push(w);
    const end = /[.!?]$/.test(w.text) || (/[,;:]$/.test(w.text) && cur.length >= 4);
    if (end || i === words.length - 1) {
      out.push(cur);
      cur = [];
    }
  });
  return out;
}

// y is the centre of the subtitle box: just above the progress card when it
// is showing, lower down when it is not.
export function subtitles(ctx, s, y) {
  const words = s.words ?? [];
  if (!words.length) return;
  ctx.save();
  ctx.font = `700 ${SIZE}px "Instrument Sans"`;
  const list = phrases(ctx, words);
  const t = s.t;
  let idx = -1;
  for (let i = 0; i < list.length; i++) {
    const from = list[i][0].start - 0.1;
    const until = i + 1 < list.length ? list[i + 1][0].start - 0.1 : list[i][list[i].length - 1].end + 0.6;
    if (t >= from && t < until) idx = i;
  }
  if (idx < 0) {
    ctx.restore();
    return;
  }
  const ph = list[idx];
  const from = ph[0].start - 0.1;
  const until = idx + 1 < list.length ? list[idx + 1][0].start - 0.1 : ph[ph.length - 1].end + 0.6;
  const appear = clamp((t - from) / 0.18);
  ctx.globalAlpha = Math.min(appear, clamp((until - t) / 0.15));
  // each phrase rises gently into place
  const yy = y + (1 - appear) * 10;
  const space = ctx.measureText(' ').width;
  const widths = ph.map((w) => ctx.measureText(w.text).width);
  const total = widths.reduce((a, b) => a + b, 0) + space * (ph.length - 1);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  let x = 960 - total / 2;
  ph.forEach((w, i) => {
    const spoken = t >= w.start;
    // lettering with the same dark ink outline as the characters
    ctx.save();
    ctx.shadowColor = 'rgba(5,8,16,0.85)';
    ctx.shadowBlur = 16;
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 8;
    ctx.strokeText(w.text, x, yy);
    ctx.restore();
    ctx.fillStyle = spoken ? '#F9FAFB' : 'rgba(203,213,225,0.62)';
    ctx.fillText(w.text, x, yy);
    // the word being said gets a hand-drawn underline that draws itself in
    const said = clamp((t - w.start) / Math.max(0.12, w.end - w.start));
    const current = t >= w.start && (i + 1 >= ph.length || t < ph[i + 1].start);
    if (current && said > 0) {
      const ux = x, uw = widths[i] * said, uy = yy + SIZE * 0.62;
      ctx.strokeStyle = C.primary;
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let k = 0; k <= 12; k++) {
        const px = ux + (uw * k) / 12;
        const py = uy + Math.sin(k * 1.3 + i) * 1.6 + (k / 12) * 1.5;
        if (k) ctx.lineTo(px, py);
        else ctx.moveTo(px, py);
      }
      ctx.stroke();
    }
    x += widths[i] + space;
  });
  ctx.restore();
}
