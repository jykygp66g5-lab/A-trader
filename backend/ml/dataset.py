from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd
import yfinance as yf

from .features import (
    FEATURE_COLUMNS,
    build_feature_frame,
)


# =========================================================
# DATASET CONFIGURATION
# =========================================================

DEFAULT_FORWARD_SESSIONS = 5
DEFAULT_PERIOD = "10y"

TARGET_COLUMN = "target"
FUTURE_RETURN_COLUMN = "future_return_percent"
SYMBOL_COLUMN = "symbol"


# =========================================================
# DATASET RESULT
# =========================================================

@dataclass
class SymbolDataset:
    symbol: str
    frame: pd.DataFrame

    @property
    def sample_count(
        self,
    ) -> int:
        return len(
            self.frame,
        )


# =========================================================
# HELPERS
# =========================================================

def _extract_close(
    data: pd.DataFrame,
) -> pd.Series:
    close = data[
        "Close"
    ]

    if isinstance(
        close,
        pd.DataFrame,
    ):
        close = close.iloc[
            :,
            0,
        ]

    return (
        close
        .astype(float)
        .sort_index()
    )


# =========================================================
# TARGET GENERATION
# =========================================================

def build_target_frame(
    data: pd.DataFrame,
    forward_sessions: int = DEFAULT_FORWARD_SESSIONS,
) -> pd.DataFrame:
    """
    Build the supervised-learning target.

    Row t asks:

        Is adjusted close at t + forward_sessions
        greater than adjusted close at t?

    The future price is used ONLY to create the label.
    It is never included in FEATURE_COLUMNS.
    """

    if forward_sessions < 1:
        raise ValueError(
            "forward_sessions must be at least 1."
        )

    close = _extract_close(
        data,
    )

    future_close = close.shift(
        -forward_sessions,
    )

    future_return = (
        (
            future_close
            / close
        )
        - 1
    ) * 100

    target = (
        future_return
        > 0
    ).astype(
        "Int64"
    )

    # Critical:
    # pandas would otherwise turn unknown future rows
    # into False/0 when comparing NaN > 0.
    target = target.where(
        future_close.notna(),
        pd.NA,
    )

    return pd.DataFrame(
        {
            FUTURE_RETURN_COLUMN:
                future_return,

            TARGET_COLUMN:
                target,
        },
        index=close.index,
    )


# =========================================================
# SINGLE-SYMBOL DATASET
# =========================================================

def build_symbol_dataset_from_data(
    symbol: str,
    data: pd.DataFrame,
    forward_sessions: int = DEFAULT_FORWARD_SESSIONS,
) -> SymbolDataset:
    features = build_feature_frame(
        data,
    )

    targets = build_target_frame(
        data,
        forward_sessions=forward_sessions,
    )

    frame = features.join(
        targets,
        how="inner",
    )

    frame[
        SYMBOL_COLUMN
    ] = symbol.upper()

    required_columns = (
        FEATURE_COLUMNS
        + [
            FUTURE_RETURN_COLUMN,
            TARGET_COLUMN,
        ]
    )

    frame = (
        frame
        .replace(
            [
                np.inf,
                -np.inf,
            ],
            np.nan,
        )
        .dropna(
            subset=required_columns,
        )
        .copy()
    )

    frame[
        TARGET_COLUMN
    ] = (
        frame[
            TARGET_COLUMN
        ]
        .astype(int)
    )

    return SymbolDataset(
        symbol=symbol.upper(),
        frame=frame,
    )


def download_symbol_dataset(
    symbol: str,
    period: str = DEFAULT_PERIOD,
    forward_sessions: int = DEFAULT_FORWARD_SESSIONS,
) -> SymbolDataset:
    ticker = (
        symbol
        .strip()
        .upper()
    )

    if not ticker:
        raise ValueError(
            "Symbol cannot be empty."
        )

    data = yf.download(
        ticker,
        period=period,
        interval="1d",
        auto_adjust=True,
        progress=False,
        prepost=False,
        threads=False,
    )

    if data.empty:
        raise ValueError(
            f"No historical market data returned for {ticker}."
        )

    return build_symbol_dataset_from_data(
        symbol=ticker,
        data=data,
        forward_sessions=forward_sessions,
    )


