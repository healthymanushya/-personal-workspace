import type { Category, Priority, TaskStatus } from "@/types/task";
import { Badge } from "@/components/ui/badge";

const PRIORITY_VARIANT: Record<Priority, "destructive" | "warning" | "secondary"> = {
  high: "destructive",
  medium: "warning",
  low: "secondary",
};

const PRIORITY_LABEL: Record<Priority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <Badge variant={PRIORITY_VARIANT[priority]}>{PRIORITY_LABEL[priority]}</Badge>;
}

const STATUS_VARIANT: Record<TaskStatus, "secondary" | "primary-soft" | "success" | "warning" | "destructive"> = {
  pending: "secondary",
  in_progress: "primary-soft",
  completed: "success",
  snoozed: "warning",
  overdue: "destructive",
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  snoozed: "Snoozed",
  overdue: "Overdue",
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}

const CATEGORY_LABEL: Record<Category, string> = {
  marketing: "Marketing",
  meetings: "Meetings",
  business: "Business",
  personal: "Personal",
  calls: "Calls",
  follow_up: "Follow-up",
  research: "Research",
  other: "Other",
};

export function CategoryTag({ category }: { category: Category }) {
  return <Badge variant="outline">{CATEGORY_LABEL[category]}</Badge>;
}
