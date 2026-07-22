import { expect, test, type Locator } from "@playwright/test";

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

test("package triggers and links retain visible focus in forced colors", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });

  const expectSystemOutline = async (locator: Locator) => {
    await locator.focus();
    await expect(locator).toBeFocused();
    expect(
      await locator.evaluate((element) => {
        const style = getComputedStyle(element);
        return { style: style.outlineStyle, width: style.outlineWidth };
      }),
    ).toEqual({ style: "solid", width: "2px" });
  };

  await expectSystemOutline(page.getByTestId("button-default"));
  await expectSystemOutline(
    page.getByRole("navigation", { name: "Package path" }).getByRole("link", { name: "Home" }),
  );
  await expectSystemOutline(page.getByRole("button", { name: "Pin release" }));
  await expectSystemOutline(page.getByRole("button", { name: "Open package popover" }));
  await expectSystemOutline(page.getByRole("button", { name: "More information" }));
  await expectSystemOutline(page.locator("summary", { hasText: "What does native mean?" }));

  const dialogTrigger = page.getByRole("button", { name: "Open package dialog" });
  await expectSystemOutline(dialogTrigger);
  await dialogTrigger.click();
  const close = page.getByRole("dialog").getByRole("button", { name: "Close" });
  await expectSystemOutline(close);
  await close.click();

  const alertTrigger = page.getByRole("button", { name: "Delete package", exact: true });
  await expectSystemOutline(alertTrigger);
  await alertTrigger.click();
  const alertDialog = page.getByRole("alertdialog");
  await expectSystemOutline(alertDialog.getByRole("button", { name: "Delete package" }));
  await expectSystemOutline(alertDialog.getByRole("button", { name: "Cancel" }));
  await alertDialog.getByRole("button", { name: "Cancel" }).click();
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

  // A failed URL must be retried after another source has rendered.
  await page.getByRole("button", { name: "Break avatar image" }).click();
  await expect(avatar.locator("img")).toHaveCount(0);
  await expect(avatar).toContainText("AL");

  const toggle = page.getByRole("button", { name: "Pin release" });
  await page.emulateMedia({ forcedColors: "active" });
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  const unpressedBorder = await toggle.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).borderTopWidth),
  );
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  const pressedBorder = await toggle.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).borderTopWidth),
  );
  expect(pressedBorder).toBeGreaterThan(unpressedBorder);
  await expect(page.getByTestId("toggle-state")).toHaveText("pressed: true");
  await toggle.press("Space");
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
});

