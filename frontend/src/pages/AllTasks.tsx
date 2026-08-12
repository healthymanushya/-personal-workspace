import { useState } from "react";
import { Search } from "lucide-react";
import Shell from "@/components/layout/Shell";
import TaskList from "@/components/tasks/TaskList";
import { useTaskList } from "@/hooks/useTasks";
import { CATEGORIES, PRIORITIES, STATUSES, type TaskStatus } from "@/types/task";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AllTasks() {
  const [status, setStatus] = useState<TaskStatus | "all">("all");
  const [category, setCategory] = useState("all");
  const [priority, setPriority] = useState("all");
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, refetch } = useTaskList({
    status: status === "all" ? undefined : status,
    category: category === "all" ? undefined : category,
    priority: priority === "all" ? undefined : priority,
    search: search || undefined,
  });

  const hasFilters = status !== "all" || category !== "all" || priority !== "all" || search;

  return (
    <Shell title="All Tasks">
      <Tabs value={status} onValueChange={(v) => setStatus(v as TaskStatus | "all")} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          {STATUSES.map((s) => (
            <TabsTrigger key={s.value} value={s.value}>
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-[160px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            aria-label="Search tasks"
            className="pl-8"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger aria-label="Filter by category" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger aria-label="Filter by priority" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {PRIORITIES.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <TaskList
        tasks={data}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        showDate
        emptyMessage={hasFilters ? "No tasks match these filters." : "No tasks yet. Add your first task to get started."}
      />
    </Shell>
  );
}
