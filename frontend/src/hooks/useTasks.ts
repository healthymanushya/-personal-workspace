import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as tasksApi from "../api/tasks";
import type { TaskListFilters } from "../api/tasks";
import type { TaskCreateInput, TaskRescheduleInput, TaskSnoozeInput, TaskUpdateInput } from "../types/task";

export function useTaskList(filters: TaskListFilters = {}) {
  return useQuery({
    queryKey: ["tasks", filters],
    queryFn: () => tasksApi.listTasks(filters),
  });
}

export function useTask(id: string | undefined) {
  return useQuery({
    queryKey: ["task", id],
    queryFn: () => tasksApi.getTask(id as string),
    enabled: !!id,
  });
}

function useInvalidateAll() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    queryClient.invalidateQueries({ queryKey: ["task"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };
}

export function useCreateTask() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (payload: TaskCreateInput) => tasksApi.createTask(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateTask() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: TaskUpdateInput }) => tasksApi.updateTask(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteTask() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (id: string) => tasksApi.deleteTask(id),
    onSuccess: invalidate,
  });
}

export function useCompleteTask() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (id: string) => tasksApi.completeTask(id),
    onSuccess: invalidate,
  });
}

export function useSnoozeTask() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: TaskSnoozeInput }) => tasksApi.snoozeTask(id, payload),
    onSuccess: invalidate,
  });
}

export function useRescheduleTask() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: TaskRescheduleInput }) =>
      tasksApi.rescheduleTask(id, payload),
    onSuccess: invalidate,
  });
}
