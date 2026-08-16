import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";

import type { Todo } from "@/api/todo";
import { FlagProviderHost } from "@/flag/context";
import { FakeFlagProvider } from "@/flag/fake";
import { FlagKey } from "@/flag/keys";
import { TodoItem } from "@/list_item/TodoItem";

const item: Todo = {
  id: "1",
  title: "buy milk",
  completed: false,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

function renderItem(
  ui: ReactElement,
  flags: FakeFlagProvider = new FakeFlagProvider(),
) {
  return render(<FlagProviderHost value={flags}>{ui}</FlagProviderHost>);
}

describe("TodoItem", () => {
  it("notifies when completed changes", async () => {
    const onCompletedChange = vi.fn();
    const user = userEvent.setup();
    renderItem(
      <TodoItem
        item={item}
        onCompletedChange={onCompletedChange}
        onDelete={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("checkbox", { name: "buy milk" }));
    expect(onCompletedChange).toHaveBeenCalledWith(true);
  });

  it("styles completed titles", () => {
    renderItem(
      <TodoItem
        item={{ ...item, completed: true }}
        onCompletedChange={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText("buy milk")).toHaveClass("line-through", "text-zinc-400");
  });

  it("does not sparkle when the flag is off", async () => {
    const user = userEvent.setup();
    renderItem(
      <TodoItem
        item={item}
        onCompletedChange={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("checkbox", { name: "buy milk" }));
    expect(screen.queryByTestId("sparkles")).not.toBeInTheDocument();
  });

  it("sparkles when completing with the flag on", async () => {
    const flags = new FakeFlagProvider({ [FlagKey.CompletedSparkles]: true });
    const user = userEvent.setup();
    renderItem(
      <TodoItem
        item={item}
        onCompletedChange={vi.fn()}
        onDelete={vi.fn()}
      />,
      flags,
    );
    await user.click(screen.getByRole("checkbox", { name: "buy milk" }));
    expect(screen.getByTestId("sparkles")).toBeInTheDocument();
  });

  it("notifies on delete", async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    renderItem(
      <TodoItem item={item} onCompletedChange={vi.fn()} onDelete={onDelete} />,
    );
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledOnce();
  });
});
