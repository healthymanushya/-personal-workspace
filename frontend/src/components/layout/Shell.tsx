import { useState, type ReactNode } from "react";
import { Menu, Plus, Search } from "lucide-react";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import TaskForm from "../tasks/TaskForm";
import NotificationPermissionBanner from "./NotificationPermissionBanner";
import NotificationBell from "./NotificationBell";
import { ThemeToggle } from "./ThemeToggle";
import { CommandPalette } from "./CommandPalette";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function Shell({ title, children }: { title: string; children: ReactNode }) {
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} onCreateTask={() => setQuickAddOpen(true)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="glass-subtle sticky top-0 z-30 flex items-center gap-2 border-t-0 border-r-0 border-l-0 px-4 py-3 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu />
          </Button>

          <h1 className="truncate text-base font-semibold tracking-tight text-foreground sm:text-lg">{title}</h1>

          <div className="ml-auto flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCommandOpen(true)}
              className="hidden text-muted-foreground sm:inline-flex"
            >
              <Search />
              Search
              <kbd className="ml-2 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                ⌘K
              </kbd>
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => setCommandOpen(true)} aria-label="Search">
                  <Search />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Search (⌘K)</TooltipContent>
            </Tooltip>

            <ThemeToggle />
            <NotificationBell />

            <Button onClick={() => setQuickAddOpen(true)} size="sm" className="hidden sm:inline-flex">
              <Plus /> Quick Add
            </Button>
            <Button onClick={() => setQuickAddOpen(true)} size="icon" className="sm:hidden" aria-label="Quick add task">
              <Plus />
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-8">
            <NotificationPermissionBanner />
            {children}
          </div>
        </div>
      </div>
      {quickAddOpen && <TaskForm onClose={() => setQuickAddOpen(false)} />}
    </div>
  );
}
