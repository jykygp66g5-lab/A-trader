import json

from trades.models import Trade

from trades.service import (
    calculate_planned_reward_risk,
    calculate_trade_pnl,
    calculate_trade_r_multiple,
    calculate_trade_risk_dollars,
    get_trade_strategy_name,
)


# =========================================================
# AI COACH TRADE RECORD
# =========================================================

def build_ai_coach_trade_record(
    trade: Trade,
) -> dict:
    pnl = (
        calculate_trade_pnl(
            trade,
        )
    )

    risk_dollars = (
        calculate_trade_risk_dollars(
            trade,
        )
    )

    r_multiple = (
        calculate_trade_r_multiple(
            trade,
        )
    )

    planned_reward_risk = (
        calculate_planned_reward_risk(
            trade,
        )
    )

    return {
        "trade_id":
            trade.id,

        "symbol":
            trade.symbol,

        "direction":
            trade.direction,

        "entry_price":
            trade.entry_price,

        "exit_price":
            trade.exit_price,

        "stop_loss":
            trade.stop_loss,

        "target_price":
            trade.target_price,

        "position_size":
            trade.position_size,

        "risk_percent":
            trade.risk_percent,

        "strategy":
            get_trade_strategy_name(
                trade,
            ),

        "playbook_setup_id":
            trade.playbook_setup_id
            or "",

        "playbook_setup_name":
            trade.playbook_setup_name
            or "",

        "tags":
            trade.tags
            or [],

        "confidence":
            trade.confidence,

        "psychology_notes":
            trade.psychology_notes
            or "",

        "lesson_learned":
            trade.lesson_learned
            or "",

        "trade_time":
            (
                trade.trade_time
                .isoformat()
                if trade.trade_time
                else None
            ),

        "created_at":
            trade.created_at
            .isoformat(),

        "pnl":
            round(
                pnl,
                2,
            ),

        "risk_dollars":
            (
                round(
                    risk_dollars,
                    2,
                )
                if risk_dollars
                is not None
                else None
            ),

        "r_multiple":
            (
                round(
                    r_multiple,
                    2,
                )
                if r_multiple
                is not None
                else None
            ),

        "planned_reward_risk":
            (
                round(
                    planned_reward_risk,
                    2,
                )
                if planned_reward_risk
                is not None
                else None
            ),
    }


# =========================================================
# AI COACH STATISTICS
# =========================================================

