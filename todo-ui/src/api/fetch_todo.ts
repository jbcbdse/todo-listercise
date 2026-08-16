import type { Todo, TodoApi, TodoStatus } from "@/api/todo";

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`request failed: ${String(response.status)}`);
  }
  return (await response.json()) as T;
}

export class FetchTodoApi implements TodoApi {
  async list(status?: TodoStatus): Promise<Todo[]> {
    const query = status === undefined ? "" : `?status=${status}`;
    const response = await fetch(`/api/todos${query}`);
    return parseJson<Todo[]>(response);
  }

  async create(title: string): Promise<Todo> {
    const response = await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    return parseJson<Todo>(response);
  }

  async update(
    id: string,
    body: { title?: string; completed?: boolean },
  ): Promise<Todo> {
    const response = await fetch(`/api/todos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return parseJson<Todo>(response);
  }

  async delete(id: string): Promise<void> {
    const response = await fetch(`/api/todos/${id}`, { method: "DELETE" });
    if (!response.ok) {
      throw new Error(`request failed: ${String(response.status)}`);
    }
  }
}
