import { useState, type FormEvent, type KeyboardEvent } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, PRIORITIES, REMINDER_OPTIONS, type Task, type TaskCreateInput } from "@/types/task";
import { useCreateTask, useUpdateTask } from "@/hooks/useTasks";
import { ApiError } from "@/api/client";

function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

export default function TaskForm({
  task,
  initialDate,
  onClose,
}: {
  task?: Task;
  initialDate?: string;
  onClose: () => void;
}) {
  const isEdit = !!task;
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [category, setCategory] = useState(task?.category ?? "other");
  const [priority, setPriority] = useState(task?.priority ?? "medium");
  const [dueDate, setDueDate] = useState(task?.due_date ?? initialDate ?? todayISO());
  const [dueTime, setDueTime] = useState(task?.due_time?.slice(0, 5) ?? "");
  const [reminder, setReminder] = useState(
    task?.reminder_minutes_before != null ? String(task.reminder_minutes_before) : "none",
  );

  const [error, setError] = useState<string | null>(null);
  const submitting = createTask.isPending || updateTask.isPending;

  async function submit() {
    if (!title.trim()) return;
    setError(null);

    const payload: TaskCreateInput = {
      title: title.trim(),
      description: description.trim() || null,
      category: category as TaskCreateInput["category"],
      priority: priority as TaskCreateInput["priority"],
      due_date: dueDate,
      due_time: dueTime ? `${dueTime}:00` : null,
      reminder_minutes_before: reminder === "none" ? null : Number(reminder),
    };

    try {
      if (isEdit) {
        await updateTask.mutateAsync({ id: task.id, payload });
        toast.success("Task updated");
      } else {
        await createTask.mutateAsync(payload);
        toast.success("Task added");
      }
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    submit();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLFormElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  }

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Task" : "Add Task"}</DialogTitle>
          <DialogDescription>{isEdit ? "Update the details below." : "Create a new task in your workspace."}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-4">
          {error && (
            <div role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Meeting with Marketing Team"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-notes">
              Notes <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="task-notes"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Optional notes"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="task-category">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
                <SelectTrigger id="task-category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-priority">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
                <SelectTrigger id="task-priority" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="task-date">Date</Label>
              <Input id="task-date" type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-time">
                Time <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input id="task-time" type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-reminder">Reminder</Label>
            <Select value={reminder} onValueChange={setReminder}>
              <SelectTrigger id="task-reminder" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REMINDER_OPTIONS.map((r) => (
                  <SelectItem key={r.label} value={r.value == null ? "none" : String(r.value)}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="items-center gap-3 sm:justify-between">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono">⌘ Enter</kbd> to save
            </span>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving…" : isEdit ? "Save Changes" : "Add Task"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
