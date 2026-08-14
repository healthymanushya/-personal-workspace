"""Server-side OneSignal REST API client.

Sends push notifications targeted at a specific app user via OneSignal's
external_id alias, set on the frontend by OneSignal.login(user.id) after
sign-in. The REST API key used here is server-only and is never exposed to
the frontend, which only ever uses the public app ID.
"""

import httpx

from app.config import settings

ONESIGNAL_NOTIFICATIONS_URL = "https://api.onesignal.com/notifications"


def is_configured() -> bool:
    return bool(settings.onesignal_app_id and settings.onesignal_rest_api_key)


async def send_notification(
    *,
    external_user_id: str,
    title: str,
    body: str,
    url: str,
    data: dict | None = None,
) -> bool:
    """Returns True if OneSignal accepted the notification for delivery."""
    if not is_configured():
        return False

    payload = {
        "app_id": settings.onesignal_app_id,
        "target_channel": "push",
        "include_aliases": {"external_id": [external_user_id]},
        "headings": {"en": title},
        "contents": {"en": body},
        "url": url,
        "data": data or {},
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(
            ONESIGNAL_NOTIFICATIONS_URL,
            json=payload,
            headers={
                "Authorization": f"Key {settings.onesignal_rest_api_key}",
                "Content-Type": "application/json; charset=utf-8",
            },
        )

    return response.status_code < 300