def build_ai_coach_statistics(
    records: list[dict],
) -> dict:
    total = len(
        records,
    )

    winners = [
        trade
        for trade in records
        if trade[
            "pnl"
        ] > 0
    ]

    losers = [
        trade
        for trade in records
        if trade[
            "pnl"
        ] < 0
    ]

    breakeven = [
        trade
        for trade in records
        if trade[
            "pnl"
        ] == 0
    ]

    total_pnl = sum(
        trade[
            "pnl"
        ]
        for trade in records
    )

    gross_profit = sum(
        trade[
            "pnl"
        ]
        for trade in winners
    )

    gross_loss = abs(
        sum(
            trade[
                "pnl"
            ]
            for trade in losers
        )
    )

    win_rate = (
        (
            len(
                winners,
            )
            / total
        )
        * 100
        if total > 0
        else 0
    )

    average_pnl = (
        total_pnl
        / total
        if total > 0
        else 0
    )

    average_winner = (
        gross_profit
        / len(
            winners,
        )
        if winners
        else 0
    )

    average_loser = (
        gross_loss
        / len(
            losers,
        )
        if losers
        else 0
    )

    loss_probability = (
        len(
            losers,
        )
        / total
        if total > 0
        else 0
    )

    expectancy = (
        (
            win_rate
            / 100
        )
        * average_winner
        - loss_probability
        * average_loser
    )

    profit_factor = (
        gross_profit
        / gross_loss
        if gross_loss > 0
        else None
    )

    r_values = [
        trade[
            "r_multiple"
        ]
        for trade in records
        if trade[
            "r_multiple"
        ]
        is not None
    ]

    planned_rr_values = [
        trade[
            "planned_reward_risk"
        ]
        for trade in records
        if trade[
            "planned_reward_risk"
        ]
        is not None
    ]

    confidence_values = [
        trade[
            "confidence"
        ]
        for trade in records
    ]

    return {
        "performance": {
            "total_trades":
                total,

            "winning_trades":
                len(
                    winners,
                ),

            "losing_trades":
                len(
                    losers,
                ),

            "breakeven_trades":
                len(
                    breakeven,
                ),

            "win_rate_percent":
                round(
                    win_rate,
                    2,
                ),

            "total_pnl":
                round(
                    total_pnl,
                    2,
                ),

            "average_pnl":
                round(
                    average_pnl,
                    2,
                ),

            "average_winner":
                round(
                    average_winner,
                    2,
                ),

            "average_loser":
                round(
                    average_loser,
                    2,
                ),

            "expectancy":
                round(
                    expectancy,
                    2,
                ),

            "profit_factor":
                (
                    round(
                        profit_factor,
                        2,
                    )
                    if profit_factor
                    is not None
                    else None
                ),
        },

        "risk": {
            "trades_with_stop":
                sum(
                    trade[
                        "stop_loss"
                    ]
                    is not None
                    for trade in records
                ),

            "trades_with_target":
                sum(
                    trade[
                        "target_price"
                    ]
                    is not None
                    for trade in records
                ),

            "trades_with_r_multiple":
                len(
                    r_values,
                ),

            "average_r_multiple":
                (
                    round(
                        sum(
                            r_values,
                        )
                        / len(
                            r_values,
                        ),
                        2,
                    )
                    if r_values
                    else None
                ),

            "trades_with_planned_rr":
                len(
                    planned_rr_values,
                ),

            "average_planned_rr":
                (
                    round(
                        sum(
                            planned_rr_values,
                        )
                        / len(
                            planned_rr_values,
                        ),
                        2,
                    )
                    if planned_rr_values
                    else None
                ),
        },

        "journal_quality": {
            "with_playbook_setup":
                sum(
                    bool(
                        trade[
                            "playbook_setup_name"
                        ]
                    )
                    for trade in records
                ),

            "with_tags":
                sum(
                    bool(
                        trade[
                            "tags"
                        ]
                    )
                    for trade in records
                ),

            "with_psychology_notes":
                sum(
                    bool(
                        trade[
                            "psychology_notes"
                        ]
                        .strip()
                    )
                    for trade in records
                ),

            "with_lesson_learned":
                sum(
                    bool(
                        trade[
                            "lesson_learned"
                        ]
                        .strip()
                    )
                    for trade in records
                ),

            "with_trade_time":
                sum(
                    trade[
                        "trade_time"
                    ]
                    is not None
                    for trade in records
                ),
        },

        "confidence": {
            "average":
                (
                    round(
                        sum(
                            confidence_values,
                        )
                        / len(
                            confidence_values,
                        ),
                        2,
                    )
                    if confidence_values
                    else None
                ),
        },
    }


# =========================================================
# SAMPLE SIZE WARNING
# =========================================================

def get_ai_coach_sample_warning(
    total_trades: int,
) -> str:
    if total_trades < 10:
        return (
            f"Only {total_trades} trades are available. "
            "This sample is too small for reliable conclusions "
            "about strategy performance or behavioral patterns. "
            "Treat the observations as preliminary."
        )

    if total_trades < 30:
        return (
            f"The journal contains {total_trades} trades. "
            "Early tendencies may be visible, but the sample "
            "is still too small for strong conclusions."
        )

    if total_trades < 50:
        return (
            f"The journal contains {total_trades} trades. "
            "Repeated tendencies are becoming more meaningful, "
            "but they should still be interpreted cautiously."
        )

    return (
        f"The journal contains {total_trades} trades. "
        "The sample supports more meaningful comparisons, "
        "although historical performance never guarantees "
        "future results."
    )


# =========================================================
# SYSTEM PROMPT
# =========================================================

