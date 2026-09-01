from sqlmodel import SQLModel


# =========================================================
# MARKET HISTORY MODELS
# =========================================================

class MarketHistoryPoint(SQLModel):
    date: str

    open: float
    high: float
    low: float
    close: float

    volume: int


class MarketHistoryResponse(SQLModel):
    symbol: str

    interval: str

    bars: list[
        MarketHistoryPoint
    ]

    has_more: bool

    oldest_available: str | None

    newest_available: str | None


# =========================================================
# MARKET ANALYSIS MODELS
# =========================================================

class MarketAnalysisResponse(SQLModel):
    # -----------------------------------------------------
    # SYMBOL / PRICE
    # -----------------------------------------------------

    symbol: str

    price: float

    previous_close: float

    change_percent: float

    # -----------------------------------------------------
    # DAILY TECHNICALS
    # -----------------------------------------------------

    rsi: float

    macd: float

    macd_signal: float

    macd_histogram: float

    sma_20: float

    sma_50: float

    sma_200: float | None

    distance_from_sma_20: float

    distance_from_sma_50: float

    distance_from_sma_200: float | None

    volatility: float

    atr_14: float | None

    # -----------------------------------------------------
    # 52-WEEK / SUPPORT / RESISTANCE
    # -----------------------------------------------------

    high_52w: float

    low_52w: float

    support: float

    resistance: float

    distance_from_52w_high_percent: float | None

    distance_from_52w_low_percent: float | None

    # -----------------------------------------------------
    # VOLUME
    # -----------------------------------------------------

    volume: int

    average_volume_20d: int

    volume_ratio: float

    # -----------------------------------------------------
    # PERFORMANCE
    # -----------------------------------------------------

    performance_5d_percent: float

    performance_20d_percent: float

    performance_60d_percent: float | None

    # -----------------------------------------------------
    # LEGACY MARKET ANALYZER VALUES
    # Keep these while the frontend is being upgraded.
    # -----------------------------------------------------

    score: int

    signal: str

    risk: str

    # -----------------------------------------------------
    # SCANNER INTELLIGENCE
    # -----------------------------------------------------

    trend_score: int

    intraday_score: int

    opportunity_score: int

    aggressive_score: int

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

    target_price: float | None

    invalidation_price: float | None

    target_source: str | None

    invalidation_source: str | None

    potential_upside_percent: float

    potential_downside_percent: float

    reward_risk_ratio: float

    risk_level: str

    # -----------------------------------------------------
    # INTRADAY TECHNICALS
    # -----------------------------------------------------

    intraday_vwap: float | None

    intraday_ema_9: float | None

    intraday_ema_20: float | None

    intraday_change_percent: float | None

    intraday_recent_momentum_percent: float | None

    intraday_session_position: float | None

    intraday_volume_ratio: float | None

    intraday_distance_vwap_percent: float | None

    intraday_distance_ema_9_percent: float | None

    intraday_ema_spread_percent: float | None

    # -----------------------------------------------------
    # EXPLANATIONS
    # -----------------------------------------------------

    reasons: list[str]

    warnings: list[str]

    # -----------------------------------------------------
    # LEGACY HISTORY
    # Temporary compatibility with the current frontend.
    # The dedicated /market/history endpoint is still better
    # for the interactive chart.
    # -----------------------------------------------------

    history: list[
        MarketHistoryPoint
    ]