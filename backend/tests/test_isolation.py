"""End-to-end proof that two accounts have fully isolated workspace data,
mirroring the Shivam / Arun two-user acceptance scenario."""

from tests.test_tasks import make_task


def register_and_login(client, email: str, password: str, full_name: str) -> dict:
    client.post("/api/auth/register", json={"email": email, "password": password, "full_name": full_name})
    resp = client.post("/api/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200, resp.text
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


def test_two_users_full_workspace_isolation(client):
    shivam = register_and_login(client, "shivam@personalworkspace.com", "shivam123", "Shivam Thakur")
    arun = register_and_login(client, "arun@personalworksapce.com", "arun123", "Arun Sharma")

    shivam_task = make_task(client, shivam, title="Client Meeting - Monday 3 PM", category="meetings")
    arun_task = make_task(client, arun, title="Team Meeting - Tuesday 11 AM", category="meetings")

    # --- List endpoints only ever show the caller's own data ---
    shivam_titles = [t["title"] for t in client.get("/api/tasks", headers=shivam).json()]
    arun_titles = [t["title"] for t in client.get("/api/tasks", headers=arun).json()]

    assert "Client Meeting - Monday 3 PM" in shivam_titles
    assert "Team Meeting - Tuesday 11 AM" not in shivam_titles

    assert "Team Meeting - Tuesday 11 AM" in arun_titles
    assert "Client Meeting - Monday 3 PM" not in arun_titles

    # --- Direct ID-based access (IDOR) ---
    resp = client.get(f"/api/tasks/{shivam_task['id']}", headers=arun)
    assert resp.status_code == 404

    resp = client.get(f"/api/tasks/{arun_task['id']}", headers=shivam)
    assert resp.status_code == 404

    # --- Cross-user update must fail ---
    resp = client.patch(f"/api/tasks/{shivam_task['id']}", json={"priority": "high"}, headers=arun)
    assert resp.status_code == 404

    # --- Cross-user delete must fail, and the record must survive ---
    resp = client.delete(f"/api/tasks/{arun_task['id']}", headers=shivam)
    assert resp.status_code == 404
    resp = client.get(f"/api/tasks/{arun_task['id']}", headers=arun)
    assert resp.status_code == 200

    # --- Cross-user complete/snooze/reschedule must fail ---
    assert client.post(f"/api/tasks/{shivam_task['id']}/complete", headers=arun).status_code == 404
    assert client.post(f"/api/tasks/{shivam_task['id']}/snooze", json={"minutes": 10}, headers=arun).status_code == 404
    assert (
        client.post(
            f"/api/tasks/{shivam_task['id']}/reschedule",
            json={"due_date": "2026-01-01", "due_time": "09:00:00"},
            headers=arun,
        ).status_code
        == 404
    )

    # --- Dashboard aggregates are scoped per user ---
    shivam_summary = client.get("/api/dashboard/summary", headers=shivam).json()
    arun_summary = client.get("/api/dashboard/summary", headers=arun).json()
    assert shivam_summary["today_count"] + shivam_summary["overdue_count"] + shivam_summary["upcoming_count"] >= 1
    assert arun_summary["today_count"] + arun_summary["overdue_count"] + arun_summary["upcoming_count"] >= 1

    shivam_today_titles = [t["title"] for t in client.get("/api/dashboard/today", headers=shivam).json()]
    arun_today_titles = [t["title"] for t in client.get("/api/dashboard/today", headers=arun).json()]
    assert "Team Meeting - Tuesday 11 AM" not in shivam_today_titles
    assert "Client Meeting - Monday 3 PM" not in arun_today_titles

    # --- Search is scoped per user too ---
    resp = client.get("/api/tasks", params={"search": "Meeting"}, headers=shivam)
    titles = [t["title"] for t in resp.json()]
    assert "Client Meeting - Monday 3 PM" in titles
    assert "Team Meeting - Tuesday 11 AM" not in titles

    # --- Reminders (due-now) are scoped per user ---
    shivam_reminder_task_ids = {
        item["task"]["id"] for item in client.get("/api/reminders/due-now", headers=shivam).json()
    }
    assert arun_task["id"] not in shivam_reminder_task_ids

    # --- Password isolation: Arun changing his own password never touches Shivam's ---
    resp = client.post(
        "/api/auth/change-password",
        json={"current_password": "arun123", "new_password": "arunNewPass1", "confirm_new_password": "arunNewPass1"},
        headers=arun,
    )
    assert resp.status_code == 200

    # Shivam's original password still works
    resp = client.post(
        "/api/auth/login", json={"email": "shivam@personalworkspace.com", "password": "shivam123"}
    )
    assert resp.status_code == 200

    # Arun must re-login with his new password now
    resp = client.post(
        "/api/auth/login", json={"email": "arun@personalworksapce.com", "password": "arun123"}
    )
    assert resp.status_code == 401
    resp = client.post(
        "/api/auth/login", json={"email": "arun@personalworksapce.com", "password": "arunNewPass1"}
    )
    assert resp.status_code == 200
