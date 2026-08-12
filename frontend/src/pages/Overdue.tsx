import Shell from "@/components/layout/Shell";
import TaskList from "@/components/tasks/TaskList";
import { useDashboardOverdue } from "@/hooks/useDashboard";

export default function Overdue() {
  const overdue = useDashboardOverdue();

  return (
    <Shell title="Overdue">
      <TaskList
        tasks={overdue.data}
        isLoading={overdue.isLoading}
        isError={overdue.isError}
        onRetry={() => overdue.refetch()}
        showDate
        emptyMessage="You're all caught up."
      />
    </Shell>
  );
}
