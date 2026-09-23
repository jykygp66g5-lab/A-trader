from datetime import datetime, timezone
from typing import Callable

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from fastapi.security import (
    OAuth2PasswordRequestForm,
)

from sqlmodel import (
    Session,
    select,
)

from database import get_session

from .models import (
    CURRENT_PRIVACY_VERSION,
    CURRENT_TERMS_VERSION,
    Token,
    User,
    UserCreate,
    UserRead,
)

from .service import (
    create_access_token,
    normalize_email,
    password_hash,
    validate_email,
)


# =========================================================
# ROUTER FACTORY
# =========================================================

def create_auth_router(
    *,
    get_current_user: Callable,
    jwt_secret_key: str | None,
) -> APIRouter:
    router = APIRouter(
        prefix="/auth",
        tags=["Authentication"],
    )

    # =====================================================
    # REGISTER
    # =====================================================

    @router.post(
        "/register",
        response_model=UserRead,
        status_code=status.HTTP_201_CREATED,
    )
    def register_user(
        user_data: UserCreate,
        session: Session = Depends(
            get_session,
        ),
    ):
        # -------------------------------------------------
        # AGE REQUIREMENT
        # -------------------------------------------------

        if user_data.age_confirmed is not True:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "You must confirm that you are at least "
                    "18 years old to create an A-Trader account."
                ),
            )

        # -------------------------------------------------
        # LEGAL ACCEPTANCE
        # -------------------------------------------------

        if (
            user_data.terms_accepted is not True
            or user_data.privacy_accepted is not True
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "You must accept the Terms of Service "
                    "and Privacy Policy to create an account."
                ),
            )

        # -------------------------------------------------
        # LEGAL DOCUMENT VERSIONS
        # -------------------------------------------------

        if user_data.terms_version != CURRENT_TERMS_VERSION:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "The Terms of Service version is no longer "
                    "current. Please review the current Terms "
                    "of Service."
                ),
            )

        if user_data.privacy_version != CURRENT_PRIVACY_VERSION:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "The Privacy Policy version is no longer "
                    "current. Please review the current Privacy "
                    "Policy."
                ),
            )

        # -------------------------------------------------
        # EMAIL
        # -------------------------------------------------

        email = validate_email(
            user_data.email,
        )

        existing_user = session.exec(
            select(User).where(
                User.email == email,
            )
        ).first()

        if existing_user is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "An account with this email already exists."
                ),
            )

        # -------------------------------------------------
        # RECORD ACCEPTANCE
        # -------------------------------------------------

        accepted_at = datetime.now(
            timezone.utc,
        )

        # -------------------------------------------------
        # CREATE USER
        # -------------------------------------------------

        user = User(
            name=user_data.name.strip(),
            email=email,
            hashed_password=password_hash.hash(
                user_data.password,
            ),
            age_confirmed_at=accepted_at,
            terms_version=CURRENT_TERMS_VERSION,
            terms_accepted_at=accepted_at,
            privacy_version=CURRENT_PRIVACY_VERSION,
            privacy_accepted_at=accepted_at,
        )

        session.add(user)
        session.commit()
        session.refresh(user)

        return user

    # =====================================================
    # LOGIN / TOKEN
    # =====================================================

    @router.post(
        "/token",
        response_model=Token,
    )
    def login_for_access_token(
        form_data: OAuth2PasswordRequestForm = Depends(),
        session: Session = Depends(
            get_session,
        ),
    ):
        email = normalize_email(
            form_data.username,
        )

        user = session.exec(
            select(User).where(
                User.email == email,
            )
        ).first()

        if (
            user is None
            or not password_hash.verify(
                form_data.password,
                user.hashed_password,
            )
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password.",
                headers={
                    "WWW-Authenticate": "Bearer",
                },
            )

        if user.id is None:
            raise HTTPException(
                status_code=(
                    status.HTTP_500_INTERNAL_SERVER_ERROR
                ),
                detail=(
                    "The user account is missing an ID."
                ),
            )

        access_token = create_access_token(
            user.id,
            jwt_secret_key,
        )

        return Token(
            access_token=access_token,
            token_type="bearer",
        )

    # =====================================================
    # CURRENT USER
    # =====================================================

    @router.get(
        "/me",
        response_model=UserRead,
    )
    def read_current_user(
        current_user: User = Depends(
            get_current_user,
        ),
    ):
        return current_user

    return router