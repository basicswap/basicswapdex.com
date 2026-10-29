// The Desktop page's coin compatibility matrix (CompatMatrix.astro): the pair
// finder above it, and the crosshair on the hovered or focused cell.
//
// The finder reads the matrix's own data: columns are the coin you send, rows
// the coin you receive; a cell holds A (adaptor signature), H (secret hash)
// and/or V (one-time VES), or nothing.

type Data = {
  coins: string[];
  names: Record<string, string>;
  logos: Record<string, string>;
  cols: string[];
  cells: Record<string, string[]>;
};

const HOW: Record<string, [string, string]> = {
  A: [
    'Yes, by adaptor signature.',
    'Each side locks its coins on its own chain, and the signature that claims one side reveals the key to the other. Nothing on either chain marks it as a swap.',
  ],
  AH: [
    'Yes, by adaptor signature or secret hash.',
    'Both chains support scripts, so either method works. With a secret hash, both sides lock coins in hash time-locked contracts, and revealing the secret to claim one side lets the other be claimed.',
  ],
  H: [
    'Yes, by secret hash.',
    'Both sides lock coins in hash time-locked contracts, and revealing the secret to claim one side lets the other be claimed.',
  ],
  V: [
    'Yes, by one-time VES.',
    'A one-time verifiably encrypted signature, which Bitcoin Cash uses with these coins in place of an adaptor signature.',
  ],
};
const MARK: Record<string, string> = { A: 'mk-a', H: 'mk-h', V: 'mk-v' };

function wire(root: HTMLElement) {
  const finder = root.querySelector<HTMLElement>('.finder');
  const table = root.querySelector<HTMLTableElement>('.matrix');
  if (!finder || !table) return;
  const data: Data = JSON.parse(finder.dataset.compat!);
  const method = (send: string, recv: string) => data.cells[recv][data.cols.indexOf(send)] ?? '';
  const sendSel = finder.querySelector<HTMLSelectElement>('select[data-side="send"]')!;
  const recvSel = finder.querySelector<HTMLSelectElement>('select[data-side="recv"]')!;
  const verdict = finder.querySelector<HTMLElement>('.verdict')!;
  const how = finder.querySelector<HTMLElement>('.how')!;
  const idx = (c: string) => data.coins.indexOf(c);

  // ---- the crosshair: a row, a column and the cell where they meet ----
  const clear = (cls: string) => table.querySelectorAll(`.${cls}`).forEach((e) => e.classList.remove(cls));
  const cross = (r: number | null, c: number | null) => {
    clear('x-row');
    clear('x-col');
    clear('x-cell');
    if (r === null || c === null) return;
    table.querySelectorAll(`[data-r="${r}"]`).forEach((e) => e.classList.add('x-row'));
    table.querySelectorAll(`[data-c="${c}"]`).forEach((e) => e.classList.add('x-col'));
    table.querySelector(`td[data-r="${r}"][data-c="${c}"]`)?.classList.add('x-cell');
  };
  const pinned = () => cross(idx(recvSel.value), idx(sendSel.value));
  const at = (e: Event) => {
    const td = (e.target as HTMLElement).closest('td[data-r]') as HTMLElement | null;
    if (td) cross(+td.dataset.r!, +td.dataset.c!);
  };
  table.addEventListener('pointerover', at);
  table.addEventListener('focusin', at);
  table.addEventListener('pointerleave', pinned);
  // clicking a cell sets the finder to that pair
  table.addEventListener('click', (e) => {
    const td = (e.target as HTMLElement).closest('td[data-r]') as HTMLElement | null;
    if (!td || td.classList.contains('self')) return;
    sendSel.value = data.coins[+td.dataset.c!];
    recvSel.value = data.coins[+td.dataset.r!];
    update();
  });
  table.querySelectorAll('td[data-r]').forEach((td) => td.setAttribute('tabindex', '-1'));

  // ---- the finder ----
  function update() {
    const send = sendSel.value;
    const recv = recvSel.value;
    for (const [side, coin] of [['send', send], ['recv', recv]] as const) {
      const img = finder!.querySelector<HTMLImageElement>(`.pick-logo[data-for="${side}"]`)!;
      const src = data.logos[coin];
      img.hidden = !src;
      if (src) img.src = src;
    }
    verdict.replaceChildren();
    verdict.classList.remove('no');
    if (send === recv) {
      verdict.textContent = 'Pick two different coins.';
      how.textContent = '';
    } else {
      const m = method(send, recv);
      if (m && HOW[m]) {
        for (const ch of m) {
          const mk = document.createElement('span');
          mk.className = `mk ${MARK[ch]}`;
          mk.setAttribute('aria-hidden', 'true');
          verdict.append(mk);
        }
        verdict.append(HOW[m][0]);
        how.textContent = HOW[m][1];
      } else {
        verdict.classList.add('no');
        verdict.textContent = 'Not directly.';
        // a coin both sides can swap with
        const via = data.coins.find((c) => c !== send && c !== recv && method(send, c) && method(c, recv));
        how.textContent = via
          ? `These two can't swap with each other, but two swaps through ${data.names[via]} work: ${data.names[send]} for ${via}, then ${via} for ${data.names[recv]}.`
          : "These two can't swap with each other.";
      }
    }
    pinned();
  }
  sendSel.addEventListener('change', update);
  recvSel.addEventListener('change', update);
  finder.querySelector('.flip')!.addEventListener('click', () => {
    [sendSel.value, recvSel.value] = [recvSel.value, sendSel.value];
    update();
  });

  finder.hidden = false;
  update();
}

document.querySelectorAll<HTMLElement>('.compat').forEach(wire);
