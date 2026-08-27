import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/phase2.html");
});

test("keyboard navigation skips disabled items and selects", async ({ page }) => {
  const trigger = page.getByRole("button", { name: "Actions" });
  const menu = page.getByRole("menu");
  const duplicate = page.getByRole("menuitem", { name: "Duplicate" });
  const rename = page.getByRole("menuitem", { name: "Rename" });

  await trigger.focus();
  await trigger.press("ArrowDown");

  await expect(menu).toBeVisible();
  await expect(duplicate).toBeFocused();
  await expect(menu).not.toHaveAttribute("aria-activedescendant", /.+/u);

  await page.keyboard.press("ArrowDown");
  await expect(rename).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(menu).toBeHidden();
  await expect(page.getByText("selected: rename")).toBeVisible();
  await expect(trigger).toBeFocused();
});

test("ArrowUp opens at the last enabled item and Escape restores focus", async ({ page }) => {
  const trigger = page.getByRole("button", { name: "Actions" });
  const menu = page.getByRole("menu");
  const share = page.getByRole("menuitem", { name: "Share" });

  await trigger.focus();
  await trigger.press("ArrowUp");
  await expect(share).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("typeahead cycles matches and disabled activation is ignored", async ({ page }) => {
  const trigger = page.getByRole("button", { name: "Actions" });
  const menu = page.getByRole("menu");
  const archive = page.getByRole("menuitem", { name: "Archive" });
  const rename = page.getByRole("menuitem", { name: "Rename" });

  await trigger.click();
  const duplicate = page.getByRole("menuitem", { name: "Duplicate" });
  await expect(duplicate).toBeFocused();
  await page.keyboard.press("r");
  await expect(rename).toBeFocused();

  await duplicate.focus();
  await archive.click({ force: true });
  await expect(duplicate).toBeFocused();
  await expect(menu).toBeVisible();
  await expect(page.getByText("selected: none")).toBeVisible();
});

test("Tab and Shift+Tab close the menu without trapping focus", async ({ page }) => {
  const trigger = page.getByRole("button", { name: "Actions" });
  const menu = page.getByRole("menu");

  await trigger.focus();
  await trigger.press("Enter");
  await expect(page.getByRole("menuitem", { name: "Duplicate" })).toBeFocused();
  await page.keyboard.press("Tab");

  await expect(menu).toBeHidden();
  await expect(page.getByRole("button", { name: "After menu" })).toBeFocused();

  await trigger.press("Enter");
  await expect(page.getByRole("menuitem", { name: "Duplicate" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
});
