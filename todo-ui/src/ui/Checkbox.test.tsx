import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Checkbox } from "@/ui/Checkbox";

describe("Checkbox", () => {
  it("toggles via the accessible name", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Checkbox label="Done" onChange={onChange} />);
    await user.click(screen.getByRole("checkbox", { name: "Done" }));
    expect(onChange).toHaveBeenCalledOnce();
  });
});