def build_ai_coach_system_prompt() -> str:
    return """
You are the AI performance coach inside A Trader.

A Trader is a trading journal and trading-performance analysis application.

Your role is to analyze the trader's COMPLETED JOURNAL HISTORY.

You do not find trades.
You do not predict markets.
You do not provide investment recommendations.

A TRADER ALREADY SUPPORTS:

- symbol
- long and short direction
- entry price
- exit price
- position size
- risk percentage
- stop loss
- target price
- automatic P&L
- automatic dollar risk
- automatic R-multiple
- planned reward-to-risk
- strategies
- custom strategies
- Playbook setup linking
- tags
- confidence score from 1 to 10
- psychology notes
- lesson learned
- trade time

NEVER recommend building, adding, or creating any of these features.

If one of these values is blank or null,
the trader did not complete that field for that trade.

It does NOT mean A Trader lacks the feature.

PROCESS VS OUTCOME:

A profitable trade is not automatically a good trade.

A losing trade is not automatically a bad trade.

A profitable trade can have poor process.

A losing trade can have good process.

Analyze execution quality, not merely P&L.

MISSING DATA:

Never invent information.

If stop_loss is null:
say the stop was not documented.

Do not claim the trader had no mental stop.

If psychology_notes is blank:
say psychology was not documented.

Do not infer fear, greed, FOMO, revenge trading,
or any other emotional state unless evidence exists.

If playbook_setup_name is blank:
say no Playbook setup was recorded.

Do not claim the trade had no setup.

If tags are empty:
say the trade was not tagged.

Do not infer market conditions that were not recorded.

R-MULTIPLE:

Use R-multiple when valid stop data exists.

Never treat a missing R-multiple as 0R.

R-multiple is useful for comparing trades with
different dollar sizes.

Use planned reward-to-risk only when both a
documented stop and documented target exist.

EVIDENCE:

Every strength and weakness must include concrete evidence.

Prefer evidence such as:

- number of trades
- win rate
- R-multiple
- average R
- stop usage
- target usage
- strategy
- Playbook setup
- tags
- confidence
- psychology notes
- lessons learned
- repeated behavior

Use the pre-calculated application statistics as factual.

Do not recalculate them differently.

Do not invent counts or percentages.

STRENGTHS:

A strength should represent positive PROCESS behavior.

Examples:

- consistent stop documentation
- positive R across a meaningful sample
- consistent Playbook execution
- disciplined risk
- strong journal completeness
- evidence of confidence calibration

Do not declare a reliable strength from one successful trade.

WEAKNESSES:

Weaknesses may include:

- inconsistent stop documentation
- weak risk discipline
- repeated negative R
- poor Playbook adherence
- incomplete journaling
- repeated psychological mistakes
- overconfidence associated with poor results
- repeated execution mistakes

Missing journal data should be described as missing documentation,
not as a missing software feature.

RECOMMENDATIONS:

Recommendations must tell the TRADER what to do.

Good:

"Record the planned stop before completing each trade."

"Link trades to their Playbook setup when applicable."

"Complete psychology notes immediately after the session."

"Review trades rated 8/10 or higher to compare confidence with outcomes."

Bad:

"Add a stop-loss field."

"Create psychology tracking."

"Build Playbook functionality."

"Add tags."

Those features already exist.

SAMPLE SIZE:

1-9 trades:
Treat findings as preliminary.
Do not claim reliable strategy edges or psychology patterns.

10-29 trades:
Early tendencies may be discussed cautiously.

30-49 trades:
Repeated tendencies can receive more weight.

50+ trades:
More meaningful comparison is possible.

Never claim certainty.

NEXT FOCUS:

Select exactly ONE process priority.

It should be the most useful behavior for the trader
to focus on before and after upcoming trades.

SAFETY:

Never tell the user to buy a security.

Never tell the user to sell a security.

Never predict a guaranteed price.

Never predict guaranteed market direction.

Never guarantee returns.

Never present historical journal results as proof
of future profitability.

STYLE:

Be concise.

Be evidence-based.

Be specific.

Avoid generic motivational language.

Do not repeat the same weakness multiple times.

If there is not enough evidence for multiple strengths,
return fewer strengths.

If there is not enough evidence for multiple weaknesses,
return fewer weaknesses.
""".strip()


# =========================================================
# USER PROMPT
# =========================================================

def build_ai_coach_user_prompt(
    records: list[dict],
    statistics: dict,
    sample_warning: str,
) -> str:
    payload = {
        "application_statistics":
            statistics,

        "sample_size_guidance":
            sample_warning,

        "individual_trades":
            records,
    }

    return (
        "Analyze this A Trader trading journal.\n\n"
        "The application has already calculated the "
        "summary statistics. Treat those values as factual.\n\n"
        "Use the individual trades for supporting evidence "
        "and qualitative process analysis.\n\n"
        "Return the structured AICoachResponse.\n\n"
        + json.dumps(
            payload,
            ensure_ascii=False,
            indent=2,
        )
    )