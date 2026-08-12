import type { Task } from "@/types/task";
import TaskList from "@/components/tasks/TaskList";

function groupToday(tasks: Task[]) {
  const overdue = tasks.filter((t) => t.status === "overdue");
  const completed = tasks.filter((t) => t.status === "completed");
  const active = tasks.filter((t) => t.status === "pending" || t.status === "in_progress" || t.status === "snoozed");

  const [now, ...upcoming] = active;
  return { overdue, now: now ? [now] : [], upcoming, completed };
}

export default function TodayGroups({
  tasks,
  isLoading,
  isError,
  onRetry,
}: {
  tasks: Task[] | undefined;
  isLoading: boolean;
  isError?: boolean;
  onRetry?: () => void;
}) {
  if (isLoading) {
    return <TaskList tasks={undefined} isLoading />;
  }

  if (isError) {
    return <TaskList tasks={undefined} isError onRetry={onRetry} />;
  }

  if (!tasks || tasks.length === 0) {
    return <TaskList tasks={[]} emptyMessage="Nothing scheduled for today." />;
  }

  const { overdue, now, upcoming, completed } = groupToday(tasks);

  return (
    <div className="space-y-5">
      {overdue.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-destructive">Overdue</p>
          <TaskList tasks={overdue} />
        </div>
      )}
      {now.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">Now</p>
          <TaskList tasks={now} />
        </div>
      )}
      {upcoming.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Upcoming</p>
          <TaskList tasks={upcoming} />
        </div>
      )}
      {completed.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-success">Completed</p>
          <TaskList tasks={completed} />
        </div>
      )}
    </div>
  );
}
