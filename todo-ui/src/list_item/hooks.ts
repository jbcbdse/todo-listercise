import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useTodoApi } from "@/api/todo_context";
import type { TodoStatus } from "@/api/todo";

const TODOS_KEY = ["todos"] as const;

export function useTodos(status?: TodoStatus) {
  const api = useTodoApi();
  return useQuery({
    queryKey: [...TODOS_KEY, status ?? "all"],
    queryFn: () => api.list(status),
  });
}

export function useCreateTodo() {
  const api = useTodoApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (title: string) => api.create(title),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: TODOS_KEY });
    },
  });
}

export function useUpdateTodo() {
  const api = useTodoApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      completed,
    }: {
      id: string;
      completed: boolean;
    }) => api.update(id, { completed }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: TODOS_KEY });
    },
  });
}

export function useDeleteTodo() {
  const api = useTodoApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: TODOS_KEY });
    },
  });
}
