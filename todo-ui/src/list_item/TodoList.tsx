import { useState } from "react";

import type { TodoStatus } from "@/api/todo";
import {
  useCreateTodo,
  useDeleteTodo,
  useTodos,
  useUpdateTodo,
} from "@/list_item/hooks";
import { sortTodos } from "@/list_item/sort";
import { TodoComposer } from "@/list_item/TodoComposer";
import { TodoItem } from "@/list_item/TodoItem";
import { useFlipList } from "@/list_item/useFlipList";
import { Button } from "@/ui/Button";

export function TodoList() {
  const [status, setStatus] = useState<TodoStatus | undefined>(undefined);
  const todos = useTodos(status);
  const createTodo = useCreateTodo();
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();
  const items = sortTodos(todos.data ?? []);
  const listRef = useFlipList(items.map((item) => item.id));

  return (
    <section className="flex flex-col gap-4">
      <TodoComposer
        disabled={createTodo.isPending}
        onSubmit={(title) => {
          createTodo.mutate(title);
        }}
      />
      <div className="flex gap-2" role="group" aria-label="Status">
        <Button
          variant={status === undefined ? "primary" : "secondary"}
          onClick={() => {
            setStatus(undefined);
          }}
        >
          All
        </Button>
        <Button
          variant={status === "incomplete" ? "primary" : "secondary"}
          onClick={() => {
            setStatus("incomplete");
          }}
        >
          Incomplete
        </Button>
        <Button
          variant={status === "completed" ? "primary" : "secondary"}
          onClick={() => {
            setStatus("completed");
          }}
        >
          Completed
        </Button>
      </div>
      {todos.isError ? (
        <p role="alert">Could not load todos.</p>
      ) : (
        <ul ref={listRef}>
          {items.map((item) => (
            <TodoItem
              key={item.id}
              item={item}
              onCompletedChange={(completed) => {
                updateTodo.mutate({ id: item.id, completed });
              }}
              onDelete={() => {
                deleteTodo.mutate(item.id);
              }}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
