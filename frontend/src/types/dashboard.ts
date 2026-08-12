import type { Task } from "./task";

export interface DashboardSummary {
  today_date: string;
  today_count: number;
  overdue_count: number;
  completed_today_count: number;
  upcoming_count: number;
  in_progress_count: number;
}

export interface DayGroup {
  date: string;
  tasks: Task[];
}

export interface UpcomingOverview {
  days: DayGroup[];
}
