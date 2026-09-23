from typing import Callable

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)

from sqlmodel import Session

from auth.models import User
from database import get_session

from .engine import (
    run_alert_engine,
)

from .schemas import (
    AlertCreate,
    AlertListResponse,
    AlertMessage,
    AlertRead,
    AlertUpdate,
    NotificationListResponse,
    NotificationRead,
    NotificationUnreadCount,
)

from .service import (
    create_alert,
    delete_alert,
    get_unread_notification_count,
    get_user_alert,
    get_user_alerts,
    get_user_notification,
    get_user_notifications,
    mark_all_notifications_read,
    mark_notification_read,
    update_alert,
)


# =========================================================
# ROUTER FACTORY
# =========================================================

def create_alerts_router(
    get_current_user: Callable,
) -> APIRouter:
    router = APIRouter(
        prefix="/alerts",
        tags=["Alerts"],
    )


    # =====================================================
    # ALERTS
    # =====================================================

    @router.post(
        "",
        response_model=AlertRead,
        status_code=status.HTTP_201_CREATED,
    )
    def create_user_alert(
        data: AlertCreate,
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

        try:
            return create_alert(
                session=session,
                user_id=current_user.id,
                data=data,
            )

        except ValueError as exc:
            raise HTTPException(
                status_code=(
                    status.HTTP_400_BAD_REQUEST
                ),
                detail=str(exc),
            ) from exc


    @router.get(
        "",
        response_model=AlertListResponse,
    )
    def list_user_alerts(
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

        alerts = get_user_alerts(
            session=session,
            user_id=current_user.id,
        )

        return AlertListResponse(
            alerts=alerts,
            count=len(alerts),
            active_count=sum(
                1
                for alert in alerts
                if alert.is_active
            ),
        )


    @router.get(
        "/{alert_id}",
        response_model=AlertRead,
    )
    def read_user_alert(
        alert_id: int,
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

        alert = get_user_alert(
            session=session,
            user_id=current_user.id,
            alert_id=alert_id,
        )

        if alert is None:
            raise HTTPException(
                status_code=(
                    status.HTTP_404_NOT_FOUND
                ),
                detail="Alert not found.",
            )

        return alert


    @router.patch(
        "/{alert_id}",
        response_model=AlertRead,
    )
    def update_user_alert(
        alert_id: int,
        data: AlertUpdate,
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

        alert = get_user_alert(
            session=session,
            user_id=current_user.id,
            alert_id=alert_id,
        )

        if alert is None:
            raise HTTPException(
                status_code=(
                    status.HTTP_404_NOT_FOUND
                ),
                detail="Alert not found.",
            )

        try:
            return update_alert(
                session=session,
                alert=alert,
                data=data,
            )

        except ValueError as exc:
            raise HTTPException(
                status_code=(
                    status.HTTP_400_BAD_REQUEST
                ),
                detail=str(exc),
            ) from exc


    @router.delete(
        "/{alert_id}",
        response_model=AlertMessage,
    )
    def delete_user_alert(
        alert_id: int,
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

        alert = get_user_alert(
            session=session,
            user_id=current_user.id,
            alert_id=alert_id,
        )

        if alert is None:
            raise HTTPException(
                status_code=(
                    status.HTTP_404_NOT_FOUND
                ),
                detail="Alert not found.",
            )

        delete_alert(
            session=session,
            alert=alert,
        )

        return AlertMessage(
            message="Alert deleted.",
        )


    # =====================================================
    # NOTIFICATIONS
    #
    # IMPORTANT:
    # These routes must be declared before /{alert_id}
    # would matter if this router were reorganized later.
    # Their explicit paths remain grouped here for clarity.
    # =====================================================

    @router.get(
        "/notifications/list",
        response_model=NotificationListResponse,
    )
    def list_notifications(
        limit: int = Query(
            default=50,
            ge=1,
            le=100,
        ),
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

        notifications = (
            get_user_notifications(
                session=session,
                user_id=current_user.id,
                limit=limit,
            )
        )

        unread_count = (
            get_unread_notification_count(
                session=session,
                user_id=current_user.id,
            )
        )

        return NotificationListResponse(
            notifications=notifications,
            count=len(notifications),
            unread_count=unread_count,
        )


    @router.get(
        "/notifications/unread-count",
        response_model=NotificationUnreadCount,
    )
    def unread_notification_count(
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

        count = (
            get_unread_notification_count(
                session=session,
                user_id=current_user.id,
            )
        )

        return NotificationUnreadCount(
            unread_count=count,
        )


    @router.patch(
        "/notifications/{notification_id}/read",
        response_model=NotificationRead,
    )
    def read_notification(
        notification_id: int,
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

        notification = (
            get_user_notification(
                session=session,
                user_id=current_user.id,
                notification_id=(
                    notification_id
                ),
            )
        )

        if notification is None:
            raise HTTPException(
                status_code=(
                    status.HTTP_404_NOT_FOUND
                ),
                detail="Notification not found.",
            )

        return mark_notification_read(
            session=session,
            notification=notification,
        )


    @router.post(
        "/notifications/read-all",
        response_model=AlertMessage,
    )
    def read_all_notifications(
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

        updated = (
            mark_all_notifications_read(
                session=session,
                user_id=current_user.id,
            )
        )

        return AlertMessage(
            message=(
                f"{updated} notification"
                f"{'' if updated == 1 else 's'} "
                "marked as read."
            ),
        )


    # =====================================================
    # DEVELOPMENT ENGINE ENDPOINT
    # =====================================================

    @router.post(
        "/engine/run",
    )
    def run_engine(
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

        result = run_alert_engine(
            session=session,
        )

        return {
            "alerts_checked":
                result.alerts_checked,

            "alerts_triggered":
                result.alerts_triggered,

            "symbols_checked":
                result.symbols_checked,

            "symbols_failed":
                result.symbols_failed,

            "notifications_created":
                result.notifications_created,

            "errors":
                result.errors,
        }


    return router
