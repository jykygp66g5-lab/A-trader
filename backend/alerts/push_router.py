import os
from datetime import datetime, timezone
from typing import Callable

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlmodel import Session, select

from auth.models import User
from database import get_session

from .push_models import PushSubscription
from .push_schemas import (
    PushMessage,
    PushPublicKey,
    PushSubscriptionCreate,
    PushSubscriptionStatus,
)


def utc_now() -> datetime:
    return datetime.now(
        timezone.utc,
    )


def create_push_router(
    get_current_user: Callable,
) -> APIRouter:
    router = APIRouter(
        prefix="/push",
        tags=["Push Notifications"],
    )

    # =====================================================
    # PUBLIC VAPID KEY
    # =====================================================

    @router.get(
        "/public-key",
        response_model=PushPublicKey,
    )
    def get_public_key():
        public_key = os.getenv(
            "VAPID_PUBLIC_KEY",
        )

        if not public_key:
            raise HTTPException(
                status_code=(
                    status.HTTP_503_SERVICE_UNAVAILABLE
                ),
                detail=(
                    "Push notifications are not configured."
                ),
            )

        return PushPublicKey(
            public_key=public_key,
        )

    # =====================================================
    # SUBSCRIBE
    # =====================================================

    @router.post(
        "/subscribe",
        response_model=PushSubscriptionStatus,
    )
    def subscribe(
        data: PushSubscriptionCreate,
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

        existing = session.exec(
            select(PushSubscription).where(
                PushSubscription.endpoint
                == data.endpoint
            )
        ).first()

        now = utc_now()

        if existing is not None:
            existing.user_id = current_user.id
            existing.p256dh = data.keys.p256dh
            existing.auth = data.keys.auth
            existing.user_agent = data.user_agent
            existing.is_active = True
            existing.updated_at = now

            session.add(existing)

        else:
            subscription = PushSubscription(
                user_id=current_user.id,
                endpoint=data.endpoint,
                p256dh=data.keys.p256dh,
                auth=data.keys.auth,
                user_agent=data.user_agent,
                is_active=True,
                created_at=now,
                updated_at=now,
            )

            session.add(subscription)

        session.commit()

        subscriptions = session.exec(
            select(PushSubscription).where(
                PushSubscription.user_id
                == current_user.id,
                PushSubscription.is_active
                == True,  # noqa: E712
            )
        ).all()

        return PushSubscriptionStatus(
            enabled=True,
            subscription_count=len(
                subscriptions,
            ),
        )

    # =====================================================
    # STATUS
    # =====================================================

    @router.get(
        "/status",
        response_model=PushSubscriptionStatus,
    )
    def push_status(
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

        subscriptions = session.exec(
            select(PushSubscription).where(
                PushSubscription.user_id
                == current_user.id,
                PushSubscription.is_active
                == True,  # noqa: E712
            )
        ).all()

        count = len(
            subscriptions,
        )

        return PushSubscriptionStatus(
            enabled=count > 0,
            subscription_count=count,
        )

    # =====================================================
    # UNSUBSCRIBE
    # =====================================================

    @router.delete(
        "/subscribe",
        response_model=PushMessage,
    )
    def unsubscribe(
        endpoint: str,
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

        subscription = session.exec(
            select(PushSubscription).where(
                PushSubscription.user_id
                == current_user.id,
                PushSubscription.endpoint
                == endpoint,
            )
        ).first()

        if subscription is not None:
            session.delete(
                subscription,
            )
            session.commit()

        return PushMessage(
            message="Push subscription removed.",
        )

    return router
