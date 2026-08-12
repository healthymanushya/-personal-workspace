import { createContext, useContext, useState, type ReactNode } from "react";

interface TaskDetailContextValue {
  openTaskId: string | null;
  openTaskDetail: (id: string) => void;
  closeTaskDetail: () => void;
}

const TaskDetailContext = createContext<TaskDetailContextValue | undefined>(undefined);

export function TaskDetailProvider({ children }: { children: ReactNode }) {
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  return (
    <TaskDetailContext.Provider
      value={{ openTaskId, openTaskDetail: setOpenTaskId, closeTaskDetail: () => setOpenTaskId(null) }}
    >
      {children}
    </TaskDetailContext.Provider>
  );
}

export function useTaskDetail(): TaskDetailContextValue {
  const ctx = useContext(TaskDetailContext);
  if (!ctx) throw new Error("useTaskDetail must be used within TaskDetailProvider");
  return ctx;
}
