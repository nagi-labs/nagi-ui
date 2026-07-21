import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/catalog.html");
});

test("styling-only package components expose semantic content and tone variants", async ({
  page,
}) => {
  const card = page.locator("div.n-card", { hasText: "Package-first surface" });
  await expect(card.getByText("Package-first surface", { exact: true })).toBeVisible();
  await expect(card.getByText("Rich content", { exact: true })).toBeVisible();
  await expect(card.locator(".n-card-description")).toContainText(
    "own only when the structure must change.",
  );
  await expect(card.getByText("Markup stays local.", { exact: true })).toBeVisible();
  await expect(card.getByText("The consumer owns and styles this declared slot sub-surface.")).toBeVisible();
  await expect(card.getByText("Package component with an owned footer surface.")).toBeVisible();
  await expect(card.getByRole("button", { name: "Manage package" })).toBeVisible();

  for (const label of ["Neutral", "Accent", "Review", "Blocked"]) {
    await expect(card.getByText(label, { exact: true })).toBeVisible();
  }
  await expect(card.locator(".n-badge-label", { hasText: "Ready" })).toBeVisible();

  await expect(card.locator('[role="status"]', { hasText: "Catalog ready" })).toBeVisible();
  await expect(card.locator(".n-alert-icon", { hasText: "✓" })).toBeVisible();
  await expect(card.locator(".n-alert-title", { hasText: "Verified" })).toBeVisible();
  await expect(card.getByRole("alert")).toContainText("Destructive action");

  const smallHeight = await page.getByTestId("button-small").evaluate((button) => button.clientHeight);
  const defaultHeight = await page.getByTestId("button-default").evaluate((button) => button.clientHeight);
  const largeHeight = await page.getByTestId("button-large").evaluate((button) => button.clientHeight);
  expect(smallHeight).toBeLessThan(defaultHeight);
  expect(defaultHeight).toBeLessThan(largeHeight);
});

test("focusable disabled Button stays focusable without activating", async ({ page }) => {
  const button = page.getByRole("button", { name: "Focusable disabled" });
  await expect(button).toHaveAttribute("aria-disabled", "true");
  await expect(button).not.toHaveAttribute("disabled", "");

  await button.focus();
  await expect(button).toBeFocused();
  await button.press("Enter");
  await expect(page.getByTestId("focusable-disabled-clicks")).toHaveText("activations: 0");
});

test("Avatar recovers after an image error and Toggle exposes native pressed state", async ({
  page,
}) => {
  const avatar = page.getByTestId("catalog-avatar");
  await expect(avatar).toHaveAccessibleName("Ada Lovelace");
  await expect(avatar.locator("img")).toHaveCount(1);

  await page.getByRole("button", { name: "Break avatar image" }).click();
  await expect(avatar.locator("img")).toHaveCount(0);
  await expect(avatar).toContainText("AL");

  await page.getByRole("button", { name: "Restore avatar image" }).click();
  await expect(avatar.locator("img")).toHaveCount(1);

  const toggle = page.getByRole("button", { name: "Pin release" });
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("toggle-state")).toHaveText("pressed: true");
  await toggle.press("Space");
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
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
  await expect(dialog.locator(".n-dialog-title")).toContainText("Package dialog");
  await expect(dialog.locator(".n-dialog-description strong")).toBeVisible();
  await expect(dialog).toHaveAccessibleDescription(
    "Confirm the package-level action before continuing.",
  );
  await expect(page.getByText("model open: true")).toBeVisible();

  await dialog.getByRole("button", { name: "Close" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText("model open: false")).toBeVisible();
});

test("disabled Tooltip and Disclosure suppress activation", async ({ page }) => {
  const tooltipTrigger = page.getByRole("button", { name: "Unavailable information" });
  await expect(tooltipTrigger).toBeDisabled();
  await expect(tooltipTrigger).not.toHaveAttribute("aria-describedby", /.+/);

  const summary = page.getByText("Unavailable disclosure", { exact: true });
  const disclosure = page.locator("details", { has: summary });
  await expect(summary).toHaveAttribute("aria-disabled", "true");
  await summary.click({ force: true });
  await expect(disclosure).not.toHaveAttribute("open", "");
});

test("rich Disclosure summary keeps native details behavior", async ({ page }) => {
  const summary = page.locator(".n-disclosure-summary", { hasText: "What does native mean?" });
  const disclosure = page.locator("details", { has: summary });

  await expect(disclosure).not.toHaveAttribute("open", "");
  await summary.click();
  await expect(disclosure).toHaveAttribute("open", "");
  await summary.click();
  await expect(disclosure).not.toHaveAttribute("open", "");
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
  await disclosure.locator("summary").click();
  await expect(disclosure).toHaveAttribute("open", "");
  await expect(page.getByText("The details element owns disclosure state")).toBeVisible();
});

