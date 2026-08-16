export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export type TodoStatus = "completed" | "incomplete";

export interface TodoApi {
  list: (status?: TodoStatus) => Promise<Todo[]>;
  create: (title: string) => Promise<Todo>;
  update: (
    id: string,
    body: { title?: string; completed?: boolean },
  ) => Promise<Todo>;
  delete: (id: string) => Promise<void>;
}
