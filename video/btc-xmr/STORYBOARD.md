# Follow the orange half

A narrated explainer of a Bitcoin to Monero atomic swap, about 2 minutes 20 seconds at 16:9, with a 60 second vertical cut.

The hard idea is the adaptor signature, where taking the Bitcoin publishes the key to the Monero. The video never names it. Instead it gives the viewer one object to watch: the seller's half of the Monero key, drawn in Monero orange with a jagged edge. It starts in the seller's pocket, ends up sealed into the Bitcoin payment, lands on Bitcoin's public board when the seller cashes that payment, and you pick it up there to open the vault. Anyone who keeps an eye on that shape has understood the swap.

The second idea is that the two traders never trust each other, and never need to. Each safety property is shown as a cheat that fails, not as an arrow on a diagram.

Character, palette and drawing rules live in [ANIMATION_GUIDE.md](ANIMATION_GUIDE.md).

## Cast

**You.** Short and round, yellow scarf. Starts with the Bitcoin and holds the yellow key half, the one with a round bow. Nervous, pats their pocket a lot.

**The seller.** Tall and lanky, orange scarf with a grey stripe. Starts with the Monero and holds the orange key half, the one with jagged teeth. Sly, keeps side-eyeing your Bitcoin.

**The toll keeper.** Only in the cold open. A middleman on a bridge with a tip jar and a "trust me" grin.

**The hourglass.** A sleepy hourglass with a face. It is the timelock. Snoozes through the happy path and wakes up in scene 8.

**The crowd.** Small round onlookers in the Bitcoin square who read everything pinned to the board. They never speak.

## Places

Both places sit on the same night stage, in the site's dark theme. They differ in how clear the air is: cool and clear on the Bitcoin side, a low violet haze on the Monero side.

**Bitcoin square.** Under the blue bank, where the air is clear and cool. A crowd stands around a big public board in the middle, drawn like one of the site's cards: a `surface` panel with a thin border and mono labels. Every transaction gets pinned up there and the crowd reads it.

**Monero street.** Under the violet bank, where a violet haze hangs low and sound goes quiet. Coins that move here vanish into the haze. The two-keyhole vault sits here.

Between the film's major sections the camera whips sideways from one place to the next; inside a section the scenes crossfade. The sound shifts from crowd murmur to quiet when we arrive on the Monero side.

## Scenes

Each scene lives in `scenes/<id>.js`, and the comment at the top of each file is the short version of what follows. Word cues in brackets are where actions land. Times are rough; the voice sets the real ones.

### 0. Cold open (0:00 to 0:15)

You flip a Bitcoin coin on the gold-lit left side, the camera pans across a gap, and the seller flips a Monero coin on the violet right side. A toll keeper in a top hat drops onto the rope bridge between you and holds up a tip jar. You both walk out and toss your coins in. You hold your hands out for the swap, and the keeper cackles dishonestly, "HA!"s popping overhead, then vanishes in a magician's puff of smoke, jar and all. On "nobody" a red strike slashes the bridge, the planks fall, and you scramble back to your own sides and stare each other down across the gap. The kicker reads `btc · xmr`, as on the site.

> Say you want to swap Bitcoin for Monero with a stranger. The usual way is to hand both coins to someone in the [middle] and hope they pass them along. That middleman can get [hacked], [run off with the coins], [freeze your account], or [change the terms] on you. This video is about doing it with [nobody] in the middle.

As the keeper dives, each risk rises out of the gap as a red warning badge on its word: "hacked", "stole the coins", "account frozen", "terms changed". You both answer them with one big eye roll on "hacked" and hold that look until the bridge breaks, when the badges clear.

Sound: coins ding into the jar, a low whoosh as the keeper falls, a swipe on the strike-through.

### 1. Two kinds of lock (0:10 to 0:24)

A gold Bitcoin padlock and an orange Monero padlock drop in, and you both run in. You hold up a card with two doodles, an arrow to a person and an hourglass with a return arrow, and a small coin acts each one out as the narration names it. The card slides into the Bitcoin lock's slot, and the lock glows and clicks shut. The seller tries the same on the Monero lock, which has no slot: the card crumples, the seller shoves the lock and staggers back, and stays stunned with crosses for eyes while the years go by. A dashed trade arc between the two locks gets a red X. Above it, a timeline runs slowly from 2014, when Monero launched, through December 2017, when h4sh3d published the first BTC↔XMR swap design on paper, to 2020, when the paper (eprint.iacr.org/2020/1126) came out and BasicSwap shipped the first working swaps.

