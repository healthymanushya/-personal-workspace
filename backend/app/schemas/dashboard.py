from datetime import date

from pydantic import BaseModel

from app.schemas.task import TaskOut


class DashboardSummary(BaseModel):
    today_date: date
    today_count: int
    overdue_count: int
    completed_today_count: int
    upcoming_count: int
    in_progress_count: int


class DayGroup(BaseModel):
    date: date
    tasks: list[TaskOut]


class UpcomingOverview(BaseModel):
    days: list[DayGroup]
