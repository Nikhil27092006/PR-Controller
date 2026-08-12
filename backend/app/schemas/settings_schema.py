from pydantic import BaseModel


class SettingsResponse(BaseModel):
    auto_sync_enabled: bool = True

    sync_interval_minutes: int = 10

    notifications_enabled: bool = True