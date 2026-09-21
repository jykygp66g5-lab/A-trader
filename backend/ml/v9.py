from __future__ import annotations

import numpy as np
import pandas as pd


V9_REGIME_FEATURE_COLUMNS = [
    "spy_trend_strength_20_200",
    "spy_trend_strength_50_200",
    "spy_volatility_ratio_20_60",
    "spy_drawdown_20",
    "spy_drawdown_60",
    "spy_momentum_acceleration",
    "qqq_spy_relative_20",
    "qqq_spy_relative_60",
    "qqq_spy_momentum_spread",
]


def _safe_divide(
    numerator: pd.Series,
    denominator: pd.Series,
) -> pd.Series:
    denominator = denominator.replace(
        0,
        np.nan,
    )

    return numerator / denominator


def build_v9_regime_features(
    spy_data: pd.DataFrame,
    qqq_data: pd.DataFrame,
) -> pd.DataFrame:
    """
    Build market-regime features using only information
    available on or before each date.

    No future prices are used.
    """

    spy_close = (
        spy_data["Close"]
        .astype(float)
        .copy()
    )

    qqq_close = (
        qqq_data["Close"]
        .astype(float)
        .copy()
    )

    aligned = pd.concat(
        [
            spy_close.rename(
                "spy_close"
            ),
            qqq_close.rename(
                "qqq_close"
            ),
        ],
        axis=1,
        join="inner",
    ).sort_index()

    spy = aligned[
        "spy_close"
    ]

    qqq = aligned[
        "qqq_close"
    ]

    spy_return = spy.pct_change()

    spy_sma20 = (
        spy
        .rolling(20)
        .mean()
    )

    spy_sma50 = (
        spy
        .rolling(50)
        .mean()
    )

    spy_sma200 = (
        spy
        .rolling(200)
        .mean()
    )

    spy_vol20 = (
        spy_return
        .rolling(20)
        .std()
    )

    spy_vol60 = (
        spy_return
        .rolling(60)
        .std()
    )

    spy_high20 = (
        spy
        .rolling(20)
        .max()
    )

    spy_high60 = (
        spy
        .rolling(60)
        .max()
    )

    spy_perf5 = (
        spy.pct_change(5)
        * 100.0
    )

    spy_perf20 = (
        spy.pct_change(20)
        * 100.0
    )

    spy_perf60 = (
        spy.pct_change(60)
        * 100.0
    )

    qqq_perf20 = (
        qqq.pct_change(20)
        * 100.0
    )

    qqq_perf60 = (
        qqq.pct_change(60)
        * 100.0
    )

    features = pd.DataFrame(
        index=aligned.index
    )

    features[
        "spy_trend_strength_20_200"
    ] = (
        _safe_divide(
            spy_sma20,
            spy_sma200,
        )
        - 1.0
    ) * 100.0

    features[
        "spy_trend_strength_50_200"
    ] = (
        _safe_divide(
            spy_sma50,
            spy_sma200,
        )
        - 1.0
    ) * 100.0

    features[
        "spy_volatility_ratio_20_60"
    ] = _safe_divide(
        spy_vol20,
        spy_vol60,
    )

    features[
        "spy_drawdown_20"
    ] = (
        _safe_divide(
            spy,
            spy_high20,
        )
        - 1.0
    ) * 100.0

    features[
        "spy_drawdown_60"
    ] = (
        _safe_divide(
            spy,
            spy_high60,
        )
        - 1.0
    ) * 100.0

    features[
        "spy_momentum_acceleration"
    ] = (
        spy_perf5
        - (
            spy_perf20 / 4.0
        )
    )

    features[
        "qqq_spy_relative_20"
    ] = (
        qqq_perf20
        - spy_perf20
    )

    features[
        "qqq_spy_relative_60"
    ] = (
        qqq_perf60
        - spy_perf60
    )

    features[
        "qqq_spy_momentum_spread"
    ] = (
        (
            qqq_perf20
            - spy_perf20
        )
        - (
            (
                qqq_perf60
                - spy_perf60
            )
            / 3.0
        )
    )

    return features[
        V9_REGIME_FEATURE_COLUMNS
    ]


def add_v9_regime_features(
    frame: pd.DataFrame,
    spy_data: pd.DataFrame,
    qqq_data: pd.DataFrame,
) -> pd.DataFrame:
    regime = build_v9_regime_features(
        spy_data=spy_data,
        qqq_data=qqq_data,
    )

    result = frame.copy()

    for column in (
        V9_REGIME_FEATURE_COLUMNS
    ):
        result[column] = (
            result.index.map(
                regime[column]
            )
        )

    return result
