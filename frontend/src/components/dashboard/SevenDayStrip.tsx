import { useNavigate } from "react-router-dom";
import type { DayGroup } from "@/types/dashboard";
import { formatDate } from "@/utils/formatIST";

export default function SevenDayStrip({ days, todayDate }: { days: DayGroup[]; todayDate?: string }) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
      {days.map((day) => {
        const completedCount = day.tasks.filter((t) => t.status === "completed").length;
        const isToday = day.date === todayDate;
        return (
          <button
            key={day.date}
            onClick={() => navigate(`/calendar?date=${day.date}`)}
            className={`rounded-lg px-3 py-3 text-left ${isToday ? "glass-subtle-accent" : "glass-subtle"}`}
          >
            <p className={`text-xs font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`}>
              {isToday ? "Today" : formatDate(day.date)}
            </p>
            <p className="mt-1 text-xl font-semibold text-foreground tabular-nums">{day.tasks.length}</p>
            <p className="text-xs text-muted-foreground">
              {day.tasks.length === 1 ? "task" : "tasks"}
              {completedCount > 0 && ` · ${completedCount} done`}
            </p>
          </button>
        );
      })}
    </div>
  );
}
