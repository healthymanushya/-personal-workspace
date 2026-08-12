import Shell from "../components/layout/Shell";
import TaskList from "../components/tasks/TaskList";
import { useDashboardToday } from "../hooks/useDashboard";

export default function Today() {
  const today = useDashboardToday();

  return (
    <Shell title="Today">
      <TaskList
        tasks={today.data}
        isLoading={today.isLoading}
        isError={today.isError}
        onRetry={() => today.refetch()}
        emptyMessage="Nothing scheduled for today."
      />
    </Shell>
  );
}
