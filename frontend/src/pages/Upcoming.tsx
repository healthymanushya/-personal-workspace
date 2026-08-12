import Shell from "@/components/layout/Shell";
import TaskList from "@/components/tasks/TaskList";
import { useDashboardUpcoming } from "@/hooks/useDashboard";
import { formatFullDate } from "@/utils/formatIST";
import { Skeleton } from "@/components/ui/skeleton";

export default function Upcoming() {
  const upcoming = useDashboardUpcoming();

  const daysWithTasks = (upcoming.data?.days ?? []).filter((day) => day.tasks.length > 0);

  return (
    <Shell title="Upcoming">
      {upcoming.isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[52px] rounded-lg" />
          ))}
        </div>
      )}

      {upcoming.isError && <TaskList tasks={undefined} isError onRetry={() => upcoming.refetch()} />}

      {!upcoming.isLoading && !upcoming.isError && (
        <>
          {daysWithTasks.length === 0 ? (
            <TaskList tasks={[]} emptyMessage="Your schedule is clear." />
          ) : (
            <div className="space-y-6">
              {daysWithTasks.map((day) => (
                <div key={day.date}>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">{formatFullDate(day.date)}</h3>
                  <TaskList tasks={day.tasks} />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Shell>
  );
}
