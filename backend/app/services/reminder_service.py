from datetime import timedelta

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.task import Task, TaskStatus
from app.models.user import User
from app.services.task_service import sync_status
from app.timezone import now_utc

# A reminder can still fire for an overdue task (it's the most common case:
# the due-time alert fires exactly when the task becomes overdue). Only
# completed and snoozed tasks are excluded.
REMINDER_ELIGIBLE_STATUSES = (TaskStatus.PENDING, TaskStatus.IN_PROGRESS, TaskStatus.OVERDUE)


def get_due_reminders(db: Session, user: User) -> list[dict]:
    stmt = select(Task).where(Task.user_id == user.id, Task.reminder_minutes_before.is_not(None))
    tasks = list(db.execute(stmt).scalars().all())
    tasks = [sync_status(db, t) for t in tasks]

    now = now_utc()
    results: list[dict] = []

    for t in tasks:
        if t.status not in REMINDER_ELIGIBLE_STATUSES:
            continue

        minutes_before = t.reminder_minutes_before
        if minutes_before and minutes_before > 0:
            trigger_at = t.due_at - timedelta(minutes=minutes_before)
            if t.reminder_fired_at is None and trigger_at <= now < t.due_at:
                remaining = max(0, round((t.due_at - now).total_seconds() / 60))
                results.append({"kind": "upcoming", "minutes_remaining": remaining, "task": t})

        if t.due_alert_fired_at is None and now >= t.due_at:
            results.append({"kind": "due", "minutes_remaining": 0, "task": t})

    return results


def ack_reminder(db: Session, task: Task, kind: str) -> Task:
    if kind == "upcoming":
        task.reminder_fired_at = now_utc()
    elif kind == "due":
        task.due_alert_fired_at = now_utc()
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="kind must be 'upcoming' or 'due'")

    db.add(task)
    db.commit()
    db.refresh(task)
    return task
