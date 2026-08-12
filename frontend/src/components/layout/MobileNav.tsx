import { NavLink } from "react-router-dom";
import { LogOut, Settings as SettingsIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { NAV_ITEMS, initials, navItemClass } from "./Sidebar";

export default function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, logout } = useAuth();
  const displayName = user?.full_name ?? user?.email ?? "";

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="flex-row items-center gap-2.5 space-y-0 px-5 py-5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
            PW
          </div>
          <SheetTitle className="text-sm font-semibold tracking-tight">Personal Workspace</SheetTitle>
        </SheetHeader>

        <Separator className="mx-4 w-auto" />

        <nav className="flex-1 space-y-0.5 px-3 py-3" onClick={onClose}>
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

        <Separator className="mx-4 w-auto" />

        <div className="px-3 py-3" onClick={onClose}>
          <NavLink to="/settings" className={({ isActive }) => navItemClass(isActive)}>
            <SettingsIcon className="size-4" />
            Settings
          </NavLink>
        </div>

        <Separator className="mx-4 w-auto" />

        <div className="flex items-center gap-2.5 p-4">
          <Avatar className="size-8">
            <AvatarFallback className="text-xs">{initials(displayName || "?")}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-foreground">{displayName}</p>
          </div>
          <Button variant="ghost" size="icon" aria-label="Sign out" onClick={logout}>
            <LogOut />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
