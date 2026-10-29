// What capture.mjs records for the homepage app tour: one scene per page,
// each a base image plus the states the film moves through. Scroll positions
// are worked out from where elements sit, and saved as named views so the
// film scrolls to exactly the same places.
export const VIEW = { w: 1600, h: 1000 };

// The taken offer's and the bid's ids come from the mock (ids.offer, ids.bid).
const swapButton = (ids) => `a[href="/offer/${ids.offer}"].inline-block`;

export const SCENES = [
  {
    // Order Book: Monero's price card, then the best Monero offer's Swap button
    id: 'book',
    async run({ page, base, rect, view, snap, ids }) {
      await page.goto('/offers', 4500);
      const row = await page.rect(`tbody tr:has(${swapButton(ids)})`);
      await base(row.y + row.h * 6);
      await rect('cardXmr', '#xmr-container');
      await rect('swap', swapButton(ids));
      await view('top', 0);
      const card = await page.rect('#xmr-container');
      await view('cards', Math.round(card.y + card.h - VIEW.h + 60));
      await view('table', Math.round(row.y - 430));
      await page.scroll((await page.views()).cards);
      await page.click('#xmr-container', 2500);
      await page.away();
      await snap('xmr');
      await page.scroll((await page.views()).table);
      await page.hover(swapButton(ids));
      await snap('swapHover');
    },
  },
  {
    // The offer: an amount to send, Send Bid, the confirmation
    id: 'offer',
    async run({ page, base, rect, view, snap, ids }) {
      await page.goto(`/offer/${ids.offer}?bid=1`, 3500);
      // as on a first visit, the first of your addresses is the one bids go from
      await page.eval(`(() => { const s = document.querySelector('select[name=addr_from]'); if (s.options.length > 1) { s.value = s.options[1].value; s.dispatchEvent(new Event('change', { bubbles: true })); } return s.value; })()`);
      await base();
      await rect('send', '#bid_amount_send');
      await rect('recv', '#bid_amount');
      await rect('sendBid', 'button[name=sendbid][value="Send Bid"]');
      await view('top', 0);
      const field = await page.rect('#bid_amount_send');
      await view('form', Math.round(field.y - 380));
      await page.scroll((await page.views()).form);
      await page.click('#bid_amount_send', 300);
      await page.away();
      await snap('focus');
      await page.type('0');
      await snap('typed1');
      await page.type('.');
      await snap('typed2');
      await page.type('1');
      await snap('typed');
      await page.eval(`(() => { const e = document.getElementById('bid_amount_send'); e.dispatchEvent(new Event('change', { bubbles: true })); e.blur(); return 1; })()`);
      await page.wait(600);
      await snap('filled');
      await page.click('button[name=sendbid][value="Send Bid"]', 800);
      await page.away();
      await rect('confirm', '#confirmModal button[name=sendbid][value=confirm]');
      await snap('modal');
      await page.hover('#confirmModal button[name=sendbid][value=confirm]');
      await snap('confirmHover');
    },
  },
  {
    // The swap: the bid page as the swap steps from Sent to Completed
    id: 'swap',
    async run({ page, base, view, snap, ids }) {
      await page.goto(`/bid/${ids.bid}?step=0`, 3000);
      await base();
      const state = await page.rect('#bid-live-content');
      await view('top', 0);
      await view('state', Math.max(0, Math.round(state.y - 140)));
      for (let step = 1; step <= 5; step++) {
        await page.goto(`/bid/${ids.bid}?step=${step}`, 2200);
        await page.scroll((await page.views()).state);
        await page.away();
        await snap(`s${step}`);
      }
    },
  },
  {
    // Smart Buy: pay 0.3 BTC for Monero, find the cheapest fill, place the bids
    id: 'smartbuy',
    async run({ page, base, rect, view, snap }) {
      await page.goto('/smartbuy', 3000);
      await page.eval(`(() => { const s = document.getElementById('coin_from'); s.value = '6'; s.dispatchEvent(new Event('change', { bubbles: true })); return 1; })()`);
      await page.wait(600);
      await base();
      await rect('pay', '#pay_amount');
      await rect('find', '#previewBtn');
      await rect('place', '#placeBtn');
      await view('top', 0);
      const pay = await page.rect('#pay_amount');
      await view('form', Math.round(pay.y - 330));
      await page.scroll((await page.views()).form);
      await page.click('#pay_amount', 300);
      await page.type('0.3');
      await page.away();
      await snap('typed');
      const find = await page.rect('#previewBtn');
      await view('find', Math.max((await page.views()).form, Math.round(find.y + find.h - VIEW.h + 80)));
      await page.scroll((await page.views()).find);
      await page.click('#previewBtn', 1800);
      await page.away();
      await snap('plan');
      await page.scroll((await page.views()).form);
      await page.away();
      await snap('planTop');
      await page.hover('#placeBtn');
      await snap('placeHover');
      await page.click('#placeBtn', 900);
      await page.away();
      await snap('confirm');
    },
  },
  {
    // Wallets: the balances, then Bitcoin's card
    id: 'wallets',
    async run({ page, base, rect, view, snap }) {
      await page.goto('/wallets', 3500);
      await base();
      const cards = await page.eval(`[...document.querySelectorAll('a[href^="/wallet/"]')].map(a => a.getAttribute('href'))`);
      const btc = cards.find((h) => /btc|bitcoin|\/2$/i.test(h)) ?? cards[1];
      await rect('btcManage', `a[href="${btc}"]`);
      await view('top', 0);
      const r = await page.rect(`a[href="${btc}"]`);
      await view('cards', Math.round(r.y - 300));
      await page.scroll((await page.views()).cards);
      await page.hover(`a[href="${btc}"]`);
      await snap('btcHover');
    },
  },
  {
    // Bitcoin's wallet page, opened from Manage Wallet: deposit address and
    // the history, the swap's lock at the top
    id: 'wallet',
    async run({ page, base, view }) {
      await page.goto('/wallet/BTC', 4000);
      await base();
      await view('top', 0);
      const deposit = await page.rect('#main_deposit_address');
      if (deposit) await view('deposit', Math.round(deposit.y - 420));
      const history = await page.rect('#transaction-history-section') ?? await page.rect('#tx-container');
      await view('history', Math.round(history.y - 140));
    },
  },
  {
    // AMM: the offer templates it keeps posting, then Add Offer
    id: 'amm',
    async run({ page, base, rect, view, snap }) {
      await page.goto('/amm', 3500);
      await base();
      await rect('add', '#add-new-offer-btn');
      await view('top', 0);
      const table = await page.rect('#offers-tab');
      await view('tables', Math.max(0, Math.round(table.y - 300)));
      await page.scroll((await page.views()).tables);
      await page.hover('#add-new-offer-btn');
      await snap('addHover');
      await page.click('#add-new-offer-btn', 700);
      await page.away();
      await snap('add');
    },
  },
];
