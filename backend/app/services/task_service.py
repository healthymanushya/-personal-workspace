from datetime import date, timedelta

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.task import Task, TaskStatus
from app.models.user import User
from app.schemas.task import TaskCreate, TaskOut, TaskReschedule, TaskSnooze, TaskUpdate
from app.timezone import (
    as_utc_naive,
    combine_ist_to_utc_naive,
    now_utc,
    utc_naive_to_ist,
)

ACTIVE_STATUSES = (TaskStatus.PENDING, TaskStatus.IN_PROGRESS)


def sync_status(db: Session, task: Task, commit: bool = True) -> Task:
    """
    Derive OVERDUE / un-snooze status at read time, per the reminder
    architecture: overdue is not set by the user, it's computed from due_at.
    """
    changed = False

    if task.status == TaskStatus.SNOOZED and task.snoozed_until is not None and task.snoozed_until <= now_utc():
        task.status = TaskStatus.PENDING
        task.snoozed_until = None
        changed = True

    if task.status in ACTIVE_STATUSES and task.due_at < now_utc():
        task.status = TaskStatus.OVERDUE
        changed = True

    if changed and commit:
        db.add(task)
        db.commit()
        db.refresh(task)

    return task


def serialize_task(task: Task) -> TaskOut:
    due_at_ist = utc_naive_to_ist(task.due_at)
    return TaskOut(
        id=task.id,
        title=task.title,
        description=task.description,
        category=task.category,
        priority=task.priority,
        status=task.status,
        due_date=task.due_date,
        due_time=task.due_time,
        due_at=task.due_at,
        due_at_ist=due_at_ist.isoformat() if due_at_ist else "",
        reminder_minutes_before=task.reminder_minutes_before,
        reminder_fired_at=task.reminder_fired_at,
        due_notification_enabled=task.due_notification_enabled,
        due_alert_fired_at=task.due_alert_fired_at,
        snoozed_until=task.snoozed_until,
        completed_at=task.completed_at,
        created_at=task.created_at,
        updated_at=task.updated_at,
        is_overdue=task.status == TaskStatus.OVERDUE,
    )


def get_task_or_404(db: Session, user: User, task_id: str) -> Task:
    task = db.get(Task, task_id)
    if task is None or task.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return sync_status(db, task)


def list_tasks(
    db: Session,
    user: User,
    task_status: TaskStatus | None = None,
    category: str | None = None,
    priority: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    search: str | None = None,
) -> list[Task]:
    stmt = select(Task).where(Task.user_id == user.id)

    if category:
        stmt = stmt.where(Task.category == category)
    if priority:
        stmt = stmt.where(Task.priority == priority)
    if date_from:
        stmt = stmt.where(Task.due_date >= date_from)
    if date_to:
        stmt = stmt.where(Task.due_date <= date_to)
    if search:
        stmt = stmt.where(Task.title.ilike(f"%{search}%"))

    stmt = stmt.order_by(Task.due_at.asc())
    tasks = list(db.execute(stmt).scalars().all())
    tasks = [sync_status(db, t) for t in tasks]

    if task_status:
        tasks = [t for t in tasks if t.status == task_status]

    return tasks


def create_task(db: Session, user: User, payload: TaskCreate) -> Task:
    due_at = combine_ist_to_utc_naive(payload.due_date, payload.due_time)
    now = now_utc()
    task = Task(
        user_id=user.id,
        title=payload.title,
        description=payload.description,
        category=payload.category,
        priority=payload.priority,
        status=TaskStatus.PENDING,
        due_date=payload.due_date,
        due_time=payload.due_time,
        due_at=due_at,
        reminder_minutes_before=payload.reminder_minutes_before,
        due_notification_enabled=payload.due_notification_enabled,
        # A task created with a due_at already in the past must never fire a
        # notification for it -- pre-mark both as already "fired".
        reminder_fired_at=now if due_at <= now else None,
        due_alert_fired_at=now if due_at <= now else None,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return sync_status(db, task)


def update_task(db: Session, task: Task, payload: TaskUpdate) -> Task:
    data = payload.model_dump(exclude_unset=True)

    date_changed = "due_date" in data or "due_time" in data
    # Any change to when the task is due, or to the pre-reminder offset,
    # invalidates the current notification schedule -- clear the fired
    # markers so the (possibly new) trigger times can fire again.
    reschedule_relevant = date_changed or "reminder_minutes_before" in data

    for field, value in data.items():
        setattr(task, field, value)

    if date_changed:
        task.due_at = combine_ist_to_utc_naive(task.due_date, task.due_time)

    if reschedule_relevant:
        now = now_utc()
        task.reminder_fired_at = now if task.due_at <= now else None
        task.due_alert_fired_at = now if task.due_at <= now else None

    db.add(task)
    db.commit()
    db.refresh(task)
    return sync_status(db, task)


def delete_task(db: Session, task: Task) -> None:
    db.delete(task)
    db.commit()


def complete_task(db: Session, task: Task) -> Task:
    task.status = TaskStatus.COMPLETED
    task.completed_at = now_utc()
    task.snoozed_until = None
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def snooze_task(db: Session, task: Task, payload: TaskSnooze) -> Task:
    if payload.until is not None:
        until_utc = as_utc_naive(payload.until) if payload.until.tzinfo else payload.until
    elif payload.minutes is not None:
        until_utc = now_utc() + timedelta(minutes=payload.minutes)
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Provide either 'minutes' or 'until'")

    task.status = TaskStatus.SNOOZED
    task.snoozed_until = until_utc
    # Clear fired markers so reminders can fire again once the snooze expires,
    # per the "snooze -> reminder again" requirement.
    task.reminder_fired_at = None
    task.due_alert_fired_at = None
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def reschedule_task(db: Session, task: Task, payload: TaskReschedule) -> Task:
    task.due_date = payload.due_date
    task.due_time = payload.due_time
    task.due_at = combine_ist_to_utc_naive(payload.due_date, payload.due_time)
    task.status = TaskStatus.PENDING
    task.snoozed_until = None
    task.completed_at = None
    task.reminder_fired_at = None
    task.due_alert_fired_at = None
    db.add(task)
    db.commit()
    db.refresh(task)
    return sync_status(db, task)
