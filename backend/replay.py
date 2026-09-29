from datetime import date, datetime, timedelta, timezone
from typing import Any, Callable

import pandas as pd

from market_data import download_market_data

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import SQLModel


REPLAY_INTERVALS = {
    "1m",
    "5m",
    "15m",
    "30m",
    "1h",
    "1d",
}

REPLAY_INTRADAY_INTERVALS = {
    "1m",
    "5m",
    "15m",
    "30m",
    "1h",
}


class ReplayBar(SQLModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int


class ReplaySessionResponse(SQLModel):
    symbol: str
    interval: str
    session_date: str

    bars: list[ReplayBar]
    total_bars: int

    first_bar: str | None
    last_bar: str | None

    previous_close: float | None

    session_open: float | None
    session_high: float | None
    session_low: float | None
    session_close: float | None

    total_volume: int

    is_intraday: bool
    message: str


def _extract_series(
    data: pd.DataFrame,
    column: str,
) -> pd.Series:
    series = data[column]

    if isinstance(
        series,
        pd.DataFrame,
    ):
        series = series.iloc[:, 0]

    return series


def _make_valid_index(
    open_price: pd.Series,
    high: pd.Series,
    low: pd.Series,
    close: pd.Series,
    volume: pd.Series,
):
    return (
        open_price
        .dropna()
        .index
        .intersection(
            high.dropna().index
        )
        .intersection(
            low.dropna().index
        )
        .intersection(
            close.dropna().index
        )
        .intersection(
            volume.dropna().index
        )
        .sort_values()
    )


def _build_bars(
    data: pd.DataFrame,
) -> list[ReplayBar]:
    open_price = _extract_series(
        data,
        "Open",
    )

    high = _extract_series(
        data,
        "High",
    )

    low = _extract_series(
        data,
        "Low",
    )

    close = _extract_series(
        data,
        "Close",
    )

    volume = _extract_series(
        data,
        "Volume",
    )

    valid_index = (
        _make_valid_index(
            open_price,
            high,
            low,
            close,
            volume,
        )
    )

    bars: list[ReplayBar] = []

    for timestamp in valid_index:
        bars.append(
            ReplayBar(
                date=(
                    timestamp
                    .isoformat()
                ),

                open=round(
                    float(
                        open_price.loc[
                            timestamp
                        ]
                    ),
                    4,
                ),

                high=round(
                    float(
                        high.loc[
                            timestamp
                        ]
                    ),
                    4,
                ),

                low=round(
                    float(
                        low.loc[
                            timestamp
                        ]
                    ),
                    4,
                ),

                close=round(
                    float(
                        close.loc[
                            timestamp
                        ]
                    ),
                    4,
                ),

                volume=int(
                    volume.loc[
                        timestamp
                    ]
                ),
            )
        )

    return bars


def _parse_session_date(
    value: str,
) -> date:
    try:
        replay_date = (
            date.fromisoformat(
                value
            )
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=(
                status
                .HTTP_400_BAD_REQUEST
            ),
            detail=(
                "Replay date must "
                "use YYYY-MM-DD."
            ),
        ) from exc

    today = (
        datetime.now(
            timezone.utc,
        )
        .date()
    )

    if (
        replay_date
        >= today
    ):
        raise HTTPException(
            status_code=(
                status
                .HTTP_400_BAD_REQUEST
            ),
            detail=(
                "Replay requires a "
                "completed historical "
                "trading date."
            ),
        )

    return replay_date


def _validate_intraday_age(
    replay_date: date,
):
    today = (
        datetime.now(
            timezone.utc,
        )
        .date()
    )

    age_days = (
        today
        - replay_date
    ).days

    if age_days > 59:
        raise HTTPException(
            status_code=(
                status
                .HTTP_400_BAD_REQUEST
            ),
            detail=(
                "Intraday replay data "
                "is currently limited "
                "to roughly the most "
                "recent 60 days. "
                "Choose a more recent "
                "date or use 1d."
            ),
        )


def _fetch_previous_close(
    symbol: str,
    replay_date: date,
) -> float | None:
    start_date = (
        replay_date
        - timedelta(
            days=10,
        )
    )

    try:
        data = download_market_data(
            symbol,
            start=(
                start_date
                .isoformat()
            ),
            end=(
                replay_date
                .isoformat()
            ),
            interval="1d",
            auto_adjust=True,
            progress=False,
            prepost=False,
        )

        if data.empty:
            return None

        close = (
            _extract_series(
                data,
                "Close",
            )
            .dropna()
        )

        if close.empty:
            return None

        return round(
            float(
                close.iloc[-1]
            ),
            4,
        )

    except Exception:
        return None


def _filter_intraday_bars(
    bars: list[ReplayBar],
    replay_date: date,
) -> list[ReplayBar]:
    session_bars: list[
        ReplayBar
    ] = []

    for bar in bars:
        try:
            bar_datetime = (
                datetime
                .fromisoformat(
                    bar.date
                )
            )

        except ValueError:
            continue

        if (
            bar_datetime
            .date()
            == replay_date
        ):
            session_bars.append(
                bar
            )

    return session_bars


def _filter_daily_bars(
    bars: list[ReplayBar],
    replay_date: date,
) -> list[ReplayBar]:
    session_bars: list[
        ReplayBar
    ] = []

    for bar in bars:
        try:
            bar_datetime = (
                datetime
                .fromisoformat(
                    bar.date
                )
            )

        except ValueError:
            continue

        if (
            bar_datetime
            .date()
            <= replay_date
        ):
            session_bars.append(
                bar
            )

    return session_bars


def create_replay_router(
    get_current_user_dependency:
        Callable[..., Any],
) -> APIRouter:
    router = APIRouter(
        prefix="/replay",
        tags=[
            "Replay",
        ],
    )

    @router.get(
        "/session/{symbol}",
        response_model=(
            ReplaySessionResponse
        ),
    )
    def get_replay_session(
        symbol: str,

        session_date: str = Query(
            ...,
            description=(
                "Historical replay "
                "date in YYYY-MM-DD "
                "format."
            ),
        ),

        interval: str = Query(
            default="5m",
        ),

        lookback_days: int = Query(
            default=90,
            ge=30,
            le=1000,
        ),

        current_user: Any = Depends(
            get_current_user_dependency
        ),
    ):
        del current_user

        ticker_symbol = (
            symbol
            .strip()
            .upper()
        )

        if not ticker_symbol:
            raise HTTPException(
                status_code=(
                    status
                    .HTTP_400_BAD_REQUEST
                ),
                detail=(
                    "Enter a stock "
                    "symbol."
                ),
            )

        if (
            len(
                ticker_symbol
            )
            > 15
        ):
            raise HTTPException(
                status_code=(
                    status
                    .HTTP_400_BAD_REQUEST
                ),
                detail=(
                    "Stock symbol is "
                    "too long."
                ),
            )

        if (
            interval
            not in
            REPLAY_INTERVALS
        ):
            raise HTTPException(
                status_code=(
                    status
                    .HTTP_400_BAD_REQUEST
                ),
                detail=(
                    "Unsupported replay "
                    "interval."
                ),
            )

        replay_date = (
            _parse_session_date(
                session_date
            )
        )

        is_intraday = (
            interval
            in
            REPLAY_INTRADAY_INTERVALS
        )

        if is_intraday:
            _validate_intraday_age(
                replay_date
            )

        try:
            if is_intraday:
                fetch_start = (
                    replay_date
                    - timedelta(
                        days=2,
                    )
                )

                fetch_end = (
                    replay_date
                    + timedelta(
                        days=2,
                    )
                )

                data = download_market_data(
                    ticker_symbol,
                    start=(
                        fetch_start
                        .isoformat()
                    ),
                    end=(
                        fetch_end
                        .isoformat()
                    ),
                    interval=interval,
                    auto_adjust=True,
                    progress=False,
                    prepost=False,
                )

            else:
                fetch_start = (
                    replay_date
                    - timedelta(
                        days=(
                            lookback_days
                        ),
                    )
                )

                fetch_end = (
                    replay_date
                    + timedelta(
                        days=1,
                    )
                )

                data = download_market_data(
                    ticker_symbol,
                    start=(
                        fetch_start
                        .isoformat()
                    ),
                    end=(
                        fetch_end
                        .isoformat()
                    ),
                    interval="1d",
                    auto_adjust=True,
                    progress=False,
                    prepost=False,
                )

            if data.empty:
                raise HTTPException(
                    status_code=(
                        status
                        .HTTP_404_NOT_FOUND
                    ),
                    detail=(
                        "No market data "
                        "was found for "
                        "this replay date. "
                        "The market may "
                        "have been closed "
                        "or the symbol may "
                        "be invalid."
                    ),
                )

            bars = (
                _build_bars(
                    data
                )
            )

            if not bars:
                raise HTTPException(
                    status_code=(
                        status
                        .HTTP_404_NOT_FOUND
                    ),
                    detail=(
                        "No replay candles "
                        "were available "
                        "for this request."
                    ),
                )

            if is_intraday:
                session_bars = (
                    _filter_intraday_bars(
                        bars,
                        replay_date,
                    )
                )

            else:
                session_bars = (
                    _filter_daily_bars(
                        bars,
                        replay_date,
                    )
                )

            if not session_bars:
                raise HTTPException(
                    status_code=(
                        status
                        .HTTP_404_NOT_FOUND
                    ),
                    detail=(
                        "No candles were "
                        "available for "
                        "the selected "
                        "replay date."
                    ),
                )

            previous_close = (
                _fetch_previous_close(
                    ticker_symbol,
                    replay_date,
                )
            )

            session_open = (
                session_bars[
                    0
                ].open
            )

            session_high = max(
                bar.high
                for bar
                in session_bars
            )

            session_low = min(
                bar.low
                for bar
                in session_bars
            )

            session_close = (
                session_bars[
                    -1
                ].close
            )

            total_volume = sum(
                bar.volume
                for bar
                in session_bars
            )

            if is_intraday:
                message = (
                    "Replay session "
                    "loaded. The "
                    "frontend should "
                    "reveal these "
                    "candles gradually "
                    "during playback."
                )

            else:
                message = (
                    "Daily replay "
                    "history loaded "
                    "through the "
                    "selected date."
                )

            return (
                ReplaySessionResponse(
                    symbol=(
                        ticker_symbol
                    ),

                    interval=(
                        interval
                    ),

                    session_date=(
                        replay_date
                        .isoformat()
                    ),

                    bars=(
                        session_bars
                    ),

                    total_bars=(
                        len(
                            session_bars
                        )
                    ),

                    first_bar=(
                        session_bars[
                            0
                        ].date
                    ),

                    last_bar=(
                        session_bars[
                            -1
                        ].date
                    ),

                    previous_close=(
                        previous_close
                    ),

                    session_open=(
                        session_open
                    ),

                    session_high=(
                        session_high
                    ),

                    session_low=(
                        session_low
                    ),

                    session_close=(
                        session_close
                    ),

                    total_volume=(
                        total_volume
                    ),

                    is_intraday=(
                        is_intraday
                    ),

                    message=(
                        message
                    ),
                )
            )

        except HTTPException:
            raise

        except Exception as exc:
            raise HTTPException(
                status_code=(
                    status
                    .HTTP_502_BAD_GATEWAY
                ),
                detail=(
                    "Replay market data "
                    f"request failed: {exc}"
                ),
            ) from exc

    return router