import { expect, test, type Locator, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/definition-stress.html");
});

function shadow(page: Page, name: "Alpha" | "Beta"): Locator {
  return page.locator(`#shadow-${name.toLowerCase()}`);
}

test("[CMB-SEM-02][CMB-SEM-04] keeps combobox relationships inside each ShadowRoot", async ({
  page,
}) => {
  const alpha = shadow(page, "Alpha");
  const beta = shadow(page, "Beta");
  const alphaInput = alpha.getByRole("combobox", { name: "Alpha framework", exact: true });
  const betaInput = beta.getByRole("combobox", { name: "Beta framework", exact: true });

  await alphaInput.fill("Vue");
  await alphaInput.press("ArrowDown");
  const alphaControls = await alphaInput.getAttribute("aria-controls");
  const alphaActive = await alphaInput.getAttribute("aria-activedescendant");
  expect(alphaControls).toBeTruthy();
  expect(alphaActive).toBeTruthy();
  const alphaListbox = alpha.locator('[role="listbox"]');
  await expect(alphaListbox).toHaveCount(1);
  await expect(alphaListbox).toHaveAttribute("id", alphaControls ?? "");
  await expect(alphaListbox.locator('[role="option"][aria-selected="true"]')).toHaveCount(1);
  expect(await alphaListbox.locator('[role="option"]').evaluateAll(
    (options, id) => options.some((option) => option.id === id),
    alphaActive,
  )).toBe(true);

  await betaInput.fill("Vue");
  await betaInput.press("ArrowDown");
  const betaActive = await betaInput.getAttribute("aria-activedescendant");
  expect(betaActive).toBeTruthy();
  expect(await beta.locator('[role="option"]').evaluateAll(
    (options, id) => options.some((option) => option.id === id),
    betaActive,
  )).toBe(true);
  expect(await alpha.locator('[role="option"]').evaluateAll(
    (options, id) => options.some((option) => option.id === id),
    alphaActive,
  )).toBe(true);
});

test("[DLG-FOCUS-02] restores a ShadowRoot dialog trigger after close", async ({ page }) => {
  const alpha = shadow(page, "Alpha");
  const trigger = alpha.getByRole("button", { name: "Open Alpha dialog", exact: true });
  await trigger.click();
  const dialog = alpha.getByRole("dialog", { name: "Alpha dialog", exact: true });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("[MNU-SEM-03][MNU-INT-03][MNU-FOCUS-02] enters and exits a nested ShadowRoot menu", async ({ page }) => {
  const alpha = shadow(page, "Alpha");
  const trigger = alpha.getByRole("button", { name: "Alpha menu", exact: true });
  await trigger.press("ArrowDown");
  const root = alpha.getByRole("menu").first();
  const rename = root.getByRole("menuitem", { name: "Alpha Rename", exact: true });
  const share = root.getByRole("menuitem", { name: "Alpha Share", exact: true });
  await expect(rename).toBeFocused();
  await page.keyboard.press("End");
  await expect(share).toBeFocused();
  await page.keyboard.press("ArrowRight");

  const submenu = alpha.getByRole("menu").nth(1);
  const copy = submenu.getByRole("menuitem", { name: "Alpha Copy link", exact: true });
  await expect(copy).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(submenu).toBeHidden();
  await expect(share).toBeFocused();

  await page.keyboard.press("ArrowRight");
  await expect(copy).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(submenu).toBeHidden();
  await expect(root).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("[DTP-FOCUS-01][DTP-FOCUS-02] restores a ShadowRoot DatePicker trigger after Escape and selection", async ({
  page,
}) => {
  const alpha = shadow(page, "Alpha");
  const trigger = alpha.getByRole("button", { name: "Choose Alpha date", exact: true });
  const dialog = alpha.getByRole("dialog", { name: "Alpha date calendar", exact: true });
  const selected = dialog.getByRole("button", { name: "Friday, July 24, 2026", exact: true });

  await trigger.click();
  await expect(dialog).toBeVisible();
  await expect(selected).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();

  await trigger.click();
  await dialog.getByRole("button", { name: "Saturday, July 25, 2026", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});
