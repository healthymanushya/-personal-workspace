from datetime import timedelta

from app.models.task import Task
from app.services import notification_scheduler, onesignal_service
from app.timezone import now_utc
from tests.test_tasks import make_task


def test_is_configured_false_by_default():
    assert onesignal_service.is_configured() is False


def test_claim_due_events_claims_pre_reminder(client, auth_headers, db_session):
    task = make_task(client, auth_headers, reminder_minutes_before=5)
    t = db_session.get(Task, task["id"])
    t.due_at = now_utc() + timedelta(minutes=3)
    db_session.add(t)
    db_session.commit()

    claimed = notification_scheduler._claim_due_events(db_session)
    assert len(claimed) == 1
    assert claimed[0]["notification_type"] == "PRE_REMINDER"
    assert claimed[0]["task_id"] == task["id"]

    # Claiming again in the same tick must not re-claim (idempotency).
    assert notification_scheduler._claim_due_events(db_session) == []


def test_claim_due_events_claims_due(client, auth_headers, db_session):
    task = make_task(client, auth_headers, reminder_minutes_before=None)
    t = db_session.get(Task, task["id"])
    t.due_at = now_utc() - timedelta(seconds=5)
    db_session.add(t)
    db_session.commit()

    claimed = notification_scheduler._claim_due_events(db_session)
    assert len(claimed) == 1
    assert claimed[0]["notification_type"] == "DUE"

    db_session.refresh(t)
    assert t.due_alert_fired_at is not None

    assert notification_scheduler._claim_due_events(db_session) == []


def test_claim_due_events_respects_due_notification_enabled(client, auth_headers, db_session):
    task = make_task(client, auth_headers, reminder_minutes_before=None)
    resp = client.patch(
        f"/api/tasks/{task['id']}",
        json={"due_notification_enabled": False},
        headers=auth_headers,
    )
    assert resp.status_code == 200

    t = db_session.get(Task, task["id"])
    t.due_at = now_utc() - timedelta(seconds=5)
    db_session.add(t)
    db_session.commit()

    assert notification_scheduler._claim_due_events(db_session) == []


def test_claim_due_events_ignores_completed_tasks(client, auth_headers, db_session):
    task = make_task(client, auth_headers, reminder_minutes_before=None)
    client.post(f"/api/tasks/{task['id']}/complete", headers=auth_headers)

    t = db_session.get(Task, task["id"])
    t.due_at = now_utc() - timedelta(seconds=5)
    db_session.add(t)
    db_session.commit()

    assert notification_scheduler._claim_due_events(db_session) == []


def test_build_notification_pre_reminder_text():
    event = {"title": "Meeting with Sales", "notification_type": "PRE_REMINDER", "reminder_minutes_before": 5}
    title, body = notification_scheduler._build_notification(event)
    assert title == "\U0001f514 Meeting with Sales"
    assert body == "Meeting with Sales starts in 5 minutes."


def test_build_notification_due_text():
    event = {"title": "Meeting with Sales", "notification_type": "DUE", "reminder_minutes_before": None}
    title, body = notification_scheduler._build_notification(event)
    assert title == "\U0001f514 Meeting with Sales"
    assert body == "Meeting with Sales is due now."


def test_build_notification_day_offset_text():
    event = {"title": "Renew passport", "notification_type": "PRE_REMINDER", "reminder_minutes_before": 1440}
    _, body = notification_scheduler._build_notification(event)
    assert body == "Renew passport starts in 1 day."
