from __future__ import annotations

import numpy as np
import pandas as pd


# =========================================================
# FEATURE CONFIGURATION
# =========================================================

FEATURE_COLUMNS = [
    "return_1d_percent",
    "rsi_14",
    "distance_sma_20_percent",
    "distance_sma_50_percent",
    "distance_sma_200_percent",
    "sma_20_50_spread_percent",
    "sma_50_200_spread_percent",
    "macd_percent",
    "macd_signal_percent",
    "macd_histogram_percent",
    "volume_ratio_20",
    "atr_14_percent",
    "volatility_20_percent",
    "volatility_60_percent",
    "performance_5d_percent",
    "performance_20d_percent",
    "performance_60d_percent",
    "distance_52w_high_percent",
    "distance_52w_low_percent",
    "range_52w_position",
]


MINIMUM_FEATURE_BARS = 200


# =========================================================
# HELPERS
# =========================================================

def _extract_series(
    data: pd.DataFrame,
    column: str,
) -> pd.Series:
    values = data[column]

    if isinstance(
        values,
        pd.DataFrame,
    ):
        values = values.iloc[:, 0]

    return (
        values
        .astype(float)
        .sort_index()
    )


def _percentage_change(
    current: pd.Series,
    previous: pd.Series,
) -> pd.Series:
    denominator = previous.replace(
        0,
        np.nan,
    )

    return (
        (
            current
            - previous
        )
        / denominator
        * 100
    )


# =========================================================
# RSI
# =========================================================

def calculate_rsi_series(
    close: pd.Series,
    period: int = 14,
) -> pd.Series:
    delta = close.diff()

    gain = delta.clip(
        lower=0,
    )

    loss = -delta.clip(
        upper=0,
    )

    average_gain = (
        gain
        .ewm(
            alpha=1 / period,
            adjust=False,
            min_periods=period,
        )
        .mean()
    )

    average_loss = (
        loss
        .ewm(
            alpha=1 / period,
            adjust=False,
            min_periods=period,
        )
        .mean()
    )

    relative_strength = (
        average_gain
        / average_loss.replace(
            0,
            np.nan,
        )
    )

    rsi = (
        100
        - (
            100
            / (
                1
                + relative_strength
            )
        )
    )

    return rsi


# =========================================================
# FEATURE GENERATION
# =========================================================

