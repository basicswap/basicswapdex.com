"""Example data for the stand-in BasicSwap backend (server.py).

Every figure here is illustrative. Prices sit near the market of October
2026 so rates and USD values read plausibly; addresses and ids are made up.
"""
import hashlib
import json
import math
import time

NOW = int(time.time())


# ---- ids and addresses in their real formats ------------------------------------
# Seeded from a label, so every capture shows the same values.
B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
BECH32 = "qpzry9x8gf2tvdw0s3jn54khce6mua7l"


def _bytes(label: str, n: int) -> bytes:
    out, i = b"", 0
    while len(out) < n:
        out += hashlib.sha256(f"{label}/{i}".encode()).digest()
        i += 1
    return out[:n]


def _pick(label: str, alphabet: str, n: int) -> str:
    return "".join(alphabet[b % len(alphabet)] for b in _bytes(label, n))


def msg_id(label: str, at: int) -> str:
    """An offer or bid id: SMSG message ids are 4 zero bytes, a 4-byte
    timestamp, then 20 bytes (56 hex characters)."""
    return "00000000" + f"{at:08x}" + _bytes(label, 20).hex()


def part_addr(label: str) -> str:
    """A Particl mainnet P2PKH address, as used for SMSG identities."""
    return "P" + _pick(label, B58, 33)


def btc_addr(label: str) -> str:
    """A native SegWit (P2WPKH) Bitcoin address."""
    return "bc1q" + _pick(label, BECH32, 38)


def txid(label: str) -> str:
    return _bytes(label, 32).hex()

# Coins (basicswap/chainparams.py): id, name, ticker, USD price, 24h change %.
COINS = [
    (2, "Bitcoin", "BTC", 81690.0, 1.24),
    (6, "Monero", "XMR", 552.2, 2.87),
    (1, "Particl", "PART", 0.2107, -0.61),
    (3, "Litecoin", "LTC", 59.39, 0.92),
    (17, "Bitcoin Cash", "BCH", 371.4, -0.34),
    (13, "Firo", "FIRO", 0.9337, 0.45),
    (11, "PIVX", "PIVX", 0.0426, -1.12),
    (12, "Dash", "DASH", 49.1, 0.38),
    (18, "Dogecoin", "DOGE", 0.0819, 3.05),
    (4, "Decred", "DCR", 14.6, -0.72),
    (5, "Namecoin", "NMC", 1.12, 0.0),
    (9, "Wownero", "WOW", 0.0088, -2.4),
]
BY_TICKER = {c[2]: c for c in COINS}
BY_NAME = {c[1]: c for c in COINS}

SUMMARY = {
    "num_network_offers": 98,
    "num_sent_active_offers": 3,
    "num_recv_active_bids": 1,
    "num_sent_active_bids": 0,
    "num_available_bids": 2,
    "num_swapping": 0,
    "num_watched_outputs": 0,
}


def amount(x: float, decimals: int = 8) -> str:
    return f"{x:.{decimals}f}"


def offer(i, send_tk, send_amt, recv_tk, mins_ago, hours_left, auto=1, premium=0.0):
    """An offer selling send_amt of send_tk for recv_tk at market +premium%."""
    fs, ts = BY_TICKER[send_tk], BY_TICKER[recv_tk]
    recv_amt = send_amt * fs[3] / ts[3] * (1 + premium / 100)
    created = NOW - mins_ago * 60
    return {
        "swap_type": 4,
        "addr_from": part_addr(f"maker-{i}"),
        "addr_to": "Public",
        "offer_id": msg_id(f"offer-{i}", created),
        "created_at": created,
        "expire_at": NOW + hours_left * 3600,
        "coin_from": fs[1],
        "coin_to": ts[1],
        "amount_from": amount(send_amt),
        "amount_to": amount(recv_amt),
        "rate": amount(recv_amt / send_amt),
        "min_bid_amount": amount(send_amt / 100),
        "is_expired": False,
        "is_own_offer": False,
        "is_revoked": False,
        "is_public": True,
        "amount_negotiable": True,
        "rate_negotiable": False,
        "auto_accept_type": auto,
        "message_nets": "smsg",
    }


