export type Category =
  | "marketing"
  | "meetings"
  | "business"
  | "personal"
  | "calls"
  | "follow_up"
  | "research"
  | "other";

export type Priority = "high" | "medium" | "low";

export type TaskStatus = "pending" | "in_progress" | "completed" | "snoozed" | "overdue";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  category: Category;
  priority: Priority;
  status: TaskStatus;
  due_date: string; // YYYY-MM-DD
  due_time: string | null; // HH:MM:SS
  due_at: string; // UTC ISO
  due_at_ist: string; // ISO with +05:30 offset
  reminder_minutes_before: number | null;
  reminder_fired_at: string | null;
  due_notification_enabled: boolean;
  due_alert_fired_at: string | null;
  snoozed_until: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  is_overdue: boolean;
}

export interface TaskCreateInput {
  title: string;
  description?: string | null;
  category: Category;
  priority: Priority;
  due_date: string;
  due_time?: string | null;
  reminder_minutes_before?: number | null;
  due_notification_enabled?: boolean;
}

export type TaskUpdateInput = Partial<TaskCreateInput> & { status?: TaskStatus };

export interface TaskSnoozeInput {
  minutes?: number;
  until?: string;
}

export interface TaskRescheduleInput {
  due_date: string;
  due_time?: string | null;
}

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: "marketing", label: "Marketing" },
  { value: "meetings", label: "Meetings" },
  { value: "business", label: "Business" },
  { value: "personal", label: "Personal" },
  { value: "calls", label: "Calls" },
  { value: "follow_up", label: "Follow-up" },
  { value: "research", label: "Research" },
  { value: "other", label: "Other" },
];

export const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export const STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "snoozed", label: "Snoozed" },
  { value: "overdue", label: "Overdue" },
];

export const REMINDER_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: "No reminder" },
  { value: 0, label: "At due time" },
  { value: 5, label: "5 minutes before" },
  { value: 10, label: "10 minutes before" },
  { value: 15, label: "15 minutes before" },
  { value: 30, label: "30 minutes before" },
  { value: 60, label: "1 hour before" },
  { value: 1440, label: "1 day before" },
];

export const SNOOZE_OPTIONS: { minutes: number; label: string }[] = [
  { minutes: 5, label: "5 minutes" },
  { minutes: 10, label: "10 minutes" },
  { minutes: 30, label: "30 minutes" },
  { minutes: 60, label: "1 hour" },
];
