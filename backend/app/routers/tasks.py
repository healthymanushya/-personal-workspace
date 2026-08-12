from datetime import date

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user
from app.database import get_db
from app.models.task import TaskStatus
from app.models.user import User
from app.schemas.task import TaskCreate, TaskOut, TaskReschedule, TaskSnooze, TaskUpdate
from app.services import task_service

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.get("", response_model=list[TaskOut])
def list_tasks(
    status_filter: TaskStatus | None = Query(default=None, alias="status"),
    category: str | None = None,
    priority: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tasks = task_service.list_tasks(
        db,
        current_user,
        task_status=status_filter,
        category=category,
        priority=priority,
        date_from=date_from,
        date_to=date_to,
        search=search,
    )
    return [task_service.serialize_task(t) for t in tasks]


@router.post("", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = task_service.create_task(db, current_user, payload)
    return task_service.serialize_task(task)


@router.get("/{task_id}", response_model=TaskOut)
def get_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = task_service.get_task_or_404(db, current_user, task_id)
    return task_service.serialize_task(task)


@router.patch("/{task_id}", response_model=TaskOut)
def update_task(
    task_id: str,
    payload: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = task_service.get_task_or_404(db, current_user, task_id)
    task = task_service.update_task(db, task, payload)
    return task_service.serialize_task(task)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = task_service.get_task_or_404(db, current_user, task_id)
    task_service.delete_task(db, task)


@router.post("/{task_id}/complete", response_model=TaskOut)
def complete_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = task_service.get_task_or_404(db, current_user, task_id)
    task = task_service.complete_task(db, task)
    return task_service.serialize_task(task)


@router.post("/{task_id}/snooze", response_model=TaskOut)
def snooze_task(
    task_id: str,
    payload: TaskSnooze,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = task_service.get_task_or_404(db, current_user, task_id)
    task = task_service.snooze_task(db, task, payload)
    return task_service.serialize_task(task)


@router.post("/{task_id}/reschedule", response_model=TaskOut)
def reschedule_task(
    task_id: str,
    payload: TaskReschedule,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = task_service.get_task_or_404(db, current_user, task_id)
    task = task_service.reschedule_task(db, task, payload)
    return task_service.serialize_task(task)
