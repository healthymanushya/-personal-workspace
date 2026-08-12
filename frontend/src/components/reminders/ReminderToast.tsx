import { useState } from "react";
import { X } from "lucide-react";
import type { ReminderItem } from "@/types/reminder";
import { SNOOZE_OPTIONS } from "@/types/task";
import { useCompleteTask, useSnoozeTask } from "@/hooks/useTasks";
import { useTaskDetail } from "@/context/TaskDetailContext";
import RescheduleModal from "@/components/tasks/RescheduleModal";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ReminderToast({ item, onDismiss }: { item: ReminderItem; onDismiss: () => void }) {
  const { task, kind, minutes_remaining } = item;
  const complete = useCompleteTask();
  const snooze = useSnoozeTask();
  const { openTaskDetail } = useTaskDetail();
  const [rescheduling, setRescheduling] = useState(false);

  const isDue = kind === "due";

  function handleComplete() {
    complete.mutate(task.id);
    onDismiss();
  }

  function handleSnooze(minutes: number) {
    snooze.mutate({ id: task.id, payload: { minutes } });
    onDismiss();
  }

  function handleOpen() {
    openTaskDetail(task.id);
    onDismiss();
  }

  return (
    <div
      className={`animate-in fade-in slide-in-from-bottom-2 w-full rounded-xl border bg-popover px-4 py-3.5 text-popover-foreground shadow-lg duration-200 ${
        isDue ? "border-destructive/25" : "border-primary/25"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={`text-xs font-semibold uppercase tracking-wide ${isDue ? "text-destructive" : "text-primary"}`}>
            {isDue ? "Task Due" : "Upcoming Task"}
          </p>
          <p className="mt-1 truncate text-sm font-medium text-foreground">{task.title}</p>
          {!isDue && <p className="mt-0.5 text-xs text-muted-foreground">Starts in {minutes_remaining} minutes</p>}
        </div>
        <Button variant="ghost" size="icon-xs" onClick={onDismiss} aria-label="Dismiss">
          <X />
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {!isDue && (
          <Button variant="outline" size="xs" onClick={handleOpen}>
            Open
          </Button>
        )}
        <Button size="xs" onClick={handleComplete}>
          Mark done
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="xs">
              Snooze
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {SNOOZE_OPTIONS.map((opt) => (
              <DropdownMenuItem key={opt.minutes} onClick={() => handleSnooze(opt.minutes)}>
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {isDue && (
          <Button variant="outline" size="xs" onClick={() => setRescheduling(true)}>
            Reschedule
          </Button>
        )}
      </div>

      {rescheduling && (
        <RescheduleModal
          task={task}
          onClose={() => {
            setRescheduling(false);
            onDismiss();
          }}
        />
      )}
    </div>
  );
}