# =========================================================
# MULTI-SYMBOL DATASET
# =========================================================

def build_multi_symbol_dataset(
    symbols: list[str],
    period: str = DEFAULT_PERIOD,
    forward_sessions: int = DEFAULT_FORWARD_SESSIONS,
) -> tuple[
    pd.DataFrame,
    dict[str, str],
]:
    """
    Download and combine multiple symbols.

    Returns:
        combined dataframe
        failures dictionary {symbol: error}
    """

    frames: list[
        pd.DataFrame
    ] = []

    failures: dict[
        str,
        str,
    ] = {}

    seen: set[
        str
    ] = set()

    for raw_symbol in symbols:
        symbol = (
            raw_symbol
            .strip()
            .upper()
        )

        if (
            not symbol
            or symbol in seen
        ):
            continue

        seen.add(
            symbol,
        )

        try:
            dataset = download_symbol_dataset(
                symbol=symbol,
                period=period,
                forward_sessions=forward_sessions,
            )

            if dataset.frame.empty:
                failures[
                    symbol
                ] = (
                    "No complete training samples."
                )

                continue

            frames.append(
                dataset.frame,
            )

        except Exception as exc:
            failures[
                symbol
            ] = str(
                exc,
            )

    if not frames:
        raise ValueError(
            "No usable ML training data was created."
        )

    combined = pd.concat(
        frames,
        axis=0,
    )

    combined = (
        combined
        .sort_index(
            kind="stable",
        )
        .copy()
    )

    return (
        combined,
        failures,
    )


# =========================================================
# V2 DATASET
# =========================================================

def build_symbol_v2_dataset_from_data(
    symbol: str,
    stock_data: pd.DataFrame,
    spy_data: pd.DataFrame,
    qqq_data: pd.DataFrame,
    forward_sessions: int = DEFAULT_FORWARD_SESSIONS,
) -> SymbolDataset:
    from .features import (
        V2_FEATURE_COLUMNS,
        build_v2_feature_frame,
    )

    features = build_v2_feature_frame(
        stock_data=stock_data,
        spy_data=spy_data,
        qqq_data=qqq_data,
    )

    targets = build_target_frame(
        stock_data,
        forward_sessions=forward_sessions,
    )

    frame = features.join(
        targets,
        how="inner",
    )

    frame[
        SYMBOL_COLUMN
    ] = symbol.upper()

    frame = frame.replace(
        [
            np.inf,
            -np.inf,
        ],
        np.nan,
    )

    required_columns = (
        V2_FEATURE_COLUMNS
        + [
            FUTURE_RETURN_COLUMN,
            TARGET_COLUMN,
        ]
    )

    frame = frame.dropna(
        subset=required_columns,
    )

    frame[
        TARGET_COLUMN
    ] = frame[
        TARGET_COLUMN
    ].astype(int)

    return SymbolDataset(
        symbol=symbol.upper(),
        frame=frame,
    )


