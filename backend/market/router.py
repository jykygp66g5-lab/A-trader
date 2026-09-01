from __future__ import annotations

from typing import Callable

from fastapi import (
    APIRouter,
    Depends,
    Query,
)

from scanner import ScannerMode

from .models import (
    MarketAnalysisResponse,
    MarketHistoryResponse,
)

from .service import (
    analyze_market_symbol,
    get_market_history_data,
)


# =========================================================
# ROUTER FACTORY
# =========================================================

def create_market_router(
    get_current_user: Callable,
) -> APIRouter:
    router = APIRouter(
        prefix="/market",
        tags=[
            "Market Analyzer",
        ],
    )

    # =====================================================
    # MARKET ANALYSIS
    # =====================================================

    @router.get(
        "/analyze/{symbol}",
        response_model=MarketAnalysisResponse,
    )
    def analyze_market(
        symbol: str,

        mode: ScannerMode = Query(
            default="balanced",
        ),

        current_user=Depends(
            get_current_user,
        ),
    ):
        return analyze_market_symbol(
            symbol=symbol,
            mode=mode,
        )

    # =====================================================
    # MARKET HISTORY
    # =====================================================

    @router.get(
        "/history/{symbol}",
        response_model=MarketHistoryResponse,
    )
    def get_market_history(
        symbol: str,

        interval: str = Query(
            default="1d",
        ),

        period: str = Query(
            default="3mo",
        ),

        before: str | None = Query(
            default=None,
        ),

        start: str | None = Query(
            default=None,
        ),

        end: str | None = Query(
            default=None,
        ),

        window_days: int | None = Query(
            default=None,
            ge=1,
            le=36500,
        ),

        current_user=Depends(
            get_current_user,
        ),
    ):
        return get_market_history_data(
            symbol=symbol,
            interval=interval,
            period=period,
            before=before,
            start=start,
            end=end,
            window_days=window_days,
        )

    return router