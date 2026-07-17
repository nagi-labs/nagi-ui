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
  await expect(menu).toBeFocused();
  await expect(menu).toHaveAttribute(
    "aria-activedescendant",
    (await duplicate.getAttribute("id")) ?? "",
  );

  await menu.press("ArrowDown");
  await expect(rename).toHaveAttribute("data-active", "");
  await menu.press("Enter");

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
  await expect(menu).toBeFocused();
  await expect(share).toHaveAttribute("data-active", "");

  await menu.press("Escape");
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("typeahead cycles matches and disabled activation is ignored", async ({ page }) => {
  const trigger = page.getByRole("button", { name: "Actions" });
  const menu = page.getByRole("menu");
  const archive = page.getByRole("menuitem", { name: "Archive" });
  const rename = page.getByRole("menuitem", { name: "Rename" });

  await trigger.click();
  await expect(menu).toBeFocused();
  await menu.press("r");
  await expect(rename).toHaveAttribute("data-active", "");

  await archive.dispatchEvent("click");
  await expect(menu).toBeVisible();
  await expect(page.getByText("selected: none")).toBeVisible();
});

test("Tab closes the menu without trapping focus", async ({ page }) => {
  const trigger = page.getByRole("button", { name: "Actions" });
  const menu = page.getByRole("menu");

  await trigger.focus();
  await trigger.press("Enter");
  await expect(menu).toBeFocused();
  await menu.press("Tab");

  await expect(menu).toBeHidden();
  await expect(page.getByRole("button", { name: "After menu" })).toBeFocused();
});
