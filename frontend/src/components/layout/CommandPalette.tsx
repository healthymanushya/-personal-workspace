import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Calendar,
  CalendarDays,
  CheckCircle2,
  LayoutDashboard,
  ListTodo,
  Plus,
  Settings as SettingsIcon,
  Sun,
} from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useTaskList } from "@/hooks/useTasks";
import { useTaskDetail } from "@/context/TaskDetailContext";
import { StatusDot } from "@/components/tasks/StatusDot";

const NAV_COMMANDS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/today", label: "Today", icon: Sun },
  { to: "/upcoming", label: "Upcoming", icon: CalendarDays },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/all-tasks", label: "All Tasks", icon: ListTodo },
  { to: "/completed", label: "Completed", icon: CheckCircle2 },
  { to: "/overdue", label: "Overdue", icon: AlertCircle },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export function CommandPalette({
  open,
  onOpenChange,
  onCreateTask,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTask: () => void;
}) {
  const navigate = useNavigate();
  const { openTaskDetail } = useTaskDetail();
  const { data: tasks } = useTaskList();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  function runCommand(action: () => void) {
    onOpenChange(false);
    action();
  }

  const activeTasks = (tasks ?? []).filter((t) => t.status !== "completed").slice(0, 8);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Command Palette" description="Search tasks or run a command">
      <Command>
        <CommandInput placeholder="Search tasks or type a command…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Actions">
            <CommandItem onSelect={() => runCommand(onCreateTask)}>
              <Plus /> Create new task
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Go to">
            {NAV_COMMANDS.map((item) => (
              <CommandItem key={item.to} onSelect={() => runCommand(() => navigate(item.to))}>
                <item.icon /> {item.label}
              </CommandItem>
            ))}
          </CommandGroup>

          {activeTasks.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Tasks">
                {activeTasks.map((task) => (
                  <CommandItem
                    key={task.id}
                    value={task.title}
                    onSelect={() => runCommand(() => openTaskDetail(task.id))}
                  >
                    <StatusDot status={task.status} />
                    <span className="truncate">{task.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
