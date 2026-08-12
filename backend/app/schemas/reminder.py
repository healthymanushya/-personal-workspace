from typing import Literal

from pydantic import BaseModel

from app.schemas.task import TaskOut

ReminderKind = Literal["upcoming", "due"]


class ReminderItemOut(BaseModel):
    kind: ReminderKind
    minutes_remaining: int
    task: TaskOut


class ReminderAck(BaseModel):
    kind: ReminderKind
