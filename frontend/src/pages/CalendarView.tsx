import { useMemo, useState, type ComponentProps } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import Shell from "@/components/layout/Shell";
import TaskList from "@/components/tasks/TaskList";
import TaskForm from "@/components/tasks/TaskForm";
import { useTaskList } from "@/hooks/useTasks";
import { formatFullDate } from "@/utils/formatIST";
import { Button } from "@/components/ui/button";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import type { DayButton } from "react-day-picker";

function istToday(): Date {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  return new Date(`${parts}T00:00:00`);
}

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fromDateStr(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function isValidDateStr(s: string | null): s is string {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export default function CalendarView() {
  const today = useMemo(() => istToday(), []);
  const [searchParams] = useSearchParams();
  const deepLinkedDate = searchParams.get("date");
  const initialSelected = isValidDateStr(deepLinkedDate) ? deepLinkedDate : toDateStr(today);

  const [month, setMonth] = useState(() => fromDateStr(initialSelected));
  const [selected, setSelected] = useState<string>(initialSelected);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const { data: tasks, isLoading, isError, refetch } = useTaskList();

  const datesWithTasks = useMemo(() => {
    const set = new Set<string>();
    for (const t of tasks ?? []) set.add(t.due_date);
    return set;
  }, [tasks]);

  const selectedTasks = (tasks ?? []).filter((t) => t.due_date === selected);

  function TaskDayButton(props: ComponentProps<typeof DayButton>) {
    const hasTasks = datesWithTasks.has(toDateStr(props.day.date));
    return (
      <div className="relative size-full">
        <CalendarDayButton {...props} />
        {hasTasks && (
          <span
            className={`pointer-events-none absolute bottom-1 left-1/2 z-20 size-1 -translate-x-1/2 rounded-full ${
              props.modifiers.selected ? "bg-primary-foreground" : "bg-primary"
            }`}
          />
        )}
      </div>
    );
  }

  return (
    <Shell title="Calendar">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[auto_1fr]">
        <div className="glass w-fit rounded-xl p-4">
          <Calendar
            mode="single"
            selected={fromDateStr(selected)}
            onSelect={(date) => date && setSelected(toDateStr(date))}
            month={month}
            onMonthChange={setMonth}
            components={{ DayButton: TaskDayButton }}
            className="bg-transparent"
          />
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground">{formatFullDate(selected)}</h3>
            <Button size="sm" variant="outline" onClick={() => setQuickAddOpen(true)}>
              <Plus /> Add task
            </Button>
          </div>
          <TaskList
            tasks={selectedTasks}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            emptyMessage="No tasks on this day."
          />
        </div>
      </div>

      {quickAddOpen && <TaskForm initialDate={selected} onClose={() => setQuickAddOpen(false)} />}
    </Shell>
  );
}
