import type { Task } from "./task";

export type ReminderKind = "upcoming" | "due";

export interface ReminderItem {
  kind: ReminderKind;
  minutes_remaining: number;
  task: Task;
}
