import os

from sqlmodel import SQLModel, Session, create_engine


# =========================================================
# DATABASE CONFIGURATION
# =========================================================

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://atrader:atrader_dev_password@localhost:5432/atrader",
)

# Railway provides postgresql:// URLs. Explicitly select
# psycopg 3 so SQLAlchemy does not fall back to psycopg2.
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgresql://",
        "postgresql+psycopg://",
        1,
    )


engine = create_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
)


# =========================================================
# DATABASE HELPERS
# =========================================================

def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session