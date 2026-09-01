from typing import Callable

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Response,
    status,
)

from sqlmodel import (
    Session,
    select,
)

from database import get_session

from auth.models import User
from playbook.service import resolve_trade_playbook

from .models import (
    Trade,
    TradeCreate,
    TradeRead,
    TradeUpdate,
)

from .service import (
    normalize_trade_create_values,
    normalize_trade_update_values,
    validate_trade_values,
)


# =========================================================
# ROUTER FACTORY
# =========================================================

def create_trades_router(
    get_current_user: Callable,
) -> APIRouter:
    router = APIRouter(
        prefix="/trades",
        tags=["Trades"],
    )

    # =====================================================
    # GET ALL TRADES
    # =====================================================

    @router.get(
        "",
        response_model=list[TradeRead],
    )
    def get_trades(
        session: Session = Depends(
            get_session,
        ),
        current_user: User = Depends(
            get_current_user,
        ),
    ):
        statement = (
            select(Trade)
            .where(
                Trade.user_id
                == current_user.id,
            )
            .order_by(
                Trade.created_at.desc(),
            )
        )

        return (
            session.exec(
                statement,
            )
            .all()
        )

    # =====================================================
    # CREATE TRADE
    # =====================================================

    @router.post(
        "",
        response_model=TradeRead,
        status_code=status.HTTP_201_CREATED,
    )
    def create_trade(
        trade_data: TradeCreate,
        session: Session = Depends(
            get_session,
        ),
        current_user: User = Depends(
            get_current_user,
        ),
    ):
        if current_user.id is None:
            raise HTTPException(
                status_code=(
                    status.HTTP_500_INTERNAL_SERVER_ERROR
                ),
                detail=(
                    "The user account is missing an ID."
                ),
            )

        validate_trade_values(
            direction=trade_data.direction,
            entry_price=trade_data.entry_price,
            stop_loss=trade_data.stop_loss,
            target_price=trade_data.target_price,
        )

        trade_values = (
            trade_data.model_dump()
        )

        playbook_id, playbook_name = (
            resolve_trade_playbook(
                trade_values[
                    "playbook_setup_id"
                ],
                current_user.id,
                session,
            )
        )

        trade_values[
            "playbook_setup_id"
        ] = playbook_id

        trade_values[
            "playbook_setup_name"
        ] = playbook_name

        trade_values = (
            normalize_trade_create_values(
                trade_values,
            )
        )

        trade = Trade(
            **trade_values,
            user_id=current_user.id,
        )

        session.add(trade)
        session.commit()
        session.refresh(trade)

        return trade

    # =====================================================
    # GET ONE TRADE
    # =====================================================

    @router.get(
        "/{trade_id}",
        response_model=TradeRead,
    )
    def get_trade(
        trade_id: int,
        session: Session = Depends(
            get_session,
        ),
        current_user: User = Depends(
            get_current_user,
        ),
    ):
        statement = (
            select(Trade)
            .where(
                Trade.id == trade_id,
                Trade.user_id
                == current_user.id,
            )
        )

        trade = (
            session.exec(
                statement,
            )
            .first()
        )

        if trade is None:
            raise HTTPException(
                status_code=(
                    status.HTTP_404_NOT_FOUND
                ),
                detail="Trade not found.",
            )

        return trade

    # =====================================================
    # UPDATE TRADE
    # =====================================================

    @router.patch(
        "/{trade_id}",
        response_model=TradeRead,
    )
    def update_trade(
        trade_id: int,
        trade_data: TradeUpdate,
        session: Session = Depends(
            get_session,
        ),
        current_user: User = Depends(
            get_current_user,
        ),
    ):
        if current_user.id is None:
            raise HTTPException(
                status_code=(
                    status.HTTP_500_INTERNAL_SERVER_ERROR
                ),
                detail=(
                    "The user account is missing an ID."
                ),
            )

        statement = (
            select(Trade)
            .where(
                Trade.id == trade_id,
                Trade.user_id
                == current_user.id,
            )
        )

        trade = (
            session.exec(
                statement,
            )
            .first()
        )

        if trade is None:
            raise HTTPException(
                status_code=(
                    status.HTTP_404_NOT_FOUND
                ),
                detail="Trade not found.",
            )

        update_data = (
            trade_data.model_dump(
                exclude_unset=True,
            )
        )

        if (
            "playbook_setup_id"
            in update_data
        ):
            playbook_id, playbook_name = (
                resolve_trade_playbook(
                    update_data[
                        "playbook_setup_id"
                    ]
                    or "",
                    current_user.id,
                    session,
                )
            )

            update_data[
                "playbook_setup_id"
            ] = playbook_id

            update_data[
                "playbook_setup_name"
            ] = playbook_name

        direction = update_data.get(
            "direction",
            trade.direction,
        )

        entry_price = update_data.get(
            "entry_price",
            trade.entry_price,
        )

        stop_loss = update_data.get(
            "stop_loss",
            trade.stop_loss,
        )

        target_price = update_data.get(
            "target_price",
            trade.target_price,
        )

        validate_trade_values(
            direction=direction,
            entry_price=entry_price,
            stop_loss=stop_loss,
            target_price=target_price,
        )

        update_data = (
            normalize_trade_update_values(
                update_data,
            )
        )

        for field, value in update_data.items():
            setattr(
                trade,
                field,
                value,
            )

        session.add(trade)
        session.commit()
        session.refresh(trade)

        return trade

    # =====================================================
    # DELETE TRADE
    # =====================================================

    @router.delete(
        "/{trade_id}",
        status_code=status.HTTP_204_NO_CONTENT,
    )
    def delete_trade(
        trade_id: int,
        session: Session = Depends(
            get_session,
        ),
        current_user: User = Depends(
            get_current_user,
        ),
    ):
        statement = (
            select(Trade)
            .where(
                Trade.id == trade_id,
                Trade.user_id
                == current_user.id,
            )
        )

        trade = (
            session.exec(
                statement,
            )
            .first()
        )

        if trade is None:
            raise HTTPException(
                status_code=(
                    status.HTTP_404_NOT_FOUND
                ),
                detail="Trade not found.",
            )

        session.delete(trade)
        session.commit()

        return Response(
            status_code=(
                status.HTTP_204_NO_CONTENT
            ),
        )

    return router