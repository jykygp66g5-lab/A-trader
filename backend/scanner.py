from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from typing import Any, Callable, Literal

import numpy as np
import pandas as pd
from market_data import download_market_data

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    Query,
    Request,
    status,
)

from sqlmodel import SQLModel

from ml.predictor import (
    get_v7_predictor,
    predict_live_v7_universe,
)


# =========================================================
# CONFIGURATION
# =========================================================

DEFAULT_SCAN_UNIVERSE = [
    # Mega-cap technology
    "AAPL",
    "MSFT",
    "NVDA",
    "AMZN",
    "GOOGL",
    "META",
    "TSLA",

    # Semiconductors
    "AMD",
    "AVGO",
    "ARM",
    "MU",
    "QCOM",
    "INTC",
    "TSM",
    "ASML",
    "SMCI",

    # Software / cloud / cybersecurity
    "PLTR",
    "CRM",
    "ORCL",
    "NOW",
    "SNOW",
    "CRWD",
    "PANW",
    "NET",

    # Consumer / growth
    "NFLX",
    "UBER",
    "ABNB",
    "SHOP",
    "MELI",
    "COIN",
    "HOOD",

    # Financials
    "JPM",
    "BAC",
    "GS",
    "MS",
    "V",
    "MA",

    # Industrials / aerospace
    "CAT",
    "GE",
    "BA",
    "LMT",
    "RTX",

    # Energy
    "XOM",
    "CVX",
    "COP",
    "SLB",

    # Healthcare
    "LLY",
    "UNH",
    "ABBV",
    "MRK",

    # ETFs / market context
    "SPY",
    "QQQ",
    "IWM",
    "DIA",
]


MAX_CUSTOM_SYMBOLS = 60

MAX_SCAN_WORKERS = 8

MINIMUM_DAILY_BARS = 60


ScannerMode = Literal[
    "balanced",
    "aggressive",
]


# =========================================================
# RESPONSE MODELS
# =========================================================

class ScannerIndicators(SQLModel):
    rsi: float

    sma_20: float
    sma_50: float
    sma_200: float | None

    distance_sma_20_percent: float
    distance_sma_50_percent: float
    distance_sma_200_percent: float | None

    macd: float
    macd_signal: float
    macd_histogram: float

    volume_ratio: float

    volatility_percent: float

    performance_5d_percent: float
    performance_20d_percent: float
    performance_60d_percent: float | None

    distance_from_52w_high_percent: float | None
    distance_from_52w_low_percent: float | None

    atr_14: float | None = None

    intraday_vwap: float | None = None
    intraday_ema_9: float | None = None
    intraday_ema_20: float | None = None

    intraday_change_percent: float | None = None

    intraday_recent_momentum_percent: float | None = None

    intraday_session_position: float | None = None

    intraday_volume_ratio: float | None = None

    intraday_distance_vwap_percent: float | None = None

    intraday_distance_ema_9_percent: float | None = None

    intraday_ema_spread_percent: float | None = None


class ScannerCandidate(SQLModel):
    symbol: str

    price: float
    previous_close: float
    change_percent: float

    # -----------------------------------------------------
    # LEGACY VALUES
    # -----------------------------------------------------

    score: int
    score_max: int
    rating: str

    trend: str
    momentum: str

    volume_state: str
    volatility_state: str

    # -----------------------------------------------------
    # NEW CORE SCORES
    # -----------------------------------------------------

    trend_score: int

    intraday_score: int

    opportunity_score: int

    aggressive_score: int

    rank_score: int

    # -----------------------------------------------------
    # ML OPPORTUNITY RANKING
    # -----------------------------------------------------

    ml_rank: int | None = None

    ml_percentile: float | None = None

    ml_raw_score: float | None = None

    ml_universe_size: int | None = None

    intraday_trend: str

    action_state: str

    # -----------------------------------------------------
    # TRADE HORIZON
    # -----------------------------------------------------

    intraday_fit_score: int

    short_term_fit_score: int

    swing_fit_score: int

    long_term_fit_score: int

    trade_horizon: str

    secondary_horizon: str

    trade_duration: str

    # -----------------------------------------------------
    # TRADE LEVELS
    # -----------------------------------------------------

    potential_upside_percent: float

    potential_downside_percent: float

    reward_risk_ratio: float

    target_price: float | None

    invalidation_price: float | None

    target_source: str | None

    invalidation_source: str | None

    risk_level: str

    # -----------------------------------------------------
    # DETAILS
    # -----------------------------------------------------

    indicators: ScannerIndicators

    reasons: list[str]

    warnings: list[str]


class ScannerFailure(SQLModel):
    symbol: str

    reason: str


class ScannerResponse(SQLModel):
    generated_at: str

    mode: ScannerMode

    universe_size: int

    scanned: int

    matched: int

    minimum_score: int

    # -----------------------------------------------------
    # ML STATUS
    # -----------------------------------------------------

    ml_status: str

    ml_model: str | None = None

    ml_model_version: str | None = None

    ml_universe_size: int | None = None

    ml_error: str | None = None

    candidates: list[
        ScannerCandidate
    ]

    failed: list[
        ScannerFailure
    ]

    disclaimer: str


class ScannerJobStatus(SQLModel):
    status: str

    running: bool

    progress_percent: int

    completed: int

    total: int

    current_symbol: str | None

    minimum_score: int

    limit: int

    mode: ScannerMode

    started_at: str | None

    finished_at: str | None

    error: str | None


class ScannerJobStartResponse(SQLModel):
    message: str

    status: ScannerJobStatus


# =========================================================
# GENERAL HELPERS
# =========================================================

def sanitize_symbol(
    symbol: str,
) -> str:
    return (
        symbol
        .strip()
        .upper()
        .replace(
            " ",
            "",
        )
    )


def sanitize_symbols(
    symbols: list[str],
) -> list[str]:
    cleaned: list[str] = []

    seen: set[str] = set()

    for raw_symbol in symbols:
        symbol = sanitize_symbol(
            raw_symbol,
        )

        if not symbol:
            continue

        if symbol in seen:
            continue

        if len(symbol) > 15:
            continue

        cleaned.append(
            symbol,
        )

        seen.add(
            symbol,
        )

    return cleaned


def safe_float(
    value,
    default: float = 0.0,
) -> float:
    try:
        result = float(
            value,
        )

        if np.isnan(
            result,
        ):
            return default

        if np.isinf(
            result,
        ):
            return default

        return result

    except (
        TypeError,
        ValueError,
    ):
        return default


def round_optional(
    value: float | None,
    digits: int = 2,
) -> float | None:
    if value is None:
        return None

    try:
        result = float(
            value,
        )

        if np.isnan(
            result,
        ):
            return None

        if np.isinf(
            result,
        ):
            return None

        return round(
            result,
            digits,
        )

    except (
        TypeError,
        ValueError,
    ):
        return None


def clamp(
    value: float,
    minimum: float = 0.0,
    maximum: float = 100.0,
) -> float:
    return max(
        minimum,
        min(
            maximum,
            value,
        ),
    )


def percentage_change(
    current: float,
    previous: float,
) -> float:
    if previous == 0:
        return 0.0

    return (
        (
            current
            - previous
        )
        / previous
        * 100
    )


def linear_score(
    value: float,
    bearish_value: float,
    bullish_value: float,
) -> float:
    if bullish_value == bearish_value:
        return 50.0

    score = (
        (
            value
            - bearish_value
        )
        / (
            bullish_value
            - bearish_value
        )
        * 100
    )

    return clamp(
        score,
    )


# =========================================================
# MARKET DATA HELPERS
# =========================================================

def extract_series(
    data: pd.DataFrame,
    column: str,
) -> pd.Series:
    values = data[
        column
    ]

    if isinstance(
        values,
        pd.DataFrame,
    ):
        values = values.iloc[
            :,
            0,
        ]

    return (
        values
        .astype(
            float,
        )
        .dropna()
    )


