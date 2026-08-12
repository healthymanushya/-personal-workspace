import { useQuery } from "@tanstack/react-query";
import * as dashboardApi from "../api/dashboard";

export function useDashboardSummary() {
  return useQuery({ queryKey: ["dashboard", "summary"], queryFn: dashboardApi.getSummary });
}

export function useDashboardToday() {
  return useQuery({ queryKey: ["dashboard", "today"], queryFn: dashboardApi.getToday });
}

export function useDashboardNextTask() {
  return useQuery({ queryKey: ["dashboard", "next-task"], queryFn: dashboardApi.getNextTask });
}

export function useDashboardUpcoming() {
  return useQuery({ queryKey: ["dashboard", "upcoming"], queryFn: dashboardApi.getUpcoming });
}

export function useDashboardOverdue() {
  return useQuery({ queryKey: ["dashboard", "overdue"], queryFn: dashboardApi.getOverdue });
}

export function useDashboardCompleted(onDate?: string) {
  return useQuery({
    queryKey: ["dashboard", "completed", onDate],
    queryFn: () => dashboardApi.getCompleted(onDate),
  });
}
