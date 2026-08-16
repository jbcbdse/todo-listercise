import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { FakeTodoApi } from "@/api/fake_todo";
import { TodoApiProvider } from "@/api/todo_context";
import { FlagProviderHost } from "@/flag/context";
import { FakeFlagProvider } from "@/flag/fake";
import { TodoList } from "@/list_item/TodoList";

function renderList(api: FakeTodoApi) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <TodoApiProvider value={api}>
          <FlagProviderHost value={new FakeFlagProvider()}>
            {children}
          </FlagProviderHost>
        </TodoApiProvider>
      </QueryClientProvider>
    );
  }
  return render(<TodoList />, { wrapper: Wrapper });
}

describe("TodoList", () => {
  it("creates and lists an item", async () => {
    const api = new FakeTodoApi();
    const user = userEvent.setup();
    renderList(api);
    await user.type(screen.getByLabelText("Title"), "buy milk");
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(await screen.findByRole("checkbox", { name: "buy milk" })).toBeVisible();
  });

  it("filters incomplete items", async () => {
    const api = new FakeTodoApi();
    api.seed([
      {
        id: "1",
        title: "done",
        completed: true,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "2",
        title: "open",
        completed: false,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
    ]);
    const user = userEvent.setup();
    renderList(api);
    expect(await screen.findByRole("checkbox", { name: "open" })).toBeVisible();
    const listed = screen.getAllByRole("checkbox");
    expect(listed[0]).toHaveAccessibleName("open");
    expect(listed[1]).toHaveAccessibleName("done");
    await user.click(screen.getByRole("button", { name: "Incomplete" }));
    expect(await screen.findByRole("checkbox", { name: "open" })).toBeVisible();
    expect(screen.queryByRole("checkbox", { name: "done" })).not.toBeInTheDocument();
  });

  it("moves a checked item below incomplete items", async () => {
    const api = new FakeTodoApi();
    api.seed([
      {
        id: "1",
        title: "first",
        completed: false,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "2",
        title: "second",
        completed: false,
        created_at: "2026-01-02T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
      },
    ]);
    const user = userEvent.setup();
    renderList(api);
    await user.click(await screen.findByRole("checkbox", { name: "first" }));
    const listed = screen.getAllByRole("checkbox");
    expect(listed[0]).toHaveAccessibleName("second");
    expect(listed[1]).toHaveAccessibleName("first");
    expect(listed[1]).toBeChecked();
  });
});
