import { useState } from "react";
import { toast } from "sonner";
import { Pencil, CalendarClock, Trash2, Check } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTaskDetail } from "@/context/TaskDetailContext";
import { useCompleteTask, useSnoozeTask, useTask } from "@/hooks/useTasks";
import { CategoryTag, PriorityBadge, StatusBadge } from "./Badges";
import { formatDateTime, formatFullDate, formatTime } from "@/utils/formatIST";
import { REMINDER_OPTIONS, SNOOZE_OPTIONS } from "@/types/task";
import TaskForm from "./TaskForm";
import RescheduleModal from "./RescheduleModal";
import { DeleteTaskDialog } from "./DeleteTaskDialog";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm text-foreground">{value}</p>
    </div>
  );
}

export default function TaskDetailModal() {
  const { openTaskId, closeTaskDetail } = useTaskDetail();
  const { data: task, isLoading, isError, refetch } = useTask(openTaskId ?? undefined);
  const complete = useCompleteTask();
  const snooze = useSnoozeTask();
  const [editing, setEditing] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const open = !!openTaskId;

  function handleOpenChange(next: boolean) {
    if (!next) closeTaskDetail();
  }

  if (editing && task) {
    return (
      <TaskForm
        task={task}
        onClose={() => {
          setEditing(false);
          closeTaskDetail();
        }}
      />
    );
  }

  const reminderText = task
    ? (REMINDER_OPTIONS.find((r) => r.value === task.reminder_minutes_before)?.label ?? "No reminder")
    : "";

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="right" className="w-full gap-0 sm:max-w-md">
          {isLoading || isError || !task ? (
            <div className="p-6">
              {isError ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <p className="text-sm text-destructive">Couldn't load this task.</p>
                  <Button variant="outline" size="sm" onClick={() => refetch()}>
                    Retry
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-16 w-full" />
                </div>
              )}
            </div>
          ) : (
            <>
              <SheetHeader>
                <SheetTitle className={task.status === "completed" ? "text-muted-foreground line-through" : ""}>
                  {task.title}
                </SheetTitle>
                <SheetDescription className="sr-only">Task details</SheetDescription>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <StatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                  <CategoryTag category={task.category} />
                </div>
              </SheetHeader>

              <div className="flex-1 space-y-5 overflow-y-auto px-4 py-2">
                {task.description && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Notes</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{task.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Date" value={formatFullDate(task.due_date)} />
                  <Field label="Time" value={formatTime(task.due_time ? task.due_at_ist : null)} />
                  <Field label="Reminder" value={reminderText} />
                  <Field label="Created" value={formatDateTime(task.created_at)} />
                  {task.completed_at && <Field label="Completed" value={formatDateTime(task.completed_at)} />}
                </div>
              </div>

              <SheetFooter className="flex-row flex-wrap gap-2 border-t border-border pt-4">
                {task.status !== "completed" && (
                  <Button
                    size="sm"
                    onClick={() => {
                      complete.mutate(task.id);
                      toast.success("Task completed");
                    }}
                  >
                    <Check /> Complete
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Snooze
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
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
                <Button variant="outline" size="sm" onClick={() => setRescheduling(true)}>
                  <CalendarClock /> Reschedule
                </Button>
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Pencil /> Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setDeleting(true)}>
                  <Trash2 /> Delete
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      {task && rescheduling && <RescheduleModal task={task} onClose={() => setRescheduling(false)} />}
      {task && deleting && (
        <DeleteTaskDialog task={task} open={deleting} onOpenChange={setDeleting} onDeleted={closeTaskDetail} />
      )}
    </>
  );
}
