import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import type { ReminderItem } from "../types/reminder";

export interface NotificationEvent extends ReminderItem {
  id: string;
  firedAt: number;
}

interface NotificationHistoryContextValue {
  history: NotificationEvent[];
  addEvent: (item: ReminderItem) => void;
  clearHistory: () => void;
}

const MAX_HISTORY = 10;

const NotificationHistoryContext = createContext<NotificationHistoryContextValue | undefined>(undefined);

export function NotificationHistoryProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<NotificationEvent[]>([]);

  const addEvent = useCallback((item: ReminderItem) => {
    const event: NotificationEvent = { ...item, id: `${item.task.id}-${item.kind}-${Date.now()}`, firedAt: Date.now() };
    setHistory((prev) => [event, ...prev].slice(0, MAX_HISTORY));
  }, []);

  const clearHistory = useCallback(() => setHistory([]), []);

  return (
    <NotificationHistoryContext.Provider value={{ history, addEvent, clearHistory }}>
      {children}
    </NotificationHistoryContext.Provider>
  );
}

export function useNotificationHistory(): NotificationHistoryContextValue {
  const ctx = useContext(NotificationHistoryContext);
  if (!ctx) throw new Error("useNotificationHistory must be used within NotificationHistoryProvider");
  return ctx;
}