> A Bitcoin lock can come with [instructions], like who gets paid and when the coins go back. A Monero lock [cannot], and that kept Monero out of cross-chain trades for years.

### 2. The split key (0:24 to 0:38)

The camera whips in on a single Monero key, which spins down and hovers in the violet haze. You run in from the left and skid to a stop, and the seller strolls in from the right on long legs. The seller's hand creeps toward the key, you notice, and you both lunge for it at once.

On "split" it cracks with a shockwave of blue and violet rings. You get thrown into a backward somersault, and the seller staggers back flailing. The halves spin up into the air. The yellow half comes down and bonks you on the head, with circling stars, before bouncing into your hand. The orange half lands in the seller's raised hand, and the seller tosses it up and catches it again to show off. You both pocket your halves, sidle up close, and the seller's eyes dart to your pocket, so you cover it. On "together", both of you look up at a vision of the two halves clicking into one key.

> So to make it possible, the Monero side skips the instructions entirely. Its key gets [split] in two, you hold one half and the seller holds the other, and the coins only move when both halves come [together].

Sound: a glassy crack on "split", then the orange-half chime for the first time as it lands in the seller's palm.

### 3. Sign the way out first (0:38 to 0:50)

A table drops in with two REFUND envelopes, and the hourglass plonks down between them. You both dash in and each sign the envelope in front of you, finishing before the swap. The envelopes swap places with both pens lifted, then you each countersign the other one. Your signatures are blue and the seller's violet, so each envelope ends up with both. The hourglass dozes off. On "stalls" you both look worried and the hourglass gives a shake. Then the envelopes take off on their own, each one home to its owner's side, and the hourglass winks on "around". Nobody leaves the scene.

> Before either of you locks a single coin, you both sign your refund [tickets]. If anything stalls or goes wrong, those refunds still go through, whether or not the other one is still [around].

### 4. You lock your Bitcoin (0:50 to 1:06)

You roll a big gold coin in like a wheel and it hops into a box with two padlocks, one gold and one orange, which click shut. You pull out a cheque marked "pay: seller", sign it, and an orange wax seal stamps down on it with the jagged shape of the seller's half. The cheque gets clipped to the box.

Gag: you turn away to fix your scarf. The seller tiptoes over and tries to peel the cheque off, the seal glows and zaps them, and when you turn back the seller is whistling. On "seal" they hold their orange half up beside it, and the shapes match.

> You lock your Bitcoin by yourself, but opening it takes [two] signatures. So you [sign] a [payment] to the seller ahead of time and [seal] it. Only the seller's half of the Monero key can break [that seal].

Why this wording: you fund the Bitcoin lock alone, into a 2-of-2 output. Your pre-signed spend to the seller is an adaptor signature encrypted to the seller's Monero key-half, and only that key-half can decrypt it. That matches the site's own write-up of the flow in `src/content/blog/architecture-as-defense-retoswap-haveno-exploit.mdx`. On "two signatures" both padlocks on the box light up, the gold one for you and the orange one for the seller.

### 5. The seller locks their Monero (1:06 to 1:18)

The vault drops into the violet haze. The seller rolls their Monero coin in and the door slams. On "both halves" the round keyhole lights gold and the jagged one orange.

Gag: you run in and try your yellow half alone. It fits the round keyhole, you jiggle it, and the vault buzzes while the jagged keyhole blinks at you. The seller smirks and pats their pocket.

> The seller locks their Monero in a vault that needs both halves to [open].

### 6. The claim (1:18 to 1:36)

Bitcoin's square, with the public board and a crowd. The seller presses their orange half into the seal, it cracks, and the box pops your Bitcoin into their arms. They run the cheque to the board and pin it up, broken seal and all. The crowd turns to look, and on "shape" the jagged outline of the seller's half rises off the seal with the orange-half chime. You pop up at the edge of the crowd and spot it.

> To collect the Bitcoin, the seller has to use their [half] on the seal. Accepting the payment pins the broken seal to the public [blockchain] and broadcasts their key half, so now anyone can [see] it. Nobody else can use it, though. The Monero also needs [your half], and that one never leaves your pocket.

On "Nobody" a small vault appears beside the board, and a crowd copy of the jagged half bounces off it. On "your half" you hold your yellow half up, and a dotted line runs from it to the round keyhole it alone fits. Then it goes back in your pocket.

