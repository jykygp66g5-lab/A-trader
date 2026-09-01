import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv


# =========================================================
# ENVIRONMENT
# =========================================================

load_dotenv()


from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI

from database import create_db_and_tables

from auth.router import create_auth_router
from auth.service import create_current_user_dependency

from trades.router import create_trades_router
from playbook.router import create_playbook_router
from market.router import create_market_router
from ai_coach.router import create_ai_coach_router

from replay import create_replay_router
from scanner import create_scanner_router


# =========================================================
# APPLICATION CONFIGURATION
# =========================================================

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")

if not JWT_SECRET_KEY:
    raise RuntimeError(
        "JWT_SECRET_KEY environment variable is required."
    )


OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

OPENAI_MODEL = os.getenv(
    "OPENAI_MODEL",
    "qwen3:8b",
)

OPENAI_BASE_URL = os.getenv(
    "OPENAI_BASE_URL",
    "http://127.0.0.1:11434/v1",
)

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:3000",
)


allowed_origins = [
    FRONTEND_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]


# =========================================================
# OPENAI CLIENT
# =========================================================

openai_client = (
    OpenAI(
        api_key=OPENAI_API_KEY,
        base_url=OPENAI_BASE_URL,
    )
    if OPENAI_API_KEY
    else None
)


# =========================================================
# AUTH DEPENDENCY
# =========================================================

get_current_user = create_current_user_dependency(
    JWT_SECRET_KEY,
)


# =========================================================
# APPLICATION LIFESPAN
# =========================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield


# =========================================================
# FASTAPI APPLICATION
# =========================================================

app = FastAPI(
    title="A Trader API",
    version="1.0.0",
    lifespan=lifespan,
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# ROUTERS
# =========================================================

app.include_router(
    create_auth_router(
        get_current_user=get_current_user,
        jwt_secret_key=JWT_SECRET_KEY,
    ),
)

app.include_router(
    create_trades_router(
        get_current_user,
    ),
)

app.include_router(
    create_playbook_router(
        get_current_user,
    ),
)

app.include_router(
    create_market_router(
        get_current_user,
    ),
)

app.include_router(
    create_ai_coach_router(
        get_current_user=get_current_user,
        openai_client=openai_client,
        openai_model=OPENAI_MODEL,
    ),
)

app.include_router(
    create_scanner_router(
        get_current_user,
    ),
)

app.include_router(
    create_replay_router(
        get_current_user,
    ),
)


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():
    return {
        "message": "A Trader API is running",
        "version": "1.0.0",
    }