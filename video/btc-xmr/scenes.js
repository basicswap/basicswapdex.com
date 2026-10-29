// One module per scene in scenes/, named after its id in script.md. Shots,
// gags and timing are in STORYBOARD.md, and the drawing rules are in
// ANIMATION_GUIDE.md.
import open from './scenes/open.js';
import locks from './scenes/locks.js';
import split from './scenes/split.js';
import refunds from './scenes/refunds.js';
import btcLock from './scenes/btc-lock.js';
import xmrLock from './scenes/xmr-lock.js';
import claim from './scenes/claim.js';
import vault from './scenes/vault.js';
import walkOff from './scenes/walk-off.js';
import outro from './scenes/outro.js';

export default {
  open,
  locks,
  split,
  refunds,
  'btc-lock': btcLock,
  'xmr-lock': xmrLock,
  claim,
  vault,
  'walk-off': walkOff,
  outro,
};
