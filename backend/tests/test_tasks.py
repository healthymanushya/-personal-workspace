from datetime import timedelta

from app.timezone import today_ist


def make_task(client, headers, **overrides):
    payload = {
        "title": "Test Task",
        "description": "desc",
        "category": "business",
        "priority": "medium",
        "due_date": str(today_ist()),
        "due_time": "23:59:00",
    }
    payload.update(overrides)
    resp = client.post("/api/tasks", json=payload, headers=headers)
    assert resp.status_code == 201, resp.text
    return resp.json()


def test_create_and_get_task(client, auth_headers):
    task = make_task(client, auth_headers, title="Meeting with Marketing Team")
    assert task["title"] == "Meeting with Marketing Team"
    assert task["status"] == "pending"
    assert task["category"] == "business"

    resp = client.get(f"/api/tasks/{task['id']}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == task["id"]


def test_list_tasks_filters_by_category(client, auth_headers):
    make_task(client, auth_headers, category="calls")
    make_task(client, auth_headers, category="research")

    resp = client.get("/api/tasks?category=calls", headers=auth_headers)
    assert resp.status_code == 200
    tasks = resp.json()
    assert len(tasks) == 1
    assert tasks[0]["category"] == "calls"


def test_update_task(client, auth_headers):
    task = make_task(client, auth_headers)
    resp = client.patch(f"/api/tasks/{task['id']}", json={"priority": "high"}, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["priority"] == "high"


def test_complete_task(client, auth_headers):
    task = make_task(client, auth_headers)
    resp = client.post(f"/api/tasks/{task['id']}/complete", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "completed"
    assert body["completed_at"] is not None


def test_snooze_task(client, auth_headers):
    task = make_task(client, auth_headers)
    resp = client.post(f"/api/tasks/{task['id']}/snooze", json={"minutes": 15}, headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "snoozed"
    assert body["snoozed_until"] is not None


def test_reschedule_task(client, auth_headers):
    task = make_task(client, auth_headers)
    new_date = str(today_ist() + timedelta(days=3))
    resp = client.post(
        f"/api/tasks/{task['id']}/reschedule",
        json={"due_date": new_date, "due_time": "09:30:00"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["due_date"] == new_date
    assert body["status"] == "pending"


def test_delete_task(client, auth_headers):
    task = make_task(client, auth_headers)
    resp = client.delete(f"/api/tasks/{task['id']}", headers=auth_headers)
    assert resp.status_code == 204

    resp = client.get(f"/api/tasks/{task['id']}", headers=auth_headers)
    assert resp.status_code == 404


def test_overdue_task_is_derived(client, auth_headers):
    yesterday = str(today_ist() - timedelta(days=1))
    task = make_task(client, auth_headers, due_date=yesterday, due_time="09:00:00")
    assert task["status"] == "overdue"
    assert task["is_overdue"] is True


def test_tasks_require_auth(client):
    resp = client.get("/api/tasks")
    assert resp.status_code == 401


def test_user_cannot_access_other_users_task(client, auth_headers):
    task = make_task(client, auth_headers)

    client.post("/api/auth/register", json={"email": "other@example.com", "password": "secret123"})
    other_login = client.post("/api/auth/login", json={"email": "other@example.com", "password": "secret123"})
    other_headers = {"Authorization": f"Bearer {other_login.json()['access_token']}"}

    resp = client.get(f"/api/tasks/{task['id']}", headers=other_headers)
    assert resp.status_code == 404
