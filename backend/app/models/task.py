import enum
import uuid
from datetime import date as date_, datetime
from datetime import time as time_
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Integer, String, Text, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.timezone import now_utc

if TYPE_CHECKING:
    from app.models.user import User


class Category(str, enum.Enum):
    MARKETING = "marketing"
    MEETINGS = "meetings"
    BUSINESS = "business"
    PERSONAL = "personal"
    CALLS = "calls"
    FOLLOW_UP = "follow_up"
    RESEARCH = "research"
    OTHER = "other"


class Priority(str, enum.Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    SNOOZED = "snoozed"
    OVERDUE = "overdue"


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    category: Mapped[Category] = mapped_column(Enum(Category), nullable=False, default=Category.OTHER)
    priority: Mapped[Priority] = mapped_column(Enum(Priority), nullable=False, default=Priority.MEDIUM)
    status: Mapped[TaskStatus] = mapped_column(Enum(TaskStatus), nullable=False, default=TaskStatus.PENDING)

    due_date: Mapped[date_] = mapped_column(Date, nullable=False, index=True)
    due_time: Mapped[time_ | None] = mapped_column(Time, nullable=True)
    due_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)

    reminder_minutes_before: Mapped[int | None] = mapped_column(Integer, nullable=True)
    reminder_fired_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    due_notification_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    due_alert_fired_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    snoozed_until: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=now_utc, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=now_utc, onupdate=now_utc, nullable=False)

    user: Mapped["User"] = relationship(back_populates="tasks")
