import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import type { Task } from "@/types/task";
import { SNOOZE_OPTIONS } from "@/types/task";
import { formatCountdown, formatOverdueBy, formatTime } from "@/utils/formatIST";
import { useCompleteTask, useSnoozeTask } from "@/hooks/useTasks";
import { useTaskDetail } from "@/context/TaskDetailContext";
import { Button } from "@/components/ui/button";
import { PriorityBadge, CategoryTag } from "@/components/tasks/Badges";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TICK_MS = 30000;

export default function NextTaskBanner({ task }: { task: Task | null | undefined }) {
  const complete = useCompleteTask();
  const snooze = useSnoozeTask();
  const { openTaskDetail } = useTaskDetail();
  // Forces a re-render every 30s so the "in X min" countdown stays fresh.
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), TICK_MS);
    return () => clearInterval(interval);
  }, []);

  if (!task) {
    return (
      <div className="glass rounded-2xl py-10 text-center text-sm text-card-foreground">
        <p className="text-sm font-medium text-muted-foreground">You're all caught up.</p>
      </div>
    );
  }

  const isOverdue = task.status === "overdue";
  const timeLabel = task.due_time
    ? isOverdue
      ? formatOverdueBy(task.due_at_ist)
      : formatCountdown(task.due_at_ist)
    : null;
  const accentTextClass = isOverdue ? "text-destructive" : "text-primary";

  return (
    <div className="relative">
      <div className="hero-glow" />
      <div className="glass-hero relative overflow-hidden rounded-2xl text-sm text-card-foreground">
        <div className={`absolute inset-y-0 left-0 w-1 ${isOverdue ? "bg-destructive" : "bg-primary"}`} />
        <div className="flex flex-col gap-5 p-6 pl-7 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className={`text-xs font-semibold uppercase tracking-widest ${accentTextClass}`}>
              {isOverdue ? "Overdue" : "Next Up"}
            </p>
            <button
              onClick={() => openTaskDetail(task.id)}
              className="mt-1.5 block text-left text-xl font-semibold tracking-tight text-foreground hover:underline sm:text-2xl"
            >
              {task.title}
            </button>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <PriorityBadge priority={task.priority} />
              <CategoryTag category={task.category} />
            </div>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-sm font-medium text-foreground">
                {formatTime(task.due_time ? task.due_at_ist : null)}
              </span>
              {timeLabel && <span className={`text-sm font-medium ${accentTextClass}`}>{timeLabel}</span>}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                complete.mutate(task.id);
                toast.success("Task completed");
              }}
              disabled={complete.isPending}
            >
              <Check /> Complete
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Snooze
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Snooze for</DropdownMenuLabel>
                {SNOOZE_OPTIONS.map((opt) => (
                  <DropdownMenuItem
                    key={opt.minutes}
                    onClick={() => {
                      snooze.mutate({ id: task.id, payload: { minutes: opt.minutes } });
                      toast.success(`Snoozed for ${opt.label}`);
                    }}
                  >
                    {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" onClick={() => openTaskDetail(task.id)}>
              Open
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
