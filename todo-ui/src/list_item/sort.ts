import type { Todo } from "@/api/todo";

export function sortTodos(items: readonly Todo[]): Todo[] {
  return items.toSorted((a, b) => {
    if (a.completed !== b.completed) {
      return Number(a.completed) - Number(b.completed);
    }
    return a.created_at.localeCompare(b.created_at);
  });
}