### 7. You open the vault (1:36 to 1:48)

At the board you hold up a notepad, glancing between the seal and the pad as you sketch the jagged shape, and tear the page off as your copy. The camera whips over to the vault as you run. Your yellow half and the copy click together, the paper turns real orange, and the vault bursts open in a ring of light. The Monero coin rolls into your arms. Then you and the seller pass each other, each carrying the other's coin. You side-eye each other the whole way and never shake hands.

> You copy it, join it to your [own], and the vault opens. At no point did either of you have to trust the other.

### 8. When someone walks off (1:48 to 2:12)

The scene opens on both coins locked, and an amber title card says "the edge cases: What if someone walks off?" while the narration sets them up. Then a "◀◀ rewind" takes us in. The seller strolls off, hands behind their back.

The hourglass wakes on "timelock" and drains, then dings. The box pops your Bitcoin back to you and you walk it home, and as you do your yellow half flies up and pins itself to the public board. The seller comes back holding a coffee, reads your half off the board, and uses it to take their Monero back out of the vault.

A second rewind. This time you are the one who wandered off, asleep in a hammock, with your refund envelope glowing unclaimed. A second, smaller hourglass runs out and the seller takes the Bitcoin. On "both" a red X flashes over the vault, which stays shut without your half. On "half as a courtesy" the seller's orange half drifts over to you, and on "late" the Monero appears beside it. That's BasicSwap's mercy path: after the swipe, the seller's client publishes their Monero key half by default (since v0.18.5), so you can still collect the Monero. It's a courtesy, not something the protocol guarantees. Then you wake up and fall out of the hammock.

> That's the swap when both of you [play] along. Now for the cases where someone doesn't, by mistake or on [purpose]. Say the seller wanders off before claiming. Once the [timelock] runs out, your Bitcoin comes back to you, and taking it home puts your half on the public board, so the seller can still get their Monero [back] by combining it with their own half. If you're the one who never comes back for the refund, the seller can take that Bitcoin after a second [wait]. They still cannot open the Monero without your half, so they never end up with [both]. By default, BasicSwap then hands you the seller's [half] as a courtesy, and you can still collect the Monero, only late. Either way, the one who walks off can't cost the other their coins.

### 9. Outro (2:12 to 2:20)

You and the seller walk away in opposite directions, each with the other's coin. A gust spins you both like tops and you come out wearing each other's scarves. You both shrug and walk off. The camera lifts into a hero like the site's: the ribbon behind the BasicSwap logo, whose two arrows swap places on "both directions", and `basicswapdex.com/bitcoin-to-monero` underneath. The ribbon here is the homepage hero's own shader, and it's the only place the film shows it.

> BasicSwap has settled Bitcoin and Monero swaps like this in both directions since 2023.

## What each scene stands for

| Scene | Transaction (from `src/data/btm-tables.json`) |
|---|---|
| 3 | Refund transactions presigned before any lock |
| 4 | Chain A lock |
| 5 | Chain B lock |
| 6 | Chain A lock spend. It reveals the seller's key share. |
| 7 | Chain B lock spend |
| 8, first beat | Chain A lock refund, then Chain A lock refund spend, which reveals your share, then Chain B lock refund |
| 8, second beat | Chain A lock refund swipe after the second timelock |

## Vertical cut (about 60 seconds)

Scenes 0, 4, 5, 6 and 7, then the coffee gag from scene 8 and the scarf swap. Narration for the cut gets trimmed separately once the long version is locked.

## The progress timeline

From the moment the swap starts (the key split in scene 2) a card along the bottom of the screen tracks it: keys split, refunds signed, bitcoin locked, monero locked, seller claims btc, you claim xmr. Each step fills in at the moment the picture shows it happening, and the card stays on top through the ribbon hand-offs. It completes when the vault opens in scene 7. In scene 8 it switches to amber tracks for each failure path ("seller walks off", "you walk off"), and it fades out as the outro begins.

## Voice and music

The narrator is Kokoro's `af_heart` at its default speed. The music is the "tech" style in E♭ at 112 bpm, which runs on its minor chords (a filtered arpeggio, sub bass and a steady kick), mixed at 0.42 so it sits under the voice.

## Open questions

- Voice: Kokoro `af_heart` for now. Swap for a recorded or ElevenLabs voice later if wanted.
- Hosting: YouTube or PeerTube, embedded on `/bitcoin-to-monero` next to SwapFilm.
