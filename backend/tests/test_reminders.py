from datetime import timedelta

from app.models.task import Task
from app.timezone import now_utc, today_ist
from tests.test_tasks import make_task


def _set_due_at(db_session, task_id, due_at):
    task = db_session.get(Task, task_id)
    task.due_at = due_at
    db_session.add(task)
    db_session.commit()


def test_upcoming_reminder_fires_within_window(client, auth_headers, db_session):
    task = make_task(client, auth_headers, reminder_minutes_before=5)
    _set_due_at(db_session, task["id"], now_utc() + timedelta(minutes=3))

    resp = client.get("/api/reminders/due-now", headers=auth_headers)
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) == 1
    assert items[0]["kind"] == "upcoming"
    assert items[0]["task"]["id"] == task["id"]
    assert 0 <= items[0]["minutes_remaining"] <= 3


def test_upcoming_reminder_not_yet_in_window(client, auth_headers, db_session):
    task = make_task(client, auth_headers, reminder_minutes_before=5)
    _set_due_at(db_session, task["id"], now_utc() + timedelta(minutes=30))

    resp = client.get("/api/reminders/due-now", headers=auth_headers)
    assert resp.json() == []


def test_at_due_time_reminder_only_fires_as_due_alert(client, auth_headers, db_session):
    task = make_task(client, auth_headers, reminder_minutes_before=0)
    _set_due_at(db_session, task["id"], now_utc() + timedelta(minutes=3))

    resp = client.get("/api/reminders/due-now", headers=auth_headers)
    assert resp.json() == []  # not due yet, and "0 minutes before" has no separate pre-due window

    _set_due_at(db_session, task["id"], now_utc() - timedelta(seconds=5))
    resp = client.get("/api/reminders/due-now", headers=auth_headers)
    items = resp.json()
    assert len(items) == 1
    assert items[0]["kind"] == "due"


def test_due_alert_fires_at_due_time(client, auth_headers, db_session):
    task = make_task(client, auth_headers, reminder_minutes_before=15)
    _set_due_at(db_session, task["id"], now_utc() - timedelta(seconds=5))

    resp = client.get("/api/reminders/due-now", headers=auth_headers)
    items = resp.json()
    assert any(i["kind"] == "due" and i["task"]["id"] == task["id"] for i in items)


def test_no_reminder_never_fires(client, auth_headers, db_session):
    task = make_task(client, auth_headers, reminder_minutes_before=None)
    _set_due_at(db_session, task["id"], now_utc() - timedelta(minutes=5))

    resp = client.get("/api/reminders/due-now", headers=auth_headers)
    assert resp.json() == []


def test_completed_task_does_not_alert(client, auth_headers, db_session):
    task = make_task(client, auth_headers, reminder_minutes_before=15)
    _set_due_at(db_session, task["id"], now_utc() - timedelta(minutes=5))
    client.post(f"/api/tasks/{task['id']}/complete", headers=auth_headers)

    resp = client.get("/api/reminders/due-now", headers=auth_headers)
    assert resp.json() == []


def test_ack_prevents_duplicate_upcoming(client, auth_headers, db_session):
    task = make_task(client, auth_headers, reminder_minutes_before=5)
    _set_due_at(db_session, task["id"], now_utc() + timedelta(minutes=3))

    first = client.get("/api/reminders/due-now", headers=auth_headers).json()
    assert len(first) == 1

    ack = client.post(f"/api/reminders/{task['id']}/ack", json={"kind": "upcoming"}, headers=auth_headers)
    assert ack.status_code == 200

    second = client.get("/api/reminders/due-now", headers=auth_headers).json()
    assert second == []


def test_ack_prevents_duplicate_due(client, auth_headers, db_session):
    task = make_task(client, auth_headers, reminder_minutes_before=0)
    _set_due_at(db_session, task["id"], now_utc() - timedelta(seconds=5))

    first = client.get("/api/reminders/due-now", headers=auth_headers).json()
    assert any(i["kind"] == "due" for i in first)

    client.post(f"/api/reminders/{task['id']}/ack", json={"kind": "due"}, headers=auth_headers)

    second = client.get("/api/reminders/due-now", headers=auth_headers).json()
    assert second == []


def test_upcoming_and_due_can_both_fire_independently(client, auth_headers, db_session):
    """Upcoming fires first; acking it must not suppress the later due alert."""
    task = make_task(client, auth_headers, reminder_minutes_before=5)
    _set_due_at(db_session, task["id"], now_utc() + timedelta(minutes=3))

    upcoming = client.get("/api/reminders/due-now", headers=auth_headers).json()
    assert upcoming[0]["kind"] == "upcoming"
    client.post(f"/api/reminders/{task['id']}/ack", json={"kind": "upcoming"}, headers=auth_headers)

    # time passes, task is now due
    _set_due_at(db_session, task["id"], now_utc() - timedelta(seconds=5))
    due = client.get("/api/reminders/due-now", headers=auth_headers).json()
    assert len(due) == 1
    assert due[0]["kind"] == "due"


