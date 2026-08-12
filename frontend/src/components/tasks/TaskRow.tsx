import { useState } from "react";
import { MoreHorizontal, Pencil, CalendarClock, Trash2, Bell } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PriorityBadge, CategoryTag } from "./Badges";
import { StatusDot } from "./StatusDot";
import { formatOverdueBy, formatTime } from "@/utils/formatIST";
import { useCompleteTask, useSnoozeTask } from "@/hooks/useTasks";
import { useTaskDetail } from "@/context/TaskDetailContext";
import { SNOOZE_OPTIONS, type Task } from "@/types/task";
import TaskForm from "./TaskForm";
import RescheduleModal from "./RescheduleModal";
import { DeleteTaskDialog } from "./DeleteTaskDialog";

function reminderLabel(minutes: number): string {
  if (minutes === 0) return "at due time";
  if (minutes < 60) return `${minutes}m before`;
  return `${minutes / 60}h before`;
}

export default function TaskRow({ task, showDate = false }: { task: Task; showDate?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const complete = useCompleteTask();
  const snooze = useSnoozeTask();
  const { openTaskDetail } = useTaskDetail();

  const isDone = task.status === "completed";
  const isOverdue = task.status === "overdue";

  return (
    <>
      <div className="group flex items-start gap-3 rounded-lg border border-transparent px-2.5 py-2 transition-colors hover:border-(--row-hover-border) hover:bg-foreground/[0.04]">
        <Checkbox
          className="mt-0.5"
          checked={isDone}
          disabled={isDone || complete.isPending}
          onCheckedChange={() => !isDone && complete.mutate(task.id)}
          aria-label="Mark done"
        />

        <StatusDot status={task.status} className="mt-2" />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <button
              onClick={() => openTaskDetail(task.id)}
              className={`truncate text-left text-sm hover:underline ${
                isDone ? "text-muted-foreground line-through" : "text-foreground"
              }`}
            >
              {task.title}
            </button>
            <span className={`shrink-0 text-xs tabular-nums ${isOverdue ? "font-medium text-destructive" : "text-muted-foreground"}`}>
              {showDate ? `${task.due_date} · ` : ""}
              {isOverdue ? formatOverdueBy(task.due_at_ist) : formatTime(task.due_time ? task.due_at_ist : null)}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <PriorityBadge priority={task.priority} />
            <CategoryTag category={task.category} />
            {task.reminder_minutes_before != null && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Bell className="size-3" />
                {reminderLabel(task.reminder_minutes_before)}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="xs">
                Snooze
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Snooze for</DropdownMenuLabel>
              {SNOOZE_OPTIONS.map((opt) => (
                <DropdownMenuItem key={opt.minutes} onClick={() => snooze.mutate({ id: task.id, payload: { minutes: opt.minutes } })}>
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-xs" aria-label="More task actions">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditing(true)}>
                <Pencil /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRescheduling(true)}>
                <CalendarClock /> Reschedule
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setDeleting(true)}>
                <Trash2 /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {editing && <TaskForm task={task} onClose={() => setEditing(false)} />}
      {rescheduling && <RescheduleModal task={task} onClose={() => setRescheduling(false)} />}
      {deleting && <DeleteTaskDialog task={task} open={deleting} onOpenChange={setDeleting} />}
    </>
  );
}