test("expanded thin primitives preserve native semantics and form reset", async ({ page }) => {
  const breadcrumb = page.getByRole("navigation", { name: "Package path" });
  await expect(breadcrumb.getByRole("link", { name: "Home" })).toHaveAttribute(
    "href",
    "/catalog.html",
  );
  await expect(breadcrumb.getByText("Catalog", { exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );

  const group = page.getByRole("group", { name: "Editor actions" });
  await expect(group.getByRole("button", { name: "Save draft" })).toBeVisible();
  await expect(group.getByRole("button", { name: "Publish" })).toBeVisible();

  await expect(page.getByRole("status", { name: "Loading package catalog" })).toBeVisible();
  await expect(page.getByTestId("decorative-spinner")).toHaveAttribute("aria-hidden", "true");
  await expect(page.getByTestId("catalog-skeleton")).toHaveAttribute("aria-hidden", "true");
  await expect(page.getByText("No packages yet", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Create package" })).toBeVisible();

  const textarea = page.getByRole("textbox", { name: "Release notes" });
  await expect(textarea).toHaveValue("Native behavior first.");
  await textarea.fill("Edited release notes");
  await expect(page.getByTestId("release-notes-value")).toHaveText("Edited release notes");
  await page.getByRole("button", { name: "Reset release notes" }).click();
  await expect(textarea).toHaveValue("Native behavior first.");
  await expect(page.getByTestId("release-notes-value")).toHaveText("Native behavior first.");
});

test("Pagination keeps native links and controlled button selection distinct", async ({ page }) => {
  const pagination = page.getByRole("navigation", { name: "Catalog pages" });
  await expect(pagination.getByRole("button", { name: "Previous" })).toBeDisabled();
  await expect(pagination.getByRole("link", { name: "1" })).toHaveAttribute(
    "href",
    "/catalog.html?page=1#utility-heading",
  );
  await expect(pagination.getByRole("button", { name: "2" })).toHaveAttribute(
    "aria-current",
    "page",
  );

  await pagination.getByRole("button", { name: "3" }).click();
  await expect(pagination.getByRole("button", { name: "3" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(pagination.getByRole("button", { name: "2" })).not.toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(page.getByTestId("pagination-state")).toHaveText(
    "current: 3, selections: 1",
  );
});

test("ToggleGroup keeps native buttons while updating single and multiple models", async ({
  page,
}) => {
  const alignment = page.getByRole("group", { name: "Text alignment" });
  const center = alignment.getByRole("button", { name: "Center" });
  const left = alignment.getByRole("button", { name: "Left" });

  await expect(center).toHaveAttribute("aria-pressed", "true");
  await center.click();
  await expect(center).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByTestId("alignment-state")).toHaveText("alignment: none");
  await left.focus();
  await left.press("Space");
  await expect(left).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("alignment-state")).toHaveText("alignment: left");
  await expect(alignment.locator("button[tabindex]")).toHaveCount(0);

  const formats = page.getByRole("group", { name: "Text formats" });
  const bold = formats.getByRole("button", { name: "Bold" });
  const italic = formats.getByRole("button", { name: "Italic" });
  await expect(bold).toHaveAttribute("aria-pressed", "true");
  await italic.click();
  await expect(bold).toHaveAttribute("aria-pressed", "true");
  await expect(italic).toHaveAttribute("aria-pressed", "true");
  await expect(formats.getByRole("button", { name: "Underline" })).toBeDisabled();
  await expect(page.getByTestId("format-state")).toHaveText("formats: bold, italic");
});

test("PreviewCard preserves link navigation and interactive pointer/focus transit", async ({
  page,
}) => {
  const root = page.locator(".n-preview-card");
  const trigger = root.getByRole("link", { name: "Nagi UI package" });
  const preview = root.locator(":scope > .unit");
  const notes = preview.getByRole("link", { name: "Read compatibility notes" });

  await expect(trigger).toHaveAttribute("href", "#preview-card-target");
  await expect(preview).toBeHidden();
  await trigger.hover();
  await expect(preview).toBeVisible({ timeout: 1_200 });
  await preview.hover();
  await page.waitForTimeout(350);
  await expect(preview).toBeVisible();

  await notes.focus();
  await page.waitForTimeout(350);
  await expect(notes).toBeFocused();
  await expect(preview).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(preview).toBeHidden();

  await page.mouse.move(0, 0);
  await trigger.focus();
  await expect(preview).toBeVisible({ timeout: 1_200 });
  await page.keyboard.press("Tab");
  await expect(notes).toBeFocused();
  await page.waitForTimeout(350);
  await expect(preview).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(preview).toBeHidden();

  await trigger.click();
  await expect(page).toHaveURL(/#preview-card-target$/);
});

test("Stepper keeps native button focus while changing only the current step", async ({ page }) => {
  const stepper = page.getByRole("navigation", { name: "Package setup" });
  const details = stepper.getByRole("button", { name: /Details/ });
  const access = stepper.getByRole("button", { name: /Access/ });
  const publish = stepper.getByRole("button", { name: /Publish/ });

  await expect(details).toHaveAttribute("aria-current", "step");
  await access.focus();
  await access.press("Space");
  await expect(access).toBeFocused();
  await expect(access).toHaveAttribute("aria-current", "step");
  await expect(details).not.toHaveAttribute("aria-current", "step");
  await expect(page.getByTestId("stepper-state")).toHaveText("current step: access");
  await expect(publish).toBeDisabled();
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
  await expect(page.getByText("model open: false", { exact: true })).toBeVisible();
});

test("AlertDialog keeps critical actions explicit and returns focus through native dialog", async ({
  page,
}) => {
  const trigger = page.getByRole("button", { name: "Delete package", exact: true });
  await trigger.click();

  const dialog = page.getByRole("alertdialog", { name: "Delete this package?" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAccessibleDescription(
    "This action permanently removes the package and cannot be undone.",
  );
  await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
  await expect(page.locator("form form")).toHaveCount(0);
  await expect(page.getByText("alert model open: true")).toBeVisible();

  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByTestId("alert-dialog-cancels")).toHaveText("cancels: 1");
  await expect(trigger).toBeFocused();

  await trigger.click();
  await dialog.getByRole("button", { name: "Delete package" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByTestId("alert-dialog-actions")).toHaveText("actions: 1");
  await expect(trigger).toBeFocused();

  await trigger.click();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page.getByText("alert model open: false")).toBeVisible();
  await expect(page.getByTestId("alert-dialog-cancels")).toHaveText("cancels: 1");
});

test("Accordion delegates exclusive and multiple disclosure state to native details", async ({
  page,
}) => {
  const accordion = page.locator(".n-accordion").first();
  const details = accordion.locator("details");
  const names = await details.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute("name")),
  );
  expect(names.every((name) => name === names[0] && name !== null)).toBe(true);
  await expect(details.nth(0)).toHaveAttribute("open", "");
  await expect(details.nth(1)).not.toHaveAttribute("open", "");

  await accordion.getByText("Can I return an order?", { exact: true }).click();
  await expect(details.nth(0)).not.toHaveAttribute("open", "");
  await expect(details.nth(1)).toHaveAttribute("open", "");
  await expect(page.getByTestId("accordion-open-keys")).toContainText("open: returns");

  await page.getByRole("button", { name: "Open shipping programmatically" }).click();
  await expect(details.nth(0)).toHaveAttribute("open", "");
  await expect(details.nth(1)).not.toHaveAttribute("open", "");
  await expect(page.getByTestId("accordion-open-keys")).toContainText("open: shipping");

  const disabled = accordion.locator("summary", { hasText: "Legacy policy" });
  await expect(disabled).toHaveAttribute("aria-disabled", "true");
  await disabled.click({ force: true });
  await expect(details.nth(2)).not.toHaveAttribute("open", "");
  await disabled.focus();
  await disabled.press("Enter");
  await expect(details.nth(2)).not.toHaveAttribute("open", "");

  const multiple = page.locator(".n-accordion").nth(1);
  const multipleDetails = multiple.locator("details");
  await expect(multipleDetails).toHaveCount(2);
  await expect(multipleDetails.nth(0)).not.toHaveAttribute("name", /.+/);
  await expect(multipleDetails.nth(0)).toHaveAttribute("open", "");
  await expect(multipleDetails.nth(1)).toHaveAttribute("open", "");
  await multiple.getByText("How does shipping work?", { exact: true }).click();
  await expect(multipleDetails.nth(0)).not.toHaveAttribute("open", "");
  await expect(multipleDetails.nth(1)).toHaveAttribute("open", "");
  await expect(page.getByTestId("multiple-accordion-open-keys")).toContainText("open: returns");
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
