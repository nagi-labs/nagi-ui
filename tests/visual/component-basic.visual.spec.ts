import { expect, test, type Page } from "@playwright/test";

import { componentDocuments } from "../../site/data/components.ts";

const hydrationErrors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }, testInfo) => {
  const errors: string[] = [];
  hydrationErrors.set(page, errors);
  page.on("console", (message) => {
    if (/hydration/i.test(message.text())) {
      errors.push(message.text());
    }
  });

  const theme = testInfo.project.name === "mobile-dark" ? "dark" : "light";
  await page.addInitScript((value) => localStorage.setItem("nagi-theme", value), theme);
});

test.afterEach(async ({ page }) => {
  expect(hydrationErrors.get(page) ?? [], "hydration console errors").toEqual([]);
});

for (const component of componentDocuments) {
  test(`${component.name} Basic`, async ({ page }) => {
    await page.goto(`/components/${component.slug}/`);
    await page.locator("#component-basic-heading").scrollIntoViewIfNeeded();
    const basic = page.locator('section[aria-labelledby="component-basic-heading"]');
    await expect(basic).toHaveScreenshot(`${component.slug}-basic.png`);
  });
}

test("Button keyboard focus", async ({ page }) => {
  await page.goto("/components/button/");
  const preview = page.locator(".site-component-preview");
  await preview.getByRole("button", { name: "Medium" }).focus();
  await expect(preview).toHaveScreenshot("button-keyboard-focus.png");
});

test("Combobox open collection", async ({ page }) => {
  await page.goto("/components/combobox/");
  const preview = page.locator(".site-component-preview");
  const input = preview.getByRole("combobox", { name: "Customer" });
  await input.focus();
  await input.press("ArrowDown");
  await expect(preview).toHaveScreenshot("combobox-open.png");
});

test("DateField invalid state", async ({ page }) => {
  await page.goto("/components/date-field/");
  const preview = page.locator(".site-component-preview");
  await expect(preview).toHaveScreenshot("date-field-invalid.png");
});

test("DatePicker open calendar", async ({ page }) => {
  await page.goto("/components/date-picker/");
  const frame = page
    .locator('section[aria-labelledby="component-basic-heading"]')
    .locator(".site-example-frame");
  await frame.getByRole("button", { name: "Choose date" }).click();
  await page.waitForTimeout(300);
  await expect(frame).toHaveScreenshot("date-picker-open.png");
});

test("Dialog open surface", async ({ page }) => {
  await page.goto("/components/dialog/");
  const preview = page.locator(".site-component-preview");
  await preview.getByRole("button", { name: "Invite teammate" }).click();
  const dialog = page.getByRole("dialog", { name: "Invite teammate" });
  await expect(dialog).toBeVisible();
  await page.waitForTimeout(500);
  await expect(dialog).toBeVisible();
  await expect(page).toHaveScreenshot("dialog-open.png");
  await expect(dialog).toBeVisible();
});
