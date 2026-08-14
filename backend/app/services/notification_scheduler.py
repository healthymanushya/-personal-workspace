"""In-process background scheduler for reminder push notifications.

Runs as a single asyncio task inside the existing FastAPI process (no
separate worker/cron service). Each tick finds due PRE_REMINDER/DUE events
across all users, atomically claims them (marks the task's fired_at column
before sending), then sends each via OneSignal. Claiming before sending
guarantees a notification is never sent twice -- even across a crash or
restart -- at the acceptable cost of a rare missed send if the process dies
between claiming and sending.
"""

import asyncio
import logging
from datetime import timedelta

from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session

from app.config import settings
from app.database import SessionLocal
from app.models.task import Task, TaskStatus
from app.services import onesignal_service
from app.timezone import now_utc

logger = logging.getLogger("notification_scheduler")

POLL_INTERVAL_SECONDS = 30
# Matches reminder_minutes_before's max (10080 minutes / le=10080 in the schema).
MAX_REMINDER_LOOKAHEAD = timedelta(days=7)
REMINDER_ELIGIBLE_STATUSES = (TaskStatus.PENDING, TaskStatus.IN_PROGRESS, TaskStatus.OVERDUE)


def _candidate_tasks(db: Session) -> list[Task]:
    """Bounded superset of tasks that might have a due event this tick,
    using the existing due_at index rather than scanning the whole table."""
    now = now_utc()
    stmt = select(Task).where(
        Task.status.in_(REMINDER_ELIGIBLE_STATUSES),
        Task.due_at <= now + MAX_REMINDER_LOOKAHEAD,
        or_(
            and_(Task.reminder_minutes_before.is_not(None), Task.reminder_fired_at.is_(None)),
            and_(Task.due_notification_enabled.is_(True), Task.due_alert_fired_at.is_(None)),
        ),
    )
    return list(db.execute(stmt).scalars().all())


def _claim_due_events(db: Session) -> list[dict]:
    """Finds due events and marks them fired in the same pass, before
    returning plain dicts (not ORM objects, which would be detached and
    unsafe to read from once this function's session closes)."""
    now = now_utc()
    claimed: list[dict] = []
    rows_to_commit: list[Task] = []

    for task in _candidate_tasks(db):
        minutes_before = task.reminder_minutes_before
        if minutes_before is not None and task.reminder_fired_at is None:
            trigger_at = task.due_at - timedelta(minutes=minutes_before)
            if trigger_at <= now < task.due_at:
                task.reminder_fired_at = now
                rows_to_commit.append(task)
                claimed.append(
                    {
                        "task_id": task.id,
                        "user_id": task.user_id,
                        "title": task.title,
                        "notification_type": "PRE_REMINDER",
                        "reminder_minutes_before": minutes_before,
                    }
                )

        if task.due_notification_enabled and task.due_alert_fired_at is None and now >= task.due_at:
            task.due_alert_fired_at = now
            if task not in rows_to_commit:
                rows_to_commit.append(task)
            claimed.append(
                {
                    "task_id": task.id,
                    "user_id": task.user_id,
                    "title": task.title,
                    "notification_type": "DUE",
                    "reminder_minutes_before": None,
                }
            )

    if rows_to_commit:
        db.add_all(rows_to_commit)
        db.commit()

    return claimed


def _format_offset(minutes: int) -> str:
    if minutes >= 1440:
        days = minutes // 1440
        return f"{days} day{'s' if days != 1 else ''}"
    if minutes >= 60:
        hours = minutes // 60
        return f"{hours} hour{'s' if hours != 1 else ''}"
    return f"{minutes} minute{'s' if minutes != 1 else ''}"


def _build_notification(event: dict) -> tuple[str, str]:
    title = f"\U0001f514 {event['title']}"
    if event["notification_type"] == "PRE_REMINDER":
        minutes = event["reminder_minutes_before"] or 0
        if minutes == 0:
            body = f"{event['title']} starts now."
        else:
            body = f"{event['title']} starts in {_format_offset(minutes)}."
    else:
        body = f"{event['title']} is due now."
    return title, body


async def _send_claimed_events(claimed: list[dict]) -> None:
    for event in claimed:
        title, body = _build_notification(event)
        try:
            await onesignal_service.send_notification(
                external_user_id=event["user_id"],
                title=title,
                body=body,
                url=f"{settings.frontend_base_url}/?task={event['task_id']}",
                data={"task_id": event["task_id"], "notification_type": event["notification_type"]},
            )
        except Exception:
            logger.exception(
                "Failed to send %s notification for task %s", event["notification_type"], event["task_id"]
            )


async def run_notification_scheduler() -> None:
    if not onesignal_service.is_configured():
        logger.info("OneSignal not configured (ONESIGNAL_APP_ID/ONESIGNAL_REST_API_KEY unset); scheduler disabled.")
        return

    while True:
        try:
            db = SessionLocal()
            try:
                claimed = await asyncio.to_thread(_claim_due_events, db)
            finally:
                db.close()

            if claimed:
                await _send_claimed_events(claimed)
        except Exception:
            logger.exception("Notification scheduler tick failed")

        await asyncio.sleep(POLL_INTERVAL_SECONDS)
