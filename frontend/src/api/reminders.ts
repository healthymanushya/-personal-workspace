import { apiRequest } from "./client";
import type { ReminderItem, ReminderKind } from "../types/reminder";
import type { Task } from "../types/task";

export function getDueNow(): Promise<ReminderItem[]> {
  return apiRequest<ReminderItem[]>("/api/reminders/due-now");
}

export function ackReminder(taskId: string, kind: ReminderKind): Promise<Task> {
  return apiRequest<Task>(`/api/reminders/${taskId}/ack`, { method: "POST", body: { kind } });
}
