import { TodoList } from "@/list_item/TodoList";

export function Page() {
  return (
    <main className="mx-auto max-w-lg p-6">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900">Todos</h1>
      <TodoList />
    </main>
  );
}
