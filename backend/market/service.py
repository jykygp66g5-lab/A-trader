from __future__ import annotations

from datetime import (
    datetime,
    timedelta,
    timezone,
)

import math

import pandas as pd
import yfinance as yf

from fastapi import (
    HTTPException,
    status,
)

from scanner import (
    ScannerMode,
    analyze_scan_symbol,
    sanitize_symbol,
)

from .models import (
    MarketAnalysisResponse,
    MarketHistoryPoint,
    MarketHistoryResponse,
)


# =========================================================
# MARKET CONFIGURATION
# =========================================================

ALLOWED_MARKET_INTERVALS = {
    "1m",
    "5m",
    "15m",
    "30m",
    "60m",
    "1h",
    "1d",
    "1wk",
}


INTRADAY_INTERVALS = {
    "1m",
    "5m",
    "15m",
    "30m",
    "60m",
    "1h",
}


ALLOWED_PERIODS = {
    "1d",
    "5d",
    "1mo",
    "3mo",
    "6mo",
    "1y",
    "2y",
    "5y",
    "10y",
    "max",
}


HISTORY_WINDOW_DAYS = {
    "1m": 2,
    "5m": 7,
    "15m": 14,
    "30m": 21,
    "60m": 30,
    "1h": 30,
    "1d": 365,
    "1wk": 3650,
}


# =========================================================
# MARKET DATA HELPERS
# =========================================================

def extract_market_columns(
    data: pd.DataFrame,
):
    open_price = data["Open"]
    high = data["High"]
    low = data["Low"]
    close = data["Close"]
    volume = data["Volume"]

    series_list = [
        open_price,
        high,
        low,
        close,
        volume,
    ]

    cleaned = []

    for item in series_list:
        if isinstance(
            item,
            pd.DataFrame,
        ):
            item = item.iloc[:, 0]

        cleaned.append(
            item,
        )

    return tuple(
        cleaned,
    )


def build_history_points(
    open_price: pd.Series,
    high: pd.Series,
    low: pd.Series,
    close: pd.Series,
    volume: pd.Series,
) -> list[MarketHistoryPoint]:
    valid_index = (
        open_price
        .dropna()
        .index
        .intersection(
            high.dropna().index,
        )
        .intersection(
            low.dropna().index,
        )
        .intersection(
            close.dropna().index,
        )
        .intersection(
            volume.dropna().index,
        )
    )

    valid_index = (
        valid_index
        .sort_values()
    )

    history: list[
        MarketHistoryPoint
    ] = []

    for date in valid_index:
        history.append(
            MarketHistoryPoint(
                date=date.isoformat(),

                open=round(
                    float(
                        open_price.loc[
                            date
                        ]
                    ),
                    4,
                ),

                high=round(
                    float(
                        high.loc[
                            date
                        ]
                    ),
                    4,
                ),

                low=round(
                    float(
                        low.loc[
                            date
                        ]
                    ),
                    4,
                ),

                close=round(
                    float(
                        close.loc[
                            date
                        ]
                    ),
                    4,
                ),

                volume=int(
                    volume.loc[
                        date
                    ]
                ),
            )
        )

    return history


def parse_market_datetime(
    value: str,
) -> datetime:
    try:
        parsed = datetime.fromisoformat(
            value.replace(
                "Z",
                "+00:00",
            )
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=(
                "Invalid market date."
            ),
        ) from exc

    if parsed.tzinfo is None:
        parsed = parsed.replace(
            tzinfo=timezone.utc,
        )

    return parsed


def intraday_cutoff() -> datetime:
    return (
        datetime.now(
            timezone.utc,
        )
        - timedelta(
            days=60,
        )
    )


# =========================================================
# LIGHTWEIGHT MARKET SNAPSHOT
# =========================================================

