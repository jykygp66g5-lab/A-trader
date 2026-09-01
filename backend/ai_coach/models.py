from sqlmodel import SQLModel


# =========================================================
# AI COACH PATTERN
# =========================================================

class AICoachPattern(SQLModel):
    title: str
    evidence: str
    impact: str


# =========================================================
# AI COACH RESPONSE
# =========================================================

class AICoachResponse(SQLModel):
    summary: str

    strengths: list[
        AICoachPattern
    ]

    weaknesses: list[
        AICoachPattern
    ]

    recommendations: list[str]

    next_focus: str

    sample_size_warning: str