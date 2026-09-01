from fastapi import (
    HTTPException,
    status,
)

from sqlmodel import (
    Session,
    select,
)

from .models import PlaybookSetup


# =========================================================
# RULE NORMALIZATION
# =========================================================

def normalize_rule_list(
    rules: list[str],
) -> list[str]:
    return [
        rule.strip()
        for rule in rules
        if (
            isinstance(
                rule,
                str,
            )
            and rule.strip()
        )
    ]


# =========================================================
# PLAYBOOK PAYLOAD NORMALIZATION
# =========================================================

def normalize_playbook_payload(
    values: dict,
) -> dict:
    string_fields = [
        "name",
        "description",
        "market_condition",
        "timeframe",
    ]

    for field in string_fields:
        if (
            field in values
            and values[field] is not None
        ):
            values[field] = (
                values[field]
                .strip()
            )

    rule_fields = [
        "entry_rules",
        "invalidation_rules",
        "target_rules",
        "confirmations",
        "mistakes_to_avoid",
    ]

    for field in rule_fields:
        if (
            field in values
            and values[field] is not None
        ):
            values[field] = (
                normalize_rule_list(
                    values[field],
                )
            )

    return values


# =========================================================
# PLAYBOOK VALIDATION
# =========================================================

def validate_playbook_rules(
    entry_rules: list[str],
    invalidation_rules: list[str],
):
    if not entry_rules:
        raise HTTPException(
            status_code=(
                status
                .HTTP_422_UNPROCESSABLE_ENTITY
            ),
            detail=(
                "Add at least one entry rule."
            ),
        )

    if not invalidation_rules:
        raise HTTPException(
            status_code=(
                status
                .HTTP_422_UNPROCESSABLE_ENTITY
            ),
            detail=(
                "Add at least one invalidation rule."
            ),
        )


# =========================================================
# GET USER PLAYBOOK SETUP
# =========================================================

def get_user_playbook_setup(
    setup_id: str,
    user_id: int,
    session: Session,
) -> PlaybookSetup:
    statement = (
        select(
            PlaybookSetup,
        )
        .where(
            PlaybookSetup.id
            == setup_id,

            PlaybookSetup.user_id
            == user_id,
        )
    )

    setup = (
        session.exec(
            statement,
        )
        .first()
    )

    if setup is None:
        raise HTTPException(
            status_code=(
                status
                .HTTP_404_NOT_FOUND
            ),
            detail=(
                "Playbook setup not found."
            ),
        )

    return setup


# =========================================================
# RESOLVE PLAYBOOK FOR TRADE
# =========================================================

def resolve_trade_playbook(
    setup_id: str,
    user_id: int,
    session: Session,
) -> tuple[
    str,
    str,
]:
    normalized_id = (
        setup_id
        .strip()
    )

    if not normalized_id:
        return (
            "",
            "",
        )

    setup = (
        get_user_playbook_setup(
            normalized_id,
            user_id,
            session,
        )
    )

    return (
        setup.id,
        setup.name,
    )