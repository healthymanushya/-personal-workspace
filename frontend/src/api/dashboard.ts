import { apiRequest } from "./client";
import type { DashboardSummary, UpcomingOverview } from "../types/dashboard";
import type { Task } from "../types/task";

export function getSummary(): Promise<DashboardSummary> {
  return apiRequest<DashboardSummary>("/api/dashboard/summary");
}

export function getToday(): Promise<Task[]> {
  return apiRequest<Task[]>("/api/dashboard/today");
}

export function getNextTask(): Promise<Task | null> {
  return apiRequest<Task | null>("/api/dashboard/next-task");
}

export function getUpcoming(): Promise<UpcomingOverview> {
  return apiRequest<UpcomingOverview>("/api/dashboard/upcoming");
}

export function getOverdue(): Promise<Task[]> {
  return apiRequest<Task[]>("/api/dashboard/overdue");
}

export function getCompleted(onDate?: string): Promise<Task[]> {
  return apiRequest<Task[]>("/api/dashboard/completed", { query: { on_date: onDate } });
}
