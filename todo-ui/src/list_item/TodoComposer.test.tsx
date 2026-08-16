import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TodoComposer } from "@/list_item/TodoComposer";

describe("TodoComposer", () => {
  it("does not submit whitespace", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<TodoComposer onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText("Title"), "   ");
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits a trimmed title and clears the field", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<TodoComposer onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText("Title"), "  buy milk  ");
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(onSubmit).toHaveBeenCalledWith("buy milk");
    expect(screen.getByLabelText("Title")).toHaveValue("");
  });
});
