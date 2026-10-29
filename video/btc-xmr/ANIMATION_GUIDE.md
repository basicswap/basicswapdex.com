# Animation guide

The rules every scene follows, so ten scenes drawn separately still look like one film. Read this before touching a scene. The story is in [STORYBOARD.md](STORYBOARD.md).

## Engine

The video is built with [explainroo](https://github.com/vincentsch/explainroo). Narration is a `script.md`, and the drawings live in `scenes.js`. Kokoro reads the script and Whisper records when each word is spoken, so anything can start on a word.

explainroo's built-in shapes and Lucide icons are for diagrams, and this film has characters, so almost everything here is drawn by hand with `s.draw`:

```js
s.draw({ x, y, at: 'sealed', out: '#claim' }, (ctx, life) => {
  // ctx is the raw canvas 2D context
  // life.p is entrance progress (0 to 1), life.local is seconds since `at`
});
```

Rules that come with it:

- Start every drawing on a cue with `s.draw`. Anything drawn straight on `s.ctx` stays up for the whole scene.
- Randomness must repeat from render to render. Use `s.rand(i)`, `s.noise(x)` and `s.wiggle(amount, speed)`, never `Math.random()`.
- Tie actions to words (`at: 'split'`) or script markers (`at: '#claim'`), not to hard-coded seconds, so they survive a change of voice.
- Sound effects go through `s.sfx(name, at, { gain, dur, pitch })`.

Each scene is a module in `scenes/`, and `scenes.js` maps the script's scene ids to them. Shared drawing code lives in `lib/`, and every scene imports it. No scene redraws a character or a prop from scratch.

- `lib/cast.js`: you, the seller and the toll keeper, with walking, spinning, flailing and faces
- `lib/props.js`: the key, its two halves, sparks, glows, the shockwave ring and dizzy stars
- `lib/things.js`: coins, padlocks, the instruction card, envelopes, the hourglass, the 2-of-2 box, cheque and seal, vault, public board, crowd, bridge and the small things
- `lib/night.js`: the stage, plus `onScreen()`, the vignette and the kicker
- `lib/hero.js`: the homepage hero's ribbon, rendered with the site's own WebGL2 shader (copied verbatim from `src/scripts/ribbon-shader.ts`). If the site's shader changes, copy it here again.
- `lib/ribbon.js`: the scene-change `ribbonPass()`, which draws `hero.js`, and a canvas version of the same curve as a fallback where WebGL2 is missing
- `lib/film.js`: what every scene shares: `finish()` (vignette, kicker, ribbon in and out), `whip()` for the last camera move, `gait()`, `moves()` and `faceAt()`
- `lib/logo.js`: the BasicSwap logo as canvas paths, from the site's `Logo.astro`
- `lib/timeline.js`: the swap progress card along the bottom (`SWAP`, the two failure tracks, `progress()`); pass it to `finish()` as `timeline`
- `lib/subtitles.js`: the burned-in subtitles, built from `s.words` and drawn by `finish()` just above the progress card (or lower when there is none). They're lettered like the art: white type with the characters' dark ink outline and no box, words not yet said dimmed, and a hand-drawn blue underline under the word being said. explainroo's own captions stay off; on a 16:9 frame they would sit on top of the card.

## Look

The film should look like basicswapdex.com. Everything happens on the site's dark theme, and the site's line ribbon carries the film from one scene to the next.

- **The stage** is `night()` in `lib/night.js`: a navy sky with specks of light drifting up, and a glossy floor with the site's dot pattern in perspective and a thin BasicSwap Blue horizon line. Pass `haze` for the violet air on the Monero side. The ribbon is never part of the stage.
- **The ribbon** is the homepage hero's own shader (`lib/hero.js`). It appears on the end card, as on the site.
- **Light:** characters are evenly lit, with no coloured rim light. Anything coloured (key halves, coins) glows a little in its own colour, and big beats get a shockwave `ring()` in blue and violet.
- **Kickers** sit top left in screen space, written as the site writes them: a short blue rule and a lowercase JetBrains Mono label such as `02 · the split key`. Use `kicker()` inside `onScreen()` so the camera doesn't move them.
- **Type** is Instrument Sans for anything set large, and JetBrains Mono for labels, as on the site.
- A soft vignette goes over every frame, also in screen space.
- **The progress timeline** sits along the bottom from scene 2 to the end of scene 8, in a card like the site's. Keep the bottom 120 px of the frame clear of anything important. Its labels are sentence case and write BTC and XMR in capitals.
- **Scene endings:** characters keep whatever expression the scene left them with when the ribbon comes in. There's no stock reaction face at the end of a scene.

## Palette

| Token | Hex | Use |
|---|---|---|
| `navy` | `#111827` | The sky at the horizon, the site's dark background |
| `navyDeep` | `#0B1120` | The top of the sky |
| `floor` | `#0D1322` | The floor |
| `surface` | `#1F2937` | Cards and panels, such as the public board |
| `brand` | `#0073FF` | Ribbon upper bank, BasicSwap logo |
| `primary` | `#3B82F6` | Horizon line, kicker rule |
| `violet` | `#A855F7` | Ribbon lower bank, the Monero side's haze |
| `link` | `#60A5FA` | Kicker text, cool glows |
| `line` | `#E5E7EB` | Limbs, feet, sparks: anything drawn straight onto navy |
| `ink` | `#111827` | Outlines and features drawn on light shapes |
| `btc` | `#F7B500` | Bitcoin, your scarf, your key half |
| `xmr` | `#FF6600` | Monero, the seller's scarf, the seller's key half, the wax seal |
| `xmrGrey` | `#4C4C4C` | Stripe on the seller's scarf, Monero coin rim |
| `strike` | `#EF5944` | The strike-through in the cold open, and nothing else |

Blue and violet belong to the world, and gold and orange belong to the two coins. Keep it that way, so the eye goes straight to the key halves.

Gold and orange sit close together, so colour is never the only cue. Your half always has a round bow, and the seller's half always has three jagged teeth. The wax seal and the vault's second keyhole copy those teeth exactly. The "same piece" match must still read in greyscale. Check a frame in greyscale before calling a scene done.

Draw the coins in this film's style, with Bitcoin in `btc` gold. The site's coin PNGs use Bitcoin's official orange, which blurs into Monero, so don't use them.

## Line and texture

- Light shapes such as bodies, key halves and the board get dark `ink` outlines, 3 px at 1080p, with a slight boil from `jitter()` so they look drawn.
- Anything drawn straight onto navy, such as limbs, feet and sparks, uses `line` instead, so it never disappears into the dark.
- The background is smooth and precise like the site, and the characters are a little hand-made. That contrast is on purpose.
- On-screen text is rare. The only words are the kickers, REFUND on the envelopes and the URL in the outro.

## Characters

Both characters are built from simple shapes so they stay consistent across scenes.

**You.** A round body about 1.0 unit tall, stubby legs, dot eyes, a yellow scarf with fringed ends that trails behind when moving. The idle loop is a slow breath that scales the body from 1.00 to 1.03, a blink every 3 to 5 seconds, and a pocket pat every 6 seconds or so.

**The seller.** A tall oval body about 1.6 units tall, long thin legs, half-lidded eyes, an orange scarf with one grey stripe. The idle loop is a slower breath, eyes drifting toward your Bitcoin and snapping back, an occasional fingertip drum.

Shared rules:

- Faces are two eyes and an optional mouth line. Mood comes from eyelids and eyebrows.
- Never fully still. If a character has nothing to do, it runs its idle loop.
- The two never touch, and they keep a gap of at least one body width unless a gag needs it closed.
- Scarves trail motion with a small lag. That lag sells the squash and stretch.

**The toll keeper.** `drawCharacter(..., 'keeper', ...)`: a wide, short body, a top hat with a BasicSwap Blue band, a toothy `grin`, no scarf. Holds the tip jar up over the hat. Only in scene 0.

**The hourglass.** `hourglass()` in `lib/things.js`: wooden frame, glass bulbs, two eyes on the top bar. It dozes with floating "z"s, can wink, and wakes and drains when a timelock runs out. Its run-out always gets a ding and a `ring()`.

**The crowd.** `crowd()`: small round onlookers in muted greys, so they never compete with the leads. `turn` ripples left to right so heads turn one after another, and `ooh` gives them little round mouths.

## Motion

- Ease everything. Default to ease-out on entrances and ease-in-out on moves. Nothing moves at a constant speed except falling sand.
- Squash on landing, stretch on fast moves, about 10 percent each way.
- Big moves get anticipation, a small dip back before a jump or a run.
- Gags need a beat. Hold for about 0.4 s before each reveal, like the glowing seal, the buzzer or the coffee return, so the viewer gets there with the character.
- Nobody stands still for long. Characters run in, lunge, get knocked back, sidle and react. If a scene has two characters standing side by side for more than about two seconds, give one of them something to do.
- Move characters with position functions of time (`youX(t)` in scene 2), and drive their legs from distance travelled (`walk: x / stepLen`) with `stride` from speed. Feet then never slide.
- The camera follows the action: push in on a lunge, pull wide on an impact, frame whoever the narration is about, and whip along the ribbon at the end. A short shake goes with impacts.

## Transitions

The film has five sections, and the camera only whips where one section hands over to the next:

1. The problem: `open`, `locks`
2. The setup: `split`, `refunds`
3. The swap: `btc-lock`, `xmr-lock`, `claim`, `vault`
4. The edge cases: `walk-off`
5. The outro

- **Between sections: the whip pan** (`pan` in `lib/transitions.js`). The picture slides off to the left with a real horizontal motion blur, and tapered speed lines in BasicSwap Blue, violet and white stream past at different depths. At the cut the frame is solid navy full of streaks, and the next scene slides in from the right and settles. The progress card and the subtitles are drawn after it, so they hold still while the world moves.
- **Inside a section: a crossfade**, set per scene with `{transition=fade}` in `script.md`.
- `OPENS_SECTION` and `CLOSES_SECTION` in `lib/film.js` say which scenes get the whip at their start and end. Change those and the script's fades together.
- `lib/transitions.js` also keeps the other styles that were tried (brush, iris, dots, coin, and the hero ribbon). `TRANSITION` in `lib/film.js` picks one.

## Sound

- **Orange-half chime.** One short bright note, the same every time the seller's half appears or is revealed. In scene 6 it plays alone with the music cut.
- **Square.** Crowd murmur, distant pigeons.
- **Fog.** Near silence, a low hum, a dripping pipe.
- **Gags.** A slide whistle for the toll keeper, a glassy crack for the key split, a "wrong answer" buzz at the vault, and a coffee slurp in scene 8.
- Music is light and plucky, ducks under speech, and drops out completely for the scene 6 reveal.

## Formats

16:9 at 1920x1080 is the master. The 9:16 cut is reframed, not letterboxed, so keep each scene's key action inside the middle 56 percent of the frame width, where a vertical crop will keep it.

## Before a scene is done

1. Render stills at the main beats and look at them together on a contact sheet.
2. Check one frame in greyscale. The two key halves must still be easy to tell apart.
3. Run `explainroo check` for small text.
4. Watch it with sound at full speed. Gags that only work when paused don't count.