def build_feature_frame(
    data: pd.DataFrame,
) -> pd.DataFrame:
    """
    Build historical ML features using only information
    available on or before each row's timestamp.

    No future values are used here.
    """

    if data.empty:
        raise ValueError(
            "Cannot build ML features from empty market data."
        )

    close = _extract_series(
        data,
        "Close",
    )

    high = _extract_series(
        data,
        "High",
    )

    low = _extract_series(
        data,
        "Low",
    )

    volume = _extract_series(
        data,
        "Volume",
    )

    if len(close) < MINIMUM_FEATURE_BARS:
        raise ValueError(
            f"At least {MINIMUM_FEATURE_BARS} daily bars "
            "are required to build ML features."
        )

    features = pd.DataFrame(
        index=close.index,
    )

    # -----------------------------------------------------
    # RETURNS
    # -----------------------------------------------------

    features[
        "return_1d_percent"
    ] = (
        close
        .pct_change()
        * 100
    )

    # -----------------------------------------------------
    # MOVING AVERAGES
    # -----------------------------------------------------

    sma_20 = (
        close
        .rolling(20)
        .mean()
    )

    sma_50 = (
        close
        .rolling(50)
        .mean()
    )

    sma_200 = (
        close
        .rolling(200)
        .mean()
    )

    features[
        "distance_sma_20_percent"
    ] = _percentage_change(
        close,
        sma_20,
    )

    features[
        "distance_sma_50_percent"
    ] = _percentage_change(
        close,
        sma_50,
    )

    features[
        "distance_sma_200_percent"
    ] = _percentage_change(
        close,
        sma_200,
    )

    features[
        "sma_20_50_spread_percent"
    ] = _percentage_change(
        sma_20,
        sma_50,
    )

    features[
        "sma_50_200_spread_percent"
    ] = _percentage_change(
        sma_50,
        sma_200,
    )

    # -----------------------------------------------------
    # RSI
    # -----------------------------------------------------

    features[
        "rsi_14"
    ] = calculate_rsi_series(
        close,
        14,
    )

    # -----------------------------------------------------
    # MACD
    #
    # Normalize MACD by price so stocks with very
    # different nominal prices remain comparable.
    # -----------------------------------------------------

    ema_12 = (
        close
        .ewm(
            span=12,
            adjust=False,
        )
        .mean()
    )

    ema_26 = (
        close
        .ewm(
            span=26,
            adjust=False,
        )
        .mean()
    )

    macd = (
        ema_12
        - ema_26
    )

    macd_signal = (
        macd
        .ewm(
            span=9,
            adjust=False,
        )
        .mean()
    )

    macd_histogram = (
        macd
        - macd_signal
    )

    features[
        "macd_percent"
    ] = (
        macd
        / close.replace(
            0,
            np.nan,
        )
        * 100
    )

    features[
        "macd_signal_percent"
    ] = (
        macd_signal
        / close.replace(
            0,
            np.nan,
        )
        * 100
    )

    features[
        "macd_histogram_percent"
    ] = (
        macd_histogram
        / close.replace(
            0,
            np.nan,
        )
        * 100
    )

    # -----------------------------------------------------
    # VOLUME
    # -----------------------------------------------------

    average_volume_20 = (
        volume
        .rolling(20)
        .mean()
    )

    features[
        "volume_ratio_20"
    ] = (
        volume
        / average_volume_20.replace(
            0,
            np.nan,
        )
    )

    # -----------------------------------------------------
    # ATR
    # -----------------------------------------------------

    previous_close = close.shift(
        1,
    )

    true_range = pd.concat(
        [
            high - low,

            (
                high
                - previous_close
            ).abs(),

            (
                low
                - previous_close
            ).abs(),
        ],
        axis=1,
    ).max(
        axis=1,
    )

    atr_14 = (
        true_range
        .rolling(14)
        .mean()
    )

    features[
        "atr_14_percent"
    ] = (
        atr_14
        / close.replace(
            0,
            np.nan,
        )
        * 100
    )

    # -----------------------------------------------------
    # VOLATILITY
    # -----------------------------------------------------

    returns = (
        close
        .pct_change()
    )

    features[
        "volatility_20_percent"
    ] = (
        returns
        .rolling(20)
        .std()
        * np.sqrt(252)
        * 100
    )

    features[
        "volatility_60_percent"
    ] = (
        returns
        .rolling(60)
        .std()
        * np.sqrt(252)
        * 100
    )

    # -----------------------------------------------------
    # MOMENTUM / PERFORMANCE
    # -----------------------------------------------------

    features[
        "performance_5d_percent"
    ] = (
        close
        .pct_change(5)
        * 100
    )

    features[
        "performance_20d_percent"
    ] = (
        close
        .pct_change(20)
        * 100
    )

    features[
        "performance_60d_percent"
    ] = (
        close
        .pct_change(60)
        * 100
    )

    # -----------------------------------------------------
    # 52-WEEK RANGE
    #
    # 252 trading sessions approximates one year.
    # Rolling windows ensure historical rows cannot see
    # future highs or lows.
    # -----------------------------------------------------

    rolling_high_252 = (
        high
        .rolling(
            252,
            min_periods=200,
        )
        .max()
    )

    rolling_low_252 = (
        low
        .rolling(
            252,
            min_periods=200,
        )
        .min()
    )

    features[
        "distance_52w_high_percent"
    ] = _percentage_change(
        close,
        rolling_high_252,
    )

    features[
        "distance_52w_low_percent"
    ] = _percentage_change(
        close,
        rolling_low_252,
    )

    rolling_range = (
        rolling_high_252
        - rolling_low_252
    )

    features[
        "range_52w_position"
    ] = (
        (
            close
            - rolling_low_252
        )
        / rolling_range.replace(
            0,
            np.nan,
        )
    )

    # -----------------------------------------------------
    # CLEANUP
    # -----------------------------------------------------

    features = features.replace(
        [
            np.inf,
            -np.inf,
        ],
        np.nan,
    )

    return features[
        FEATURE_COLUMNS
    ]


