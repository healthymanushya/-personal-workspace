"""
All business logic (what's "today", what's overdue, when reminders fire) is
computed here in Asia/Kolkata (IST), never in the browser. Datetimes are
persisted in SQLite as naive values that represent UTC instants; every
boundary function below converts explicitly.
"""

from datetime import date, datetime, time as dt_time, timezone as dt_timezone
from zoneinfo import ZoneInfo

from app.config import settings

IST = ZoneInfo(settings.timezone)
UTC = dt_timezone.utc


def now_utc() -> datetime:
    """Current instant, naive, representing UTC (matches DB storage)."""
    return datetime.now(UTC).replace(tzinfo=None)


def now_ist() -> datetime:
    """Current wall-clock time in IST, timezone-aware."""
    return datetime.now(UTC).astimezone(IST)


def today_ist() -> date:
    return now_ist().date()


def as_utc_naive(dt: datetime) -> datetime:
    """Convert any aware datetime to a naive UTC datetime for storage."""
    if dt.tzinfo is None:
        raise ValueError("Expected a timezone-aware datetime")
    return dt.astimezone(UTC).replace(tzinfo=None)


def utc_naive_to_ist(dt: datetime | None) -> datetime | None:
    """Attach UTC to a naive stored value and convert to IST for display."""
    if dt is None:
        return None
    return dt.replace(tzinfo=UTC).astimezone(IST)


def combine_ist_to_utc_naive(day: date, time_of_day: dt_time | None) -> datetime:
    """
    Combine an IST calendar date + optional wall-clock time into the naive
    UTC datetime stored as `due_at`. A task with no time defaults to end of
    day (23:59:59 IST) so it sorts after timed tasks on the same day.
    """
    t = time_of_day if time_of_day is not None else dt_time(23, 59, 59)
    local_dt = datetime.combine(day, t, tzinfo=IST)
    return as_utc_naive(local_dt)