OFFERS = [
    offer(1, "XMR", 25.0, "BTC", 2, 3, premium=-0.42),
    offer(2, "LTC", 12.5, "BTC", 5, 2, premium=0.16),
    offer(3, "BTC", 0.0454, "XMR", 9, 6, premium=-0.86),
    offer(4, "PART", 1500.0, "BTC", 11, 5, premium=0.33),
    offer(5, "BTC", 0.25, "LTC", 14, 1, premium=0.31),
    offer(6, "LTC", 4.2, "XMR", 6, 4, premium=0.41),
    offer(7, "FIRO", 820.0, "LTC", 18, 8, premium=0.94),
    offer(8, "DOGE", 9000.0, "BTC", 23, 3, premium=-1.2),
    offer(9, "BCH", 2.5, "XMR", 31, 7, premium=0.22),
    offer(10, "DASH", 14.0, "LTC", 37, 9, premium=0.12),
    offer(11, "XMR", 3.1, "LTC", 42, 2, premium=-0.35),
    offer(12, "PIVX", 52000.0, "BTC", 55, 11, premium=0.58),
    offer(13, "XMR", 8.4, "BTC", 26, 5, premium=-0.21),
    offer(14, "XMR", 12.0, "BTC", 48, 8, premium=0.05),
]


def series(seed: int, n: int, start: float, vol: float, drift: float):
    """A deterministic price walk ending at start, as [ms, price] pairs."""
    s = seed
    vals = []
    v = 0.0
    for _ in range(n):
        s = (s * 1103515245 + 12345) & 0x7FFFFFFF
        v += drift + (s / 0x7FFFFFFF - 0.5) * vol
        vals.append(v)
    end = vals[-1]
    step = 86400 * 1000 // n
    return [[(NOW * 1000) - (n - i) * step, start * math.exp((x - end) / 100)] for i, x in enumerate(vals)]


def plan(body: bytes):
    """Smart Buy's fill plan: XMR offers for BTC, cheapest first."""
    try:
        req = json.loads(body or b"{}")
    except ValueError:
        req = {}
    spend = float(req.get("amount_to") or req.get("amount") or 0.3)
    legs, left = [], spend
    xmr = sorted((o for o in OFFERS if o["coin_from"] == "Monero" and o["coin_to"] == "Bitcoin"), key=lambda o: float(o["rate"]))
    for o in xmr:
        if left <= 0:
            break
        rate = float(o["rate"])
        cost = min(left, float(o["amount_from"]) * rate)
        legs.append({"offer_id": o["offer_id"], "amount": f"{cost / rate:.12f}", "rate": f"{rate:.8f}", "cost": f"{cost:.8f}", "own": False})
        left -= cost
    recv = sum(float(leg["amount"]) for leg in legs)
    avg = spend / recv if recv else 0
    market = BY_TICKER["XMR"][3] / BY_TICKER["BTC"][3]
    return {
        "coin_from": "Monero", "coin_to": "Bitcoin",
        "legs": legs, "excluded": [],
        "num_bids": len(legs),
        "total_receive": f"{recv:.12f}", "fees": "0.000210000000", "net_receive": f"{recv - 0.00021:.12f}",
        "total_spend": f"{spend:.8f}", "avg_rate": f"{avg:.8f}",
        "market_rate": f"{market:.8f}", "limit_rate": f"{market * 1.01:.8f}",
        "pct_vs_market": round((avg / market - 1) * 100, 2),
        "mode": req.get("mode", "spend"), "unfilled": "0.00000000", "exhaustive": True,
    }


def coin_lookup(key: str):
    key = key.strip()
    if key.isdigit():
        return next((c for c in COINS if c[0] == int(key)), None)
    return BY_TICKER.get(key.upper()) or BY_NAME.get(key)


def coins_param(body: bytes) -> list[str]:
    try:
        data = json.loads(body or b"{}")
    except ValueError:
        from urllib.parse import parse_qs

        data = {k: v[0] for k, v in parse_qs(body.decode()).items()}
    return [c for c in str(data.get("coins", "")).split(",") if c]


