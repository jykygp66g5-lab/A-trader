import json
import logging
import os

from py_vapid import Vapid
from pywebpush import WebPushException, webpush
from sqlmodel import Session, select

from alerts.push_models import PushSubscription


logger = logging.getLogger(__name__)


def _get_vapid() -> tuple[Vapid, str]:
    private_key = os.getenv("VAPID_PRIVATE_KEY")
    subject = os.getenv("VAPID_SUBJECT")

    if not private_key:
        raise RuntimeError(
            "VAPID_PRIVATE_KEY is not configured."
        )

    if not subject:
        raise RuntimeError(
            "VAPID_SUBJECT is not configured."
        )

    vapid = Vapid.from_raw(
        private_key.encode("utf-8")
    )

    return vapid, subject


def send_push_to_user(
    *,
    session: Session,
    user_id: int,
    title: str,
    message: str,
    url: str = "/alerts#notifications",
    tag: str = "a-trader-notification",
) -> int:
    """
    Send a Web Push notification to every active
    browser/device subscription belonging to a user.

    Push failures never raise into the alert engine.
    Expired subscriptions are automatically disabled.
    """

    subscriptions = session.exec(
        select(PushSubscription).where(
            PushSubscription.user_id == user_id,
            PushSubscription.is_active == True,
        )
    ).all()

    if not subscriptions:
        return 0

    try:
        vapid, subject = _get_vapid()
    except Exception:
        logger.exception(
            "Web Push is not configured correctly."
        )
        return 0

    payload = json.dumps(
        {
            "title": title,
            "message": message,
            "url": url,
            "tag": tag,
        }
    )

    sent = 0

    for subscription in subscriptions:
        subscription_info = {
            "endpoint": subscription.endpoint,
            "keys": {
                "p256dh": subscription.p256dh,
                "auth": subscription.auth,
            },
        }

        try:
            webpush(
                subscription_info=subscription_info,
                data=payload,
                vapid_private_key=vapid,
                vapid_claims={
                    "sub": subject,
                },
                ttl=60,
                timeout=10,
            )

            sent += 1

        except WebPushException as exc:
            status_code = getattr(
                getattr(exc, "response", None),
                "status_code",
                None,
            )

            if status_code in {404, 410}:
                subscription.is_active = False
                session.add(subscription)

                logger.info(
                    "Disabled expired push subscription %s.",
                    subscription.id,
                )
            else:
                logger.warning(
                    "Web Push failed for subscription %s: %s",
                    subscription.id,
                    exc,
                )

        except Exception:
            logger.exception(
                "Unexpected Web Push failure for subscription %s.",
                subscription.id,
            )

    session.commit()

    return sent