# =========================================================
# LATEST LIVE FEATURE VECTOR
# =========================================================

def latest_feature_row(
    data: pd.DataFrame,
) -> pd.DataFrame:
    """
    Return the newest complete feature row in the exact
    column order expected by trained models.
    """

    features = build_feature_frame(
        data,
    )

    complete = (
        features
        .dropna(
            subset=FEATURE_COLUMNS,
        )
    )

    if complete.empty:
        raise ValueError(
            "No complete ML feature row is available."
        )

    return complete[
        FEATURE_COLUMNS
    ].tail(1)


# =========================================================
# MARKET CONTEXT FEATURES
# =========================================================

MARKET_FEATURE_COLUMNS = [
    # Relative strength
    "relative_spy_5d_percent",
    "relative_spy_20d_percent",
    "relative_spy_60d_percent",
    "relative_qqq_5d_percent",
    "relative_qqq_20d_percent",
    "relative_qqq_60d_percent",

    # SPY market regime
    "spy_rsi_14",
    "spy_distance_sma_20_percent",
    "spy_distance_sma_50_percent",
    "spy_distance_sma_200_percent",
    "spy_performance_5d_percent",
    "spy_performance_20d_percent",
    "spy_performance_60d_percent",
    "spy_volatility_20_percent",
    "spy_volatility_60_percent",
    "spy_above_sma_200",
    "spy_bull_structure",

    # QQQ context
    "qqq_rsi_14",
    "qqq_distance_sma_50_percent",
    "qqq_distance_sma_200_percent",
    "qqq_performance_20d_percent",
    "qqq_performance_60d_percent",

    # Stock relationship to market
    "correlation_spy_60d",
    "beta_spy_60d",
]


V2_FEATURE_COLUMNS = (
    FEATURE_COLUMNS
    + MARKET_FEATURE_COLUMNS
)


def _build_market_reference_features(
    data: pd.DataFrame,
    prefix: str,
) -> pd.DataFrame:
    close = _extract_series(
        data,
        "Close",
    )

    returns = close.pct_change()

    sma_20 = close.rolling(
        20,
    ).mean()

    sma_50 = close.rolling(
        50,
    ).mean()

    sma_200 = close.rolling(
        200,
    ).mean()

    frame = pd.DataFrame(
        index=close.index,
    )

    frame[
        f"{prefix}_rsi_14"
    ] = calculate_rsi_series(
        close,
        14,
    )

    frame[
        f"{prefix}_distance_sma_20_percent"
    ] = _percentage_change(
        close,
        sma_20,
    )

    frame[
        f"{prefix}_distance_sma_50_percent"
    ] = _percentage_change(
        close,
        sma_50,
    )

    frame[
        f"{prefix}_distance_sma_200_percent"
    ] = _percentage_change(
        close,
        sma_200,
    )

    frame[
        f"{prefix}_performance_5d_percent"
    ] = (
        close.pct_change(
            5,
        )
        * 100
    )

    frame[
        f"{prefix}_performance_20d_percent"
    ] = (
        close.pct_change(
            20,
        )
        * 100
    )

    frame[
        f"{prefix}_performance_60d_percent"
    ] = (
        close.pct_change(
            60,
        )
        * 100
    )

    frame[
        f"{prefix}_volatility_20_percent"
    ] = (
        returns
        .rolling(
            20,
        )
        .std()
        * np.sqrt(
            252
        )
        * 100
    )

    frame[
        f"{prefix}_volatility_60_percent"
    ] = (
        returns
        .rolling(
            60,
        )
        .std()
        * np.sqrt(
            252
        )
        * 100
    )

    frame[
        f"{prefix}_above_sma_200"
    ] = (
        close
        > sma_200
    ).astype(float)

    frame[
        f"{prefix}_bull_structure"
    ] = (
        (
            close
            > sma_50
        )
        & (
            sma_50
            > sma_200
        )
    ).astype(float)

    return frame


