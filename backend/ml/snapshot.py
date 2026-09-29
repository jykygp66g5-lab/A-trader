from __future__ import annotations

from pathlib import Path

import pandas as pd

from market_data import download_market_data


SNAPSHOT_DIRECTORY = (
    Path(__file__).resolve().parent
    / "data"
)

DEFAULT_SYMBOLS = [
    "AAPL",
    "MSFT",
    "NVDA",
    "AMZN",
    "GOOGL",
    "META",
    "AMD",
    "JPM",
    "SPY",
    "QQQ",
]


def download_daily_history(
    symbol: str,
    period: str = "10y",
) -> pd.DataFrame:
    print(
        f"Downloading {symbol}..."
    )

    data = download_market_data(
        symbol,
        period=period,
        interval="1d",
        auto_adjust=True,
        progress=False,
        prepost=False,
        threads=False,
    )

    if data.empty:
        raise ValueError(
            f"No market data returned for {symbol}."
        )

    # yfinance can return MultiIndex columns.
    # For a single ticker, flatten them to:
    # Open / High / Low / Close / Volume.
    if isinstance(
        data.columns,
        pd.MultiIndex,
    ):
        data.columns = (
            data.columns
            .get_level_values(0)
        )

    data = (
        data
        .sort_index()
        .copy()
    )

    return data


def save_snapshot(
    symbol: str,
    data: pd.DataFrame,
) -> Path:
    SNAPSHOT_DIRECTORY.mkdir(
        parents=True,
        exist_ok=True,
    )

    path = (
        SNAPSHOT_DIRECTORY
        / f"{symbol.upper()}_daily.csv"
    )

    data.to_csv(
        path,
        index=True,
    )

    return path


def build_snapshot(
    symbols: list[str] | None = None,
    period: str = "10y",
) -> dict[str, Path]:
    if symbols is None:
        symbols = DEFAULT_SYMBOLS

    saved: dict[
        str,
        Path,
    ] = {}

    for symbol in symbols:
        clean_symbol = (
            symbol
            .strip()
            .upper()
        )

        if not clean_symbol:
            continue

        data = download_daily_history(
            symbol=clean_symbol,
            period=period,
        )

        path = save_snapshot(
            symbol=clean_symbol,
            data=data,
        )

        saved[
            clean_symbol
        ] = path

        print(
            f"Saved {clean_symbol}: "
            f"{len(data)} rows -> {path}"
        )

    return saved


def load_snapshot(
    symbol: str,
) -> pd.DataFrame:
    clean_symbol = (
        symbol
        .strip()
        .upper()
    )

    path = (
        SNAPSHOT_DIRECTORY
        / f"{clean_symbol}_daily.csv"
    )

    if not path.exists():
        raise FileNotFoundError(
            f"No snapshot found for {clean_symbol}: {path}"
        )

    data = pd.read_csv(
        path,
        index_col=0,
        parse_dates=True,
    )

    data.index.name = "Date"

    return (
        data
        .sort_index()
        .copy()
    )


if __name__ == "__main__":
    paths = build_snapshot()

    print()
    print(
        "========== SNAPSHOT COMPLETE =========="
    )

    for symbol, path in paths.items():
        print(
            f"{symbol}: {path}"
        )
