import type { Todo, TodoApi, TodoStatus } from "@/api/todo";

export class FakeTodoApi implements TodoApi {
  private items: Todo[] = [];
  private seq = 0;

  seed(items: Todo[]): void {
    this.items = [...items];
  }

  list(status?: TodoStatus): Promise<Todo[]> {
    return Promise.resolve(
      this.items.filter((item) => {
        if (status === "completed") {
          return item.completed;
        }
        if (status === "incomplete") {
          return !item.completed;
        }
        return true;
      }),
    );
  }

  create(title: string): Promise<Todo> {
    this.seq += 1;
    const now = new Date().toISOString();
    const item: Todo = {
      id: `todo-${String(this.seq)}`,
      title,
      completed: false,
      created_at: now,
      updated_at: now,
    };
    this.items = [...this.items, item];
    return Promise.resolve(item);
  }

  update(
    id: string,
    body: { title?: string; completed?: boolean },
  ): Promise<Todo> {
    const index = this.items.findIndex((item) => item.id === id);
    const current = this.items[index];
    if (index < 0 || current === undefined) {
      return Promise.reject(new Error(`not found: ${id}`));
    }
    const next: Todo = {
      ...current,
      title: body.title ?? current.title,
      completed: body.completed ?? current.completed,
      updated_at: new Date().toISOString(),
    };
    this.items = this.items.map((item, i) => (i === index ? next : item));
    return Promise.resolve(next);
  }

  delete(id: string): Promise<void> {
    const exists = this.items.some((item) => item.id === id);
    if (!exists) {
      return Promise.reject(new Error(`not found: ${id}`));
    }
    this.items = this.items.filter((item) => item.id !== id);
    return Promise.resolve();
  }
}
