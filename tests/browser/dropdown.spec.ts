import { expect, test, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/dropdown.html");
});

function dropdown(page: Page, heading: "LTR" | "RTL") {
  const section = page
    .locator(".section")
    .filter({ has: page.getByRole("heading", { name: heading }) });
  return {
    section,
    trigger: section.getByRole("button", {
      name: heading === "LTR" ? "File actions" : "RTL actions",
    }),
    root: section.getByRole("menu").first(),
    submenu: section.getByRole("menu").nth(1),
  };
}

test("checkbox and radio state changes remain visible in the open menu", async ({ page }) => {
  const ltr = dropdown(page, "LTR");

  await ltr.trigger.click();
  const checkbox = ltr.section.getByRole("menuitemcheckbox", { name: "Show toolbar" });
  await expect(checkbox).toHaveAttribute("aria-checked", "true");
  await checkbox.click();
  await expect(checkbox).toHaveAttribute("aria-checked", "false");
  await expect(page.getByTestId("toolbar-state")).toHaveText("false");
  await expect(ltr.root).toBeVisible();

  const modified = ltr.section.getByRole("menuitemradio", { name: "Sort by modified date" });
  await modified.click();
  await expect(modified).toHaveAttribute("aria-checked", "true");
  await expect(page.getByTestId("sort-state")).toHaveText("modified");
  await expect(ltr.root).toBeVisible();
});

test("keyboard enters a submenu, returns one level, and nested action closes the tree", async ({
  page,
}) => {
  const ltr = dropdown(page, "LTR");
  const share = ltr.section.getByRole("menuitem", { name: "Share" });

  await ltr.trigger.focus();
  await ltr.trigger.press("ArrowDown");
  await ltr.root.press("End");
  await ltr.root.press("ArrowUp");
  await expect(share).toHaveAttribute("data-active", "");

  await ltr.root.press("ArrowRight");
  await expect(ltr.submenu).toBeVisible();
  await expect(ltr.submenu).toBeFocused();
  await expect(share).toHaveAttribute("aria-expanded", "true");

  await ltr.submenu.press("ArrowLeft");
  await expect(ltr.submenu).toBeHidden();
  await expect(ltr.root).toBeFocused();
  await expect(share).toHaveAttribute("data-active", "");

  await ltr.root.press("Enter");
  await expect(ltr.submenu).toBeFocused();
  await ltr.submenu.press("Enter");
  await expect(ltr.submenu).toBeHidden();
  await expect(ltr.root).toBeHidden();
  await expect(page.getByTestId("action-state")).toHaveText("copy-link");
  await expect(ltr.trigger).toBeFocused();
});

test("RTL reverses the submenu arrow and anchors it on inline-end", async ({ page }) => {
  const rtl = dropdown(page, "RTL");
  const share = rtl.section.getByRole("menuitem", { name: "Share" });

  await rtl.trigger.focus();
  await rtl.trigger.press("ArrowDown");
  await rtl.root.press("End");
  await rtl.root.press("ArrowUp");
  await expect(share).toHaveAttribute("data-active", "");
  await rtl.root.press("ArrowLeft");

  await expect(rtl.submenu).toBeVisible();
  await expect(rtl.submenu).toBeFocused();
  const rootBox = await rtl.root.boundingBox();
  const childBox = await rtl.submenu.boundingBox();
  expect(rootBox).not.toBeNull();
  expect(childBox).not.toBeNull();
  expect(childBox?.x ?? 0).toBeLessThan(rootBox?.x ?? 0);
  expect((childBox?.x ?? 0) + (childBox?.width ?? 0)).toBeLessThanOrEqual((rootBox?.x ?? 0) + 8);

  await rtl.submenu.press("ArrowRight");
  await expect(rtl.submenu).toBeHidden();
  await expect(rtl.root).toBeFocused();
});

test("pointer grace keeps the submenu open while crossing from its trigger", async ({ page }) => {
  const ltr = dropdown(page, "LTR");
  const share = ltr.section.getByRole("menuitem", { name: "Share" });

  await ltr.trigger.click();
  await share.hover();
  await expect(ltr.submenu).toBeVisible();
  await ltr.submenu.getByRole("menuitem", { name: "Copy link" }).hover();
  await page.waitForTimeout(350);
  await expect(ltr.submenu).toBeVisible();
});

test("items recompute while open keeps the tree, and submenus register dynamically", async ({
  page,
}) => {
  const ltr = dropdown(page, "LTR");

  await ltr.trigger.click();
  const advancedToggle = ltr.section.getByRole("menuitemcheckbox", { name: "Show advanced" });
  await advancedToggle.click();
  await expect(advancedToggle).toHaveAttribute("aria-checked", "true");
  await expect(ltr.root).toBeVisible();

  const advanced = ltr.section.getByRole("menuitem", { name: "Advanced" });
  await expect(advanced).toBeVisible();
  await advanced.hover();
  const advancedMenu = ltr.section.getByRole("menu").nth(1);
  await expect(advancedMenu).toBeVisible();

  const verbose = advancedMenu.getByRole("menuitemcheckbox", { name: "Verbose logging" });
  await verbose.click();
  await expect(verbose).toHaveAttribute("aria-checked", "true");
  await expect(advancedMenu).toBeVisible();
  await expect(ltr.root).toBeVisible();
  await expect(page.getByTestId("verbose-state")).toHaveText("true");

  await advancedMenu.getByRole("menuitem", { name: "Reset settings" }).click();
  await expect(ltr.root).toBeHidden();
  await expect(page.getByTestId("action-state")).toHaveText("reset");

  await ltr.trigger.click();
  await ltr.section.getByRole("menuitemcheckbox", { name: "Show advanced" }).click();
  await expect(ltr.section.getByRole("menuitem", { name: "Advanced" })).toBeHidden();
  await ltr.root.press("End");
  await ltr.root.press("ArrowUp");
  await expect(ltr.section.getByRole("menuitem", { name: "Share" })).toHaveAttribute(
    "data-active",
    "",
  );
});

test("light dismiss closes both levels of the native popover tree", async ({ page }) => {
  const ltr = dropdown(page, "LTR");

  await ltr.trigger.click();
  await ltr.section.getByRole("menuitem", { name: "Share" }).click();
  await expect(ltr.submenu).toBeVisible();
  await page.getByRole("heading", { name: "Nagi UI — complete Dropdown" }).click();
  await expect(ltr.submenu).toBeHidden();
  await expect(ltr.root).toBeHidden();
});
