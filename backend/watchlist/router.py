from typing import Callable

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from sqlalchemy.exc import IntegrityError

from sqlmodel import (
    Session,
    select,
)

from auth.models import User
from database import get_session
from scanner import sanitize_symbol

from .models import (
    WatchlistItem,
    WatchlistItemRead,
)


# =========================================================
# ROUTER FACTORY
# =========================================================

def create_watchlist_router(
    get_current_user: Callable,
) -> APIRouter:
    router = APIRouter(
        prefix="/watchlist",
        tags=[
            "Watchlist",
        ],
    )


    # =====================================================
    # GET WATCHLIST
    # =====================================================

    @router.get(
        "",
        response_model=list[
            WatchlistItemRead
        ],
    )
    def get_watchlist(
        current_user: User = Depends(
            get_current_user,
        ),
        session: Session = Depends(
            get_session,
        ),
    ):
        if current_user.id is None:
            raise HTTPException(
                status_code=(
                    status.HTTP_401_UNAUTHORIZED
                ),
                detail="Invalid user.",
            )

        return session.exec(
            select(
                WatchlistItem,
            )
            .where(
                WatchlistItem.user_id
                == current_user.id,
            )
            .order_by(
                WatchlistItem.created_at.desc(),
            )
        ).all()


    # =====================================================
    # ADD SYMBOL
    # =====================================================

    @router.post(
        "/{symbol}",
        response_model=WatchlistItemRead,
        status_code=(
            status.HTTP_201_CREATED
        ),
    )
    def add_to_watchlist(
        symbol: str,
        current_user: User = Depends(
            get_current_user,
        ),
        session: Session = Depends(
            get_session,
        ),
    ):
        if current_user.id is None:
            raise HTTPException(
                status_code=(
                    status.HTTP_401_UNAUTHORIZED
                ),
                detail="Invalid user.",
            )

        ticker = sanitize_symbol(
            symbol,
        )

        if not ticker:
            raise HTTPException(
                status_code=(
                    status.HTTP_400_BAD_REQUEST
                ),
                detail="Enter a valid symbol.",
            )

        existing = session.exec(
            select(
                WatchlistItem,
            ).where(
                WatchlistItem.user_id
                == current_user.id,
                WatchlistItem.symbol
                == ticker,
            )
        ).first()

        if existing is not None:
            return existing

        item = WatchlistItem(
            user_id=current_user.id,
            symbol=ticker,
        )

        session.add(
            item,
        )

        try:
            session.commit()

        except IntegrityError:
            session.rollback()

            existing = session.exec(
                select(
                    WatchlistItem,
                ).where(
                    WatchlistItem.user_id
                    == current_user.id,
                    WatchlistItem.symbol
                    == ticker,
                )
            ).first()

            if existing is not None:
                return existing

            raise

        session.refresh(
            item,
        )

        return item


    # =====================================================
    # REMOVE SYMBOL
    # =====================================================

    @router.delete(
        "/{symbol}",
        status_code=(
            status.HTTP_204_NO_CONTENT
        ),
    )
    def remove_from_watchlist(
        symbol: str,
        current_user: User = Depends(
            get_current_user,
        ),
        session: Session = Depends(
            get_session,
        ),
    ):
        if current_user.id is None:
            raise HTTPException(
                status_code=(
                    status.HTTP_401_UNAUTHORIZED
                ),
                detail="Invalid user.",
            )

        ticker = sanitize_symbol(
            symbol,
        )

        item = session.exec(
            select(
                WatchlistItem,
            ).where(
                WatchlistItem.user_id
                == current_user.id,
                WatchlistItem.symbol
                == ticker,
            )
        ).first()

        if item is None:
            raise HTTPException(
                status_code=(
                    status.HTTP_404_NOT_FOUND
                ),
                detail=(
                    "Symbol is not in your watchlist."
                ),
            )

        session.delete(
            item,
        )

        session.commit()

        return None


    return router
