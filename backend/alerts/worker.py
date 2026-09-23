import os
import signal
import time
from datetime import datetime, timezone

from dotenv import load_dotenv
from sqlmodel import Session

load_dotenv()

from database import engine

# Register models referenced by alert foreign keys before
# the standalone worker creates a SQLModel session.
from auth.models import User
from alerts.models import Alert, Notification
from alerts.push_models import PushSubscription

from alerts.engine import run_alert_engine


# =========================================================
# CONFIGURATION
# =========================================================

DEFAULT_INTERVAL_SECONDS = 60

CHECK_INTERVAL_SECONDS = max(
    15,
    int(
        os.getenv(
            "ALERT_CHECK_INTERVAL_SECONDS",
            str(DEFAULT_INTERVAL_SECONDS),
        )
    ),
)


# =========================================================
# WORKER STATE
# =========================================================

running = True


def utc_timestamp() -> str:
    return datetime.now(
        timezone.utc,
    ).isoformat(
        timespec="seconds",
    )


def request_shutdown(
    signum,
    frame,
) -> None:
    global running

    running = False

    print(
        f"\n[{utc_timestamp()}] "
        "Alert worker shutting down...",
        flush=True,
    )


signal.signal(
    signal.SIGINT,
    request_shutdown,
)

signal.signal(
    signal.SIGTERM,
    request_shutdown,
)


# =========================================================
# RUN ONE CYCLE
# =========================================================

def run_cycle() -> None:
    try:
        with Session(engine) as session:
            result = run_alert_engine(
                session=session,
            )

        print(
            (
                f"[{utc_timestamp()}] "
                f"Checked {result.alerts_checked} alert(s) "
                f"across {result.symbols_checked} symbol(s). "
                f"Triggered {result.alerts_triggered}. "
                f"Created {result.notifications_created} "
                "notification(s)."
            ),
            flush=True,
        )

        if result.symbols_failed:
            print(
                (
                    f"[{utc_timestamp()}] "
                    f"{result.symbols_failed} symbol fetch(es) failed."
                ),
                flush=True,
            )

        for error in result.errors:
            print(
                f"[{utc_timestamp()}] ERROR: {error}",
                flush=True,
            )

    except Exception as exc:
        print(
            (
                f"[{utc_timestamp()}] "
                f"WORKER ERROR: {exc}"
            ),
            flush=True,
        )


# =========================================================
# WORKER LOOP
# =========================================================

def run_worker() -> None:
    print(
        (
            f"[{utc_timestamp()}] "
            "A-Trader alert worker started. "
            f"Checking every {CHECK_INTERVAL_SECONDS} seconds."
        ),
        flush=True,
    )

    while running:
        cycle_started = time.monotonic()

        run_cycle()

        elapsed = (
            time.monotonic()
            - cycle_started
        )

        sleep_remaining = max(
            0,
            CHECK_INTERVAL_SECONDS
            - elapsed,
        )

        while (
            running
            and sleep_remaining > 0
        ):
            sleep_for = min(
                1.0,
                sleep_remaining,
            )

            time.sleep(
                sleep_for,
            )

            sleep_remaining -= sleep_for

    print(
        (
            f"[{utc_timestamp()}] "
            "A-Trader alert worker stopped."
        ),
        flush=True,
    )


# =========================================================
# ENTRY POINT
# =========================================================

if __name__ == "__main__":
    run_worker()
