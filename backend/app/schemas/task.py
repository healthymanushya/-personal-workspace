from datetime import date, datetime, time

from pydantic import BaseModel, ConfigDict, Field

from app.models.task import Category, Priority, TaskStatus


class TaskBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    category: Category = Category.OTHER
    priority: Priority = Priority.MEDIUM
    due_date: date
    due_time: time | None = None
    reminder_minutes_before: int | None = Field(default=None, ge=0, le=10080)
    due_notification_enabled: bool = True


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    category: Category | None = None
    priority: Priority | None = None
    status: TaskStatus | None = None
    due_date: date | None = None
    due_time: time | None = None
    reminder_minutes_before: int | None = None
    due_notification_enabled: bool | None = None


class TaskSnooze(BaseModel):
    minutes: int | None = Field(default=None, ge=1, le=10080)
    until: datetime | None = None


class TaskReschedule(BaseModel):
    due_date: date
    due_time: time | None = None


class TaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    description: str | None
    category: Category
    priority: Priority
    status: TaskStatus

    due_date: date
    due_time: time | None
    due_at: datetime
    due_at_ist: str

    reminder_minutes_before: int | None
    reminder_fired_at: datetime | None
    due_notification_enabled: bool
    due_alert_fired_at: datetime | None

    snoozed_until: datetime | None
    completed_at: datetime | None

    created_at: datetime
    updated_at: datetime

    is_overdue: bool
