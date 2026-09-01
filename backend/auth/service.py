import jwt

from datetime import (
    datetime,
    timedelta,
    timezone,
)

from fastapi import (
    Depends,
    HTTPException,
    status,
)

from fastapi.security import OAuth2PasswordBearer

from jwt.exceptions import InvalidTokenError

from pwdlib import PasswordHash

from sqlmodel import (
    Session,
)

from database import get_session

from .models import User


# =========================================================
# AUTH CONSTANTS
# =========================================================

JWT_ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = (
    60 * 24 * 7
)

password_hash = (
    PasswordHash.recommended()
)

oauth2_scheme = (
    OAuth2PasswordBearer(
        tokenUrl="/auth/token",
    )
)


# =========================================================
# EMAIL HELPERS
# =========================================================

def normalize_email(
    email: str,
) -> str:
    return (
        email
        .strip()
        .lower()
    )


def validate_email(
    email: str,
) -> str:
    normalized = (
        normalize_email(
            email,
        )
    )

    if (
        "@" not in normalized
        or "." not in normalized.split("@")[-1]
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_422_UNPROCESSABLE_ENTITY
            ),
            detail=(
                "Enter a valid email address."
            ),
        )

    return normalized


# =========================================================
# ACCESS TOKEN
# =========================================================

def create_access_token(
    user_id: int,
    jwt_secret_key: str | None,
) -> str:
    if not jwt_secret_key:
        raise RuntimeError(
            "JWT_SECRET_KEY is missing."
        )

    now = datetime.now(
        timezone.utc,
    )

    expires_at = (
        now
        + timedelta(
            minutes=(
                ACCESS_TOKEN_EXPIRE_MINUTES
            ),
        )
    )

    payload = {
        "sub": str(
            user_id,
        ),
        "iat": now,
        "exp": expires_at,
        "type": "access",
    }

    return jwt.encode(
        payload,
        jwt_secret_key,
        algorithm=JWT_ALGORITHM,
    )


# =========================================================
# CURRENT USER DEPENDENCY FACTORY
# =========================================================

def create_current_user_dependency(
    jwt_secret_key: str | None,
):
    def get_current_user(
        token: str = Depends(
            oauth2_scheme,
        ),
        session: Session = Depends(
            get_session,
        ),
    ) -> User:
        credentials_error = (
            HTTPException(
                status_code=(
                    status.HTTP_401_UNAUTHORIZED
                ),
                detail=(
                    "Invalid or expired authentication token."
                ),
                headers={
                    "WWW-Authenticate": "Bearer",
                },
            )
        )

        if not jwt_secret_key:
            raise HTTPException(
                status_code=(
                    status.HTTP_500_INTERNAL_SERVER_ERROR
                ),
                detail=(
                    "JWT_SECRET_KEY is not configured."
                ),
            )

        try:
            payload = jwt.decode(
                token,
                jwt_secret_key,
                algorithms=[
                    JWT_ALGORITHM,
                ],
            )

            if (
                payload.get("type")
                != "access"
            ):
                raise credentials_error

            subject = payload.get(
                "sub",
            )

            if subject is None:
                raise credentials_error

            user_id = int(
                subject,
            )

        except (
            InvalidTokenError,
            ValueError,
        ):
            raise credentials_error

        user = session.get(
            User,
            user_id,
        )

        if user is None:
            raise credentials_error

        return user

    return get_current_user