def test_snooze_suppresses_reminders_until_expiry(client, auth_headers, db_session):
    task = make_task(client, auth_headers, reminder_minutes_before=15)
    _set_due_at(db_session, task["id"], now_utc() - timedelta(seconds=5))

    due = client.get("/api/reminders/due-now", headers=auth_headers).json()
    assert any(i["kind"] == "due" for i in due)
    client.post(f"/api/reminders/{task['id']}/ack", json={"kind": "due"}, headers=auth_headers)

    resp = client.post(f"/api/tasks/{task['id']}/snooze", json={"minutes": 10}, headers=auth_headers)
    assert resp.json()["status"] == "snoozed"

    during_snooze = client.get("/api/reminders/due-now", headers=auth_headers).json()
    assert during_snooze == []


def test_snooze_reminder_fires_again_after_snooze_expires(client, auth_headers, db_session):
    task = make_task(client, auth_headers, reminder_minutes_before=15)
    _set_due_at(db_session, task["id"], now_utc() - timedelta(seconds=5))
    client.post(f"/api/reminders/{task['id']}/ack", json={"kind": "due"}, headers=auth_headers)
    client.post(f"/api/tasks/{task['id']}/snooze", json={"minutes": 10}, headers=auth_headers)

    # simulate the snooze window elapsing
    t = db_session.get(Task, task["id"])
    t.snoozed_until = now_utc() - timedelta(seconds=1)
    db_session.add(t)
    db_session.commit()

    items = client.get("/api/reminders/due-now", headers=auth_headers).json()
    assert any(i["kind"] == "due" and i["task"]["id"] == task["id"] for i in items)


def test_reschedule_clears_reminder_state_and_respects_new_time(client, auth_headers, db_session):
    task = make_task(client, auth_headers, reminder_minutes_before=15)
    _set_due_at(db_session, task["id"], now_utc() - timedelta(seconds=5))
    client.post(f"/api/reminders/{task['id']}/ack", json={"kind": "due"}, headers=auth_headers)

    new_date = str(today_ist() + timedelta(days=2))
    resp = client.post(
        f"/api/tasks/{task['id']}/reschedule",
        json={"due_date": new_date, "due_time": "09:00:00"},
        headers=auth_headers,
    )
    assert resp.status_code == 200

    # far in the future: no reminder window yet
    items = client.get("/api/reminders/due-now", headers=auth_headers).json()
    assert items == []

    # move the rescheduled due_at into the past: the due alert must fire again
    _set_due_at(db_session, task["id"], now_utc() - timedelta(seconds=5))
    items = client.get("/api/reminders/due-now", headers=auth_headers).json()
    assert any(i["kind"] == "due" and i["task"]["id"] == task["id"] for i in items)


def test_overdue_task_still_eligible_for_due_alert(client, auth_headers, db_session):
    """Overdue is a derived status; the due alert must still be able to fire on it."""
    task = make_task(client, auth_headers, reminder_minutes_before=15)
    _set_due_at(db_session, task["id"], now_utc() - timedelta(hours=2))

    resp = client.get("/api/tasks/" + task["id"], headers=auth_headers)
    assert resp.json()["status"] == "overdue"

    items = client.get("/api/reminders/due-now", headers=auth_headers).json()
    assert any(i["kind"] == "due" and i["task"]["id"] == task["id"] for i in items)


def test_creating_task_with_past_due_at_does_not_fire(client, auth_headers, db_session):
    """A task must never fire notifications for a due_at already in the
    past at creation time."""
    past_date = str(today_ist() - timedelta(days=1))
    resp = client.post(
        "/api/tasks",
        json={
            "title": "Backdated task",
            "category": "other",
            "priority": "medium",
            "due_date": past_date,
            "due_time": "09:00:00",
            "reminder_minutes_before": 15,
        },
        headers=auth_headers,
    )
    assert resp.status_code == 201
    task_id = resp.json()["id"]

    items = client.get("/api/reminders/due-now", headers=auth_headers).json()
    assert items == []

    t = db_session.get(Task, task_id)
    assert t.reminder_fired_at is not None
    assert t.due_alert_fired_at is not None


def test_editing_due_time_resets_fired_state(client, auth_headers, db_session):
    """A plain PATCH (not /reschedule) that changes due_date/due_time must
    also reset the fired markers, so the new schedule can fire."""
    task = make_task(client, auth_headers, reminder_minutes_before=15)
    _set_due_at(db_session, task["id"], now_utc() - timedelta(seconds=5))
    client.post(f"/api/reminders/{task['id']}/ack", json={"kind": "due"}, headers=auth_headers)

    t = db_session.get(Task, task["id"])
    assert t.due_alert_fired_at is not None

    new_date = str(today_ist() + timedelta(days=2))
    resp = client.patch(
        f"/api/tasks/{task['id']}",
        json={"due_date": new_date, "due_time": "10:00:00"},
        headers=auth_headers,
    )
    assert resp.status_code == 200

    items = client.get("/api/reminders/due-now", headers=auth_headers).json()
    assert items == []  # far future, no window yet

    _set_due_at(db_session, task["id"], now_utc() - timedelta(seconds=5))
    items = client.get("/api/reminders/due-now", headers=auth_headers).json()
    assert any(i["kind"] == "due" and i["task"]["id"] == task["id"] for i in items)


def test_reminders_are_scoped_to_ist_due_at(client, auth_headers, db_session):
    """due_at is stored as naive UTC; due_at_ist must reflect the +05:30 offset."""
    task = make_task(client, auth_headers, reminder_minutes_before=15, due_time="09:00:00")
    assert task["due_at_ist"].endswith("+05:30")

    # 09:00 IST == 03:30 UTC on the same date
    assert task["due_at"].endswith("T03:30:00")
