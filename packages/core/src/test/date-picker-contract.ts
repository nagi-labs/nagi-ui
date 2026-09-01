import { expect, test, type Locator, type Page } from "@playwright/test";

import type { ComponentDefinition } from "../definition.ts";
import { inspectAnatomy } from "../definition.ts";
import { contractTitle } from "./definition-contract.ts";

export interface DatePickerContractOptions {
  definition: ComponentDefinition;
  url: string;
  triggerName: string;
  fieldName: string;
  calendarName: string;
  selectedDateName: string;
  nextDateName: string;
  initialValue: string;
  committedValue: string;
  openStatusName: string;
}

function trigger(page: Page, options: DatePickerContractOptions): Locator {
  return page.getByRole("button", { name: options.triggerName, exact: true });
}

async function rootFor(page: Page, options: DatePickerContractOptions): Promise<Locator> {
  return page.locator('[data-scope="date-picker"][data-part="root"]').filter({
    has: trigger(page, options),
  }).first();
}

async function openPicker(page: Page, options: DatePickerContractOptions) {
  const opener = trigger(page, options);
  await opener.click();
  const root = await rootFor(page, options);
  const dialog = root.getByRole("dialog", { name: options.calendarName, exact: true });
  await expect(dialog).toBeVisible();
  return { dialog, opener, root };
}

/** The composed field and popup expose the native/ARIA relationships they claim. */
export async function assertDatePickerSemantics(page: Page, options: DatePickerContractOptions) {
  const root = await rootFor(page, options);
  const field = root.getByRole("group", { name: options.fieldName, exact: true });
  await expect(field).toHaveCount(1);
  await expect(field.getByRole("spinbutton")).toHaveCount(3);

  const formControl = root.locator('input[type="date"][data-part="form-control"]');
  await expect(formControl).toHaveCount(1);
  await expect(formControl).toHaveValue(options.initialValue);

  const opener = trigger(page, options);
  await expect(opener).toHaveAttribute("aria-haspopup", "dialog");
  const popupId = await opener.getAttribute("popovertarget");
  expect(popupId, "DatePicker trigger must control one popup with popovertarget.").toBeTruthy();
  const popup = root.locator(`[data-part="popup"][id="${popupId}"]`);
  await expect(popup).toHaveCount(1);
  await expect(popup).toHaveAttribute("popover");

  const { dialog } = await openPicker(page, options);
  await expect(dialog).not.toHaveAttribute("aria-modal");
  const grid = dialog.getByRole("grid", { name: options.calendarName, exact: true });
  await expect(grid).toHaveCount(1);
  expect(await grid.getByRole("gridcell").evaluateAll((cells) =>
    cells.every((cell) => /^(?:true|false)$/u.test(cell.getAttribute("aria-selected") ?? "")),
  )).toBe(true);
  expect(await grid.getByRole("button").evaluateAll((buttons) =>
    buttons.every((button) =>
      button.tagName === "BUTTON" && Boolean(button.getAttribute("aria-label")?.trim())),
  )).toBe(true);
  const enabledTabIndexes = await grid.locator("button:not(:disabled)").evaluateAll((buttons) =>
    buttons.map((button) => button.getAttribute("tabindex")),
  );
  expect(enabledTabIndexes.filter((value) => value === "0")).toHaveLength(1);
  expect(enabledTabIndexes.every((value) => value === "0" || value === "-1")).toBe(true);
  await expect.poll(async () => root.evaluate(inspectAnatomy, options.definition.anatomy)).toEqual([]);
}

/** Selection and navigation use the grid's declared roving focus and model. */
export async function assertDatePickerInteraction(page: Page, options: DatePickerContractOptions) {
  const { dialog } = await openPicker(page, options);
  await expect(page.getByRole("status", { name: options.openStatusName })).toHaveText("true");
  const grid = dialog.getByRole("grid", { name: options.calendarName, exact: true });
  const selected = grid.getByRole("button", { name: options.selectedDateName, exact: true });
  await expect(selected).toBeFocused();
  await selected.press("ArrowRight");
  await expect(grid.getByRole("button", { name: options.nextDateName, exact: true })).toBeFocused();

  const available = grid.getByRole("button", { name: options.nextDateName, exact: true });
  await available.click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("status", { name: options.openStatusName })).toHaveText("false");
  await expect(trigger(page, options)).toBeFocused();
  await expect(
    (await rootFor(page, options)).locator('input[type="date"][data-part="form-control"]'),
  ).toHaveValue(options.committedValue);
}

/** Escape cancels calendar navigation and restores only the local invoker. */
export async function assertDatePickerFocusRestoration(page: Page, options: DatePickerContractOptions) {
  const { dialog, opener } = await openPicker(page, options);
  await expect(dialog.getByRole("button", { name: options.selectedDateName, exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("status", { name: options.openStatusName })).toHaveText("false");
  await expect(opener).toBeFocused();
}

/** Functional focus and selected-state indicators remain visible in forced colors. */
export async function assertDatePickerStyle(page: Page, options: DatePickerContractOptions) {
  const { dialog } = await openPicker(page, options);
  const selected = dialog.getByRole("button", { name: options.selectedDateName, exact: true });
  await expect(selected).toBeFocused();
  await page.emulateMedia({ forcedColors: "active" });
  expect(await selected.evaluate((element) => {
    const style = getComputedStyle(element);
    return style.outlineStyle !== "none" || style.boxShadow !== "none";
  })).toBe(true);
}

export function datePickerContract(options: DatePickerContractOptions): void {
  test.describe(`DatePicker contract: ${options.calendarName}`, () => {
    test.beforeEach(async ({ page }) => page.goto(options.url));

    test(contractTitle(options.definition, [
      "DTP-SEM-01", "DTP-SEM-02", "DTP-CAL-SEM-01", "DTP-CAL-SEM-02",
      "DTP-POP-SEM-01", "DTP-ANAT-01", "DTP-ANAT-02", "DTP-ANAT-03",
      "DTP-ANAT-04", "DTP-ANAT-05", "DTP-ANAT-06", "DTP-ANAT-07", "DTP-ANAT-08",
    ], "exposes its composed native field, popup, and grid"), async ({ page }) => {
      await assertDatePickerSemantics(page, options);
    });

    test(contractTitle(options.definition, [
      "DTP-CAL-INT-01", "DTP-CAL-FOCUS-01", "DTP-INT-02", "DTP-INT-03", "DTP-STATE-01", "DTP-POP-STATE-01",
    ], "navigates and commits through the calendar"), async ({ page }) => {
      await assertDatePickerInteraction(page, options);
    });

    test(contractTitle(options.definition, ["DTP-POP-INT-01", "DTP-FOCUS-01", "DTP-FOCUS-02"], "restores the local trigger on Escape"), async ({ page }) => {
      await assertDatePickerFocusRestoration(page, options);
    });

    test(contractTitle(options.definition, ["DTP-STYLE-01"], "keeps functional focus visible in forced colors"), async ({ page }) => {
      await assertDatePickerStyle(page, options);
    });
  });
}