def build_multi_symbol_v2_dataset(
    symbols: list[str],
    period: str = DEFAULT_PERIOD,
    forward_sessions: int = DEFAULT_FORWARD_SESSIONS,
) -> tuple[
    pd.DataFrame,
    dict[str, str],
]:
    from .features import (
        V2_FEATURE_COLUMNS,
    )

    unique_symbols = list(
        dict.fromkeys(
            symbol.upper().strip()
            for symbol in symbols
            if symbol.strip()
        )
    )

    if not unique_symbols:
        raise ValueError(
            "Enter at least one symbol."
        )

    print(
        "Downloading SPY..."
    )

    spy_data = yf.download(
        "SPY",
        period=period,
        interval="1d",
        auto_adjust=True,
        progress=False,
        prepost=False,
        threads=False,
    )

    print(
        "Downloading QQQ..."
    )

    qqq_data = yf.download(
        "QQQ",
        period=period,
        interval="1d",
        auto_adjust=True,
        progress=False,
        prepost=False,
        threads=False,
    )

    if spy_data.empty:
        raise ValueError(
            "SPY market data is empty."
        )

    if qqq_data.empty:
        raise ValueError(
            "QQQ market data is empty."
        )

    frames: list[
        pd.DataFrame
    ] = []

    failures: dict[
        str,
        str,
    ] = {}

    for symbol in unique_symbols:
        try:
            print(
                f"Downloading {symbol}..."
            )

            stock_data = yf.download(
                symbol,
                period=period,
                interval="1d",
                auto_adjust=True,
                progress=False,
                prepost=False,
                threads=False,
            )

            if stock_data.empty:
                raise ValueError(
                    "Downloaded market data is empty."
                )

            dataset = (
                build_symbol_v2_dataset_from_data(
                    symbol=symbol,
                    stock_data=stock_data,
                    spy_data=spy_data,
                    qqq_data=qqq_data,
                    forward_sessions=forward_sessions,
                )
            )

            if dataset.frame.empty:
                raise ValueError(
                    "No complete V2 training rows were created."
                )

            frames.append(
                dataset.frame
            )

        except Exception as exc:
            failures[
                symbol
            ] = str(
                exc
            )

    if not frames:
        raise ValueError(
            "No usable V2 ML training data was created."
        )

    combined = pd.concat(
        frames,
        axis=0,
    )

    combined = (
        combined
        .sort_index(
            kind="stable",
        )
        .copy()
    )

    expected_columns = (
        V2_FEATURE_COLUMNS
        + [
            FUTURE_RETURN_COLUMN,
            TARGET_COLUMN,
            SYMBOL_COLUMN,
        ]
    )

    combined = combined[
        expected_columns
    ]

    return (
        combined,
        failures,
    )


# =========================================================
# RELATIVE PERFORMANCE TARGET
# =========================================================

RELATIVE_TARGET_COLUMN = "relative_target"

RELATIVE_FUTURE_RETURN_COLUMN = (
    "relative_future_return_percent"
)

SPY_FUTURE_RETURN_COLUMN = (
    "spy_future_return_percent"
)


def build_relative_target_frame(
    stock_data: pd.DataFrame,
    spy_data: pd.DataFrame,
    forward_sessions: int = DEFAULT_FORWARD_SESSIONS,
) -> pd.DataFrame:
    """
    Build a target measuring whether the stock
    outperforms SPY over the next N trading sessions.

    relative_target:
        1 = stock future return > SPY future return
        0 = stock future return <= SPY future return

    All newest rows without a complete future horizon
    remain unknown.
    """

    stock_close = _extract_close(
        stock_data,
    ).rename(
        "stock_close"
    )

    spy_close = _extract_close(
        spy_data,
    ).rename(
        "spy_close"
    )

    prices = pd.concat(
        [
            stock_close,
            spy_close,
        ],
        axis=1,
        join="inner",
    ).sort_index()

    stock_future_close = prices[
        "stock_close"
    ].shift(
        -forward_sessions
    )

    spy_future_close = prices[
        "spy_close"
    ].shift(
        -forward_sessions
    )

    stock_future_return = (
        (
            stock_future_close
            / prices[
                "stock_close"
            ]
        )
        - 1
    ) * 100

    spy_future_return = (
        (
            spy_future_close
            / prices[
                "spy_close"
            ]
        )
        - 1
    ) * 100

    relative_future_return = (
        stock_future_return
        - spy_future_return
    )

    relative_target = (
        relative_future_return
        > 0
    ).astype(
        "Int64"
    )

    complete_future = (
        stock_future_close.notna()
        & spy_future_close.notna()
    )

    relative_target = relative_target.where(
        complete_future,
        pd.NA,
    )

    relative_future_return = (
        relative_future_return.where(
            complete_future,
            pd.NA,
        )
    )

    spy_future_return = (
        spy_future_return.where(
            complete_future,
            pd.NA,
        )
    )

    return pd.DataFrame(
        {
            SPY_FUTURE_RETURN_COLUMN:
                spy_future_return,

            RELATIVE_FUTURE_RETURN_COLUMN:
                relative_future_return,

            RELATIVE_TARGET_COLUMN:
                relative_target,
        },
        index=prices.index,
    )


# =========================================================
# V2 RELATIVE-TARGET DATASET
# =========================================================

