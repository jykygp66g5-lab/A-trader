from pydantic import BaseModel


class PushKeys(BaseModel):
    p256dh: str
    auth: str


class PushSubscriptionCreate(BaseModel):
    endpoint: str
    keys: PushKeys
    user_agent: str | None = None


class PushSubscriptionStatus(BaseModel):
    enabled: bool
    subscription_count: int


class PushPublicKey(BaseModel):
    public_key: str


class PushMessage(BaseModel):
    message: str
