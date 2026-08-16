import { expect, test } from "@playwright/test";

test.beforeEach(async ({ request }) => {
  try {
    const response = await request.get("http://localhost:8000/healthz");
    if (response.status() !== 200) {
      test.skip(true, "API is not running");
    }
  } catch {
    test.skip(true, "API is not running");
  }
});

test.describe("todos", () => {
  test("creates, completes, filters, and deletes", async ({ page }) => {
    const stamp = String(Date.now());
    const openTitle = `open-${stamp}`;
    const doneTitle = `done-${stamp}`;

    await page.goto("/");

    await page.getByLabel("Title").fill(openTitle);
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByRole("checkbox", { name: openTitle })).toBeVisible();

    await page.getByLabel("Title").fill(doneTitle);
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByRole("checkbox", { name: doneTitle })).toBeVisible();

    await page.getByRole("checkbox", { name: doneTitle }).click();
    await expect(page.getByRole("checkbox", { name: doneTitle })).toBeChecked();
    await page.getByRole("button", { name: "Incomplete" }).click();
    await expect(page.getByRole("checkbox", { name: openTitle })).toBeVisible();
    await expect(
      page.getByRole("checkbox", { name: doneTitle }),
    ).toHaveCount(0);

    await page.getByRole("button", { name: "All" }).click();
    const row = page.getByRole("listitem").filter({ hasText: openTitle });
    await row.getByRole("button", { name: "Delete" }).click();
    await expect(
      page.getByRole("checkbox", { name: openTitle }),
    ).toHaveCount(0);
  });
});
