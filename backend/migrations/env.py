import os
from logging.config import fileConfig

from alembic import context
from dotenv import load_dotenv
from sqlalchemy import engine_from_config, pool
from sqlmodel import SQLModel

# Load backend/.env for local development.
load_dotenv()

# Import every database table model explicitly.
# This ensures SQLModel.metadata always contains the complete schema.
from auth.models import User
from alerts.models import Alert, Notification
from alerts.push_models import PushSubscription
from trades.models import Trade
from playbook.models import PlaybookSetup


config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)


database_url = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://atrader:atrader_dev_password@localhost:5432/atrader",
)

# Railway provides postgresql:// URLs. Explicitly use psycopg,
# which is the PostgreSQL driver installed by backend/requirements.txt.
if database_url.startswith("postgresql://"):
    database_url = database_url.replace(
        "postgresql://",
        "postgresql+psycopg://",
        1,
    )

config.set_main_option("sqlalchemy.url", database_url)

target_metadata = SQLModel.metadata


def run_migrations_offline() -> None:
    context.configure(
        url=database_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
