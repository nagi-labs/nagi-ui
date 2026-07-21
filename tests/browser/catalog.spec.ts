import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/catalog.html");
});

test("styling-only package components expose semantic content and tone variants", async ({
  page,
}) => {
  const card = page.locator("article.card", { hasText: "Package-first surface" });
  await expect(card.getByRole("heading", { name: "Package-first surface" })).toBeVisible();
  await expect(card.getByText("The consumer owns and styles this declared slot sub-surface.")).toBeVisible();

  for (const label of ["Neutral", "Accent", "Ready", "Review", "Blocked"]) {
    await expect(card.getByText(label, { exact: true })).toBeVisible();
  }

  await expect(card.locator('[role="status"]', { hasText: "Catalog ready" })).toBeVisible();
  await expect(card.getByRole("alert")).toContainText("Destructive action");
});

test("package Popover opens and light dismisses through native wiring", async ({ page }) => {
  const trigger = page.getByRole("button", { name: "Open package popover" });
  const body = page.getByText("Popover body belongs to the application slot.");

  await trigger.click();
  await expect(body).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(body).toBeHidden();
});

test("package Dialog mirrors open state and closes through its owned button", async ({ page }) => {
  await page.getByRole("button", { name: "Open package dialog" }).click();
  const dialog = page.getByRole("dialog", { name: "Package dialog" });
  await expect(dialog).toBeVisible();
  await expect(page.getByText("model open: true")).toBeVisible();

  await dialog.getByRole("button", { name: "Close" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText("model open: false")).toBeVisible();
});

test("package Tooltip follows focus and keeps the ARIA relationship", async ({ page }) => {
  const trigger = page.getByRole("button", { name: "More information" });
  await trigger.focus();
  const tooltip = page.getByRole("tooltip");
  await expect(tooltip).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-describedby", await tooltip.getAttribute("id"));

  await trigger.blur();
  await expect(tooltip).toBeHidden();
});

test("package Disclosure uses native details state", async ({ page }) => {
  const disclosure = page.locator("details", { hasText: "What does native mean?" });
  await page.getByText("What does native mean?", { exact: true }).click();
  await expect(disclosure).toHaveAttribute("open", "");
  await expect(page.getByText("The details element owns disclosure state")).toBeVisible();
});

test("package Toast exposes notification and dismiss operations", async ({ page }) => {
  await page.getByRole("button", { name: "Show toast" }).click();
  await expect(page.getByText("Catalog notification 1")).toBeVisible();
  await page.getByRole("button", { name: "Dismiss notification" }).click();
  await expect(page.getByText("Catalog notification 1")).toBeHidden();
});