def api(path: str, body: bytes):
    if path == "/json":
        return SUMMARY
    if path in ("/json/offers", "/json/offers/"):
        return OFFERS
    if path == "/json/sentoffers":
        return []
    if path == "/json/coinprices":
        return {"currency": "USD", "source": "coingecko.com", "rates": {k: c[3] for k in coins_param(body) if (c := coin_lookup(k))}}
    if path == "/json/coinvolume":
        return {"source": "coingecko.com", "data": {k: {"volume_24h": c[3] * 120000, "price_change_24h": c[4]} for k in coins_param(body) if (c := coin_lookup(k))}}
    if path == "/json/coinhistory":
        return {"source": "coingecko.com", "data": {k: series(c[0] * 7 + 3, 96, c[3], 1.2, 0.03 if c[4] > 0 else -0.03) for k in coins_param(body) if (c := coin_lookup(k))}}
    if path == "/json/identities/" or path.startswith("/json/identities/"):
        return []
    if path in ("/json/sentbids", "/json/bids"):
        return []
    if path == "/json/walletbalances":
        return [{"id": c[0], "name": c[1], "balance": b, "pending": "0.0"} for c, b in ((COINS[[x[0] for x in COINS].index(i)], b) for i, _, b in balances())]
    if path == "/amm/state":
        return {"success": True, "status": "running", "amm_version": "1.0.0", "template_runtime": {}, "bid_runtime": {}}
    if path == "/mock/ids":
        return {"offer": TAKEN["offer_id"], "bid": BID_ID}
    if path.startswith("/json/wallettransactions/"):
        return {"transactions": BTC_TXS, "page_no": 1, "total": len(BTC_TXS), "total_pages": 1}
    if path == "/json/rate":
        from urllib.parse import parse_qs

        f = {k: v[0] for k, v in parse_qs(body.decode()).items()}
        amt_from, rate = float(f.get("amt_from", 0)), float(f.get("rate", 0))
        return {"amount_to": f"{amt_from * rate:.8f}", "rate": f"{rate:.8f}"}
    if path == "/json/bids/plan":
        return plan(body)
    if path.startswith("/json/bids/"):
        return {}
    if path == "/json/checkupdates" or path == "/json/updatestatus":
        return {"update_available": False}
    if path == "/json/heartbeat":
        return {"ok": True}
    return {}


def page_offers(rest, query):
    coins = [(c[0], c[1]) for c in COINS]
    return "offers.html", {
        "page_type": "Order Book",
        "page_button": "hidden",
        "page_type_description": "Consult available offers in the order book and initiate a coin swap.",
        "show_chart": True,
        "coins_from": coins,
        "coins": coins,
        "messages": [],
        "filters": {"coin_from": -1, "coin_to": -1, "page_no": 1, "sort_by": "created_at", "sort_dir": "desc", "sent_from": "any", "auto_accept_type": "any"},
        "offers": [],
        "sent_offers": False,
        "offers_count": len(OFFERS),
        "tla_from": "",
        "tla_to": "",
        "enabled_chart_coins": "",
    }


# ---- the offer taken in the film: 25 XMR for BTC ------------------------------
TAKEN = OFFERS[0]
BID_AT = NOW - 60 * 20  # the bid went out 20 minutes ago
BID_ID = msg_id("bid", BID_AT)
MY_ADDR = part_addr("me")


def balances():
    """(id, name, balance) per coin, as listAvailableCoinsWithBalances gives."""
    held = {"BTC": "0.48120344", "XMR": "31.204811372250", "LTC": "84.21900311", "PART": "1240.55120000", "FIRO": "512.00000000", "DOGE": "15020.11000000", "BCH": "3.20500000", "DASH": "11.04000000"}
    return [(c[0], c[1], held.get(c[2], "0.0")) for c in COINS if c[2] in held]


