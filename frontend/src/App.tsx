import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Today from "./pages/Today";
import Upcoming from "./pages/Upcoming";
import CalendarView from "./pages/CalendarView";
import AllTasks from "./pages/AllTasks";
import Completed from "./pages/Completed";
import Overdue from "./pages/Overdue";
import Settings from "./pages/Settings";
import TaskDetailModal from "./components/tasks/TaskDetailModal";
import ReminderCenter from "./components/reminders/ReminderCenter";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/today"
        element={
          <ProtectedRoute>
            <Today />
          </ProtectedRoute>
        }
      />
      <Route
        path="/upcoming"
        element={
          <ProtectedRoute>
            <Upcoming />
          </ProtectedRoute>
        }
      />
      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <CalendarView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/all-tasks"
        element={
          <ProtectedRoute>
            <AllTasks />
          </ProtectedRoute>
        }
      />
      <Route
        path="/completed"
        element={
          <ProtectedRoute>
            <Completed />
          </ProtectedRoute>
        }
      />
      <Route
        path="/overdue"
        element={
          <ProtectedRoute>
            <Overdue />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <TaskDetailModal />
    <ReminderCenter />
    </>
  );
}
