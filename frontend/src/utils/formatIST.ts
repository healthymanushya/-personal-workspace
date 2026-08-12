// Display-only formatting. All business logic (today/overdue/etc.) is computed
// by the backend in Asia/Kolkata — this just renders backend-provided values,
// pinned to the IST timezone so display is consistent regardless of browser locale.

const IST_TZ = "Asia/Kolkata";

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr.length === 10 ? `${dateStr}T00:00:00+05:30` : dateStr);
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(d);
}

export function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr.length === 10 ? `${dateStr}T00:00:00+05:30` : dateStr);
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function formatTime(isoStr: string | null): string {
  if (!isoStr) return "All day";
  const d = new Date(isoStr);
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

export function formatDateTime(isoStr: string): string {
  const d = new Date(isoStr);
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TZ,
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

/** "in 25 min" / "in 2h 5m" / "now" for a future ISO instant. Caller guarantees isoStr is in the future. */
export function formatCountdown(isoStr: string): string {
  const diffMs = new Date(isoStr).getTime() - Date.now();
  const totalMinutes = Math.max(0, Math.round(diffMs / 60000));
  if (totalMinutes === 0) return "now";
  if (totalMinutes < 60) return `in ${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `in ${hours}h` : `in ${hours}h ${minutes}m`;
}

/** "5 min late" / "3h late" / "2 days late" for a past ISO instant. Caller guarantees isoStr is in the past. */
export function formatOverdueBy(isoStr: string): string {
  const diffMs = Date.now() - new Date(isoStr).getTime();
  const totalMinutes = Math.max(0, Math.round(diffMs / 60000));
  if (totalMinutes < 60) return `${totalMinutes} min late`;
  const totalHours = Math.floor(totalMinutes / 60);
  if (totalHours < 24) return `${totalHours}h late`;
  const days = Math.floor(totalHours / 24);
  return `${days} ${days === 1 ? "day" : "days"} late`;
}

export function greeting(): string {
  const hourStr = new Intl.DateTimeFormat("en-IN", { timeZone: IST_TZ, hour: "numeric", hour12: false }).format(
    new Date(),
  );
  const hour = parseInt(hourStr, 10);
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
