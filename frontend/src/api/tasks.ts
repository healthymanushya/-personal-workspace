import { apiRequest } from "./client";
import type {
  Task,
  TaskCreateInput,
  TaskRescheduleInput,
  TaskSnoozeInput,
  TaskStatus,
  TaskUpdateInput,
} from "../types/task";

export interface TaskListFilters {
  [key: string]: string | undefined;
  status?: TaskStatus;
  category?: string;
  priority?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export function listTasks(filters: TaskListFilters = {}): Promise<Task[]> {
  return apiRequest<Task[]>("/api/tasks", { query: filters });
}

export function getTask(id: string): Promise<Task> {
  return apiRequest<Task>(`/api/tasks/${id}`);
}

export function createTask(payload: TaskCreateInput): Promise<Task> {
  return apiRequest<Task>("/api/tasks", { method: "POST", body: payload });
}

export function updateTask(id: string, payload: TaskUpdateInput): Promise<Task> {
  return apiRequest<Task>(`/api/tasks/${id}`, { method: "PATCH", body: payload });
}

export function deleteTask(id: string): Promise<void> {
  return apiRequest<void>(`/api/tasks/${id}`, { method: "DELETE" });
}

export function completeTask(id: string): Promise<Task> {
  return apiRequest<Task>(`/api/tasks/${id}/complete`, { method: "POST" });
}

export function snoozeTask(id: string, payload: TaskSnoozeInput): Promise<Task> {
  return apiRequest<Task>(`/api/tasks/${id}/snooze`, { method: "POST", body: payload });
}

export function rescheduleTask(id: string, payload: TaskRescheduleInput): Promise<Task> {
  return apiRequest<Task>(`/api/tasks/${id}/reschedule`, { method: "POST", body: payload });
}
