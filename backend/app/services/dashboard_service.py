from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.task import Task, TaskStatus
from app.models.user import User
from app.services.task_service import sync_status
from app.timezone import today_ist

UPCOMING_DAYS = 7


def _user_tasks(db: Session, user: User) -> list[Task]:
    stmt = select(Task).where(Task.user_id == user.id).order_by(Task.due_at.asc())
    tasks = list(db.execute(stmt).scalars().all())
    return [sync_status(db, t) for t in tasks]


def get_today_tasks(db: Session, user: User) -> list[Task]:
    today = today_ist()
    return [t for t in _user_tasks(db, user) if t.due_date == today]


def get_next_task(db: Session, user: User) -> Task | None:
    """The soonest task that is not yet completed, whether due today or overdue."""
    candidates = [
        t
        for t in _user_tasks(db, user)
        if t.status in (TaskStatus.PENDING, TaskStatus.IN_PROGRESS, TaskStatus.OVERDUE)
    ]
    return candidates[0] if candidates else None


def get_upcoming_tasks(db: Session, user: User, days: int = UPCOMING_DAYS) -> list[Task]:
    today = today_ist()
    end = today + timedelta(days=days - 1)
    return [
        t
        for t in _user_tasks(db, user)
        if today <= t.due_date <= end and t.status != TaskStatus.COMPLETED
    ]


def get_upcoming_grouped(db: Session, user: User, days: int = UPCOMING_DAYS) -> dict[date, list[Task]]:
    today = today_ist()
    grouped: dict[date, list[Task]] = {today + timedelta(days=i): [] for i in range(days)}
    for t in get_upcoming_tasks(db, user, days):
        grouped.setdefault(t.due_date, []).append(t)
    return grouped


def get_overdue_tasks(db: Session, user: User) -> list[Task]:
    return [t for t in _user_tasks(db, user) if t.status == TaskStatus.OVERDUE]


def get_completed_tasks(db: Session, user: User, on_date: date | None = None) -> list[Task]:
    tasks = [t for t in _user_tasks(db, user) if t.status == TaskStatus.COMPLETED]
    if on_date:
        tasks = [t for t in tasks if t.completed_at and t.due_date == on_date]
    return tasks


def get_summary(db: Session, user: User) -> dict:
    today = today_ist()
    all_tasks = _user_tasks(db, user)

    today_count = sum(1 for t in all_tasks if t.due_date == today and t.status != TaskStatus.COMPLETED)
    overdue_count = sum(1 for t in all_tasks if t.status == TaskStatus.OVERDUE)
    completed_today_count = sum(
        1 for t in all_tasks if t.status == TaskStatus.COMPLETED and t.completed_at and t.due_date == today
    )
    in_progress_count = sum(1 for t in all_tasks if t.status == TaskStatus.IN_PROGRESS)
    upcoming_count = len(get_upcoming_tasks(db, user))

    return {
        "today_date": today,
        "today_count": today_count,
        "overdue_count": overdue_count,
        "completed_today_count": completed_today_count,
        "upcoming_count": upcoming_count,
        "in_progress_count": in_progress_count,
    }