def get_market_snapshot(
    symbol: str,
) -> dict[str, float | int]:
    ticker_symbol = sanitize_symbol(
        symbol,
    )

    if not ticker_symbol:
        raise ValueError(
            "A valid market symbol is required.",
        )

    # -----------------------------------------------------
    # INTRADAY PRICE / VOLUME
    # -----------------------------------------------------

    data = yf.download(
        ticker_symbol,
        period="5d",
        interval="5m",
        auto_adjust=True,
        progress=False,
        prepost=False,
        threads=False,
    )

    if data.empty:
        raise ValueError(
            f"No market data found for {ticker_symbol}.",
        )

    (
        _open,
        _high,
        _low,
        close,
        volume,
    ) = extract_market_columns(
        data,
    )

    close = close.dropna()
    volume = volume.dropna()

    if close.empty:
        raise ValueError(
            f"No valid price data found for {ticker_symbol}.",
        )

    current_price = float(
        close.iloc[-1],
    )

    latest_volume = (
        int(volume.iloc[-1])
        if not volume.empty
        else 0
    )

    # -----------------------------------------------------
    # DAILY PERCENT CHANGE
    # -----------------------------------------------------

    daily_data = yf.download(
        ticker_symbol,
        period="5d",
        interval="1d",
        auto_adjust=True,
        progress=False,
        prepost=False,
        threads=False,
    )

    percent_change = 0.0

    if not daily_data.empty:
        (
            _daily_open,
            _daily_high,
            _daily_low,
            daily_close,
            _daily_volume,
        ) = extract_market_columns(
            daily_data,
        )

        daily_close = (
            daily_close
            .dropna()
        )

        if len(daily_close) >= 2:
            previous_close = float(
                daily_close.iloc[-2],
            )

            if previous_close != 0:
                percent_change = (
                    (
                        current_price
                        - previous_close
                    )
                    / previous_close
                ) * 100

    return {
        "price": round(
            current_price,
            4,
        ),
        "percent_change": round(
            percent_change,
            4,
        ),
        "volume": latest_volume,
    }


# =========================================================
# MARKET ANALYSIS
# =========================================================

