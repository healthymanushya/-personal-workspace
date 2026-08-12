import { useEffect, useState } from "react";
import { BellRing } from "lucide-react";
import { Alert, AlertAction, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const PROMPT_DISMISSED_KEY = "pw_notif_prompt_dismissed";
const DENIED_DISMISSED_KEY = "pw_notif_denied_dismissed";

type PermissionState = NotificationPermission | "unsupported";

function currentPermission(): PermissionState {
  return typeof Notification === "undefined" ? "unsupported" : Notification.permission;
}

export default function NotificationPermissionBanner() {
  const [permission, setPermission] = useState<PermissionState>(currentPermission);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (permission === "default") {
      setDismissed(localStorage.getItem(PROMPT_DISMISSED_KEY) === "1");
    } else if (permission === "denied") {
      setDismissed(localStorage.getItem(DENIED_DISMISSED_KEY) === "1");
    } else {
      setDismissed(true);
    }
  }, [permission]);

  if (permission === "unsupported" || permission === "granted" || dismissed) return null;

  function dismiss() {
    localStorage.setItem(permission === "denied" ? DENIED_DISMISSED_KEY : PROMPT_DISMISSED_KEY, "1");
    setDismissed(true);
  }

  async function enable() {
    const result = await Notification.requestPermission();
    setPermission(result);
  }

  return (
    <Alert className="mb-6 border-primary/20 bg-primary/5">
      <BellRing className="text-primary" />
      <AlertDescription className="pr-2 text-foreground">
        {permission === "denied"
          ? "Browser notifications are blocked. In-app reminders will still show while Personal Workspace is open in this tab."
          : "Enable browser notifications to get reminders even when this tab isn't focused."}
      </AlertDescription>
      <AlertAction className="static mt-1 flex items-center gap-2 justify-self-end">
        {permission === "default" && (
          <Button size="xs" onClick={enable}>
            Enable
          </Button>
        )}
        <Button size="xs" variant="ghost" onClick={dismiss}>
          Dismiss
        </Button>
      </AlertAction>
    </Alert>
  );
}
