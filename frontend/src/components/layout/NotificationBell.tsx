import { useState } from "react";
import { Bell } from "lucide-react";
import { useNotificationHistory } from "@/context/NotificationHistoryContext";
import { formatDateTime } from "@/utils/formatIST";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function NotificationBell() {
  const { history, clearHistory } = useNotificationHistory();
  const [open, setOpen] = useState(false);
  const [lastSeenCount, setLastSeenCount] = useState(0);

  const unreadCount = Math.max(0, history.length - lastSeenCount);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setLastSeenCount(history.length);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
            >
              <Bell />
              {unreadCount > 0 && (
                <Badge className="absolute -right-1 -top-1 h-4 min-w-4 justify-center rounded-full px-1 text-[10px]">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Notifications</TooltipContent>
      </Tooltip>

      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3.5 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notifications</p>
          {history.length > 0 && (
            <Button variant="ghost" size="xs" onClick={clearHistory}>
              Clear
            </Button>
          )}
        </div>
        {history.length === 0 ? (
          <p className="px-3.5 pb-4 text-sm text-muted-foreground">No reminders yet.</p>
        ) : (
          <ScrollArea className="max-h-80">
            <div className="pb-1">
              {history.map((event, idx) => {
                const isUnread = idx < unreadCount;
                return (
                  <div key={event.id} className="flex items-start gap-2.5 px-3.5 py-2.5 hover:bg-accent">
                    <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${isUnread ? "bg-primary" : "bg-transparent"}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        {event.kind === "due" ? "Task Due" : "Upcoming Task"} ·{" "}
                        {formatDateTime(new Date(event.firedAt).toISOString())}
                      </p>
                      <p className={`truncate text-sm ${isUnread ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                        {event.task.title}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
