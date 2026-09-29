from __future__ import annotations

from collections import OrderedDict
from datetime import datetime
from threading import Lock
from time import monotonic, sleep
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


MARKET_DATA_MAX_ATTEMPTS = 3

MARKET_DATA_RETRY_DELAYS = (
    0.5,
    1.0,
)


# =========================================================
# IN-MEMORY MARKET DATA CACHE
# =========================================================

MARKET_DATA_CACHE_MAX_ENTRIES = 64

MARKET_DATA_INTRADAY_TTL_SECONDS = 20.0
MARKET_DATA_DAILY_TTL_SECONDS = 300.0
MARKET_DATA_WEEKLY_TTL_SECONDS = 900.0


_market_data_cache: OrderedDict[
    tuple[Any, ...],
    tuple[float, pd.DataFrame],
] = OrderedDict()

_market_data_cache_lock = Lock()


def _normalize_tickers_for_cache(
    tickers: str | list[str],
) -> tuple[str, ...]:
    if isinstance(
        tickers,
        str,
    ):
        return (
            tickers.strip().upper(),
        )

    return tuple(
        str(ticker)
        .strip()
        .upper()
        for ticker in tickers
    )


def _cache_value(
    value: Any,
) -> Any:
    if isinstance(
        value,
        datetime,
    ):
        return value.isoformat()

    if hasattr(
        value,
        "isoformat",
    ):
        try:
            return value.isoformat()
        except Exception:
            pass

    return str(
        value,
    ) if value is not None else None


def _market_data_cache_key(
    *,
    tickers: str | list[str],
    period: str | None,
    interval: str,
    start: Any | None,
    end: Any | None,
    auto_adjust: bool,
    progress: bool,
    prepost: bool,
    threads: bool,
    group_by: str,
) -> tuple[Any, ...]:
    return (
        _normalize_tickers_for_cache(
            tickers,
        ),
        period,
        interval,
        _cache_value(start),
        _cache_value(end),
        auto_adjust,
        progress,
        prepost,
        threads,
        group_by,
    )


def _cache_ttl_for_interval(
    interval: str,
) -> float:
    if interval in {
        "1m",
        "2m",
        "5m",
        "15m",
        "30m",
        "60m",
        "90m",
        "1h",
    }:
        return (
            MARKET_DATA_INTRADAY_TTL_SECONDS
        )

    if interval in {
        "1wk",
        "1mo",
        "3mo",
    }:
        return (
            MARKET_DATA_WEEKLY_TTL_SECONDS
        )

    return (
        MARKET_DATA_DAILY_TTL_SECONDS
    )


def _get_cached_market_data(
    key: tuple[Any, ...],
    *,
    ttl_seconds: float,
) -> pd.DataFrame | None:
    now = monotonic()

    with _market_data_cache_lock:
        cached = (
            _market_data_cache.get(
                key,
            )
        )

        if cached is None:
            return None

        cached_at, frame = cached

        if (
            now
            - cached_at
            > ttl_seconds
        ):
            del _market_data_cache[
                key
            ]
            return None

        _market_data_cache.move_to_end(
            key,
        )

        return frame.copy(
            deep=True,
        )


def _store_cached_market_data(
    key: tuple[Any, ...],
    frame: pd.DataFrame,
) -> None:
    if frame.empty:
        return

    with _market_data_cache_lock:
        _market_data_cache[
            key
        ] = (
            monotonic(),
            frame.copy(
                deep=True,
            ),
        )

        _market_data_cache.move_to_end(
            key,
        )

        while (
            len(
                _market_data_cache
            )
            > MARKET_DATA_CACHE_MAX_ENTRIES
        ):
            _market_data_cache.popitem(
                last=False,
            )


def clear_market_data_cache() -> None:
    with _market_data_cache_lock:
        _market_data_cache.clear()


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

    cache_key = _market_data_cache_key(
        tickers=tickers,
        period=period,
        interval=interval,
        start=start,
        end=end,
        auto_adjust=auto_adjust,
        progress=progress,
        prepost=prepost,
        threads=threads,
        group_by=group_by,
    )

    cache_ttl = (
        _cache_ttl_for_interval(
            interval,
        )
    )

    cached = (
        _get_cached_market_data(
            cache_key,
            ttl_seconds=cache_ttl,
        )
    )

    if cached is not None:
        return cached

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

    last_error: Exception | None = None

    for attempt in range(
        1,
        MARKET_DATA_MAX_ATTEMPTS + 1,
    ):
        try:
            data = yf.download(
                **kwargs,
            )

            if not isinstance(
                data,
                pd.DataFrame,
            ):
                raise TypeError(
                    "Market data provider returned an "
                    "unexpected type: "
                    f"{type(data).__name__}."
                )

            _store_cached_market_data(
                cache_key,
                data,
            )

            return data.copy(
                deep=True,
            )

        except Exception as exc:
            last_error = exc

            if (
                attempt
                >= MARKET_DATA_MAX_ATTEMPTS
            ):
                break

            delay = (
                MARKET_DATA_RETRY_DELAYS[
                    attempt - 1
                ]
            )

            sleep(
                delay,
            )

    raise RuntimeError(
        "Market data download failed after "
        f"{MARKET_DATA_MAX_ATTEMPTS} attempts."
    ) from last_error


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
