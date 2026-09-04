import { expect, test, type Locator, type Page } from "@playwright/test";
import type { ComponentDefinition } from "../definition.ts";
import { inspectAnatomy } from "../definition.ts";
import {
  componentContractAnnotation,
  componentContractRequirementsAnnotation,
  componentImplementationAnnotation,
  componentImplementationRequirementsAnnotation,
} from "./definition-contract.ts";

const comboboxContractRequirementIds = [
  "CMB_CONTRACT_01",
  "CMB_CONTRACT_02",
  "CMB_CONTRACT_03",
] as const;

const nativePopoverComboboxImplementationRequirementIds = [
  "CMB_IMPLEMENTATION_01",
  "CMB_IMPLEMENTATION_02",
  "CMB_IMPLEMENTATION_03",
] as const;

export interface ComboboxContractOptions {
  definition: ComponentDefinition;
  /** Runner metadata used to prove the portable Contract against both forms. */
  fixture?: "package" | "owned";
  /** Set false when a custom implementation supplies its own Implementation suite. */
  includeStandardImplementation?: boolean;
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

function exactAttribute(value: string): string {
  return JSON.stringify(value);
}

async function controlledListbox(control: Locator): Promise<Locator> {
  const controlledId = await control.getAttribute("aria-controls");
  expect(controlledId, "Combobox must control one listbox.").toBeTruthy();
  return control.page().locator(`[role="listbox"][id=${exactAttribute(controlledId!)}]`);
}

async function componentRoot(control: Locator): Promise<Locator> {
  return control
    .page()
    .locator('[data-scope="combobox"][data-part="root"]')
    .filter({
      has: control,
    })
    .first();
}

/** Static semantics and scoped IDREFs independent of popup implementation. */
export async function assertComboboxSemantics(page: Page, options: ComboboxContractOptions) {
  const control = input(page, options);
  await expect(control).toHaveAttribute("aria-autocomplete", "list");
  await expect(control).toHaveAttribute("aria-expanded", "false");
  await expect(control).not.toHaveAttribute("aria-activedescendant");

  const listbox = await controlledListbox(control);
  await expect(listbox).toHaveCount(1);
  await expect(listbox).not.toHaveAttribute("aria-multiselectable");
  await expect(listbox.locator('[role="option"]').first()).toHaveAttribute(
    "aria-selected",
    "false",
  );
  // A closed native Popover is absent from the accessibility tree, so its
  // descendant's computed accessible name is intentionally empty. Exercise
  // the real exposed state before asserting the adopted listbox requirement.
  await control.focus();
  await page.keyboard.press("ArrowDown");
  await expect(listbox).toBeVisible();
  await expect(listbox).toHaveAccessibleName(options.name);
}

export async function assertNativePopoverComboboxSemantics(
  page: Page,
  options: ComboboxContractOptions,
) {
  const control = input(page, options);
  const listbox = await controlledListbox(control);
  const popup = listbox.locator("xpath=ancestor::*[@popover][1]");
  await expect(popup).toHaveCount(1);
}

export async function assertComboboxAnatomy(page: Page, options: ComboboxContractOptions) {
  const control = input(page, options);
  const root = await componentRoot(control);
  const anatomyIssues = await root.evaluate(inspectAnatomy, options.definition.anatomy);
  expect(anatomyIssues).toEqual([]);
}

export async function assertComboboxActiveRelationship(
  page: Page,
  options: ComboboxContractOptions,
  requireInputFocus = false,
) {
  const control = input(page, options);
  const activeId = await control.getAttribute("aria-activedescendant");
  expect(activeId, "An active Combobox must expose aria-activedescendant.").toBeTruthy();
  const listbox = await controlledListbox(control);
  const active = listbox.locator(`[role="option"][id="${activeId}"]`);
  await expect(active).toHaveCount(1);
  await expect(active).toHaveAttribute("aria-selected", "true");
  if (requireInputFocus) await expect(control).toBeFocused();
  return active;
}

/** Provisional navigation, valid active IDREF, commit/cancel, and input focus. */
export async function assertComboboxInteraction(page: Page, options: ComboboxContractOptions) {
  const control = input(page, options);
  const listbox = await controlledListbox(control);
  await control.focus();
  await page.keyboard.press("ArrowDown");
  await expect(control).toBeFocused();
  await expect(control).toHaveAttribute("aria-expanded", "true");

  const active = await assertComboboxActiveRelationship(page, options, true);
  await expect(active).toHaveText("Vue");
  await expect(active).toHaveAttribute("aria-selected", "true");

  await page.keyboard.press("ArrowDown");
  const nextId = await control.getAttribute("aria-activedescendant");
  await expect(listbox.locator(`[role="option"][id="${nextId}"]`)).toHaveText("Svelte");
  await expect(listbox.getByRole("option", { name: "React", exact: true })).toHaveAttribute(
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
export async function assertComboboxDynamicCollection(
  page: Page,
  options: ComboboxContractOptions,
) {
  const control = input(page, options);
  await control.focus();
  await page.keyboard.press("ArrowDown");
  await expect(control).toHaveAttribute("aria-activedescendant", /-option-vue$/);
  await page
    .getByRole("button", { name: options.removeActiveName, exact: true })
    .evaluate((button: HTMLButtonElement) => button.click());
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
  expect(await active.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe(
    "none",
  );

  await page.emulateMedia({ forcedColors: "active" });
  await expect(control).toBeFocused();
  expect(await control.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe(
    "none",
  );
}

const comboboxContractReferences = [
  {
    type: "reference",
    description: "https://www.w3.org/WAI/ARIA/apg/patterns/combobox/",
  },
  {
    type: "reference",
    description: "https://www.w3.org/TR/wai-aria-1.2/#aria-activedescendant",
  },
];

const nativePopoverComboboxImplementationReferences = [
  {
    type: "reference",
    description: "https://html.spec.whatwg.org/multipage/popover.html#the-popover-attribute",
  },
];

export function comboboxContract(options: ComboboxContractOptions): void {
  test.describe(
    `Combobox / Component Contract / ${options.name}`,
    {
      tag: [
        "@definition",
        "@combobox",
        "@component-contract",
        ...(options.fixture ? [`@fixture-${options.fixture}`] : []),
      ],
      annotation: [
        ...comboboxContractReferences,
        componentContractAnnotation(options.definition),
        componentContractRequirementsAnnotation(comboboxContractRequirementIds),
      ],
    },
    () => {
      test.beforeEach(async ({ page }) => page.goto(options.url));

      async function CMB_CONTRACT_01({ page }: { page: Page }) {
        await assertComboboxSemantics(page, options);
      }

      async function CMB_CONTRACT_02({ page }: { page: Page }) {
        await assertComboboxInteraction(page, options);
      }

      async function CMB_CONTRACT_03({ page }: { page: Page }) {
        await assertComboboxDynamicCollection(page, options);
      }

      test(
        "Connects one named editable input to a single-selection listbox",
        { tag: ["@semantics", `@${CMB_CONTRACT_01.name}`] },
        CMB_CONTRACT_01,
      );

      test(
        "Navigates enabled suggestions with input focus and commits or cancels explicitly",
        { tag: ["@interaction", "@state", "@focus", `@${CMB_CONTRACT_02.name}`] },
        CMB_CONTRACT_02,
      );

      test(
        "Clears a removed active reference while preserving input focus and accepted selection",
        { tag: ["@semantics", "@state", "@focus", `@${CMB_CONTRACT_03.name}`] },
        CMB_CONTRACT_03,
      );
    },
  );

  if (options.includeStandardImplementation !== false) test.describe(
    `Combobox / Implementation / ${options.name}`,
    {
      tag: [
        "@definition",
        "@combobox",
        "@implementation",
        ...(options.fixture ? [`@fixture-${options.fixture}`] : []),
      ],
      annotation: [
        ...nativePopoverComboboxImplementationReferences,
        componentImplementationAnnotation(options.definition),
        componentImplementationRequirementsAnnotation(
          nativePopoverComboboxImplementationRequirementIds,
        ),
      ],
    },
    () => {
      test.beforeEach(async ({ page }) => page.goto(options.url));

      async function CMB_IMPLEMENTATION_01({ page }: { page: Page }) {
        await assertNativePopoverComboboxSemantics(page, options);
      }

      async function CMB_IMPLEMENTATION_02({ page }: { page: Page }) {
        await assertComboboxAnatomy(page, options);
      }

      test(
        "Places the controlled listbox inside one native popover",
        { tag: ["@semantics", `@${CMB_IMPLEMENTATION_01.name}`] },
        CMB_IMPLEMENTATION_01,
      );

      test(
        "Scopes the input, popup, listbox, and dynamic options to one root",
        { tag: ["@anatomy", `@${CMB_IMPLEMENTATION_02.name}`] },
        CMB_IMPLEMENTATION_02,
      );

      if (options.verifyPackageStyle) {
        async function CMB_IMPLEMENTATION_03({ page }: { page: Page }) {
          await assertComboboxStyle(page, options);
        }

        test(
          "Keeps active and forced-colors focus states visible",
          { tag: ["@style", "@focus", `@${CMB_IMPLEMENTATION_03.name}`] },
          CMB_IMPLEMENTATION_03,
        );
      }
    },
  );
}