def build_market_context_frame(
    stock_data: pd.DataFrame,
    spy_data: pd.DataFrame,
    qqq_data: pd.DataFrame,
) -> pd.DataFrame:
    """
    Build market/regime features using only information
    available on or before each timestamp.
    """

    stock_close = _extract_series(
        stock_data,
        "Close",
    )

    spy_close = _extract_series(
        spy_data,
        "Close",
    )

    qqq_close = _extract_series(
        qqq_data,
        "Close",
    )

    aligned_prices = pd.concat(
        [
            stock_close.rename(
                "stock",
            ),
            spy_close.rename(
                "spy",
            ),
            qqq_close.rename(
                "qqq",
            ),
        ],
        axis=1,
        join="inner",
    )

    context = pd.DataFrame(
        index=aligned_prices.index,
    )

    # -----------------------------------------------------
    # RELATIVE STRENGTH
    # -----------------------------------------------------

    for sessions in [
        5,
        20,
        60,
    ]:
        stock_performance = (
            aligned_prices[
                "stock"
            ]
            .pct_change(
                sessions,
            )
            * 100
        )

        spy_performance = (
            aligned_prices[
                "spy"
            ]
            .pct_change(
                sessions,
            )
            * 100
        )

        qqq_performance = (
            aligned_prices[
                "qqq"
            ]
            .pct_change(
                sessions,
            )
            * 100
        )

        context[
            f"relative_spy_{sessions}d_percent"
        ] = (
            stock_performance
            - spy_performance
        )

        context[
            f"relative_qqq_{sessions}d_percent"
        ] = (
            stock_performance
            - qqq_performance
        )

    # -----------------------------------------------------
    # SPY / QQQ REGIME
    # -----------------------------------------------------

    spy_features = (
        _build_market_reference_features(
            spy_data,
            "spy",
        )
        .reindex(
            context.index,
        )
    )

    qqq_features = (
        _build_market_reference_features(
            qqq_data,
            "qqq",
        )
        .reindex(
            context.index,
        )
    )

    spy_columns = [
        "spy_rsi_14",
        "spy_distance_sma_20_percent",
        "spy_distance_sma_50_percent",
        "spy_distance_sma_200_percent",
        "spy_performance_5d_percent",
        "spy_performance_20d_percent",
        "spy_performance_60d_percent",
        "spy_volatility_20_percent",
        "spy_volatility_60_percent",
        "spy_above_sma_200",
        "spy_bull_structure",
    ]

    qqq_columns = [
        "qqq_rsi_14",
        "qqq_distance_sma_50_percent",
        "qqq_distance_sma_200_percent",
        "qqq_performance_20d_percent",
        "qqq_performance_60d_percent",
    ]

    context = context.join(
        spy_features[
            spy_columns
        ],
        how="left",
    )

    context = context.join(
        qqq_features[
            qqq_columns
        ],
        how="left",
    )

    # -----------------------------------------------------
    # STOCK / SPY RELATIONSHIP
    # -----------------------------------------------------

    stock_returns = (
        aligned_prices[
            "stock"
        ]
        .pct_change()
    )

    spy_returns = (
        aligned_prices[
            "spy"
        ]
        .pct_change()
    )

    context[
        "correlation_spy_60d"
    ] = (
        stock_returns
        .rolling(
            60,
        )
        .corr(
            spy_returns,
        )
    )

    covariance = (
        stock_returns
        .rolling(
            60,
        )
        .cov(
            spy_returns,
        )
    )

    spy_variance = (
        spy_returns
        .rolling(
            60,
        )
        .var()
    )

    context[
        "beta_spy_60d"
    ] = (
        covariance
        / spy_variance.replace(
            0,
            np.nan,
        )
    )

    context = context.replace(
        [
            np.inf,
            -np.inf,
        ],
        np.nan,
    )

    return context[
        MARKET_FEATURE_COLUMNS
    ]


def build_v2_feature_frame(
    stock_data: pd.DataFrame,
    spy_data: pd.DataFrame,
    qqq_data: pd.DataFrame,
) -> pd.DataFrame:
    stock_features = build_feature_frame(
        stock_data,
    )

    market_features = build_market_context_frame(
        stock_data=stock_data,
        spy_data=spy_data,
        qqq_data=qqq_data,
    )

    combined = stock_features.join(
        market_features,
        how="inner",
    )

    combined = combined.replace(
        [
            np.inf,
            -np.inf,
        ],
        np.nan,
    )

    return combined[
        V2_FEATURE_COLUMNS
    ]
