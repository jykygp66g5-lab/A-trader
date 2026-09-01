from datetime import datetime, timezone
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
from trades.models import Trade

from .models import (
    PlaybookSetup,
    PlaybookSetupCreate,
    PlaybookSetupRead,
    PlaybookSetupUpdate,
)

from .service import (
    get_user_playbook_setup,
    normalize_playbook_payload,
    validate_playbook_rules,
)


# =========================================================
# ROUTER FACTORY
# =========================================================

def create_playbook_router(
    get_current_user: Callable,
) -> APIRouter:
    router = APIRouter(
        prefix="/playbook",
        tags=["Playbook"],
    )

    # =====================================================
    # GET ALL PLAYBOOK SETUPS
    # =====================================================

    @router.get(
        "",
        response_model=list[PlaybookSetupRead],
    )
    def get_playbook_setups(
        session: Session = Depends(
            get_session,
        ),
        current_user: User = Depends(
            get_current_user,
        ),
    ):
        statement = (
            select(PlaybookSetup)
            .where(
                PlaybookSetup.user_id
                == current_user.id,
            )
            .order_by(
                PlaybookSetup.updated_at.desc(),
            )
        )

        return (
            session.exec(
                statement,
            )
            .all()
        )

    # =====================================================
    # CREATE PLAYBOOK SETUP
    # =====================================================

    @router.post(
        "",
        response_model=PlaybookSetupRead,
        status_code=status.HTTP_201_CREATED,
    )
    def create_playbook_setup(
        setup_data: PlaybookSetupCreate,
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

        values = (
            normalize_playbook_payload(
                setup_data.model_dump()
            )
        )

        validate_playbook_rules(
            values["entry_rules"],
            values["invalidation_rules"],
        )

        setup = PlaybookSetup(
            **values,
            user_id=current_user.id,
        )

        session.add(setup)
        session.commit()
        session.refresh(setup)

        return setup

    # =====================================================
    # GET ONE PLAYBOOK SETUP
    # =====================================================

    @router.get(
        "/{setup_id}",
        response_model=PlaybookSetupRead,
    )
    def get_playbook_setup(
        setup_id: str,
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

        return get_user_playbook_setup(
            setup_id,
            current_user.id,
            session,
        )

    # =====================================================
    # UPDATE PLAYBOOK SETUP
    # =====================================================

    @router.patch(
        "/{setup_id}",
        response_model=PlaybookSetupRead,
    )
    def update_playbook_setup(
        setup_id: str,
        setup_data: PlaybookSetupUpdate,
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

        setup = get_user_playbook_setup(
            setup_id,
            current_user.id,
            session,
        )

        values = (
            normalize_playbook_payload(
                setup_data.model_dump(
                    exclude_unset=True,
                )
            )
        )

        final_entry_rules = values.get(
            "entry_rules",
            setup.entry_rules,
        )

        final_invalidation_rules = values.get(
            "invalidation_rules",
            setup.invalidation_rules,
        )

        validate_playbook_rules(
            final_entry_rules,
            final_invalidation_rules,
        )

        for field, value in values.items():
            setattr(
                setup,
                field,
                value,
            )

        setup.updated_at = datetime.now(
            timezone.utc,
        )

        session.add(setup)
        session.commit()
        session.refresh(setup)

        return setup

    # =====================================================
    # DUPLICATE PLAYBOOK SETUP
    # =====================================================

    @router.post(
        "/{setup_id}/duplicate",
        response_model=PlaybookSetupRead,
        status_code=status.HTTP_201_CREATED,
    )
    def duplicate_playbook_setup(
        setup_id: str,
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

        original = get_user_playbook_setup(
            setup_id,
            current_user.id,
            session,
        )

        copy = PlaybookSetup(
            user_id=current_user.id,
            name=f"{original.name} Copy",
            description=original.description,
            market_condition=(
                original.market_condition
            ),
            timeframe=original.timeframe,
            max_risk_percent=(
                original.max_risk_percent
            ),
            entry_rules=list(
                original.entry_rules
            ),
            invalidation_rules=list(
                original.invalidation_rules
            ),
            target_rules=list(
                original.target_rules
            ),
            confirmations=list(
                original.confirmations
            ),
            mistakes_to_avoid=list(
                original.mistakes_to_avoid
            ),
        )

        session.add(copy)
        session.commit()
        session.refresh(copy)

        return copy

    # =====================================================
    # DELETE PLAYBOOK SETUP
    # =====================================================

    @router.delete(
        "/{setup_id}",
        status_code=status.HTTP_204_NO_CONTENT,
    )
    def delete_playbook_setup(
        setup_id: str,
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

        setup = get_user_playbook_setup(
            setup_id,
            current_user.id,
            session,
        )

        linked_trades = (
            session.exec(
                select(Trade)
                .where(
                    Trade.user_id
                    == current_user.id,

                    Trade.playbook_setup_id
                    == setup.id,
                )
            )
            .all()
        )

        for trade in linked_trades:
            trade.playbook_setup_id = ""

            session.add(trade)

        session.delete(setup)
        session.commit()

        return Response(
            status_code=(
                status.HTTP_204_NO_CONTENT
            ),
        )

    return router