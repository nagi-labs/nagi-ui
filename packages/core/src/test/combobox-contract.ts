import { expect, test, type Locator, type Page } from "@playwright/test";
import type { ComponentDefinition } from "../definition.ts";
import { inspectAnatomy } from "../definition.ts";
import { contractTitle } from "./definition-contract.ts";

export interface ComboboxContractOptions {
  definition: ComponentDefinition;
  url: string;
  name: string;
  inputStatusName: string;
  selectionStatusName: string;
  removeActiveName: string;
  /** The package Blueprint's functional styling is not imposed on owned markup. */
  verifyPackageStyle?: boolean;
}

function input(page: Page, options: ComboboxContractOptions): Locator {
  return page.getByRole("combobox", { name: options.name, exact: true });
}

async function componentRoot(control: Locator): Promise<Locator> {
  return control.page().locator('[data-scope="combobox"][data-part="root"]').filter({
    has: control,
  }).first();
}

/** Static semantics, scoped IDREFs, native layer, and executable anatomy. */
export async function assertComboboxSemantics(page: Page, options: ComboboxContractOptions) {
  const control = input(page, options);
  const root = await componentRoot(control);
  await expect(control).toHaveAttribute("aria-autocomplete", "list");
  await expect(control).toHaveAttribute("aria-expanded", "false");
  await expect(control).not.toHaveAttribute("aria-activedescendant");

  const controlledId = await control.getAttribute("aria-controls");
  const listbox = root.locator(`[role="listbox"][id="${controlledId}"]`);
  await expect(listbox).toHaveCount(1);
  await expect(listbox).not.toHaveAttribute("aria-multiselectable");
  await expect(listbox.locator('[role="option"]').first()).toHaveAttribute(
    "aria-selected",
    "false",
  );
  const popup = listbox.locator("xpath=ancestor::*[@popover][1]");
  await expect(popup).toHaveCount(1);

  const anatomyIssues = await root.evaluate(inspectAnatomy, options.definition.anatomy);
  expect(anatomyIssues).toEqual([]);

  // A closed native Popover is absent from the accessibility tree, so its
  // descendant's computed accessible name is intentionally empty. Exercise
  // the real exposed state before asserting the adopted listbox requirement.
  await control.focus();
  await page.keyboard.press("ArrowDown");
  await expect(listbox).toBeVisible();
  await expect(listbox).toHaveAccessibleName(options.name);
}

export async function assertComboboxActiveRelationship(
  page: Page,
  options: ComboboxContractOptions,
  requireInputFocus = false,
) {
  const control = input(page, options);
  const root = await componentRoot(control);
  const activeId = await control.getAttribute("aria-activedescendant");
  expect(activeId, "An active Combobox must expose aria-activedescendant.").toBeTruthy();
  const controlledId = await control.getAttribute("aria-controls");
  const listbox = root.locator(`[role="listbox"][id="${controlledId}"]`);
  const active = listbox.locator(`[role="option"][id="${activeId}"]`);
  await expect(active).toHaveCount(1);
  await expect(active).toHaveAttribute("aria-selected", "true");
  if (requireInputFocus) await expect(control).toBeFocused();
  return active;
}

/** Provisional navigation, valid active IDREF, commit/cancel, and input focus. */
export async function assertComboboxInteraction(page: Page, options: ComboboxContractOptions) {
  const control = input(page, options);
  const root = await componentRoot(control);
  await control.focus();
  await page.keyboard.press("ArrowDown");
  await expect(control).toBeFocused();
  await expect(control).toHaveAttribute("aria-expanded", "true");

  const active = await assertComboboxActiveRelationship(page, options, true);
  await expect(active).toHaveText("Vue");
  await expect(active).toHaveAttribute("aria-selected", "true");

  await page.keyboard.press("ArrowDown");
  const nextId = await control.getAttribute("aria-activedescendant");
  await expect(root.locator(`[role="option"][id="${nextId}"]`)).toHaveText("Svelte");
  await expect(root.getByRole("option", { name: "React", exact: true })).toHaveAttribute(
    "aria-disabled",
    "true",
  );

  await page.keyboard.press("Escape");
  await expect(control).toHaveAttribute("aria-expanded", "false");
  await expect(control).not.toHaveAttribute("aria-activedescendant");
  await expect(page.getByRole("status", { name: options.selectionStatusName })).toHaveText("none");

  await control.fill("sol");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(control).toHaveValue("Solid");
  await expect(page.getByRole("status", { name: options.inputStatusName })).toHaveText("Solid");
  await expect(page.getByRole("status", { name: options.selectionStatusName })).toHaveText("solid");

  await control.fill("vue");
  await expect(page.getByRole("status", { name: options.selectionStatusName })).toHaveText("solid");
}

/** A changing collection must not leave a stale active-descendant IDREF. */
export async function assertComboboxDynamicCollection(page: Page, options: ComboboxContractOptions) {
  const control = input(page, options);
  await control.focus();
  await page.keyboard.press("ArrowDown");
  await expect(control).toHaveAttribute("aria-activedescendant", /-option-vue$/);
  await page.getByRole("button", { name: options.removeActiveName, exact: true }).evaluate(
    (button: HTMLButtonElement) => button.click(),
  );
  await expect(control).toBeFocused();
  await expect(control).not.toHaveAttribute("aria-activedescendant");
  await expect(page.getByRole("status", { name: options.selectionStatusName })).toHaveText("none");
}

/** Functional styling is checked independently from semantic anatomy. */
export async function assertComboboxStyle(page: Page, options: ComboboxContractOptions) {
  const control = input(page, options);
  const root = await componentRoot(control);
  await control.focus();
  await page.keyboard.press("ArrowDown");
  const active = root.locator('[role="option"][aria-selected="true"]');
  await expect(active).toBeVisible();
  expect(await active.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe("none");

  await page.emulateMedia({ forcedColors: "active" });
  await expect(control).toBeFocused();
  expect(await control.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe("none");
}

export function comboboxContract(options: ComboboxContractOptions): void {
  test.describe(`Combobox contract: ${options.name}`, () => {
    test.beforeEach(async ({ page }) => page.goto(options.url));

    test(contractTitle(options.definition, ["CMB-SEM-01", "CMB-SEM-02", "CMB-LBX-SEM-01", "CMB-LBX-SEM-02", "CMB-LBX-STATE-01", "CMB-POP-SEM-01", "CMB-INT-04", "CMB-ANAT-01"], "has scoped native popup anatomy"), async ({ page }) => {
      await assertComboboxSemantics(page, options);
    });

    test(contractTitle(options.definition, ["CMB-SEM-03", "CMB-SEM-04", "CMB-STATE-01", "CMB-INT-01", "CMB-INT-02", "CMB-INT-03", "CMB-FOCUS-01"], "keeps focus and provisional selection synchronized"), async ({ page }) => {
      await assertComboboxInteraction(page, options);
    });

    test(contractTitle(options.definition, ["CMB-STATE-02"], "clears an active reference removed from a dynamic collection"), async ({ page }) => {
      await assertComboboxDynamicCollection(page, options);
    });

    if (options.verifyPackageStyle) {
      test(contractTitle(options.definition, ["CMB-STYLE-01"], "keeps active and forced-colors focus states visible"), async ({ page }) => {
        await assertComboboxStyle(page, options);
      });
    }
  });
}
