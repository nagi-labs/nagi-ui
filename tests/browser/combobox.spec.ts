import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/combobox.html");
});

test("typing filters while the committed selection survives", async ({ page }) => {
  const input = page.getByRole("combobox", { name: "Framework" });
  await input.fill("a");

  const listbox = page.getByRole("listbox", { name: "Framework" });
  await expect(listbox).toBeVisible();
  await expect(listbox.getByRole("option")).toHaveCount(3);
  await expect(page.getByTestId("input-state")).toHaveText("a");
  await expect(page.getByTestId("selected-state")).toHaveText("vue");
  await expect(input).toHaveAttribute("aria-expanded", "true");
});

test("Arrow navigation keeps DOM focus on the input and skips disabled suggestions", async ({
  page,
}) => {
  const input = page.getByRole("combobox", { name: "Framework" });
  await input.fill("a");
  await input.press("ArrowDown");

  const angular = page.getByRole("option", { name: "Angular" });
  await expect(input).toBeFocused();
  await expect(angular).toHaveAttribute("aria-selected", "true");
  const activeId = await angular.getAttribute("id");
  await expect(input).toHaveAttribute("aria-activedescendant", activeId ?? "");
  await expect(page.getByTestId("selected-state")).toHaveText("vue");
});

test("Escape cancels provisional navigation without changing text or selection", async ({
  page,
}) => {
  const input = page.getByRole("combobox", { name: "Framework" });
  await input.fill("s");
  await input.press("ArrowDown");
  await input.press("Escape");

  await expect(page.getByRole("listbox", { name: "Framework" })).toBeHidden();
  await expect(input).toHaveValue("s");
  await expect(page.getByTestId("selected-state")).toHaveText("vue");
  await expect(input).not.toHaveAttribute("aria-activedescendant", /.+/);
});

test("Enter and pointer selection commit the option and close the popup", async ({ page }) => {
  const input = page.getByRole("combobox", { name: "Framework" });
  const listbox = page.getByRole("listbox", { name: "Framework" });

  await input.fill("sve");
  await input.press("ArrowDown");
  await input.press("Enter");
  await expect(input).toHaveValue("Svelte");
  await expect(page.getByTestId("selected-state")).toHaveText("svelte");
  await expect(listbox).toBeHidden();

  await input.fill("sol");
  await page.getByRole("option", { name: "Solid" }).click();
  await expect(input).toBeFocused();
  await expect(input).toHaveValue("Solid");
  await expect(page.getByTestId("selected-state")).toHaveText("solid");
  await expect(listbox).toBeHidden();
});

test("no matches expose empty status and light dismiss closes the native popover", async ({ page }) => {
  const input = page.getByRole("combobox", { name: "Framework" });
  const listbox = page.getByRole("listbox", { name: "Framework" });

  await input.fill("no match");
  await expect(page.getByText("No results", { exact: true })).toBeVisible();
  await expect(input).toHaveAttribute("aria-expanded", "true");

  await input.fill("s");
  await expect(listbox).toBeVisible();
  await page.getByRole("button", { name: "After combobox" }).click();
  await expect(listbox).toBeHidden();
  await expect(input).toHaveValue("s");
  await expect(page.getByTestId("selected-state")).toHaveText("vue");
});
