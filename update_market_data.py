from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo


ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = ROOT / "data" / "market-data.json"

HOLDINGS = {
    "2330": "2330.TW",
    "2317": "2317.TW",
    "2382": "2382.TW",
    "2027": "2027.TW",
}

INDICATORS = {
    "台積電 ADR": "TSM",
    "輝達": "NVDA",
    "費城半導體": "^SOX",
    "NASDAQ": "^IXIC",
    "VIX": "^VIX",
    "美元指數": "DX-Y.NYB",
    "美債 10Y": "^TNX",
}


def pct_direction(change: float) -> str:
    if change > 0:
        return "up"
    if change < 0:
        return "down"
    return "flat"


def format_pct(change: float) -> str:
    return f"{change:+.2f}%"


def fetch_quote(yf, symbol: str) -> tuple[float | None, float | None]:
    history = yf.Ticker(symbol).history(period="5d", interval="1d")
    if history.empty or "Close" not in history:
        return None, None

    closes = [float(value) for value in history["Close"].dropna().tolist()]
    if not closes:
        return None, None

    last = closes[-1]
    if len(closes) < 2 or closes[-2] == 0:
        return last, None

    change = ((last - closes[-2]) / closes[-2]) * 100
    return last, change


def load_existing() -> dict:
    if DATA_FILE.exists():
        return json.loads(DATA_FILE.read_text(encoding="utf-8"))
    return {}


def main() -> None:
    import yfinance as yf

    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    existing = load_existing()
    taipei_now = datetime.now(ZoneInfo("Asia/Taipei")).strftime("%Y-%m-%d %H:%M")

    holdings = existing.get("holdings", {})
    for stock_id, ticker in HOLDINGS.items():
        price, _ = fetch_quote(yf, ticker)
        if price is None:
            continue
        current = holdings.get(stock_id, {})
        current["price"] = round(price, 2)
        holdings[stock_id] = current

    values = {}
    for name, ticker in INDICATORS.items():
        price, change = fetch_quote(yf, ticker)
        if price is None:
            continue
        values[name] = {
            "price": price,
            "change": change,
            "direction": pct_direction(change or 0),
        }

    def item(name: str) -> list[str]:
        data = values.get(name)
        if not data:
            return [name, "待更新", "flat"]
        if data["change"] is None:
            return [name, f"{data['price']:.2f}", "flat"]
        return [name, f"{data['price']:.2f} / {format_pct(data['change'])}", data["direction"]]

    indicator_groups = [
        {
            "title": "AI / 半導體市場",
            "items": [item("台積電 ADR"), item("輝達"), item("費城半導體"), item("NASDAQ")],
        },
        {
            "title": "風險與美元",
            "items": [item("美債 10Y"), item("VIX"), item("美元指數")],
        },
        existing.get("indicatorGroups", [{}, {}, {"title": "台股相關", "items": []}])[2],
    ]

    output = {
        **existing,
        "updatedAt": taipei_now,
        "holdings": holdings,
        "indicatorGroups": indicator_groups,
    }

    DATA_FILE.write_text(
        json.dumps(output, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
