from __future__ import annotations

import numpy as np
import pandas as pd

from .features import (
    V2_FEATURE_COLUMNS,
    build_v2_feature_frame,
)

from .snapshot import (
    load_snapshot,
)


V3_HORIZONS = [
    5,
    10,
    20,
]


def extract_close(
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
            0
        ]

    return (
        close
        .astype(float)
        .rename(
            "close"
        )
    )


def build_multi_horizon_targets(
    stock_data: pd.DataFrame,
    spy_data: pd.DataFrame,
    horizons: list[int] | None = None,
) -> pd.DataFrame:
    if horizons is None:
        horizons = V3_HORIZONS

    stock_close = extract_close(
        stock_data,
    ).rename(
        "stock_close"
    )

    spy_close = extract_close(
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

    targets = pd.DataFrame(
        index=prices.index,
    )

    for horizon in horizons:
        stock_future = prices[
            "stock_close"
        ].shift(
            -horizon
        )

        spy_future = prices[
            "spy_close"
        ].shift(
            -horizon
        )

        stock_return = (
            (
                stock_future
                / prices[
                    "stock_close"
                ]
            )
            - 1
        ) * 100

        spy_return = (
            (
                spy_future
                / prices[
                    "spy_close"
                ]
            )
            - 1
        ) * 100

        relative_return = (
            stock_return
            - spy_return
        )

        complete_future = (
            stock_future.notna()
            & spy_future.notna()
        )

        targets[
            f"future_return_{horizon}d_percent"
        ] = stock_return.where(
            complete_future,
            np.nan,
        )

        targets[
            f"spy_future_return_{horizon}d_percent"
        ] = spy_return.where(
            complete_future,
            np.nan,
        )

        targets[
            f"relative_return_{horizon}d_percent"
        ] = relative_return.where(
            complete_future,
            np.nan,
        )

    return targets


def build_v3_symbol_frame(
    symbol: str,
) -> pd.DataFrame:
    stock_data = load_snapshot(
        symbol
    )

    spy_data = load_snapshot(
        "SPY"
    )

    qqq_data = load_snapshot(
        "QQQ"
    )

    features = build_v2_feature_frame(
        stock_data=stock_data,
        spy_data=spy_data,
        qqq_data=qqq_data,
    )

    targets = build_multi_horizon_targets(
        stock_data=stock_data,
        spy_data=spy_data,
    )

    frame = features.join(
        targets,
        how="inner",
    )

    frame[
        "symbol"
    ] = symbol.upper()

    return (
        frame
        .replace(
            [
                np.inf,
                -np.inf,
            ],
            np.nan,
        )
        .sort_index()
        .copy()
    )


def build_v3_dataset(
    symbols: list[str],
) -> pd.DataFrame:
    frames: list[
        pd.DataFrame
    ] = []

    for symbol in symbols:
        clean_symbol = (
            symbol
            .strip()
            .upper()
        )

        if not clean_symbol:
            continue

        print(
            f"Building {clean_symbol}..."
        )

        frame = build_v3_symbol_frame(
            clean_symbol
        )

        frames.append(
            frame
        )

    if not frames:
        raise ValueError(
            "No V3 data was created."
        )

    combined = pd.concat(
        frames,
        axis=0,
    )

    return (
        combined
        .sort_index(
            kind="stable",
        )
        .copy()
    )
