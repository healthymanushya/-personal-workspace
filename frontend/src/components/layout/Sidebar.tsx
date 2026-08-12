import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Sun,
  CalendarDays,
  Calendar,
  ListTodo,
  CheckCircle2,
  AlertCircle,
  Settings as SettingsIcon,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const NAV_ITEMS = [
  { to: "/", label: "Dashboard", exact: true, icon: LayoutDashboard },
  { to: "/today", label: "Today", icon: Sun },
  { to: "/upcoming", label: "Upcoming", icon: CalendarDays },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/all-tasks", label: "All Tasks", icon: ListTodo },
  { to: "/completed", label: "Completed", icon: CheckCircle2 },
  { to: "/overdue", label: "Overdue", icon: AlertCircle },
];

export function navItemClass(isActive: boolean): string {
  return `flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors ${
    isActive
      ? "nav-active font-semibold text-foreground"
      : "font-medium text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground"
  }`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex-1 space-y-0.5 px-3 py-3" onClick={onNavigate}>
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink key={item.to} to={item.to} end={item.exact} className={({ isActive }) => navItemClass(isActive)}>
            {({ isActive }) => (
              <>
                <Icon className={`size-4 ${isActive ? "text-primary" : ""}`} />
                {item.label}
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}

export function SidebarBrand() {
  return (
    <div className="flex items-center gap-2.5 px-5 py-5">
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
        PW
      </div>
      <span className="text-sm font-semibold tracking-tight text-foreground">Personal Workspace</span>
    </div>
  );
}

export function SidebarProfile() {
  const { user, logout } = useAuth();
  const displayName = user?.full_name ?? user?.email ?? "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors hover:bg-accent/60">
          <Avatar className="size-8">
            <AvatarFallback className="text-xs">{initials(displayName || "?")}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-foreground">{displayName}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-56">
        <DropdownMenuItem onClick={logout} variant="destructive">
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function Sidebar() {
  return (
    <aside className="glass hidden h-full w-60 shrink-0 flex-col border-y-0 border-l-0 md:flex">
      <SidebarBrand />
      <Separator className="mx-4 w-auto" />
      <SidebarNav />
      <Separator className="mx-4 w-auto" />
      <div className="px-3 py-3">
        <NavLink to="/settings" className={({ isActive }) => navItemClass(isActive)}>
          <SettingsIcon className="size-4" />
          Settings
        </NavLink>
      </div>
      <Separator className="mx-4 w-auto" />
      <div className="p-3">
        <SidebarProfile />
      </div>
    </aside>
  );
}
