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

test("native link items follow href with pointer and trusted keyboard activation", async ({
  page,
}) => {
  const ltr = dropdown(page, "LTR");

  await ltr.trigger.click();
  await ltr.section.getByRole("menuitem", { name: "Share" }).click();
  const link = ltr.submenu.getByRole("menuitem", { name: "Documentation" });
  await expect(link).toHaveAttribute("href", "#documentation");
  await link.click();
  await expect(page).toHaveURL(/#documentation$/);
  await expect(ltr.root).toBeHidden();

  await page.goto("/dropdown.html");
  const keyboard = dropdown(page, "LTR");
  await keyboard.trigger.press("ArrowDown");
  await expect(keyboard.root.getByRole("menuitem", { name: "Duplicate" })).toBeFocused();
  await page.keyboard.press("End");
  await page.keyboard.press("ArrowUp");
  await expect(keyboard.root.getByRole("menuitem", { name: "Share" })).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(keyboard.submenu.getByRole("menuitem", { name: "Copy link" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(keyboard.submenu.getByRole("menuitem", { name: "Documentation" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#documentation$/);
});

test("setup-style link adapters keep href while handling navigation and intent prefetch", async ({
  page,
}) => {
  const ltr = dropdown(page, "LTR");

  await ltr.trigger.click();
  await ltr.section.getByRole("menuitem", { name: "Share" }).click();
  const link = ltr.submenu.getByRole("menuitem", { name: "Router adapter" });
  await expect(link).toHaveAttribute("href", "#router-adapter");
  await link.hover();
  await expect(page.getByTestId("link-prefetch-state")).toHaveText("1");
  await link.click();
  await expect(page).toHaveURL(/#router-adapter$/);
  await expect(page.getByTestId("router-navigation-state")).toHaveText("1");
  await expect(ltr.root).toBeHidden();

  await page.goto("/dropdown.html");
  const keyboard = dropdown(page, "LTR");
  await keyboard.trigger.press("ArrowDown");
  await expect(keyboard.root.getByRole("menuitem", { name: "Duplicate" })).toBeFocused();
  await page.keyboard.press("End");
  await page.keyboard.press("ArrowUp");
  await expect(keyboard.root.getByRole("menuitem", { name: "Share" })).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(keyboard.submenu.getByRole("menuitem", { name: "Copy link" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(keyboard.submenu.getByRole("menuitem", { name: "Documentation" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(keyboard.submenu.getByRole("menuitem", { name: "Router adapter" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#router-adapter$/);
  await expect(page.getByTestId("router-navigation-state")).toHaveText("1");
});

test("keyboard enters a submenu, returns one level, and nested action closes the tree", async ({
  page,
}) => {
  const ltr = dropdown(page, "LTR");
  const share = ltr.section.getByRole("menuitem", { name: "Share" });

  await ltr.trigger.focus();
  await ltr.trigger.press("ArrowDown");
  await expect(ltr.root.getByRole("menuitem", { name: "Duplicate" })).toBeFocused();
  await page.keyboard.press("End");
  await page.keyboard.press("ArrowUp");
  await expect(share).toBeFocused();

  await page.keyboard.press("ArrowRight");
  await expect(ltr.submenu).toBeVisible();
  await expect(ltr.submenu.getByRole("menuitem", { name: "Copy link" })).toBeFocused();
  await expect(share).toHaveAttribute("aria-expanded", "true");

  await page.keyboard.press("ArrowLeft");
  await expect(ltr.submenu).toBeHidden();
  await expect(share).toBeFocused();

  await page.keyboard.press("Enter");
  await expect(ltr.submenu.getByRole("menuitem", { name: "Copy link" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(ltr.submenu).toBeHidden();
  await expect(ltr.root).toBeHidden();
  await expect(page.getByTestId("action-state")).toHaveText("copy-link");
  await expect(ltr.trigger).toBeFocused();
});

test("a rejected controlled submenu close keeps the visible child as focus owner", async ({
  page,
}) => {
  const section = page
    .locator(".section")
    .filter({ has: page.getByRole("heading", { name: "Controlled submenu close", exact: true }) });
  const trigger = section.getByRole("button", { name: "Locked submenu actions" });
  const root = section.getByRole("menu").first();
  const submenu = section.getByRole("menu").nth(1);

  await trigger.press("ArrowDown");
  await expect(root.getByRole("menuitem", { name: "Duplicate" })).toBeFocused();
  await page.keyboard.press("End");
  await page.keyboard.press("ArrowUp");
  const share = root.getByRole("menuitem", { name: "Share" });
  await expect(share).toBeFocused();
  await page.keyboard.press("ArrowRight");
  const copy = submenu.getByRole("menuitem", { name: "Copy link" });
  await expect(copy).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(submenu).toBeVisible();
  await expect(copy).toBeFocused();
  await expect(share).toHaveAttribute("aria-expanded", "true");
});

test("RTL reverses the submenu arrow and anchors it on inline-end", async ({ page }) => {
  const rtl = dropdown(page, "RTL");
  const share = rtl.section.getByRole("menuitem", { name: "Share" });

  await rtl.trigger.focus();
  await rtl.trigger.press("ArrowDown");
  await expect(rtl.root.getByRole("menuitem", { name: "Duplicate" })).toBeFocused();
  await page.keyboard.press("End");
  await page.keyboard.press("ArrowUp");
  await expect(share).toBeFocused();
  await page.keyboard.press("ArrowLeft");

  await expect(rtl.submenu).toBeVisible();
  await expect(rtl.submenu.getByRole("menuitem", { name: "Copy link" })).toBeFocused();
  const rootBox = await rtl.root.boundingBox();
  const childBox = await rtl.submenu.boundingBox();
  expect(rootBox).not.toBeNull();
  expect(childBox).not.toBeNull();
  expect(childBox?.x ?? 0).toBeLessThan(rootBox?.x ?? 0);
  expect((childBox?.x ?? 0) + (childBox?.width ?? 0)).toBeLessThanOrEqual((rootBox?.x ?? 0) + 8);

  await page.keyboard.press("ArrowRight");
  await expect(rtl.submenu).toBeHidden();
  await expect(share).toBeFocused();
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
  await page.keyboard.press("End");
  await page.keyboard.press("ArrowUp");
  await expect(ltr.section.getByRole("menuitem", { name: "Share" })).toBeFocused();
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