def page_offer(rest, query):
    o = TAKEN
    bid = query.get("bid") == "1"
    send = query.get("send", "")
    return "offer.html", {
        "offer_id": o["offer_id"],
        "sent_bid_id": None,
        "messages": [],
        "err_messages": [],
        "bids": [],
        "addrs": [(MY_ADDR, "")],
        "data": {
            "tla_from": "XMR", "tla_to": "BTC",
            "state": "Received",
            "coin_from": "Monero", "coin_to": "Bitcoin",
            "coin_from_ind": 6, "coin_to_ind": 2,
            "coin_from_exp": 12, "coin_to_exp": 8,
            "amt_from": "25.000000000000", "amt_to": o["amount_to"],
            "amt_bid_min": "0.250000000000",
            "rate": o["rate"],
            "lock_type": "Sequence lock, time", "lock_value": 7200, "lock_value_hr": " (2.0 hours)",
            "addr_from": o["addr_from"], "addr_to": "Public",
            "created_at": o["created_at"], "expired_at": o["expire_at"],
            "sent": False, "was_revoked": False,
            "show_bid_form": bid, "show_edit_form": False,
            "amount_negotiable": True, "rate_negotiable": False,
            "bid_amount": query.get("recv", ""), "bid_rate": o["rate"],
            "nb_validmins": 10, "nb_addr_from": MY_ADDR,
            "debug_ui": False, "automation_strat_id": -1,
            "is_expired": False, "active_ind": 1,
            "swap_type": "Adaptor Sig", "reverse": True,
            "auto_accept_type": 1,
            "xmr_type": True, "a_fee_rate": "0.00002000", "a_fee_rate_verify": "0.00002000", "a_fee_rate_verify_src": "estimatesmartfee",
            "amt_swapped": "0.000000000000",
            "coin_to_balance": "0.48120344",
            "bid_can_subfee": False,
            "tracking_max_fills": None,
            "_send": send,
        },
    }


# Bid states the film walks through (basicswap_util.BidStates), with the
# description describeBid gives a bidder swapping BTC (script coin, leader)
# for XMR (scriptless, follower).
BID_STEPS = [
    (1, "Sent", "Bid sent, waiting for offerer to accept"),
    (5, "Accepted", "Bid accepted, waiting for bidder to respond"),
    (9, "Script coin locked", "BTC lock tx confirmed, waiting for XMR lock tx"),
    (11, "Scriptless coin locked", "Both lock txs confirmed, waiting for bidder to release the BTC lock tx"),
    (12, "Script coin lock released", "Lock released, waiting for offerer to spend from BTC lock tx"),
    (8, "Completed", "Swap completed successfully"),
]


def page_bid(rest, query):
    step = max(0, min(len(BID_STEPS) - 1, int(query.get("step", "0"))))
    ind, name, desc = BID_STEPS[step]
    t0 = BID_AT  # the states follow every 4 minutes
    old = [(t0 + 60 * 4 * i, BID_STEPS[i][1]) for i in range(step)]
    stamp = lambda t: time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(t))  # noqa: E731
    return "bid_xmr.html", {
        "bid_id": BID_ID,
        "messages": [],
        "err_messages": [],
        "edit_bid": False,
        "old_states": list(reversed(old)),
        "data": {
            "coin_from": "Monero", "coin_to": "Bitcoin",
            "ticker_from": "XMR", "ticker_to": "BTC",
            "amt_from": "14.855949287732", "amt_to": "0.10000000",
            "bid_rate": "0.00673131",
            "bid_state": name, "bid_state_ind": ind,
            "state_description": desc,
            "offer_id": TAKEN["offer_id"],
            "addr_from": MY_ADDR, "addr_from_label": "",
            "created_at": stamp(t0), "created_at_timestamp": t0,
            "expired_at": stamp(t0 + 600),
            "state_time_timestamp": NOW - 30,
            "was_sent": True, "was_received": False,
            "reverse_bid": True,
            "show_txns": False, "txns": [], "events": [],
            "can_accept_bid": False, "can_abandon": step < 2,
            "debug_ui": False,
            "lock_transfers": [],
            "coin_a_lock_refund_tx_est_final": NOW + 7200,
            "coin_a_lock_refund_swipe_tx_est_final": NOW + 14400,
            "coin_a_last_median_time": NOW - 300,
            "show_bidder_seq_diagram": False, "show_offerer_seq_diagram": False,
        },
    }


# ---- the Bitcoin wallet (wallet.html) -------------------------------------------
def minute_stamp(t: int) -> str:
    """format_timestamp's default: %Y-%m-%d %H:%M."""
    return time.strftime("%Y-%m-%d %H:%M", time.localtime(t))