def build_symbol_v2_relative_dataset_from_data(
    symbol: str,
    stock_data: pd.DataFrame,
    spy_data: pd.DataFrame,
    qqq_data: pd.DataFrame,
    forward_sessions: int = DEFAULT_FORWARD_SESSIONS,
) -> SymbolDataset:
    from .features import (
        V2_FEATURE_COLUMNS,
        build_v2_feature_frame,
    )

    features = build_v2_feature_frame(
        stock_data=stock_data,
        spy_data=spy_data,
        qqq_data=qqq_data,
    )

    relative_targets = build_relative_target_frame(
        stock_data=stock_data,
        spy_data=spy_data,
        forward_sessions=forward_sessions,
    )

    frame = features.join(
        relative_targets,
        how="inner",
    )

    frame[
        SYMBOL_COLUMN
    ] = symbol.upper()

    frame = frame.replace(
        [
            np.inf,
            -np.inf,
        ],
        np.nan,
    )

    required_columns = (
        V2_FEATURE_COLUMNS
        + [
            SPY_FUTURE_RETURN_COLUMN,
            RELATIVE_FUTURE_RETURN_COLUMN,
            RELATIVE_TARGET_COLUMN,
        ]
    )

    frame = frame.dropna(
        subset=required_columns,
    )

    frame[
        RELATIVE_TARGET_COLUMN
    ] = frame[
        RELATIVE_TARGET_COLUMN
    ].astype(
        int
    )

    return SymbolDataset(
        symbol=symbol.upper(),
        frame=frame,
    )


def build_multi_symbol_v2_relative_dataset(
    symbols: list[str],
    period: str = DEFAULT_PERIOD,
    forward_sessions: int = DEFAULT_FORWARD_SESSIONS,
) -> tuple[
    pd.DataFrame,
    dict[str, str],
]:
    from .features import (
        V2_FEATURE_COLUMNS,
    )

    unique_symbols = list(
        dict.fromkeys(
            symbol.upper().strip()
            for symbol in symbols
            if symbol.strip()
        )
    )

    if not unique_symbols:
        raise ValueError(
            "Enter at least one symbol."
        )

    print(
        "Downloading SPY..."
    )

    spy_data = yf.download(
        "SPY",
        period=period,
        interval="1d",
        auto_adjust=True,
        progress=False,
        prepost=False,
        threads=False,
    )

    print(
        "Downloading QQQ..."
    )

    qqq_data = yf.download(
        "QQQ",
        period=period,
        interval="1d",
        auto_adjust=True,
        progress=False,
        prepost=False,
        threads=False,
    )

    if spy_data.empty:
        raise ValueError(
            "SPY market data is empty."
        )

    if qqq_data.empty:
        raise ValueError(
            "QQQ market data is empty."
        )

    frames: list[
        pd.DataFrame
    ] = []

    failures: dict[
        str,
        str,
    ] = {}

    for symbol in unique_symbols:
        try:
            print(
                f"Downloading {symbol}..."
            )

            stock_data = yf.download(
                symbol,
                period=period,
                interval="1d",
                auto_adjust=True,
                progress=False,
                prepost=False,
                threads=False,
            )

            if stock_data.empty:
                raise ValueError(
                    "Downloaded market data is empty."
                )

            dataset = (
                build_symbol_v2_relative_dataset_from_data(
                    symbol=symbol,
                    stock_data=stock_data,
                    spy_data=spy_data,
                    qqq_data=qqq_data,
                    forward_sessions=forward_sessions,
                )
            )

            if dataset.frame.empty:
                raise ValueError(
                    "No complete relative-target rows were created."
                )

            frames.append(
                dataset.frame
            )

        except Exception as exc:
            failures[
                symbol
            ] = str(
                exc
            )

    if not frames:
        raise ValueError(
            "No usable relative-target training data was created."
        )

    combined = pd.concat(
        frames,
        axis=0,
    )

    combined = (
        combined
        .sort_index(
            kind="stable",
        )
        .copy()
    )

    expected_columns = (
        V2_FEATURE_COLUMNS
        + [
            SPY_FUTURE_RETURN_COLUMN,
            RELATIVE_FUTURE_RETURN_COLUMN,
            RELATIVE_TARGET_COLUMN,
            SYMBOL_COLUMN,
        ]
    )

    combined = combined[
        expected_columns
    ]

    return (
        combined,
        failures,
    )
