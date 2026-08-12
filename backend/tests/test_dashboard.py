from datetime import timedelta

from app.timezone import today_ist
from tests.test_tasks import make_task


def test_dashboard_summary_counts(client, auth_headers):
    make_task(client, auth_headers, title="Today task")
    make_task(client, auth_headers, title="Overdue task", due_date=str(today_ist() - timedelta(days=1)))
    upcoming = make_task(client, auth_headers, title="Upcoming task", due_date=str(today_ist() + timedelta(days=2)))
    client.post(f"/api/tasks/{upcoming['id']}/complete", headers=auth_headers)

    resp = client.get("/api/dashboard/summary", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["today_count"] == 1
    assert body["overdue_count"] == 1
    assert body["completed_today_count"] == 0


def test_dashboard_today(client, auth_headers):
    make_task(client, auth_headers, title="Today task")
    make_task(client, auth_headers, title="Future task", due_date=str(today_ist() + timedelta(days=5)))

    resp = client.get("/api/dashboard/today", headers=auth_headers)
    assert resp.status_code == 200
    tasks = resp.json()
    assert len(tasks) == 1
    assert tasks[0]["title"] == "Today task"


def test_dashboard_upcoming_groups_next_7_days(client, auth_headers):
    make_task(client, auth_headers, title="Day 3", due_date=str(today_ist() + timedelta(days=3)))
    make_task(client, auth_headers, title="Too far", due_date=str(today_ist() + timedelta(days=10)))

    resp = client.get("/api/dashboard/upcoming", headers=auth_headers)
    assert resp.status_code == 200
    days = resp.json()["days"]
    assert len(days) == 7
    all_titles = [t["title"] for d in days for t in d["tasks"]]
    assert "Day 3" in all_titles
    assert "Too far" not in all_titles


def test_dashboard_overdue(client, auth_headers):
    make_task(client, auth_headers, title="Old task", due_date=str(today_ist() - timedelta(days=2)))

    resp = client.get("/api/dashboard/overdue", headers=auth_headers)
    assert resp.status_code == 200
    tasks = resp.json()
    assert len(tasks) == 1
    assert tasks[0]["title"] == "Old task"


def test_dashboard_next_task_prefers_overdue_then_earliest(client, auth_headers):
    make_task(client, auth_headers, title="Later today", due_time="20:00:00")
    make_task(client, auth_headers, title="Overdue", due_date=str(today_ist() - timedelta(days=1)))

    resp = client.get("/api/dashboard/next-task", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["title"] == "Overdue"


def test_dashboard_completed(client, auth_headers):
    task = make_task(client, auth_headers, title="Done task")
    client.post(f"/api/tasks/{task['id']}/complete", headers=auth_headers)

    resp = client.get("/api/dashboard/completed", headers=auth_headers)
    assert resp.status_code == 200
    tasks = resp.json()
    assert len(tasks) == 1
    assert tasks[0]["title"] == "Done task"
