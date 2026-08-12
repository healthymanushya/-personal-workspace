import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { TaskDetailProvider } from "./context/TaskDetailContext";
import { NotificationHistoryProvider } from "./context/NotificationHistoryContext";
import { ThemeProvider } from "./components/providers/theme-provider";
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "./components/ui/sonner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TaskDetailProvider>
              <NotificationHistoryProvider>
                <TooltipProvider delayDuration={300}>
                  <App />
                  <Toaster position="top-center" />
                </TooltipProvider>
              </NotificationHistoryProvider>
            </TaskDetailProvider>
          </AuthProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);
