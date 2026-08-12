import type { TaskStatus } from "@/types/task";
import { cn } from "@/lib/utils";

const STATUS_DOT_CLASS: Record<TaskStatus, string> = {
  pending: "bg-muted-foreground/50",
  in_progress: "bg-primary",
  completed: "bg-success",
  snoozed: "bg-warning",
  overdue: "bg-destructive",
};

export function StatusDot({ status, className }: { status: TaskStatus; className?: string }) {
  return <span className={cn("size-2 shrink-0 rounded-full", STATUS_DOT_CLASS[status], className)} />;
}
