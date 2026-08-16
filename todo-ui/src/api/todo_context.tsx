import { createContext, useContext } from "react";

import type { TodoApi } from "@/api/todo";

const TodoApiContext = createContext<TodoApi | null>(null);

export const TodoApiProvider = TodoApiContext.Provider;

export function useTodoApi(): TodoApi {
  const api = useContext(TodoApiContext);
  if (api == null) {
    throw new Error("TodoApi is not configured");
  }
  return api;
}