def calculate_rsi(
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
            alpha=(
                1
                / period
            ),
            adjust=False,
            min_periods=period,
        )
        .mean()
    )

    average_loss = (
        loss
        .ewm(
            alpha=(
                1
                / period
            ),
            adjust=False,
            min_periods=period,
        )
        .mean()
    )

    relative_strength = (
        average_gain
        / average_loss
        .replace(
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

    return rsi.fillna(
        50,
    )


def calculate_period_performance(
    close: pd.Series,
    sessions: int,
) -> float | None:
    if len(
        close,
    ) <= sessions:
        return None

    current = float(
        close.iloc[
            -1
        ],
    )

    previous = float(
        close.iloc[
            -(sessions + 1)
        ],
    )

    if previous <= 0:
        return None

    return percentage_change(
        current,
        previous,
    )


def calculate_atr(
    high: pd.Series,
    low: pd.Series,
    close: pd.Series,
    period: int = 14,
) -> float | None:
    if (
        len(high) < period + 1
        or len(low) < period + 1
        or len(close) < period + 1
    ):
        return None

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

    atr_series = (
        true_range
        .rolling(
            period,
        )
        .mean()
    )

    atr = atr_series.iloc[
        -1
    ]

    if pd.isna(
        atr,
    ):
        return None

    return float(
        atr,
    )


# =========================================================
# LEGACY SCORE
# =========================================================

def score_candidate(
    *,
    price: float,
    sma_20: float,
    sma_50: float,
    sma_200: float | None,
    rsi: float,
    macd: float,
    macd_signal: float,
    volume_ratio: float,
    performance_5d: float,
    performance_20d: float,
    distance_from_high: float | None,
) -> tuple[
    int,
    list[str],
    list[str],
]:
    score = 0

    reasons: list[str] = []

    warnings: list[str] = []

    if price > sma_20:
        score += 1

        reasons.append(
            "Price is above the 20-day moving average.",
        )

    else:
        score -= 1

        warnings.append(
            "Price is below the 20-day moving average.",
        )

    if price > sma_50:
        score += 2

        reasons.append(
            "Price is above the 50-day moving average.",
        )

    else:
        score -= 2

        warnings.append(
            "Price is below the 50-day moving average.",
        )

    if sma_200 is not None:
        if price > sma_200:
            score += 2

            reasons.append(
                "Price is above the 200-day moving average.",
            )

        else:
            score -= 2

            warnings.append(
                "Price is below the 200-day moving average.",
            )

        if sma_50 > sma_200:
            score += 1

            reasons.append(
                "The 50-day average is above the 200-day average.",
            )

        else:
            score -= 1

    if (
        price
        > sma_20
        > sma_50
    ):
        score += 2

        reasons.append(
            "Short-term moving averages are positively aligned.",
        )

    if macd > macd_signal:
        score += 2

        reasons.append(
            "MACD momentum is above its signal line.",
        )

    else:
        score -= 1

        warnings.append(
            "MACD momentum is below its signal line.",
        )

    if (
        50
        <= rsi
        <= 65
    ):
        score += 2

        reasons.append(
            "RSI shows positive momentum without being extremely extended.",
        )

    elif (
        65
        < rsi
        <= 72
    ):
        score += 1

        reasons.append(
            "RSI shows strong momentum.",
        )

    elif rsi > 72:
        score -= 1

        warnings.append(
            "RSI is elevated, so the move may be extended.",
        )

    elif rsi < 30:
        score -= 1

        warnings.append(
            "RSI is deeply weak or oversold.",
        )

    if volume_ratio >= 1.5:
        score += 2

        reasons.append(
            "Recent volume is significantly above its 20-day average.",
        )

    elif volume_ratio >= 1.1:
        score += 1

        reasons.append(
            "Recent volume is above its 20-day average.",
        )

    elif volume_ratio < 0.65:
        score -= 1

        warnings.append(
            "Recent volume is relatively weak.",
        )

    if performance_5d > 2:
        score += 1

        reasons.append(
            "The stock has positive five-session momentum.",
        )

    elif performance_5d < -5:
        score -= 1

    if performance_20d > 5:
        score += 1

        reasons.append(
            "The stock has positive one-month momentum.",
        )

    elif performance_20d < -10:
        score -= 1

    if distance_from_high is not None:
        if (
            -8
            <= distance_from_high
            <= 0
        ):
            score += 2

            reasons.append(
                "Price is trading close to its 52-week high.",
            )

        elif distance_from_high < -30:
            score -= 1

            warnings.append(
                "Price remains far below its 52-week high.",
            )

    return (
        score,
        reasons,
        warnings,
    )


# =========================================================
# TREND SCORE
# =========================================================

def calculate_trend_score(
    *,
    price: float,
    sma_20: float,
    sma_50: float,
    sma_200: float | None,
    rsi: float,
    macd: float,
    macd_signal: float,
    performance_20d: float,
    performance_60d: float | None,
) -> int:
    score = 0.0

    if price > sma_20:
        score += 10

    if price > sma_50:
        score += 15

    if (
        sma_200 is not None
        and price > sma_200
    ):
        score += 15

    if (
        price
        > sma_20
        > sma_50
    ):
        score += 10

    if (
        sma_200 is not None
        and sma_50 > sma_200
    ):
        score += 10

    if macd > macd_signal:
        score += 10

    if (
        50
        <= rsi
        <= 70
    ):
        score += 10

    elif (
        45
        <= rsi
        < 50
    ):
        score += 5

    if performance_20d > 5:
        score += 10

    elif performance_20d > 0:
        score += 5

    if performance_60d is not None:
        if performance_60d > 10:
            score += 10

        elif performance_60d > 0:
            score += 5

    return int(
        round(
            clamp(
                score,
            )
        )
    )


# =========================================================
# INTRADAY ANALYSIS
# =========================================================

def analyze_intraday(
    symbol: str,
    fallback_price: float,
) -> dict[str, Any]:
    default_result = {
        "available":
            False,

        "price":
            fallback_price,

        "vwap":
            None,

        "ema_9":
            None,

        "ema_20":
            None,

        "change_percent":
            None,

        "recent_momentum_percent":
            None,

        "session_position":
            None,

        "volume_ratio":
            None,

        "distance_vwap_percent":
            None,

        "distance_ema_9_percent":
            None,

        "ema_spread_percent":
            None,

        "score":
            50,

        "trend":
            "Unavailable",
    }

    try:
        data = download_market_data(
            symbol,

            period="5d",

            interval="5m",

            auto_adjust=True,

            progress=False,

            prepost=False,

            threads=False,
        )

        if (
            data.empty
            or len(data) < 5
        ):
            return default_result

        close = extract_series(
            data,
            "Close",
        )

        if isinstance(
            data.index,
            pd.DatetimeIndex,
        ):
            latest_date = (
                data.index[
                    -1
                ]
                .date()
            )

            mask = (
                data.index.date
                == latest_date
            )

            session = data.loc[
                mask
            ]

        else:
            session = data

        if session.empty:
            return default_result

        session_close = extract_series(
            session,
            "Close",
        )

        session_high = extract_series(
            session,
            "High",
        )

        session_low = extract_series(
            session,
            "Low",
        )

        session_volume = extract_series(
            session,
            "Volume",
        )

        if len(
            session_close,
        ) < 2:
            return default_result

        current_price = float(
            session_close.iloc[
                -1
            ],
        )

        session_open = float(
            session_close.iloc[
                0
            ],
        )

        session_change = percentage_change(
            current_price,
            session_open,
        )

        ema_9_series = (
            close
            .ewm(
                span=9,
                adjust=False,
            )
            .mean()
        )

        ema_20_series = (
            close
            .ewm(
                span=20,
                adjust=False,
            )
            .mean()
        )

        ema_9 = float(
            ema_9_series.iloc[
                -1
            ],
        )

        ema_20 = float(
            ema_20_series.iloc[
                -1
            ],
        )

        typical_price = (
            session_high
            + session_low
            + session_close
        ) / 3

        cumulative_volume = (
            session_volume
            .cumsum()
        )

        if (
            len(
                cumulative_volume,
            ) == 0
            or cumulative_volume.iloc[
                -1
            ] <= 0
        ):
            vwap = current_price

        else:
            vwap_series = (
                (
                    typical_price
                    * session_volume
                )
                .cumsum()
                / cumulative_volume
            )

            vwap = float(
                vwap_series.iloc[
                    -1
                ],
            )

        session_high_value = float(
            session_high.max(),
        )

        session_low_value = float(
            session_low.min(),
        )

        session_range = (
            session_high_value
            - session_low_value
        )

        if session_range > 0:
            session_position = (
                (
                    current_price
                    - session_low_value
                )
                / session_range
            )

        else:
            session_position = 0.5

        lookback = min(
            6,
            len(
                session_close,
            ) - 1,
        )

        recent_previous = float(
            session_close.iloc[
                -(lookback + 1)
            ],
        )

        recent_momentum = percentage_change(
            current_price,
            recent_previous,
        )

        all_volume = extract_series(
            data,
            "Volume",
        )

        if len(
            all_volume,
        ) >= 20:
            average_bar_volume = float(
                all_volume
                .tail(
                    20,
                )
                .mean(),
            )

        else:
            average_bar_volume = float(
                all_volume.mean(),
            )

        latest_bar_volume = float(
            session_volume.iloc[
                -1
            ],
        )

        intraday_volume_ratio = (
            latest_bar_volume
            / average_bar_volume
            if average_bar_volume > 0
            else 0.0
        )

        distance_vwap = percentage_change(
            current_price,
            vwap,
        )

        distance_ema_9 = percentage_change(
            current_price,
            ema_9,
        )

        ema_spread = percentage_change(
            ema_9,
            ema_20,
        )

        # -------------------------------------------------
        # SMOOTHER INTRADAY SCORE
        # -------------------------------------------------

        vwap_score = linear_score(
            distance_vwap,
            -1.0,
            1.0,
        )

        ema_position_score = linear_score(
            distance_ema_9,
            -0.75,
            0.75,
        )

        ema_structure_score = linear_score(
            ema_spread,
            -0.75,
            0.75,
        )

        session_change_score = linear_score(
            session_change,
            -2.0,
            2.0,
        )

        recent_momentum_score = linear_score(
            recent_momentum,
            -1.0,
            1.0,
        )

        session_position_score = clamp(
            session_position
            * 100,
        )

        volume_score = linear_score(
            intraday_volume_ratio,
            0.5,
            1.75,
        )

        score = (
            vwap_score
            * 0.20

            + ema_position_score
            * 0.15

            + ema_structure_score
            * 0.15

            + session_change_score
            * 0.15

            + recent_momentum_score
            * 0.15

            + session_position_score
            * 0.15

            + volume_score
            * 0.05
        )

        score = int(
            round(
                clamp(
                    score,
                )
            )
        )

        if (
            score >= 75
            and current_price > vwap
            and ema_9 > ema_20
        ):
            intraday_trend = (
                "Bullish"
            )

        elif (
            score <= 35
            and current_price < vwap
            and ema_9 < ema_20
        ):
            intraday_trend = (
                "Bearish"
            )

        elif score >= 60:
            intraday_trend = (
                "Positive"
            )

        elif score <= 40:
            intraday_trend = (
                "Weak"
            )

        else:
            intraday_trend = (
                "Mixed"
            )

        return {
            "available":
                True,

            "price":
                current_price,

            "vwap":
                vwap,

            "ema_9":
                ema_9,

            "ema_20":
                ema_20,

            "change_percent":
                session_change,

            "recent_momentum_percent":
                recent_momentum,

            "session_position":
                session_position,

            "volume_ratio":
                intraday_volume_ratio,

            "distance_vwap_percent":
                distance_vwap,

            "distance_ema_9_percent":
                distance_ema_9,

            "ema_spread_percent":
                ema_spread,

            "score":
                score,

            "trend":
                intraday_trend,
        }

    except Exception:
        return default_result


# =========================================================
# TECHNICAL TARGET / INVALIDATION
# =========================================================

def calculate_trade_levels(
    *,
    price: float,
    high: pd.Series,
    low: pd.Series,
    close: pd.Series,
    atr: float | None,
    sma_20: float,
    sma_50: float,
    intraday_vwap: float | None,
    intraday_ema_20: float | None,
) -> dict[str, Any]:
    if price <= 0:
        return {
            "target_price":
                None,

            "invalidation_price":
                None,

            "target_source":
                None,

            "invalidation_source":
                None,

            "potential_upside_percent":
                0.0,

            "potential_downside_percent":
                0.0,

            "reward_risk_ratio":
                0.0,
        }

    if len(
        high,
    ) > 1:
        historical_high = high.iloc[
            :-1
        ]

    else:
        historical_high = high

    if len(
        low,
    ) > 1:
        historical_low = low.iloc[
            :-1
        ]

    else:
        historical_low = low

    effective_atr = (
        atr
        if (
            atr is not None
            and atr > 0
        )
        else price * 0.02
    )

    # -----------------------------------------------------
    # SUPPORT / INVALIDATION CANDIDATES
    # -----------------------------------------------------

    stop_candidates: list[
        tuple[
            float,
            str,
        ]
    ] = []

    if len(
        historical_low,
    ) >= 5:
        stop_candidates.append(
            (
                float(
                    historical_low
                    .tail(
                        5,
                    )
                    .min(),
                ),
                "5-day swing low",
            )
        )

    if len(
        historical_low,
    ) >= 10:
        stop_candidates.append(
            (
                float(
                    historical_low
                    .tail(
                        10,
                    )
                    .min(),
                ),
                "10-day swing low",
            )
        )

    if len(
        historical_low,
    ) >= 20:
        stop_candidates.append(
            (
                float(
                    historical_low
                    .tail(
                        20,
                    )
                    .min(),
                ),
                "20-day support",
            )
        )

    if (
        sma_20 > 0
        and sma_20 < price
    ):
        stop_candidates.append(
            (
                sma_20
                - effective_atr * 0.15,
                "20-day moving-average support",
            )
        )

    if (
        sma_50 > 0
        and sma_50 < price
    ):
        stop_candidates.append(
            (
                sma_50
                - effective_atr * 0.15,
                "50-day moving-average support",
            )
        )

    if (
        intraday_ema_20 is not None
        and intraday_ema_20 < price
    ):
        stop_candidates.append(
            (
                intraday_ema_20
                - effective_atr * 0.15,
                "Intraday EMA20 support",
            )
        )

    if (
        intraday_vwap is not None
        and intraday_vwap < price
    ):
        stop_candidates.append(
            (
                intraday_vwap
                - effective_atr * 0.20,
                "Intraday VWAP support",
            )
        )

    stop_candidates.extend(
        [
            (
                price
                - effective_atr * 1.0,
                "1 ATR invalidation",
            ),

            (
                price
                - effective_atr * 1.5,
                "1.5 ATR invalidation",
            ),
        ]
    )

    minimum_stop_distance = max(
        effective_atr * 0.60,
        price * 0.0075,
    )

    maximum_stop_distance = max(
        effective_atr * 3.0,
        price * 0.08,
    )

    valid_stops: list[
        tuple[
            float,
            str,
        ]
    ] = []

    for (
        stop_price,
        source,
    ) in stop_candidates:
        distance = (
            price
            - stop_price
        )

        if stop_price <= 0:
            continue

        if stop_price >= price:
            continue

        if distance < minimum_stop_distance:
            continue

        if distance > maximum_stop_distance:
            continue

        valid_stops.append(
            (
                stop_price,
                source,
            )
        )

    if valid_stops:
        valid_stops.sort(
            key=lambda item:
                item[
                    0
                ],
            reverse=True,
        )

        (
            invalidation_price,
            invalidation_source,
        ) = valid_stops[
            0
        ]

    else:
        invalidation_price = (
            price
            - effective_atr * 1.25
        )

        invalidation_source = (
            "ATR fallback invalidation"
        )

    risk_amount = (
        price
        - invalidation_price
    )

    # -----------------------------------------------------
    # RESISTANCE / TARGET CANDIDATES
    # -----------------------------------------------------

    target_candidates: list[
        tuple[
            float,
            str,
        ]
    ] = []

    if len(
        historical_high,
    ) >= 10:
        target_candidates.append(
            (
                float(
                    historical_high
                    .tail(
                        10,
                    )
                    .max(),
                ),
                "10-day resistance",
            )
        )

    if len(
        historical_high,
    ) >= 20:
        target_candidates.append(
            (
                float(
                    historical_high
                    .tail(
                        20,
                    )
                    .max(),
                ),
                "20-day resistance",
            )
        )

    if len(
        historical_high,
    ) >= 50:
        target_candidates.append(
            (
                float(
                    historical_high
                    .tail(
                        50,
                    )
                    .max(),
                ),
                "50-day resistance",
            )
        )

    if len(
        historical_high,
    ) > 0:
        target_candidates.append(
            (
                float(
                    historical_high.max(),
                ),
                "52-week resistance",
            )
        )

    target_candidates.extend(
        [
            (
                price
                + effective_atr * 1.5,
                "1.5 ATR extension",
            ),

            (
                price
                + effective_atr * 2.0,
                "2 ATR extension",
            ),

            (
                price
                + effective_atr * 2.5,
                "2.5 ATR extension",
            ),

            (
                price
                + effective_atr * 3.0,
                "3 ATR extension",
            ),
        ]
    )

    minimum_target_distance = max(
        effective_atr * 0.65,
        price * 0.0075,
    )

    maximum_target_distance = max(
        effective_atr * 8.0,
        price * 0.25,
    )

    valid_targets: list[
        tuple[
            float,
            str,
            float,
        ]
    ] = []

    for (
        target,
        source,
    ) in target_candidates:
        reward_amount = (
            target
            - price
        )

        if target <= price:
            continue

        if reward_amount < minimum_target_distance:
            continue

        if reward_amount > maximum_target_distance:
            continue

        if risk_amount > 0:
            rr = (
                reward_amount
                / risk_amount
            )

        else:
            rr = 0.0

        valid_targets.append(
            (
                target,
                source,
                rr,
            )
        )

    # Prefer a real resistance level that provides
    # at least a minimally useful reward/risk profile.
    technical_targets = [
        item
        for item
        in valid_targets
        if (
            "resistance"
            in item[
                1
            ].lower()
            and item[
                2
            ] >= 1.20
        )
    ]

    if technical_targets:
        technical_targets.sort(
            key=lambda item:
                item[
                    0
                ],
        )

        (
            target_price,
            target_source,
            _,
        ) = technical_targets[
            0
        ]

    else:
        acceptable_targets = [
            item
            for item
            in valid_targets
            if item[
                2
            ] >= 1.25
        ]

        if acceptable_targets:
            acceptable_targets.sort(
                key=lambda item:
                    item[
                        0
                    ],
            )

            (
                target_price,
                target_source,
                _,
            ) = acceptable_targets[
                0
            ]

        elif valid_targets:
            valid_targets.sort(
                key=lambda item:
                    item[
                        2
                    ],
                reverse=True,
            )

            (
                target_price,
                target_source,
                _,
            ) = valid_targets[
                0
            ]

        else:
            target_price = (
                price
                + effective_atr * 2.0
            )

            target_source = (
                "ATR fallback target"
            )

    potential_upside = percentage_change(
        target_price,
        price,
    )

    potential_downside = abs(
        percentage_change(
            invalidation_price,
            price,
        )
    )

    if potential_downside > 0:
        reward_risk_ratio = (
            potential_upside
            / potential_downside
        )

    else:
        reward_risk_ratio = 0.0

    return {
        "target_price":
            round(
                target_price,
                2,
            ),

        "invalidation_price":
            round(
                invalidation_price,
                2,
            ),

        "target_source":
            target_source,

        "invalidation_source":
            invalidation_source,

        "potential_upside_percent":
            round(
                potential_upside,
                2,
            ),

        "potential_downside_percent":
            round(
                potential_downside,
                2,
            ),

        "reward_risk_ratio":
            round(
                reward_risk_ratio,
                2,
            ),
    }


# =========================================================
# OPPORTUNITY SCORE
# =========================================================

def calculate_opportunity_score(
    *,
    trend_score: int,
    intraday_score: int,
    reward_risk_ratio: float,
    rsi: float,
    distance_sma_20: float,
) -> int:
    reward_risk_score = clamp(
        (
            reward_risk_ratio
            / 3.0
        )
        * 100,
    )

    extension_score = 100.0

    if rsi >= 78:
        extension_score -= 55

    elif rsi >= 73:
        extension_score -= 35

    elif rsi >= 68:
        extension_score -= 15

    if distance_sma_20 >= 12:
        extension_score -= 50

    elif distance_sma_20 >= 8:
        extension_score -= 30

    elif distance_sma_20 >= 5:
        extension_score -= 15

    score = (
        trend_score
        * 0.32

        + intraday_score
        * 0.32

        + reward_risk_score
        * 0.26

        + extension_score
        * 0.10
    )

    return int(
        round(
            clamp(
                score,
            )
        )
    )


# =========================================================
# AGGRESSIVE / HIGH UPSIDE SCORE
# =========================================================

def calculate_aggressive_score(
    *,
    trend_score: int,
    intraday_score: int,
    potential_upside_percent: float,
    volatility: float,
    daily_volume_ratio: float,
    intraday_volume_ratio: float | None,
    reward_risk_ratio: float,
) -> int:
    upside_score = clamp(
        (
            potential_upside_percent
            / 12.0
        )
        * 100,
    )

    if volatility <= 15:
        volatility_score = 20.0

    elif volatility <= 25:
        volatility_score = 40.0

    elif volatility <= 45:
        volatility_score = 70.0

    elif volatility <= 70:
        volatility_score = 95.0

    elif volatility <= 100:
        volatility_score = 75.0

    else:
        volatility_score = 45.0

    participation_ratio = max(
        daily_volume_ratio,
        intraday_volume_ratio
        or 0.0,
    )

    volume_score = clamp(
        (
            participation_ratio
            / 1.75
        )
        * 100,
    )

    reward_risk_score = clamp(
        (
            reward_risk_ratio
            / 3.0
        )
        * 100,
    )

    score = (
        trend_score
        * 0.12

        + intraday_score
        * 0.28

        + upside_score
        * 0.28

        + volatility_score
        * 0.12

        + volume_score
        * 0.08

        + reward_risk_score
        * 0.12
    )

    return int(
        round(
            clamp(
                score,
            )
        )
    )


# =========================================================
# TRADE HORIZON SCORING
# =========================================================

def calculate_trade_horizons(
    *,
    trend_score: int,
    intraday_score: int,
    rsi: float,
    macd: float,
    macd_signal: float,
    volume_ratio: float,
    intraday_volume_ratio: float | None,
    performance_5d: float,
    performance_20d: float,
    performance_60d: float | None,
    reward_risk_ratio: float,
    volatility: float,
    price: float,
    sma_20: float,
    sma_50: float,
    sma_200: float | None,
) -> dict[str, Any]:
    # -----------------------------------------------------
    # COMMON COMPONENTS
    # -----------------------------------------------------

    performance_5_score = linear_score(
        performance_5d,
        -8,
        8,
    )

    performance_20_score = linear_score(
        performance_20d,
        -15,
        15,
    )

    performance_60_score = linear_score(
        performance_60d
        if performance_60d is not None
        else 0,
        -25,
        30,
    )

    reward_risk_score = clamp(
        reward_risk_ratio
        / 3
        * 100,
    )

    daily_volume_score = linear_score(
        volume_ratio,
        0.50,
        1.75,
    )

    intraday_volume_score = linear_score(
        intraday_volume_ratio
        if intraday_volume_ratio is not None
        else 1.0,
        0.50,
        1.75,
    )

    macd_score = (
        80.0
        if macd > macd_signal
        else 30.0
    )

    if 50 <= rsi <= 68:
        momentum_quality = 90.0

    elif 45 <= rsi < 50:
        momentum_quality = 65.0

    elif 68 < rsi <= 75:
        momentum_quality = 65.0

    elif rsi > 75:
        momentum_quality = 35.0

    elif rsi < 35:
        momentum_quality = 25.0

    else:
        momentum_quality = 50.0

    # -----------------------------------------------------
    # INTRADAY FIT
    # -----------------------------------------------------

    intraday_fit = (
        intraday_score
        * 0.55

        + intraday_volume_score
        * 0.15

        + performance_5_score
        * 0.10

        + reward_risk_score
        * 0.10

        + trend_score
        * 0.10
    )

    # -----------------------------------------------------
    # SHORT-TERM FIT
    # Roughly several days to ~3 weeks
    # -----------------------------------------------------

    short_term_fit = (
        intraday_score
        * 0.20

        + trend_score
        * 0.25

        + performance_5_score
        * 0.20

        + performance_20_score
        * 0.15

        + momentum_quality
        * 0.10

        + reward_risk_score
        * 0.10
    )

    # -----------------------------------------------------
    # SWING FIT
    # Roughly 2-8 weeks
    # -----------------------------------------------------

    swing_fit = (
        trend_score
        * 0.35

        + performance_20_score
        * 0.20

        + performance_60_score
        * 0.10

        + macd_score
        * 0.10

        + momentum_quality
        * 0.10

        + reward_risk_score
        * 0.15
    )

    # -----------------------------------------------------
    # LONG-TERM FIT
    # Months+
    # -----------------------------------------------------

    long_structure_score = 0.0

    if price > sma_50:
        long_structure_score += 25

    if (
        sma_200 is not None
        and price > sma_200
    ):
        long_structure_score += 30

    if (
        sma_200 is not None
        and sma_50 > sma_200
    ):
        long_structure_score += 30

    if price > sma_20:
        long_structure_score += 15

    volatility_quality = 100.0

    if volatility >= 100:
        volatility_quality = 25.0

    elif volatility >= 70:
        volatility_quality = 45.0

    elif volatility >= 50:
        volatility_quality = 65.0

    elif volatility >= 35:
        volatility_quality = 80.0

    long_term_fit = (
        long_structure_score
        * 0.40

        + trend_score
        * 0.25

        + performance_60_score
        * 0.20

        + performance_20_score
        * 0.10

        + volatility_quality
        * 0.05
    )

    scores = {
        "Intraday":
            int(
                round(
                    clamp(
                        intraday_fit,
                    )
                )
            ),

        "Short term":
            int(
                round(
                    clamp(
                        short_term_fit,
                    )
                )
            ),

        "Swing":
            int(
                round(
                    clamp(
                        swing_fit,
                    )
                )
            ),

        "Long term":
            int(
                round(
                    clamp(
                        long_term_fit,
                    )
                )
            ),
    }

    ranked = sorted(
        scores.items(),
        key=lambda item:
            item[
                1
            ],
        reverse=True,
    )

    trade_horizon = ranked[
        0
    ][
        0
    ]

    secondary_horizon = ranked[
        1
    ][
        0
    ]

    duration_lookup = {
        "Intraday":
            "Same trading day",

        "Short term":
            "Several days to about 3 weeks",

        "Swing":
            "About 2 to 8 weeks",

        "Long term":
            "Several months or longer",
    }

    return {
        "intraday_fit_score":
            scores[
                "Intraday"
            ],

        "short_term_fit_score":
            scores[
                "Short term"
            ],

        "swing_fit_score":
            scores[
                "Swing"
            ],

        "long_term_fit_score":
            scores[
                "Long term"
            ],

        "trade_horizon":
            trade_horizon,

        "secondary_horizon":
            secondary_horizon,

        "trade_duration":
            duration_lookup[
                trade_horizon
            ],
    }


# =========================================================
# ACTION STATE
# =========================================================

def get_action_state(
    *,
    trend_score: int,
    intraday_score: int,
    opportunity_score: int,
    reward_risk_ratio: float,
    rsi: float,
    distance_sma_20: float,
) -> str:
    if (
        rsi >= 78
        or distance_sma_20 >= 12
    ):
        return (
            "Extended"
        )

    if (
        trend_score < 35
        and intraday_score < 35
    ):
        return (
            "Avoid"
        )

    if (
        opportunity_score >= 75
        and intraday_score >= 62
        and reward_risk_ratio >= 1.5
    ):
        return (
            "Potential entry"
        )

    if (
        trend_score >= 70
        and intraday_score < 45
    ):
        return (
            "Wait"
        )

    if (
        reward_risk_ratio < 0.90
    ):
        return (
            "Wait"
        )

    if opportunity_score >= 60:
        return (
            "Watch"
        )

    if intraday_score < 40:
        return (
            "Wait"
        )

    return (
        "Watch"
    )


# =========================================================
# RISK LEVEL
# =========================================================

def get_risk_level(
    *,
    volatility: float,
    downside_percent: float,
) -> str:
    if (
        volatility >= 70
        or downside_percent >= 7
    ):
        return (
            "Very high"
        )

    if (
        volatility >= 45
        or downside_percent >= 5
    ):
        return (
            "High"
        )

    if (
        volatility >= 25
        or downside_percent >= 3
    ):
        return (
            "Moderate"
        )

    return (
        "Low"
    )


# =========================================================
# CLASSIFICATION
# =========================================================

def get_rating(
    score: int,
) -> str:
    if score >= 12:
        return (
            "Strong setup"
        )

    if score >= 8:
        return (
            "Bullish setup"
        )

    if score >= 5:
        return (
            "Watch"
        )

    if score >= 1:
        return (
            "Neutral"
        )

    return (
        "Weak"
    )


def get_trend(
    *,
    price: float,
    sma_20: float,
    sma_50: float,
    sma_200: float | None,
) -> str:
    if (
        sma_200 is not None
        and price
        > sma_20
        > sma_50
        > sma_200
    ):
        return (
            "Strong uptrend"
        )

    if (
        price > sma_20
        and price > sma_50
    ):
        return (
            "Uptrend"
        )

    if (
        price < sma_20
        and price < sma_50
    ):
        return (
            "Downtrend"
        )

    return (
        "Mixed"
    )


def get_momentum(
    *,
    rsi: float,
    macd: float,
    macd_signal: float,
) -> str:
    if (
        macd > macd_signal
        and rsi >= 55
    ):
        return (
            "Positive"
        )

    if (
        macd < macd_signal
        and rsi <= 45
    ):
        return (
            "Negative"
        )

    return (
        "Mixed"
    )


def get_volume_state(
    volume_ratio: float,
) -> str:
    if volume_ratio >= 1.5:
        return (
            "High"
        )

    if volume_ratio >= 1.1:
        return (
            "Above average"
        )

    if volume_ratio < 0.65:
        return (
            "Low"
        )

    return (
        "Normal"
    )


def get_volatility_state(
    volatility: float,
) -> str:
    if volatility < 20:
        return (
            "Low"
        )

    if volatility < 40:
        return (
            "Moderate"
        )

    if volatility < 70:
        return (
            "High"
        )

    return (
        "Very high"
    )


# =========================================================
# SINGLE-SYMBOL ANALYSIS
# =========================================================

def analyze_scan_symbol(
    symbol: str,
    mode: ScannerMode = "balanced",
) -> ScannerCandidate:
    daily_data = download_market_data(
        symbol,

        period="1y",

        interval="1d",

        auto_adjust=True,

        progress=False,

        prepost=False,

        threads=False,
    )

    if daily_data.empty:
        raise ValueError(
            "No market data returned.",
        )

    close = extract_series(
        daily_data,
        "Close",
    )

    high = extract_series(
        daily_data,
        "High",
    )

    low = extract_series(
        daily_data,
        "Low",
    )

    volume = extract_series(
        daily_data,
        "Volume",
    )

    if len(
        close,
    ) < MINIMUM_DAILY_BARS:
        raise ValueError(
            "Not enough historical data.",
        )

    daily_price = float(
        close.iloc[
            -1
        ],
    )

    previous_close = float(
        close.iloc[
            -2
        ],
    )

    # -----------------------------------------------------
    # MOVING AVERAGES
    # -----------------------------------------------------

    sma_20 = float(
        close
        .rolling(
            20,
        )
        .mean()
        .iloc[
            -1
        ],
    )

    sma_50 = float(
        close
        .rolling(
            50,
        )
        .mean()
        .iloc[
            -1
        ],
    )

    sma_200: float | None = None

    if len(
        close,
    ) >= 200:
        calculated_sma_200 = (
            close
            .rolling(
                200,
            )
            .mean()
            .iloc[
                -1
            ]
        )

        if not pd.isna(
            calculated_sma_200,
        ):
            sma_200 = float(
                calculated_sma_200,
            )

    # -----------------------------------------------------
    # RSI
    # -----------------------------------------------------

    rsi = float(
        calculate_rsi(
            close,
        ).iloc[
            -1
        ],
    )

    # -----------------------------------------------------
    # MACD
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

    macd_series = (
        ema_12
        - ema_26
    )

    macd_signal_series = (
        macd_series
        .ewm(
            span=9,
            adjust=False,
        )
        .mean()
    )

    macd = float(
        macd_series.iloc[
            -1
        ],
    )

    macd_signal = float(
        macd_signal_series.iloc[
            -1
        ],
    )

    macd_histogram = (
        macd
        - macd_signal
    )

    # -----------------------------------------------------
    # VOLUME
    # -----------------------------------------------------

    latest_volume = float(
        volume.iloc[
            -1
        ],
    )

    average_volume_20 = float(
        volume
        .tail(
            20,
        )
        .mean(),
    )

    volume_ratio = (
        latest_volume
        / average_volume_20
        if average_volume_20 > 0
        else 0.0
    )

    # -----------------------------------------------------
    # VOLATILITY
    # -----------------------------------------------------

    returns = (
        close
        .pct_change()
        .dropna()
    )

    volatility = float(
        returns
        .tail(
            60,
        )
        .std()
        * np.sqrt(
            252,
        )
        * 100
    )

    # -----------------------------------------------------
    # PERFORMANCE
    # -----------------------------------------------------

    performance_5d = (
        calculate_period_performance(
            close,
            5,
        )
        or 0.0
    )

    performance_20d = (
        calculate_period_performance(
            close,
            20,
        )
        or 0.0
    )

    performance_60d = (
        calculate_period_performance(
            close,
            60,
        )
    )

    # -----------------------------------------------------
    # ATR
    # -----------------------------------------------------

    atr_14 = calculate_atr(
        high,
        low,
        close,
        14,
    )

    # -----------------------------------------------------
    # 52-WEEK RANGE
    # -----------------------------------------------------

    high_52w = float(
        high.max(),
    )

    low_52w = float(
        low.min(),
    )

    distance_from_high = (
        percentage_change(
            daily_price,
            high_52w,
        )
        if high_52w > 0
        else None
    )

    distance_from_low = (
        percentage_change(
            daily_price,
            low_52w,
        )
        if low_52w > 0
        else None
    )

    # -----------------------------------------------------
    # INTRADAY DATA
    # -----------------------------------------------------

    intraday = analyze_intraday(
        symbol,
        daily_price,
    )

    price = float(
        intraday.get(
            "price",
        )
        or daily_price
    )

    change_percent = percentage_change(
        price,
        previous_close,
    )

    # -----------------------------------------------------
    # DISTANCE FROM MOVING AVERAGES
    # -----------------------------------------------------

    distance_sma_20 = percentage_change(
        price,
        sma_20,
    )

    distance_sma_50 = percentage_change(
        price,
        sma_50,
    )

    distance_sma_200: float | None = None

    if (
        sma_200 is not None
        and sma_200 > 0
    ):
        distance_sma_200 = percentage_change(
            price,
            sma_200,
        )

    # -----------------------------------------------------
    # LEGACY SCORE
    # -----------------------------------------------------

    (
        legacy_score,
        reasons,
        warnings,
    ) = score_candidate(
        price=price,

        sma_20=sma_20,

        sma_50=sma_50,

        sma_200=sma_200,

        rsi=rsi,

        macd=macd,

        macd_signal=macd_signal,

        volume_ratio=volume_ratio,

        performance_5d=performance_5d,

        performance_20d=performance_20d,

        distance_from_high=distance_from_high,
    )

    # -----------------------------------------------------
    # TREND SCORE
    # -----------------------------------------------------

    trend_score = calculate_trend_score(
        price=price,

        sma_20=sma_20,

        sma_50=sma_50,

        sma_200=sma_200,

        rsi=rsi,

        macd=macd,

        macd_signal=macd_signal,

        performance_20d=performance_20d,

        performance_60d=performance_60d,
    )

    # -----------------------------------------------------
    # INTRADAY SCORE
    # -----------------------------------------------------

    intraday_score = int(
        intraday.get(
            "score",
            50,
        )
    )

    intraday_trend = str(
        intraday.get(
            "trend",
            "Unavailable",
        )
    )

    if not intraday.get(
        "available",
        False,
    ):
        warnings.append(
            "Intraday market data was unavailable, so the intraday score is neutral.",
        )

    elif intraday_score <= 40:
        warnings.append(
            "Current intraday price action is weak relative to the broader structure.",
        )

    elif intraday_score >= 70:
        reasons.append(
            "Current intraday price action confirms positive momentum.",
        )

    # -----------------------------------------------------
    # TECHNICAL TARGET / INVALIDATION
    # -----------------------------------------------------

    levels = calculate_trade_levels(
        price=price,

        high=high,

        low=low,

        close=close,

        atr=atr_14,

        sma_20=sma_20,

        sma_50=sma_50,

        intraday_vwap=(
            intraday.get(
                "vwap",
            )
        ),

        intraday_ema_20=(
            intraday.get(
                "ema_20",
            )
        ),
    )

    target_price = levels[
        "target_price"
    ]

    invalidation_price = levels[
        "invalidation_price"
    ]

    target_source = levels[
        "target_source"
    ]

    invalidation_source = levels[
        "invalidation_source"
    ]

    potential_upside = safe_float(
        levels[
            "potential_upside_percent"
        ],
    )

    potential_downside = safe_float(
        levels[
            "potential_downside_percent"
        ],
    )

    reward_risk_ratio = safe_float(
        levels[
            "reward_risk_ratio"
        ],
    )

    # -----------------------------------------------------
    # OPPORTUNITY SCORE
    # -----------------------------------------------------

    opportunity_score = calculate_opportunity_score(
        trend_score=trend_score,

        intraday_score=intraday_score,

        reward_risk_ratio=reward_risk_ratio,

        rsi=rsi,

        distance_sma_20=distance_sma_20,
    )

    # -----------------------------------------------------
    # AGGRESSIVE SCORE
    # -----------------------------------------------------

    aggressive_score = calculate_aggressive_score(
        trend_score=trend_score,

        intraday_score=intraday_score,

        potential_upside_percent=(
            potential_upside
        ),

        volatility=volatility,

        daily_volume_ratio=volume_ratio,

        intraday_volume_ratio=(
            intraday.get(
                "volume_ratio",
            )
        ),

        reward_risk_ratio=reward_risk_ratio,
    )

    # -----------------------------------------------------
    # TRADE HORIZON
    # -----------------------------------------------------

    horizon = calculate_trade_horizons(
        trend_score=trend_score,

        intraday_score=intraday_score,

        rsi=rsi,

        macd=macd,

        macd_signal=macd_signal,

        volume_ratio=volume_ratio,

        intraday_volume_ratio=(
            intraday.get(
                "volume_ratio",
            )
        ),

        performance_5d=performance_5d,

        performance_20d=performance_20d,

        performance_60d=performance_60d,

        reward_risk_ratio=reward_risk_ratio,

        volatility=volatility,

        price=price,

        sma_20=sma_20,

        sma_50=sma_50,

        sma_200=sma_200,
    )

    # -----------------------------------------------------
    # ACTION
    # -----------------------------------------------------

    action_state = get_action_state(
        trend_score=trend_score,

        intraday_score=intraday_score,

        opportunity_score=opportunity_score,

        reward_risk_ratio=reward_risk_ratio,

        rsi=rsi,

        distance_sma_20=distance_sma_20,
    )

    # -----------------------------------------------------
    # RISK LEVEL
    # -----------------------------------------------------

    risk_level = get_risk_level(
        volatility=volatility,

        downside_percent=(
            potential_downside
        ),
    )

    # -----------------------------------------------------
    # ACTIVE RANK SCORE
    # -----------------------------------------------------

    if mode == "aggressive":
        rank_score = (
            aggressive_score
        )

    else:
        rank_score = (
            opportunity_score
        )

    # -----------------------------------------------------
    # EXPLANATIONS
    # -----------------------------------------------------

    if reward_risk_ratio >= 2:
        reasons.append(
            f"Technical reward/risk is approximately {reward_risk_ratio:.2f}:1.",
        )

    elif reward_risk_ratio < 1:
        warnings.append(
            f"Technical reward/risk is only approximately {reward_risk_ratio:.2f}:1.",
        )

    if (
        trend_score >= 70
        and intraday_score < 45
    ):
        warnings.append(
            "The broader trend is strong, but current intraday behavior does not confirm an immediate entry.",
        )

    if (
        potential_upside >= 6
        and volatility >= 40
    ):
        reasons.append(
            "The setup has relatively high modeled upside potential.",
        )

        warnings.append(
            "Higher upside potential is accompanied by elevated volatility.",
        )

    reasons.append(
        f"Best estimated trade horizon is {horizon['trade_horizon'].lower()}."
    )

    # -----------------------------------------------------
    # RESPONSE
    # -----------------------------------------------------

    return ScannerCandidate(
        symbol=symbol,

        price=round(
            price,
            2,
        ),

        previous_close=round(
            previous_close,
            2,
        ),

        change_percent=round(
            change_percent,
            2,
        ),

        score=legacy_score,

        score_max=18,

        rating=get_rating(
            legacy_score,
        ),

        trend=get_trend(
            price=price,

            sma_20=sma_20,

            sma_50=sma_50,

            sma_200=sma_200,
        ),

        momentum=get_momentum(
            rsi=rsi,

            macd=macd,

            macd_signal=macd_signal,
        ),

        volume_state=get_volume_state(
            volume_ratio,
        ),

        volatility_state=get_volatility_state(
            volatility,
        ),

        trend_score=trend_score,

        intraday_score=intraday_score,

        opportunity_score=(
            opportunity_score
        ),

        aggressive_score=(
            aggressive_score
        ),

        rank_score=rank_score,

        intraday_trend=(
            intraday_trend
        ),

        action_state=(
            action_state
        ),

        intraday_fit_score=(
            horizon[
                "intraday_fit_score"
            ]
        ),

        short_term_fit_score=(
            horizon[
                "short_term_fit_score"
            ]
        ),

        swing_fit_score=(
            horizon[
                "swing_fit_score"
            ]
        ),

        long_term_fit_score=(
            horizon[
                "long_term_fit_score"
            ]
        ),

        trade_horizon=(
            horizon[
                "trade_horizon"
            ]
        ),

        secondary_horizon=(
            horizon[
                "secondary_horizon"
            ]
        ),

        trade_duration=(
            horizon[
                "trade_duration"
            ]
        ),

        potential_upside_percent=round(
            potential_upside,
            2,
        ),

        potential_downside_percent=round(
            potential_downside,
            2,
        ),

        reward_risk_ratio=round(
            reward_risk_ratio,
            2,
        ),

        target_price=round_optional(
            target_price,
        ),

        invalidation_price=round_optional(
            invalidation_price,
        ),

        target_source=(
            str(
                target_source,
            )
            if target_source
            else None
        ),

        invalidation_source=(
            str(
                invalidation_source,
            )
            if invalidation_source
            else None
        ),

        risk_level=risk_level,

        indicators=ScannerIndicators(
            rsi=round(
                rsi,
                2,
            ),

            sma_20=round(
                sma_20,
                2,
            ),

            sma_50=round(
                sma_50,
                2,
            ),

            sma_200=round_optional(
                sma_200,
            ),

            distance_sma_20_percent=round(
                distance_sma_20,
                2,
            ),

            distance_sma_50_percent=round(
                distance_sma_50,
                2,
            ),

            distance_sma_200_percent=(
                round_optional(
                    distance_sma_200,
                )
            ),

            macd=round(
                macd,
                4,
            ),

            macd_signal=round(
                macd_signal,
                4,
            ),

            macd_histogram=round(
                macd_histogram,
                4,
            ),

            volume_ratio=round(
                volume_ratio,
                2,
            ),

            volatility_percent=round(
                volatility,
                2,
            ),

            performance_5d_percent=round(
                performance_5d,
                2,
            ),

            performance_20d_percent=round(
                performance_20d,
                2,
            ),

            performance_60d_percent=(
                round_optional(
                    performance_60d,
                )
            ),

            distance_from_52w_high_percent=(
                round_optional(
                    distance_from_high,
                )
            ),

            distance_from_52w_low_percent=(
                round_optional(
                    distance_from_low,
                )
            ),

            atr_14=round_optional(
                atr_14,
            ),

            intraday_vwap=round_optional(
                intraday.get(
                    "vwap",
                )
            ),

            intraday_ema_9=round_optional(
                intraday.get(
                    "ema_9",
                )
            ),

            intraday_ema_20=round_optional(
                intraday.get(
                    "ema_20",
                )
            ),

            intraday_change_percent=(
                round_optional(
                    intraday.get(
                        "change_percent",
                    )
                )
            ),

            intraday_recent_momentum_percent=(
                round_optional(
                    intraday.get(
                        "recent_momentum_percent",
                    )
                )
            ),

            intraday_session_position=(
                round_optional(
                    intraday.get(
                        "session_position",
                    ),
                    3,
                )
            ),

            intraday_volume_ratio=(
                round_optional(
                    intraday.get(
                        "volume_ratio",
                    )
                )
            ),

            intraday_distance_vwap_percent=(
                round_optional(
                    intraday.get(
                        "distance_vwap_percent",
                    )
                )
            ),

            intraday_distance_ema_9_percent=(
                round_optional(
                    intraday.get(
                        "distance_ema_9_percent",
                    )
                )
            ),

            intraday_ema_spread_percent=(
                round_optional(
                    intraday.get(
                        "ema_spread_percent",
                    )
                )
            ),
        ),

        reasons=reasons[
            :12
        ],

        warnings=warnings[
            :10
        ],
    )


# =========================================================
# MULTI-SYMBOL SCANNER
# =========================================================

def run_scan(
    symbols: list[str],
    minimum_score: int,
    limit: int,
    mode: ScannerMode = "balanced",
    progress_callback:
        Callable[
            [
                int,
                int,
                str,
            ],
            None,
        ]
        | None = None,
) -> ScannerResponse:
    candidates: list[
        ScannerCandidate
    ] = []

    failures: list[
        ScannerFailure
    ] = []

    worker_count = min(
        MAX_SCAN_WORKERS,
        max(
            1,
            len(
                symbols,
            ),
        ),
    )

    completed_count = 0

    with ThreadPoolExecutor(
        max_workers=(
            worker_count
        ),
    ) as executor:
        futures = {
            executor.submit(
                analyze_scan_symbol,
                symbol,
                mode,
            ):
                symbol

            for symbol
            in symbols
        }

        for future in as_completed(
            futures,
        ):
            symbol = futures[
                future
            ]

            try:
                result = (
                    future.result()
                )

                if (
                    result.score
                    >= minimum_score
                ):
                    candidates.append(
                        result,
                    )

            except Exception as exc:
                failures.append(
                    ScannerFailure(
                        symbol=symbol,

                        reason=str(
                            exc,
                        )[
                            :300
                        ],
                    )
                )

            completed_count += 1

            if (
                progress_callback
                is not None
            ):
                progress_callback(
                    completed_count,

                    len(
                        symbols,
                    ),

                    symbol,
                )

    # -----------------------------------------------------
    # V7 ML OPPORTUNITY RANKING
    # -----------------------------------------------------
    #
    # V7 is intentionally kept separate from the existing
    # technical rank_score. It ranks its fixed validated
    # 49-stock universe and is attached as an independent
    # evidence layer.
    #
    # If ML inference fails, the scanner remains usable and
    # falls back to technical-only output.

    ml_status = "unavailable"

    ml_model: str | None = None

    ml_model_version: str | None = None

    ml_universe_size: int | None = None

    ml_error: str | None = None

    try:
        predictor = (
            get_v7_predictor()
        )

        ml_results = (
            predict_live_v7_universe(
                predictor
            )
        )

        ml_status = "available"

        ml_model = (
            predictor.model_name
        )

        ml_model_version = (
            predictor.model_version
        )

        ml_universe_size = len(
            ml_results
        )

        ml_by_symbol = {
            result.symbol:
                result

            for result
            in ml_results
        }

        for candidate in candidates:
            ml_result = (
                ml_by_symbol.get(
                    candidate.symbol.upper()
                )
            )

            if ml_result is None:
                continue

            candidate.ml_rank = (
                ml_result.rank
            )

            candidate.ml_percentile = round(
                ml_result.percentile,
                2,
            )

            candidate.ml_raw_score = round(
                ml_result.raw_score,
                6,
            )

            candidate.ml_universe_size = (
                ml_result.universe_size
            )

    except Exception as exc:
        # ML is supplementary. A market-data or model
        # failure must not break the technical scanner,
        # but the API must expose that ML was unavailable.
        ml_error = str(
            exc
        )[
            :500
        ]

    candidates.sort(
        key=lambda item: (
            item.rank_score,

            item.opportunity_score,

            item.reward_risk_ratio,

            item.intraday_score,
        ),
        reverse=True,
    )

    candidates = candidates[
        :limit
    ]

    return ScannerResponse(
        generated_at=(
            datetime.now(
                timezone.utc,
            )
            .isoformat()
        ),

        mode=mode,

        universe_size=len(
            symbols,
        ),

        scanned=(
            len(
                symbols,
            )
            - len(
                failures,
            )
        ),

        matched=len(
            candidates,
        ),

        minimum_score=(
            minimum_score
        ),

        ml_status=(
            ml_status
        ),

        ml_model=(
            ml_model
        ),

        ml_model_version=(
            ml_model_version
        ),

        ml_universe_size=(
            ml_universe_size
        ),

        ml_error=(
            ml_error
        ),

        candidates=candidates,

        failed=failures,

        disclaimer=(
            "Scanner results are quantitative technical observations "
            "based on historical and intraday market data. Trade-horizon "
            "classifications, opportunity scores, aggressive scores, "
            "technical targets, invalidation levels and reward/risk "
            "estimates are model-generated estimates rather than "
            "predictions or guarantees. Aggressive mode deliberately "
            "places more weight on upside potential, momentum and "
            "volatility and may involve substantially greater downside risk."
        ),
    )


# =========================================================
# BACKGROUND SCANNER JOBS
# =========================================================

def get_scanner_jobs(
    request: Request,
) -> dict[
    str,
    dict[
        str,
        Any,
    ],
]:
    jobs = getattr(
        request.app.state,
        "scanner_jobs",
        None,
    )

    if jobs is None:
        jobs = {}

        request.app.state.scanner_jobs = (
            jobs
        )

    return jobs


def get_scanner_job_key(
    current_user,
) -> str:
    user_id = getattr(
        current_user,
        "id",
        None,
    )

    if user_id is None:
        raise HTTPException(
            status_code=(
                status
                .HTTP_500_INTERNAL_SERVER_ERROR
            ),

            detail=(
                "The user account is missing an ID."
            ),
        )

    return str(
        user_id,
    )


def build_job_status(
    job: dict[
        str,
        Any,
    ],
) -> ScannerJobStatus:
    total = int(
        job.get(
            "total",
            0,
        )
        or 0
    )

    completed = int(
        job.get(
            "completed",
            0,
        )
        or 0
    )

    if total > 0:
        progress_percent = round(
            completed
            / total
            * 100,
        )

    else:
        progress_percent = 0

    return ScannerJobStatus(
        status=str(
            job.get(
                "status",
                "idle",
            )
        ),

        running=(
            job.get(
                "status"
            )
            == "running"
        ),

        progress_percent=(
            progress_percent
        ),

        completed=completed,

        total=total,

        current_symbol=(
            job.get(
                "current_symbol"
            )
        ),

        minimum_score=int(
            job.get(
                "minimum_score",
                5,
            )
        ),

        limit=int(
            job.get(
                "limit",
                20,
            )
        ),

        mode=job.get(
            "mode",
            "balanced",
        ),

        started_at=(
            job.get(
                "started_at"
            )
        ),

        finished_at=(
            job.get(
                "finished_at"
            )
        ),

        error=(
            job.get(
                "error"
            )
        ),
    )


def execute_background_scan(
    *,
    jobs: dict[
        str,
        dict[
            str,
            Any,
        ],
    ],
    job_key: str,
    symbols: list[str],
    minimum_score: int,
    limit: int,
    mode: ScannerMode,
):
    job = jobs[
        job_key
    ]

    def update_progress(
        completed: int,
        total: int,
        symbol: str,
    ):
        job[
            "completed"
        ] = completed

        job[
            "total"
        ] = total

        job[
            "current_symbol"
        ] = symbol

    try:
        result = run_scan(
            symbols=symbols,

            minimum_score=(
                minimum_score
            ),

            limit=limit,

            mode=mode,

            progress_callback=(
                update_progress
            ),
        )

        job[
            "result"
        ] = result

        job[
            "status"
        ] = "completed"

        job[
            "completed"
        ] = len(
            symbols,
        )

        job[
            "current_symbol"
        ] = None

        job[
            "finished_at"
        ] = (
            datetime.now(
                timezone.utc,
            )
            .isoformat()
        )

    except Exception as exc:
        job[
            "status"
        ] = "failed"

        job[
            "error"
        ] = str(
            exc,
        )[
            :500
        ]

        job[
            "current_symbol"
        ] = None

        job[
            "finished_at"
        ] = (
            datetime.now(
                timezone.utc,
            )
            .isoformat()
        )


# =========================================================
# ROUTER FACTORY
# =========================================================

def create_scanner_router(
    get_current_user:
        Callable,
) -> APIRouter:
    router = APIRouter(
        prefix="/scanner",

        tags=[
            "Market Scanner",
        ],
    )

    # -----------------------------------------------------
    # UNIVERSE
    # -----------------------------------------------------

    @router.get(
        "/universe",
    )
    def get_scanner_universe(
        current_user=Depends(
            get_current_user,
        ),
    ):
        return {
            "symbols":
                DEFAULT_SCAN_UNIVERSE,

            "count":
                len(
                    DEFAULT_SCAN_UNIVERSE,
                ),
        }

    # -----------------------------------------------------
    # START BACKGROUND SCAN
    # -----------------------------------------------------

    @router.post(
        "/start",

        response_model=(
            ScannerJobStartResponse
        ),

        status_code=(
            status
            .HTTP_202_ACCEPTED
        ),
    )
    def start_background_scan(
        request: Request,

        background_tasks:
            BackgroundTasks,

        minimum_score: int = Query(
            default=5,

            ge=-20,

            le=18,
        ),

        limit: int = Query(
            default=20,

            ge=1,

            le=50,
        ),

        mode: ScannerMode = Query(
            default="balanced",
        ),

        current_user=Depends(
            get_current_user,
        ),
    ):
        jobs = get_scanner_jobs(
            request,
        )

        job_key = get_scanner_job_key(
            current_user,
        )

        existing_job = jobs.get(
            job_key,
        )

        if (
            existing_job is not None
            and existing_job.get(
                "status"
            )
            == "running"
        ):
            return ScannerJobStartResponse(
                message=(
                    "Scanner is already running."
                ),

                status=(
                    build_job_status(
                        existing_job,
                    )
                ),
            )

        jobs[
            job_key
        ] = {
            "status":
                "running",

            "completed":
                0,

            "total":
                len(
                    DEFAULT_SCAN_UNIVERSE,
                ),

            "current_symbol":
                None,

            "minimum_score":
                minimum_score,

            "limit":
                limit,

            "mode":
                mode,

            "started_at":
                datetime.now(
                    timezone.utc,
                )
                .isoformat(),

            "finished_at":
                None,

            "error":
                None,

            "result":
                None,
        }

        background_tasks.add_task(
            execute_background_scan,

            jobs=jobs,

            job_key=job_key,

            symbols=list(
                DEFAULT_SCAN_UNIVERSE,
            ),

            minimum_score=(
                minimum_score
            ),

            limit=limit,

            mode=mode,
        )

        return ScannerJobStartResponse(
            message=(
                f"{mode.capitalize()} scanner started."
            ),

            status=(
                build_job_status(
                    jobs[
                        job_key
                    ],
                )
            ),
        )

    # -----------------------------------------------------
    # STATUS
    # -----------------------------------------------------

    @router.get(
        "/status",

        response_model=(
            ScannerJobStatus
        ),
    )
    def get_background_scan_status(
        request: Request,

        current_user=Depends(
            get_current_user,
        ),
    ):
        jobs = get_scanner_jobs(
            request,
        )

        job_key = get_scanner_job_key(
            current_user,
        )

        job = jobs.get(
            job_key,
        )

        if job is None:
            return ScannerJobStatus(
                status="idle",

                running=False,

                progress_percent=0,

                completed=0,

                total=0,

                current_symbol=None,

                minimum_score=5,

                limit=20,

                mode="balanced",

                started_at=None,

                finished_at=None,

                error=None,
            )

        return build_job_status(
            job,
        )

    # -----------------------------------------------------
    # RESULT
    # -----------------------------------------------------

    @router.get(
        "/result",

        response_model=(
            ScannerResponse
        ),
    )
    def get_background_scan_result(
        request: Request,

        current_user=Depends(
            get_current_user,
        ),
    ):
        jobs = get_scanner_jobs(
            request,
        )

        job_key = get_scanner_job_key(
            current_user,
        )

        job = jobs.get(
            job_key,
        )

        if job is None:
            raise HTTPException(
                status_code=(
                    status
                    .HTTP_404_NOT_FOUND
                ),

                detail=(
                    "No scanner job has been started."
                ),
            )

        job_status = job.get(
            "status"
        )

        if job_status == "running":
            raise HTTPException(
                status_code=(
                    status
                    .HTTP_409_CONFLICT
                ),

                detail=(
                    "Scanner is still running."
                ),
            )

        if job_status == "failed":
            raise HTTPException(
                status_code=(
                    status
                    .HTTP_502_BAD_GATEWAY
                ),

                detail=(
                    job.get(
                        "error"
                    )
                    or "Scanner failed."
                ),
            )

        result = job.get(
            "result"
        )

        if result is None:
            raise HTTPException(
                status_code=(
                    status
                    .HTTP_404_NOT_FOUND
                ),

                detail=(
                    "Scanner result is not available."
                ),
            )

        return result

    # -----------------------------------------------------
    # SYNCHRONOUS SCAN
    # -----------------------------------------------------

    @router.get(
        "/scan",

        response_model=(
            ScannerResponse
        ),
    )
    def scan_market(
        minimum_score: int = Query(
            default=5,

            ge=-20,

            le=18,
        ),

        limit: int = Query(
            default=20,

            ge=1,

            le=50,
        ),

        mode: ScannerMode = Query(
            default="balanced",
        ),

        current_user=Depends(
            get_current_user,
        ),
    ):
        try:
            return run_scan(
                symbols=(
                    DEFAULT_SCAN_UNIVERSE
                ),

                minimum_score=(
                    minimum_score
                ),

                limit=limit,

                mode=mode,
            )

        except Exception as exc:
            raise HTTPException(
                status_code=(
                    status
                    .HTTP_502_BAD_GATEWAY
                ),

                detail=(
                    "Market scanner failed: "
                    f"{exc}"
                ),
            ) from exc

    # -----------------------------------------------------
    # CUSTOM SCAN
    # -----------------------------------------------------

    @router.get(
        "/custom",

        response_model=(
            ScannerResponse
        ),
    )
    def scan_custom_symbols(
        symbols: str = Query(
            ...,

            description=(
                "Comma-separated ticker symbols."
            ),
        ),

        minimum_score: int = Query(
            default=0,

            ge=-20,

            le=18,
        ),

        limit: int = Query(
            default=20,

            ge=1,

            le=50,
        ),

        mode: ScannerMode = Query(
            default="balanced",
        ),

        current_user=Depends(
            get_current_user,
        ),
    ):
        parsed_symbols = sanitize_symbols(
            symbols.split(
                ",",
            ),
        )

        if not parsed_symbols:
            raise HTTPException(
                status_code=(
                    status
                    .HTTP_400_BAD_REQUEST
                ),

                detail=(
                    "Enter at least one valid symbol."
                ),
            )

        if (
            len(
                parsed_symbols,
            )
            > MAX_CUSTOM_SYMBOLS
        ):
            raise HTTPException(
                status_code=(
                    status
                    .HTTP_400_BAD_REQUEST
                ),

                detail=(
                    f"A custom scan is limited to "
                    f"{MAX_CUSTOM_SYMBOLS} symbols."
                ),
            )

        try:
            return run_scan(
                symbols=(
                    parsed_symbols
                ),

                minimum_score=(
                    minimum_score
                ),

                limit=limit,

                mode=mode,
            )

        except Exception as exc:
            raise HTTPException(
                status_code=(
                    status
                    .HTTP_502_BAD_GATEWAY
                ),

                detail=(
                    "Custom market scanner failed: "
                    f"{exc}"
                ),
            ) from exc

    # -----------------------------------------------------
    # SINGLE SYMBOL
    # -----------------------------------------------------

    @router.get(
        "/symbol/{symbol}",

        response_model=(
            ScannerCandidate
        ),
    )
    def scan_single_symbol(
        symbol: str,

        mode: ScannerMode = Query(
            default="balanced",
        ),

        current_user=Depends(
            get_current_user,
        ),
    ):
        ticker_symbol = sanitize_symbol(
            symbol,
        )

        if not ticker_symbol:
            raise HTTPException(
                status_code=(
                    status
                    .HTTP_400_BAD_REQUEST
                ),

                detail=(
                    "Enter a valid symbol."
                ),
            )

        try:
            return analyze_scan_symbol(
                ticker_symbol,
                mode,
            )

        except Exception as exc:
            raise HTTPException(
                status_code=(
                    status
                    .HTTP_404_NOT_FOUND
                ),

                detail=(
                    f"Could not analyze "
                    f"{ticker_symbol}: {exc}"
                ),
            ) from exc

    return router