# Its history ends with the swap's lock: 0.1 BTC into the 2-of-2 lock output
# (a P2WSH address), plus the network fee.
SWAP_LOCK = {"txid": txid("btc-lock"), "address": "bc1q" + _pick("btc-lock", BECH32, 58)}
BTC_TXS = [
    {"txid": SWAP_LOCK["txid"], "type": "Outgoing", "amount": "0.10002040", "confirmations": 3, "timestamp": minute_stamp(BID_AT + 5 * 60), "address": SWAP_LOCK["address"], "tx_class": "", "is_swap": True},
    {"txid": txid("btc-in-1"), "type": "Incoming", "amount": "0.25000000", "confirmations": 288, "timestamp": minute_stamp(NOW - 2 * 86400), "address": btc_addr("deposit-1"), "tx_class": "", "is_swap": False},
    {"txid": txid("btc-out-1"), "type": "Outgoing", "amount": "0.04201320", "confirmations": 1031, "timestamp": minute_stamp(NOW - 7 * 86400 - 3600 * 5), "address": btc_addr("payee-1"), "tx_class": "", "is_swap": False},
    {"txid": txid("btc-in-2"), "type": "Incoming", "amount": "0.18000000", "confirmations": 2112, "timestamp": minute_stamp(NOW - 15 * 86400), "address": btc_addr("deposit-2"), "tx_class": "", "is_swap": False},
    {"txid": txid("btc-in-3"), "type": "Incoming", "amount": "0.19323704", "confirmations": 4380, "timestamp": minute_stamp(NOW - 31 * 86400), "address": btc_addr("deposit-3"), "tx_class": "", "is_swap": False},
]


def page_wallet(rest, query):
    c = BY_TICKER["BTC"]
    w = wallet(c, "0.48120344", blocks=968402, version="28.1.0")
    w.update({
        "deposit_address": btc_addr("deposit-4"),
        "main_address": "",
        "known_block_count": 968402,
        "wallet_blocks": 968402,
        "utxo_value": "0.00000000",
        "fee_rate": "0.00002000",
        "est_fee": "0.00000282",
        "wd_address": "", "wd_value": "", "wd_subfee": False, "wd_sweepall": False,
        "show_utxo_groups": False,
        "locked_utxos": 1,
        "pending_out": "0.00000000",
    })
    return "wallet.html", {
        "messages": [], "err_messages": [],
        "w": w,
        "block_unknown_seeds": True,
        "donation_info": None,
        "debug_ui": False,
        "transactions": [],
        "tx_page_no": 1, "tx_total": len(BTC_TXS), "tx_limit": 30,
        "is_electrum_mode": False,
    }


def page_smartbuy(rest, query):
    coins = balances()
    # ?defaults=real shows BasicSwap's own defaults (15 bids, 5% over the
    # market rate) for the docs; the homepage tour uses the demo values.
    real = query.get("defaults", "") == "real"
    return "smartbuy.html", {
        "coins_from": coins,
        "coins": coins,
        "default_anchor": "market",
        "default_slip_percent": 5.0 if real else 1.0,
        "default_max_bids": 15 if real else 5,
        "batch_caps": {},
    }


def page_newoffer(rest, query):
    """Create Single Offer: the trade step, or ?step=terms for the terms step,
    with a BTC-for-XMR offer filled in as a reader would."""
    coins = balances()
    btc = next(c for c in COINS if c[2] == "BTC")[0]
    xmr = next(c for c in COINS if c[2] == "XMR")[0]
    data = {
        "coin_from": btc,
        "coin_to": xmr,
        "amt_from": "0.05000000",
        "amt_to": "3.104500000000",
        "rate": "62.09000000",
        "amt_bid_min": "0.010",
        "offer_mode": "one_time",
        "addr_from": MY_ADDR,
        "addr_to": -1,
        "fee_from_conf": 2,
        "fee_to_conf": 2,
        "validhrs": 1,
        "lockhrs": 24,
        "lockmins": 30,
        "automation_strat_id": 1,
        "swap_type": "xmr_swap",
        "amt_var": True,
        "rate_var": False,
    }
    step = query.get("step", "trade")
    return ("offer_new_2.html" if step == "terms" else "offer_new_1.html"), {
        "coins_from": coins,
        "coins": coins,
        "addrs": [(MY_ADDR, "")],
        "addrs_to": [],
        "data": data,
        "automation_strategies": [(1, "Accept All"), (2, "Accept Known")],
        "swap_types": [("seller_first", "Secret Hash"), ("xmr_swap", "Adaptor Sig")],
        "show_chart": True,
    }


def wallet(c, bal, pending="0.00000000", blocks=0, version="", extra=None):
    w = {
        "name": c[1], "ticker": c[2], "cid": str(c[0]), "version": version,
        "balance": bal, "pending": pending, "blocks": blocks, "synced": "100.00",
        "expected_seed": True, "encrypted": True, "locked": False, "updating": False,
        "havedata": True, "connection_type": "rpc", "lastupdated": "1 min ago",
    }
    w.update(extra or {})
    return w


