import Shell from "@/components/layout/Shell";
import StatCard from "@/components/dashboard/StatCard";
import NextTaskBanner from "@/components/dashboard/NextTaskBanner";
import TodayGroups from "@/components/dashboard/TodayGroups";
import SevenDayStrip from "@/components/dashboard/SevenDayStrip";
import TaskList from "@/components/tasks/TaskList";
import { useAuth } from "@/context/AuthContext";
import {
  useDashboardNextTask,
  useDashboardOverdue,
  useDashboardSummary,
  useDashboardToday,
  useDashboardUpcoming,
} from "@/hooks/useDashboard";
import { formatFullDate, greeting } from "@/utils/formatIST";

export default function Dashboard() {
  const { user } = useAuth();
  const summary = useDashboardSummary();
  const today = useDashboardToday();
  const nextTask = useDashboardNextTask();
  const overdue = useDashboardOverdue();
  const upcoming = useDashboardUpcoming();

  const todayDateLabel = summary.data ? formatFullDate(summary.data.today_date) : "";

  const upcomingTasks = (upcoming.data?.days ?? [])
    .filter((d) => d.date !== summary.data?.today_date)
    .flatMap((d) => d.tasks)
    .slice(0, 5);

  const todayTotal = (summary.data?.today_count ?? 0) + (summary.data?.completed_today_count ?? 0);
  const todayDone = summary.data?.completed_today_count ?? 0;
  const todayProgress = todayTotal > 0 ? Math.round((todayDone / todayTotal) * 100) : 0;

  return (
    <Shell title="Dashboard">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">{todayDateLabel}</p>
        <h2 className="mt-0.5 text-2xl font-semibold tracking-tight text-foreground">
          {greeting()}
          {user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Here's what needs your attention.</p>
      </div>

      <div className="mb-8">
        <NextTaskBanner task={nextTask.data} />
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Today's Tasks"
          value={todayTotal}
          supportingText={`${todayDone} of ${todayTotal} done`}
          progress={todayTotal > 0 ? todayProgress : undefined}
        />
        <StatCard label="Overdue" value={summary.data?.overdue_count ?? 0} tone="destructive" />
        <StatCard label="In Progress" value={summary.data?.in_progress_count ?? 0} tone="primary" />
        <StatCard label="Completed" value={summary.data?.completed_today_count ?? 0} supportingText="today" tone="success" />
      </div>

      <div className="mb-8">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Today's Work</h3>
        <div className="glass rounded-xl p-3">
          <TodayGroups
            tasks={today.data}
            isLoading={today.isLoading}
            isError={today.isError}
            onRetry={() => today.refetch()}
          />
        </div>
      </div>

      {overdue.data && overdue.data.length > 0 && (
        <div className="glass-subtle-destructive mb-8 rounded-xl p-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-destructive">
            <span className="size-1.5 rounded-full bg-destructive" />
            Overdue ({overdue.data.length})
          </h3>
          <TaskList tasks={overdue.data} showDate />
        </div>
      )}

      <div className="mb-8">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Upcoming</h3>
        <TaskList
          tasks={upcomingTasks}
          showDate
          isLoading={upcoming.isLoading}
          isError={upcoming.isError}
          onRetry={() => upcoming.refetch()}
          emptyMessage="Your schedule is clear."
        />
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Next 7 Days</h3>
        {upcoming.data && <SevenDayStrip days={upcoming.data.days} todayDate={summary.data?.today_date} />}
      </div>
    </Shell>
  );
}
