from typing import (
    Any,
    Callable,
)

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from sqlmodel import (
    Session,
    select,
)

from database import get_session

from auth.models import User
from trades.models import Trade

from .models import AICoachResponse

from .service import (
    build_ai_coach_statistics,
    build_ai_coach_system_prompt,
    build_ai_coach_trade_record,
    build_ai_coach_user_prompt,
    get_ai_coach_sample_warning,
)


# =========================================================
# ROUTER FACTORY
# =========================================================

def create_ai_coach_router(
    *,
    get_current_user: Callable,
    openai_client: Any,
    openai_model: str,
) -> APIRouter:
    router = APIRouter(
        prefix="/ai-coach",
        tags=["AI Coach"],
    )

    # =====================================================
    # ANALYZE TRADES
    # =====================================================

    @router.post(
        "/analyze",
        response_model=AICoachResponse,
    )
    def analyze_trades(
        session: Session = Depends(
            get_session,
        ),
        current_user: User = Depends(
            get_current_user,
        ),
    ):
        if openai_client is None:
            raise HTTPException(
                status_code=(
                    status.HTTP_503_SERVICE_UNAVAILABLE
                ),
                detail=(
                    "The AI service is not configured. "
                    "Check backend/.env."
                ),
            )

        statement = (
            select(Trade)
            .where(
                Trade.user_id
                == current_user.id,
            )
            .order_by(
                Trade.created_at.asc(),
            )
        )

        trades = (
            session.exec(
                statement,
            )
            .all()
        )

        if not trades:
            raise HTTPException(
                status_code=(
                    status.HTTP_400_BAD_REQUEST
                ),
                detail=(
                    "Log at least one trade before running AI Coach."
                ),
            )

        records = [
            build_ai_coach_trade_record(
                trade,
            )
            for trade in trades
        ]

        statistics = (
            build_ai_coach_statistics(
                records,
            )
        )

        sample_warning = (
            get_ai_coach_sample_warning(
                len(records),
            )
        )

        system_prompt = (
            build_ai_coach_system_prompt()
        )

        user_prompt = (
            build_ai_coach_user_prompt(
                records=records,
                statistics=statistics,
                sample_warning=sample_warning,
            )
        )

        try:
            response = (
                openai_client
                .responses
                .parse(
                    model=openai_model,
                    input=[
                        {
                            "role": "system",
                            "content": system_prompt,
                        },
                        {
                            "role": "user",
                            "content": user_prompt,
                        },
                    ],
                    text_format=AICoachResponse,
                )
            )

        except Exception as exc:
            raise HTTPException(
                status_code=(
                    status.HTTP_502_BAD_GATEWAY
                ),
                detail=(
                    "AI Coach failed to analyze the journal: "
                    f"{exc}"
                ),
            ) from exc

        analysis = (
            response.output_parsed
        )

        if analysis is None:
            raise HTTPException(
                status_code=(
                    status.HTTP_502_BAD_GATEWAY
                ),
                detail=(
                    "AI Coach returned an invalid structured response."
                ),
            )

        analysis.sample_size_warning = (
            sample_warning
        )

        return analysis

    return router