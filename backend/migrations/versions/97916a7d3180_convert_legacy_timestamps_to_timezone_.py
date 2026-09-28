"""convert legacy timestamps to timezone aware

Revision ID: 97916a7d3180
Revises: a73ecb0c5876
Create Date: 2026-09-28 19:31:09.420877
"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "97916a7d3180"
down_revision: Union[str, Sequence[str], None] = "a73ecb0c5876"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _upgrade_timestamp(
    table_name: str,
    column_name: str,
) -> None:
    """Interpret the legacy naive value as UTC and store it as timestamptz."""
    op.execute(
        f'''
        ALTER TABLE "{table_name}"
        ALTER COLUMN "{column_name}"
        TYPE TIMESTAMP WITH TIME ZONE
        USING "{column_name}" AT TIME ZONE 'UTC'
        '''
    )


def _downgrade_timestamp(
    table_name: str,
    column_name: str,
) -> None:
    """Convert timestamptz back to a naive UTC timestamp."""
    op.execute(
        f'''
        ALTER TABLE "{table_name}"
        ALTER COLUMN "{column_name}"
        TYPE TIMESTAMP WITHOUT TIME ZONE
        USING "{column_name}" AT TIME ZONE 'UTC'
        '''
    )


def upgrade() -> None:
    # Normalize every application datetime column to TIMESTAMP WITH TIME ZONE.
    # Legacy naive values were written by application code using UTC.

    _upgrade_timestamp("alert", "created_at")
    _upgrade_timestamp("alert", "updated_at")
    _upgrade_timestamp("alert", "last_checked_at")
    _upgrade_timestamp("alert", "last_triggered_at")

    _upgrade_timestamp("notification", "created_at")
    _upgrade_timestamp("notification", "read_at")

    _upgrade_timestamp("pushsubscription", "created_at")
    _upgrade_timestamp("pushsubscription", "updated_at")

    _upgrade_timestamp("playbooksetup", "created_at")
    _upgrade_timestamp("playbooksetup", "updated_at")

    _upgrade_timestamp("trade", "trade_time")
    _upgrade_timestamp("trade", "created_at")

    _upgrade_timestamp("user", "created_at")
    _upgrade_timestamp("user", "age_confirmed_at")
    _upgrade_timestamp("user", "terms_accepted_at")
    _upgrade_timestamp("user", "privacy_accepted_at")


def downgrade() -> None:
    _downgrade_timestamp("user", "privacy_accepted_at")
    _downgrade_timestamp("user", "terms_accepted_at")
    _downgrade_timestamp("user", "age_confirmed_at")
    _downgrade_timestamp("user", "created_at")

    _downgrade_timestamp("trade", "created_at")
    _downgrade_timestamp("trade", "trade_time")

    _downgrade_timestamp("playbooksetup", "updated_at")
    _downgrade_timestamp("playbooksetup", "created_at")

    _downgrade_timestamp("pushsubscription", "updated_at")
    _downgrade_timestamp("pushsubscription", "created_at")

    _downgrade_timestamp("notification", "read_at")
    _downgrade_timestamp("notification", "created_at")

    _downgrade_timestamp("alert", "last_triggered_at")
    _downgrade_timestamp("alert", "last_checked_at")
    _downgrade_timestamp("alert", "updated_at")
    _downgrade_timestamp("alert", "created_at")