def analyze_market_symbol(
    symbol: str,
    mode: ScannerMode = "balanced",
) -> MarketAnalysisResponse:
    ticker_symbol = (
        sanitize_symbol(
            symbol,
        )
    )

    if not ticker_symbol:
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=(
                "Enter a valid symbol."
            ),
        )

    try:
        # -------------------------------------------------
        # SCANNER ANALYSIS
        # -------------------------------------------------

        scanner_analysis = (
            analyze_scan_symbol(
                ticker_symbol,
                mode,
            )
        )

        indicators = (
            scanner_analysis
            .indicators
        )

        # -------------------------------------------------
        # DAILY MARKET DATA
        # -------------------------------------------------

        data = yf.download(
            ticker_symbol,
            period="1y",
            interval="1d",
            auto_adjust=True,
            progress=False,
            prepost=False,
            threads=False,
        )

        if data.empty:
            raise HTTPException(
                status_code=(
                    status.HTTP_404_NOT_FOUND
                ),
                detail=(
                    "No market data found for this symbol."
                ),
            )

        (
            open_price,
            high,
            low,
            close,
            volume,
        ) = extract_market_columns(
            data,
        )

        open_price = (
            open_price
            .dropna()
        )

        high = (
            high
            .dropna()
        )

        low = (
            low
            .dropna()
        )

        close = (
            close
            .dropna()
        )

        volume = (
            volume
            .dropna()
        )

        if len(close) < 200:
            raise HTTPException(
                status_code=(
                    status.HTTP_400_BAD_REQUEST
                ),
                detail=(
                    "Not enough historical data is available "
                    "to calculate the 200-day moving average."
                ),
            )

        # -------------------------------------------------
        # MARKET LEVELS
        # -------------------------------------------------

        high_52w = float(
            high.max(),
        )

        low_52w = float(
            low.min(),
        )

        support = float(
            low
            .tail(20)
            .min(),
        )

        resistance = float(
            high
            .tail(20)
            .max(),
        )

        latest_volume = int(
            volume.iloc[-1],
        )

        average_volume_20d = int(
            volume
            .tail(20)
            .mean(),
        )

        # -------------------------------------------------
        # LEGACY MARKET ANALYZER VALUES
        #
        # Preserve the exact behavior of the old
        # /market/analyze endpoint while also returning
        # the newer Scanner intelligence.
        # -------------------------------------------------

        latest_price = float(
            close.iloc[-1],
        )

        sma_50 = float(
            close
            .rolling(
                window=50,
            )
            .mean()
            .iloc[-1]
        )

        sma_200 = float(
            close
            .rolling(
                window=200,
            )
            .mean()
            .iloc[-1]
        )

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

        legacy_macd = float(
            macd_series.iloc[-1],
        )

        legacy_macd_signal = float(
            macd_signal_series.iloc[-1],
        )

        delta = (
            close
            .diff()
        )

        gain = (
            delta
            .clip(
                lower=0,
            )
        )

        loss = (
            -delta
            .clip(
                upper=0,
            )
        )

        average_gain = (
            gain
            .rolling(
                window=14,
            )
            .mean()
        )

        average_loss = (
            loss
            .rolling(
                window=14,
            )
            .mean()
        )

        relative_strength = (
            average_gain
            / average_loss
        )

        rsi_series = (
            100
            - (
                100
                / (
                    1
                    + relative_strength
                )
            )
        )

        legacy_rsi = float(
            rsi_series.iloc[-1],
        )

        # -------------------------------------------------
        # LEGACY SCORE
        # -------------------------------------------------

        legacy_score = 0

        if latest_price > sma_50:
            legacy_score += 1

        else:
            legacy_score -= 1

        if latest_price > sma_200:
            legacy_score += 1

        else:
            legacy_score -= 1

        if sma_50 > sma_200:
            legacy_score += 1

        else:
            legacy_score -= 1

        if (
            legacy_macd
            > legacy_macd_signal
        ):
            legacy_score += 1

        else:
            legacy_score -= 1

        if legacy_rsi < 30:
            legacy_score += 1

        elif legacy_rsi > 70:
            legacy_score -= 1

        # -------------------------------------------------
        # LEGACY SIGNAL
        # -------------------------------------------------

        if legacy_score >= 3:
            legacy_signal = (
                "Bullish"
            )

        elif legacy_score <= -3:
            legacy_signal = (
                "Bearish"
            )

        else:
            legacy_signal = (
                "Neutral"
            )

        # -------------------------------------------------
        # LEGACY VOLATILITY / RISK
        # -------------------------------------------------

        returns = (
            close
            .pct_change()
            .dropna()
        )

        legacy_volatility = float(
            returns.std()
            * math.sqrt(252)
            * 100
        )

        if legacy_volatility < 20:
            legacy_risk = (
                "Low"
            )

        elif legacy_volatility < 40:
            legacy_risk = (
                "Moderate"
            )

        else:
            legacy_risk = (
                "High"
            )

        # -------------------------------------------------
        # HISTORY
        # -------------------------------------------------

        history = (
            build_history_points(
                open_price,
                high,
                low,
                close,
                volume,
            )
        )

        # -------------------------------------------------
        # COMBINED RESPONSE
        # -------------------------------------------------

        return MarketAnalysisResponse(
            # ---------------------------------------------
            # SYMBOL / PRICE
            # ---------------------------------------------

            symbol=(
                scanner_analysis.symbol
            ),

            price=(
                scanner_analysis.price
            ),

            previous_close=(
                scanner_analysis.previous_close
            ),

            change_percent=(
                scanner_analysis.change_percent
            ),

            # ---------------------------------------------
            # DAILY TECHNICALS
            # ---------------------------------------------

            rsi=(
                indicators.rsi
            ),

            macd=(
                indicators.macd
            ),

            macd_signal=(
                indicators.macd_signal
            ),

            macd_histogram=(
                indicators.macd_histogram
            ),

            sma_20=(
                indicators.sma_20
            ),

            sma_50=(
                indicators.sma_50
            ),

            sma_200=(
                indicators.sma_200
            ),

            distance_from_sma_20=(
                indicators
                .distance_sma_20_percent
            ),

            distance_from_sma_50=(
                indicators
                .distance_sma_50_percent
            ),

            distance_from_sma_200=(
                indicators
                .distance_sma_200_percent
            ),

            volatility=round(
                legacy_volatility,
                2,
            ),

            atr_14=(
                indicators.atr_14
            ),

            # ---------------------------------------------
            # RANGE / LEVELS
            # ---------------------------------------------

            high_52w=round(
                high_52w,
                2,
            ),

            low_52w=round(
                low_52w,
                2,
            ),

            support=round(
                support,
                2,
            ),

            resistance=round(
                resistance,
                2,
            ),

            distance_from_52w_high_percent=(
                indicators
                .distance_from_52w_high_percent
            ),

            distance_from_52w_low_percent=(
                indicators
                .distance_from_52w_low_percent
            ),

            # ---------------------------------------------
            # VOLUME
            # ---------------------------------------------

            volume=(
                latest_volume
            ),

            average_volume_20d=(
                average_volume_20d
            ),

            volume_ratio=(
                indicators.volume_ratio
            ),

            # ---------------------------------------------
            # PERFORMANCE
            # ---------------------------------------------

            performance_5d_percent=(
                indicators
                .performance_5d_percent
            ),

            performance_20d_percent=(
                indicators
                .performance_20d_percent
            ),

            performance_60d_percent=(
                indicators
                .performance_60d_percent
            ),

            # ---------------------------------------------
            # LEGACY FRONTEND
            # ---------------------------------------------

            score=(
                legacy_score
            ),

            signal=(
                legacy_signal
            ),

            risk=(
                legacy_risk
            ),

            # ---------------------------------------------
            # SCANNER INTELLIGENCE
            # ---------------------------------------------

            trend_score=(
                scanner_analysis
                .trend_score
            ),

            intraday_score=(
                scanner_analysis
                .intraday_score
            ),

            opportunity_score=(
                scanner_analysis
                .opportunity_score
            ),

            aggressive_score=(
                scanner_analysis
                .aggressive_score
            ),

            intraday_trend=(
                scanner_analysis
                .intraday_trend
            ),

            action_state=(
                scanner_analysis
                .action_state
            ),

            # ---------------------------------------------
            # TRADE HORIZON
            # ---------------------------------------------

            intraday_fit_score=(
                scanner_analysis
                .intraday_fit_score
            ),

            short_term_fit_score=(
                scanner_analysis
                .short_term_fit_score
            ),

            swing_fit_score=(
                scanner_analysis
                .swing_fit_score
            ),

            long_term_fit_score=(
                scanner_analysis
                .long_term_fit_score
            ),

            trade_horizon=(
                scanner_analysis
                .trade_horizon
            ),

            secondary_horizon=(
                scanner_analysis
                .secondary_horizon
            ),

            trade_duration=(
                scanner_analysis
                .trade_duration
            ),

            # ---------------------------------------------
            # TRADE LEVELS
            # ---------------------------------------------

            target_price=(
                scanner_analysis
                .target_price
            ),

            invalidation_price=(
                scanner_analysis
                .invalidation_price
            ),

            target_source=(
                scanner_analysis
                .target_source
            ),

            invalidation_source=(
                scanner_analysis
                .invalidation_source
            ),

            potential_upside_percent=(
                scanner_analysis
                .potential_upside_percent
            ),

            potential_downside_percent=(
                scanner_analysis
                .potential_downside_percent
            ),

            reward_risk_ratio=(
                scanner_analysis
                .reward_risk_ratio
            ),

            risk_level=(
                scanner_analysis
                .risk_level
            ),

            # ---------------------------------------------
            # INTRADAY
            # ---------------------------------------------

            intraday_vwap=(
                indicators
                .intraday_vwap
            ),

            intraday_ema_9=(
                indicators
                .intraday_ema_9
            ),

            intraday_ema_20=(
                indicators
                .intraday_ema_20
            ),

            intraday_change_percent=(
                indicators
                .intraday_change_percent
            ),

            intraday_recent_momentum_percent=(
                indicators
                .intraday_recent_momentum_percent
            ),

            intraday_session_position=(
                indicators
                .intraday_session_position
            ),

            intraday_volume_ratio=(
                indicators
                .intraday_volume_ratio
            ),

            intraday_distance_vwap_percent=(
                indicators
                .intraday_distance_vwap_percent
            ),

            intraday_distance_ema_9_percent=(
                indicators
                .intraday_distance_ema_9_percent
            ),

            intraday_ema_spread_percent=(
                indicators
                .intraday_ema_spread_percent
            ),

            # ---------------------------------------------
            # EXPLANATIONS
            # ---------------------------------------------

            reasons=list(
                scanner_analysis.reasons
            ),

            warnings=list(
                scanner_analysis.warnings
            ),

            # ---------------------------------------------
            # HISTORY
            # ---------------------------------------------

            history=(
                history
            ),
        )

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=(
                status.HTTP_502_BAD_GATEWAY
            ),
            detail=(
                "Market analysis failed: "
                f"{exc}"
            ),
        ) from exc


