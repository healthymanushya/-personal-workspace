import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNotificationHistory } from "../../context/NotificationHistoryContext";
import * as remindersApi from "../../api/reminders";
import type { ReminderItem } from "../../types/reminder";
import ReminderToast from "./ReminderToast";

const POLL_INTERVAL_MS = 20000;

function toastKey(item: ReminderItem): string {
  return `${item.task.id}:${item.kind}`;
}

function notifyBrowser(item: ReminderItem): void {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const title = item.kind === "due" ? "Task Due" : "Upcoming Task";
  const body = item.kind === "due" ? item.task.title : `${item.task.title} — starts in ${item.minutes_remaining} minutes`;
  new Notification(title, { body });
}

export default function ReminderCenter() {
  const { user } = useAuth();
  const { addEvent } = useNotificationHistory();
  const [toasts, setToasts] = useState<ReminderItem[]>([]);
  const seenRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function poll() {
      try {
        const items = await remindersApi.getDueNow();
        if (cancelled) return;

        const fresh = items.filter((item) => !seenRef.current.has(toastKey(item)));
        if (fresh.length === 0) return;

        fresh.forEach((item) => {
          seenRef.current.add(toastKey(item));
          notifyBrowser(item);
          addEvent(item);
        });
        setToasts((prev) => [...prev, ...fresh]);

        // Ack immediately so the same reminder never fires twice, even if
        // the user never interacts with the toast.
        fresh.forEach((item) => {
          remindersApi.ackReminder(item.task.id, item.kind).catch(() => {});
        });
      } catch {
        // transient network error — next poll will retry
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user, addEvent]);

  function dismiss(key: string) {
    setToasts((prev) => prev.filter((t) => toastKey(t) !== key));
  }

  if (toasts.length === 0) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 flex flex-col gap-3 sm:inset-x-auto sm:right-4 sm:w-full sm:max-w-sm">
      {toasts.map((item) => (
        <ReminderToast key={toastKey(item)} item={item} onDismiss={() => dismiss(toastKey(item))} />
      ))}
    </div>
  );
}
