from __future__ import annotations

from typing import Any

import pandas as pd
import yfinance as yf


REQUIRED_OHLCV_COLUMNS = [
    "Open",
    "High",
    "Low",
    "Close",
    "Volume",
]


def download_market_data(
    tickers: str | list[str],
    *,
    period: str | None = None,
    interval: str = "1d",
    start: Any | None = None,
    end: Any | None = None,
    auto_adjust: bool = True,
    progress: bool = False,
    prepost: bool = False,
    threads: bool = False,
    group_by: str = "column",
) -> pd.DataFrame:
    """
    Canonical market-data download entry point.

    This deliberately preserves the current yfinance
    behavior while giving A-Trader one place to manage
    providers, retries, caching, validation, and logging
    later.
    """

    kwargs: dict[str, Any] = {
        "tickers": tickers,
        "interval": interval,
        "auto_adjust": auto_adjust,
        "progress": progress,
        "prepost": prepost,
        "threads": threads,
        "group_by": group_by,
    }

    if period is not None:
        kwargs["period"] = period

    if start is not None:
        kwargs["start"] = start

    if end is not None:
        kwargs["end"] = end

    data = yf.download(
        **kwargs,
    )

    if not isinstance(data, pd.DataFrame):
        raise TypeError(
            "Market data provider returned an unexpected "
            f"type: {type(data).__name__}."
        )

    return data


def normalize_single_symbol_frame(
    data: pd.DataFrame,
    symbol: str,
) -> pd.DataFrame:
    """
    Normalize a single symbol to standard OHLCV columns.

    Handles both ordinary yfinance frames and MultiIndex
    frames returned by single- or multi-symbol downloads.
    """

    clean_symbol = (
        symbol
        .strip()
        .upper()
    )

    if not clean_symbol:
        raise ValueError(
            "A valid market symbol is required."
        )

    if data.empty:
        raise ValueError(
            f"No market data available for {clean_symbol}."
        )

    if not isinstance(
        data.columns,
        pd.MultiIndex,
    ):
        result = data.copy()

    else:
        level_0 = {
            str(value)
            for value
            in data.columns.get_level_values(0)
        }

        level_1 = {
            str(value)
            for value
            in data.columns.get_level_values(1)
        }

        if clean_symbol in level_1:
            result = data.xs(
                clean_symbol,
                axis=1,
                level=1,
            ).copy()

        elif clean_symbol in level_0:
            result = data.xs(
                clean_symbol,
                axis=1,
                level=0,
            ).copy()

        else:
            # Single-symbol yfinance downloads can still
            # return a MultiIndex whose symbol level is not
            # useful to callers. In that case flatten the
            # OHLCV level when it is unambiguous.
            level_0_has_ohlcv = all(
                column in level_0
                for column in REQUIRED_OHLCV_COLUMNS
            )

            if level_0_has_ohlcv:
                result = data.copy()
                result.columns = (
                    result.columns
                    .get_level_values(0)
                )

            else:
                raise ValueError(
                    f"Could not locate {clean_symbol} "
                    "in market data."
                )

    missing = [
        column
        for column in REQUIRED_OHLCV_COLUMNS
        if column not in result.columns
    ]

    if missing:
        raise ValueError(
            f"{clean_symbol} market data missing columns: "
            + ", ".join(missing)
        )

    return (
        result[
            REQUIRED_OHLCV_COLUMNS
        ]
        .dropna(
            subset=["Close"],
        )
        .sort_index()
        .copy()
    )
