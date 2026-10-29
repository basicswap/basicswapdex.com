# Follow the orange half

> One "##" block per scene, matching a function in scenes.js.
> The storyboard for every scene is in STORYBOARD.md.

## open
Say you want to swap Bitcoin for Monero with a stranger. The usual way is to hand both coins to someone in the [#middle] middle and hope they pass them along. That middleman can get [#hack] hacked, [#theft] run off with the coins, [#freeze] freeze your account, or [#terms] change the terms on you. [pause 0.4] This video is about doing it with [#nobody] nobody in the middle.

## locks {hold=3.2 transition=fade}
A Bitcoin lock can come with [#instructions] instructions, like who gets paid and when the coins go back. A Monero lock [#cant] cannot, and that kept Monero out of cross-chain trades for years.

## split {lead=1.4 hold=2.4}
So to make it possible, the Monero side skips the instructions entirely. Its key gets [#split] split in two, you hold [#yours] one half and the seller holds [#theirs] the other, and the coins only move when both halves come [#together] together.

## refunds {transition=fade}
Before either of you locks a single coin, you both sign your refund [#out] tickets. If anything stalls or goes wrong, those refunds still go through, whether or not the other one is still [#around] around.

## btc-lock
You lock your Bitcoin by yourself, but opening it takes [#two] two signatures. So you [#sign] sign a [#payment] payment to the seller ahead of time and [#sealed] seal it. Only the seller's half of the Monero key can break [#seal] that seal.

## xmr-lock {hold=3 transition=fade}
The seller locks their Monero in a vault that needs both halves to [#open] open.

## claim {transition=fade}
To collect the Bitcoin, the seller has to use their [#half] half on the seal. Accepting the payment pins the broken seal to the public [#board] blockchain and broadcasts their key half, so now anyone can [#shape] see it. Nobody else can use it, though. The Monero also needs [#other] your half, and that one never leaves your pocket.

## vault {lead=2.4 transition=fade}
You copy it, join it to your [#own] own, and the vault [#opens] opens. At no point did either of you have to trust the other.

## walk-off
That's the swap when both of you [#play] play along. Now for the cases where someone doesn't, by mistake or on [#purpose] purpose. [pause 0.7] Say the seller wanders off before claiming. Once the [#timelock] timelock runs out, your Bitcoin comes back to you, and taking it home puts your half on the public board, so the seller can still get their Monero [#back] back by combining it with their own half. [pause 0.5] If you're the one who never comes back for the refund, the seller can take that Bitcoin after a second [#wait] wait. They still cannot open the Monero without your half, so they never end up with [#both] both. By default, BasicSwap then hands you the seller's [#mercy] half as a courtesy, and you can still collect the Monero, only late. Either way, the one who walks off can't cost the other their coins.

## outro {lead=2.6 hold=3.6}
{BasicSwap|basic swap} has settled Bitcoin and Monero swaps like this in both directions since 2023.
