from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.reminder import ReminderAck, ReminderItemOut
from app.schemas.task import TaskOut
from app.services import reminder_service, task_service

router = APIRouter(prefix="/api/reminders", tags=["reminders"])


@router.get("/due-now", response_model=list[ReminderItemOut])
def due_now(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    items = reminder_service.get_due_reminders(db, current_user)
    return [
        ReminderItemOut(
            kind=item["kind"],
            minutes_remaining=item["minutes_remaining"],
            task=task_service.serialize_task(item["task"]),
        )
        for item in items
    ]


@router.post("/{task_id}/ack", response_model=TaskOut)
def ack(
    task_id: str,
    payload: ReminderAck,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = task_service.get_task_or_404(db, current_user, task_id)
    task = reminder_service.ack_reminder(db, task, payload.kind)
    return task_service.serialize_task(task)
