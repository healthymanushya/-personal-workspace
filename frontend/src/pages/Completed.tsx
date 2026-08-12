import Shell from "../components/layout/Shell";
import TaskList from "../components/tasks/TaskList";
import { useDashboardCompleted } from "../hooks/useDashboard";

export default function Completed() {
  const completed = useDashboardCompleted();

  return (
    <Shell title="Completed">
      <TaskList
        tasks={completed.data}
        isLoading={completed.isLoading}
        isError={completed.isError}
        onRetry={() => completed.refetch()}
        showDate
        emptyMessage="No completed tasks yet."
      />
    </Shell>
  );
}