test("package Toast exposes notification and dismiss operations", async ({ page }) => {
  await page.getByRole("button", { name: "Show toast" }).click();
  await expect(page.getByText("Catalog notification 1", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Dismiss notification" }).click();
  await expect(page.getByText("Catalog notification 1", { exact: true })).toBeHidden();
});

test("Toast exposes structured actions and F6 focus without stealing trigger focus", async ({
  page,
}) => {
  const trigger = page.getByRole("button", { name: "Show undo toast" });
  await trigger.click();
  await expect(trigger).toBeFocused();

  const region = page.getByRole("region", { name: "Notifications" });
  await expect(region.getByText("Item archived", { exact: true })).toBeVisible();
  await expect(region.getByText("The item can be restored.", { exact: true })).toBeVisible();

  await page.keyboard.press("Shift+F6");
  await expect(trigger).toBeFocused();
  await page.keyboard.press("F6");
  await expect(region).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(region.getByRole("button", { name: "Undo" })).toBeFocused();
  await region.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByTestId("undone-actions")).toHaveText("undo actions: 1");
  await expect(region.getByText("Item archived", { exact: true })).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("Toast repairs focus when an update removes the focused action", async ({ page }) => {
  const trigger = page.getByRole("button", { name: "Show undo toast" });
  const region = page.getByRole("region", { name: "Notifications" });
  await trigger.click();
  await page.keyboard.press("F6");
  await page.keyboard.press("Tab");
  await expect(region.getByRole("button", { name: "Undo" })).toBeFocused();

  await page.getByRole("button", { name: "Remove undo action" }).evaluate(
    (button: HTMLButtonElement) => button.click(),
  );
  const dismiss = region.getByRole("button", { name: "Dismiss notification" });
  await expect(dismiss).toBeFocused();
  await dismiss.click();
  await expect(trigger).toBeFocused();
});

test("Toast upserts by explicit id, limits live items, and closes all", async ({ page }) => {
  const region = page.getByRole("region", { name: "Notifications" });
  const upsert = page.getByRole("button", { name: "Upsert sync toast" });
  await upsert.click();
  await page.keyboard.press("F6");
  await page.keyboard.press("Tab");
  const dismiss = region.getByRole("button", { name: "Dismiss notification" });
  await expect(dismiss).toBeFocused();
  await upsert.evaluate((button: HTMLButtonElement) => button.click());
  await expect(dismiss).toBeFocused();
  await expect(region.getByRole("listitem")).toHaveCount(1);
  await expect(region.getByText("Revision 2", { exact: true })).toBeVisible();
  await expect(region.getByText("Revision 1", { exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "Fill toast limit" }).click();
  await expect(region.getByRole("listitem")).toHaveCount(3);
  await expect(region.getByText("Limited notification 1", { exact: true })).toHaveCount(0);
  for (const number of [2, 3, 4]) {
    await expect(region.getByText(`Limited notification ${number}`, { exact: true })).toBeVisible();
  }

  await page.getByRole("button", { name: "Close all notifications" }).evaluate(
    (button: HTMLButtonElement) => button.click(),
  );
  await expect(region.getByRole("listitem")).toHaveCount(0);
  await expect(region).toBeHidden();
});

test("Toast promise and priority update the visual and live contracts", async ({ page }) => {
  await page.getByRole("button", { name: "Run successful promise" }).click();
  const region = page.getByRole("region", { name: "Notifications" });
  await expect(region.getByText("Save complete", { exact: true })).toBeVisible();
  await expect(region.getByText("2 records saved", { exact: true })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Save complete" })).toHaveCount(1);

  await page.getByRole("button", { name: "Show urgent toast" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Connection lost" })).toHaveCount(1);
  await expect(region.getByText("Changes are not being saved.", { exact: true })).toBeVisible();
});

test("Toast auto-dismiss pauses while the F6 region owns focus", async ({ page }) => {
  const trigger = page.getByRole("button", { name: "Show timed toast" });
  const region = page.getByRole("region", { name: "Notifications" });
  await trigger.click();
  await page.keyboard.press("F6");
  await expect(region).toBeFocused();
  await page.waitForTimeout(300);
  await expect(region.getByText("This notification pauses while focused.")).toBeVisible();

  await page.keyboard.press("F6");
  await expect(trigger).toBeFocused();
  await expect(region.getByText("This notification pauses while focused.")).toBeHidden({
    timeout: 500,
  });
});

test("F6 cycles multiple explicit Toast regions and returns to the external trigger", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Show toast" }).click();
  const trigger = page.getByRole("button", { name: "Show secondary toast" });
  await trigger.click();
  const primary = page.getByRole("region", { name: "Notifications", exact: true });
  const secondary = page.getByRole("region", { name: "Secondary notifications" });

  await page.keyboard.press("F6");
  await expect(primary).toBeFocused();
  await page.keyboard.press("F6");
  await expect(secondary).toBeFocused();
  await page.keyboard.press("F6");
  await expect(trigger).toBeFocused();
});
