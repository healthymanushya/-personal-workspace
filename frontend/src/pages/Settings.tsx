import { useState, type FormEvent } from "react";
import { useTheme } from "next-themes";
import { LogOut, Monitor, Moon, Sun } from "lucide-react";
import Shell from "@/components/layout/Shell";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/api/client";
import * as authApi from "@/api/auth";

function currentPermission(): NotificationPermission | "unsupported" {
  return typeof Notification === "undefined" ? "unsupported" : Notification.permission;
}

const PERMISSION_LABEL: Record<string, string> = {
  granted: "Enabled",
  denied: "Blocked",
  default: "Not enabled",
  unsupported: "Not supported in this browser",
};

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export default function Settings() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [permission, setPermission] = useState(currentPermission);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmNewPassword) {
      setPasswordError("New password and confirmation do not match");
      return;
    }

    setChangingPassword(true);
    try {
      await authApi.changePassword(currentPassword, newPassword, confirmNewPassword);
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setChangingPassword(false);
    }
  }

  async function enableNotifications() {
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    setPermission(result);
  }

  return (
    <Shell title="Settings">
      <div className="max-w-xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Name</dt>
                <dd className="font-medium text-foreground">{user?.full_name ?? "—"}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="font-medium text-foreground">{user?.email}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="inline-flex rounded-lg border border-border bg-muted p-1">
              {THEME_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  variant={theme === opt.value ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTheme(opt.value)}
                >
                  <opt.icon /> {opt.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">Browser notifications</p>
                <p className="text-xs text-muted-foreground">{PERMISSION_LABEL[permission]}</p>
              </div>
              {permission === "default" && (
                <Button size="sm" onClick={enableNotifications}>
                  Enable
                </Button>
              )}
            </div>
            {permission === "denied" && (
              <p className="mt-3 text-xs text-muted-foreground">
                Notifications are blocked at the browser level. In-app reminders will still show while Personal
                Workspace is open in this tab. To enable browser notifications, allow them for this site in your
                browser's settings.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Timezone</span>
              <span className="font-medium text-foreground">Asia/Kolkata (IST)</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              {passwordError && (
                <div role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div role="status" className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600">
                  Password updated successfully.
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                <Input
                  id="confirm-new-password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                />
              </div>
              <Button type="submit" size="sm" disabled={changingPassword}>
                {changingPassword ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" size="sm" onClick={logout}>
              <LogOut /> Log out
            </Button>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