# =========================================================
# MARKET HISTORY
# =========================================================

def get_market_history_data(
    symbol: str,
    interval: str = "1d",
    period: str = "3mo",
    before: str | None = None,
    start: str | None = None,
    end: str | None = None,
    window_days: int | None = None,
) -> MarketHistoryResponse:
    ticker_symbol = (
        sanitize_symbol(
            symbol,
        )
    )

    if not ticker_symbol:
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=(
                "Enter a valid symbol."
            ),
        )

    if (
        interval
        not in ALLOWED_MARKET_INTERVALS
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=(
                "Unsupported market interval."
            ),
        )

    if period not in ALLOWED_PERIODS:
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=(
                "Unsupported market period."
            ),
        )

    try:
        download_kwargs = {
            "tickers":
                ticker_symbol,

            "interval":
                interval,

            "auto_adjust":
                True,

            "progress":
                False,

            "prepost":
                False,

            "threads":
                False,
        }

        intraday = (
            interval
            in INTRADAY_INTERVALS
        )

        cutoff = (
            intraday_cutoff()
        )

        # -------------------------------------------------
        # EXPLICIT START / END
        # -------------------------------------------------

        if (
            start is not None
            and end is not None
        ):
            start_dt = (
                parse_market_datetime(
                    start,
                )
            )

            end_dt = (
                parse_market_datetime(
                    end,
                )
            )

            if end_dt <= start_dt:
                raise HTTPException(
                    status_code=(
                        status.HTTP_400_BAD_REQUEST
                    ),
                    detail=(
                        "Market history end must "
                        "be after start."
                    ),
                )

            if intraday:
                if end_dt <= cutoff:
                    return MarketHistoryResponse(
                        symbol=ticker_symbol,
                        interval=interval,
                        bars=[],
                        has_more=False,
                        oldest_available=None,
                        newest_available=None,
                    )

                if start_dt < cutoff:
                    start_dt = cutoff

            download_kwargs[
                "start"
            ] = start_dt

            download_kwargs[
                "end"
            ] = end_dt

        # -------------------------------------------------
        # LOAD OLDER HISTORY
        # -------------------------------------------------

        elif before is not None:
            end_dt = (
                parse_market_datetime(
                    before,
                )
            )

            if (
                intraday
                and end_dt <= cutoff
            ):
                return MarketHistoryResponse(
                    symbol=ticker_symbol,
                    interval=interval,
                    bars=[],
                    has_more=False,
                    oldest_available=None,
                    newest_available=None,
                )

            days = (
                window_days
                or HISTORY_WINDOW_DAYS[
                    interval
                ]
            )

            days = max(
                1,
                min(
                    days,
                    36500,
                ),
            )

            start_dt = (
                end_dt
                - timedelta(
                    days=days,
                )
            )

            if (
                intraday
                and start_dt < cutoff
            ):
                start_dt = cutoff

            download_kwargs[
                "start"
            ] = start_dt

            download_kwargs[
                "end"
            ] = end_dt

        # -------------------------------------------------
        # NORMAL PERIOD DOWNLOAD
        # -------------------------------------------------

        else:
            if intraday:
                intraday_periods = {
                    "1d",
                    "5d",
                    "1mo",
                }

                if (
                    period
                    not in intraday_periods
                ):
                    period = (
                        "1mo"
                    )

            download_kwargs[
                "period"
            ] = period

        # -------------------------------------------------
        # DOWNLOAD
        # -------------------------------------------------

        data = yf.download(
            **download_kwargs,
        )

        if data.empty:
            if (
                before is not None
                or (
                    start is not None
                    and end is not None
                )
            ):
                return MarketHistoryResponse(
                    symbol=ticker_symbol,
                    interval=interval,
                    bars=[],
                    has_more=False,
                    oldest_available=None,
                    newest_available=None,
                )

            raise HTTPException(
                status_code=(
                    status.HTTP_404_NOT_FOUND
                ),
                detail=(
                    "No market history found."
                ),
            )

        (
            open_price,
            high,
            low,
            close,
            volume,
        ) = extract_market_columns(
            data,
        )

        bars = (
            build_history_points(
                open_price,
                high,
                low,
                close,
                volume,
            )
        )

        if not bars:
            return MarketHistoryResponse(
                symbol=ticker_symbol,
                interval=interval,
                bars=[],
                has_more=False,
                oldest_available=None,
                newest_available=None,
            )

        oldest_available = (
            bars[0].date
        )

        newest_available = (
            bars[-1].date
        )

        # -------------------------------------------------
        # DETERMINE WHETHER MORE HISTORY EXISTS
        # -------------------------------------------------

        if intraday:
            oldest_datetime = (
                parse_market_datetime(
                    oldest_available,
                )
            )

            has_more = (
                oldest_datetime
                > (
                    cutoff
                    + timedelta(
                        hours=1,
                    )
                )
            )

        else:
            has_more = (
                period != "max"
            )

        # -------------------------------------------------
        # RESPONSE
        # -------------------------------------------------

        return MarketHistoryResponse(
            symbol=(
                ticker_symbol
            ),

            interval=(
                interval
            ),

            bars=(
                bars
            ),

            has_more=(
                has_more
            ),

            oldest_available=(
                oldest_available
            ),

            newest_available=(
                newest_available
            ),
        )

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=(
                status.HTTP_502_BAD_GATEWAY
            ),
            detail=(
                "Market history failed: "
                f"{exc}"
            ),
        ) from exc