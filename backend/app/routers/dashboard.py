from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.dashboard import DashboardSummary, DayGroup, UpcomingOverview
from app.schemas.task import TaskOut
from app.services import dashboard_service, task_service

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return dashboard_service.get_summary(db, current_user)


@router.get("/today", response_model=list[TaskOut])
def today(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tasks = dashboard_service.get_today_tasks(db, current_user)
    return [task_service.serialize_task(t) for t in tasks]


@router.get("/next-task", response_model=TaskOut | None)
def next_task(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = dashboard_service.get_next_task(db, current_user)
    return task_service.serialize_task(task) if task else None


@router.get("/upcoming", response_model=UpcomingOverview)
def upcoming(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    grouped = dashboard_service.get_upcoming_grouped(db, current_user)
    days = [
        DayGroup(date=d, tasks=[task_service.serialize_task(t) for t in tasks])
        for d, tasks in sorted(grouped.items())
    ]
    return UpcomingOverview(days=days)


@router.get("/overdue", response_model=list[TaskOut])
def overdue(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tasks = dashboard_service.get_overdue_tasks(db, current_user)
    return [task_service.serialize_task(t) for t in tasks]


@router.get("/completed", response_model=list[TaskOut])
def completed(
    on_date: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tasks = dashboard_service.get_completed_tasks(db, current_user, on_date)
    return [task_service.serialize_task(t) for t in tasks]
