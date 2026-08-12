import type { Task } from "@/types/task";
import TaskRow from "./TaskRow";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function TaskList({
  tasks,
  showDate = false,
  emptyMessage = "No tasks here.",
  isLoading = false,
  isError = false,
  onRetry,
}: {
  tasks: Task[] | undefined;
  showDate?: boolean;
  emptyMessage?: string;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[52px] rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-destructive/20 bg-destructive/5 py-10 text-center">
        <p className="text-sm text-destructive">Couldn't load tasks. Please try again.</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        )}
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} showDate={showDate} />
      ))}
    </div>
  );
}