def page_wallets(rest, query):
    b = BY_TICKER
    return "wallets.html", {
        "messages": [], "err_messages": [], "use_tor": True,
        "wallets": [
            wallet(b["PART"], "1240.55120000", blocks=2061811, version="23.2.9", extra={"blind_balance": "320.00000000", "anon_balance": "0.00000000"}),
            wallet(b["BTC"], "0.48120344", blocks=968402, version="28.1.0"),
            wallet(b["LTC"], "84.21900311", blocks=3012960, version="0.21.4", extra={"mweb_balance": "2.50000000"}),
            wallet(b["XMR"], "31.204811372250", pending="0.000000000000", blocks=3512407, version="0.18.4.3"),
            wallet(b["FIRO"], "512.00000000", blocks=1170344, version="0.14.18.1", extra={"spark_balance": "48.00000000"}),
            wallet(b["BCH"], "3.20500000", blocks=921033, version="28.0.1"),
            wallet(b["DOGE"], "15020.11000000", blocks=5911204, version="1.14.9"),
            wallet(b["DASH"], "11.04000000", blocks=2350112, version="22.1.3"),
        ],
    }


AMM_CONFIG = {
    "min_seconds_between_offers": 60,
    "max_seconds_between_offers": 240,
    "offers": [
        {"enabled": True, "coin_from": "Monero", "coin_to": "Bitcoin", "amount": 20, "amount_step": 2, "min_coin_from_amt": 1, "minrate": 0.0066, "ratetweakpercent": 1.5, "amount_variable": True, "adjust_rates_based_on_market": True, "address": "auto", "name": "XMR to BTC", "offer_valid_seconds": 3600},
        {"enabled": True, "coin_from": "Litecoin", "coin_to": "Monero", "amount": 60, "amount_step": 5, "min_coin_from_amt": 5, "minrate": 0.105, "ratetweakpercent": 1, "amount_variable": True, "adjust_rates_based_on_market": True, "address": "auto", "name": "LTC to XMR", "offer_valid_seconds": 3600},
        {"enabled": True, "coin_from": "Bitcoin", "coin_to": "Litecoin", "amount": 0.2, "amount_step": 0.02, "min_coin_from_amt": 0.01, "minrate": 1360, "ratetweakpercent": 0.8, "amount_variable": True, "adjust_rates_based_on_market": True, "address": "auto", "name": "BTC to LTC", "offer_valid_seconds": 3600},
        {"enabled": False, "coin_from": "Particl", "coin_to": "Monero", "amount": 500, "amount_step": 50, "min_coin_from_amt": 100, "minrate": 0.00038, "ratetweakpercent": 5, "amount_variable": True, "address": "auto", "name": "PART to XMR", "offer_valid_seconds": 3600},
    ],
    "bids": [
        {"enabled": True, "coin_from": "Monero", "coin_to": "Bitcoin", "amount": 5, "max_rate": 0.0069, "max_concurrent": 2, "min_coin_to_balance": 0.05, "amount_variable": True, "address": "auto", "name": "Buy XMR with BTC"},
    ],
}


def page_amm(rest, query):
    cfg = json.dumps(AMM_CONFIG, indent=4)
    return "amm.html", {
        "messages": [], "err_messages": [],
        "amm_dir": "/home/user/.basicswap/AMM",
        "config_path": "/home/user/.basicswap/AMM/createoffers.json",
        "state_path": "/home/user/.basicswap/AMM/createoffers_state.json",
        "script_path": "scripts/createoffers.py",
        "config_exists": True, "state_exists": True, "script_exists": True,
        "config_content": cfg, "config_data": AMM_CONFIG,
        "state_content": "{}", "state_data": {},
        "current_status": "running",
        "logs": [],
        "amm_host": "127.0.0.1", "amm_port": 12700,
        "amm_debug": False, "amm_autostart": True,
        "debug_ui_mode": False,
        "coins": balances(),
    }


PAGES = {
    "offers": page_offers,
    "offer": page_offer,
    "bid": page_bid,
    "smartbuy": page_smartbuy,
    "newoffer": page_newoffer,
    "wallets": page_wallets,
    "wallet": page_wallet,
    "amm": page_amm,
}
