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
  "CMB_CONTRACT_04",
  "CMB_CONTRACT_05",
  "CMB_CONTRACT_06",
  "CMB_CONTRACT_07",
  "CMB_CONTRACT_08",
  "CMB_CONTRACT_09",
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
  dismissName: string;
  disabled: {
    name: string;
    inputStatusName: string;
    selectionStatusName: string;
    externalUpdateName: string;
  };
  readOnly: {
    name: string;
    inputStatusName: string;
    selectionStatusName: string;
  };
  controlled: {
    name: string;
    inputStatusName: string;
    selectionStatusName: string;
    inputRequestsStatusName: string;
    selectionRequestsStatusName: string;
  };
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

/** Disabled blocks user input while still accepting externally owned state. */
export async function assertComboboxDisabled(page: Page, options: ComboboxContractOptions) {
  const control = input(page, { ...options, name: options.disabled.name });
  await expect(control).toBeDisabled();
  await expect(control).toHaveAttribute("aria-expanded", "false");

  await control.evaluate((element) => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    element.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));
  });
  await expect(control).toHaveAttribute("aria-expanded", "false");
  await expect(control).not.toHaveAttribute("aria-activedescendant");
  await expect(page.getByRole("status", { name: options.disabled.inputStatusName })).toHaveText(
    "Vue",
  );
  await expect(page.getByRole("status", { name: options.disabled.selectionStatusName })).toHaveText(
    "vue",
  );

  await page.getByRole("button", { name: options.disabled.externalUpdateName }).click();
  await expect(control).toHaveValue("Solid");
  await expect(page.getByRole("status", { name: options.disabled.inputStatusName })).toHaveText(
    "Solid",
  );
  await expect(page.getByRole("status", { name: options.disabled.selectionStatusName })).toHaveText(
    "solid",
  );
}

/** Read-only preserves accepted state while leaving suggestions inspectable. */
export async function assertComboboxReadOnly(page: Page, options: ComboboxContractOptions) {
  const control = input(page, { ...options, name: options.readOnly.name });
  await expect(control).toHaveAttribute("readonly", "");
  await control.click();
  const listbox = await controlledListbox(control);
  await expect(listbox).toBeVisible();

  await control.press("ArrowDown");
  await control.press("ArrowDown");
  const active = await assertComboboxActiveRelationship(
    page,
    { ...options, name: options.readOnly.name },
    true,
  );
  await expect(active).toHaveText("Svelte");
  await active.click();
  await expect(control).toBeFocused();
  await expect(control).toHaveValue("");
  await expect(page.getByRole("status", { name: options.readOnly.selectionStatusName })).toHaveText(
    "vue",
  );

  await control.press("Enter");
  await expect(listbox).toBeHidden();
  await expect(page.getByRole("status", { name: options.readOnly.inputStatusName })).toHaveText("");
  await expect(page.getByRole("status", { name: options.readOnly.selectionStatusName })).toHaveText(
    "vue",
  );
}

/** Dismissal at the popup boundary synchronizes state without committing navigation. */
export async function assertComboboxPopupBoundary(page: Page, options: ComboboxContractOptions) {
  const control = input(page, options);
  await control.fill("s");
  const listbox = await controlledListbox(control);
  await expect(listbox).toBeVisible();
  await control.press("ArrowDown");
  await expect(control).toHaveAttribute("aria-activedescendant", /-option-svelte$/);

  await page.getByRole("button", { name: options.dismissName }).click();
  await expect(listbox).toBeHidden();
  await expect(control).toHaveAttribute("aria-expanded", "false");
  await expect(control).not.toHaveAttribute("aria-activedescendant");
  await expect(control).toHaveValue("s");
  await expect(page.getByRole("status", { name: options.selectionStatusName })).toHaveText("none");
}

/** Composition stays browser-owned until one compositionend update is accepted. */
export async function assertComboboxIme(page: Page, options: ComboboxContractOptions) {
  const control = input(page, options);
  await control.focus();
  await control.evaluate((element: HTMLInputElement) => {
    element.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true }));
    element.value = "s";
    element.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        data: "s",
        inputType: "insertCompositionText",
        isComposing: true,
      }),
    );
    element.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown", isComposing: true }),
    );
  });
  await expect(page.getByRole("status", { name: options.inputStatusName })).toHaveText("");
  await expect(page.getByRole("status", { name: options.selectionStatusName })).toHaveText("none");
  await expect(control).not.toHaveAttribute("aria-activedescendant");

  await control.evaluate((element) => {
    element.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true, data: "s" }));
  });
  await expect(page.getByRole("status", { name: options.inputStatusName })).toHaveText("s");
  await expect(page.getByRole("status", { name: options.selectionStatusName })).toHaveText("none");
  await expect(control).toHaveAttribute("aria-expanded", "true");
  await expect(control).not.toHaveAttribute("aria-activedescendant");
}

/** Pointer activation keeps input focus, rejects disabled options, and commits enabled ones. */
export async function assertComboboxPointer(page: Page, options: ComboboxContractOptions) {
  const control = input(page, options);
  await control.click();
  const listbox = await controlledListbox(control);
  const disabledOption = listbox.getByRole("option", { name: "React", exact: true });
  await disabledOption.dispatchEvent("pointerdown");
  await disabledOption.dispatchEvent("click");
  await expect(control).toBeFocused();
  await expect(control).toHaveValue("");
  await expect(page.getByRole("status", { name: options.selectionStatusName })).toHaveText("none");
  await expect(listbox).toBeVisible();

  await listbox.getByRole("option", { name: "Solid", exact: true }).click();
  await expect(control).toBeFocused();
  await expect(control).toHaveValue("Solid");
  await expect(page.getByRole("status", { name: options.selectionStatusName })).toHaveText("solid");
  await expect(listbox).toBeHidden();
}

/** Rejected controlled writes repair rendered input and selection to the accepted source. */
export async function assertComboboxControlledState(page: Page, options: ComboboxContractOptions) {
  const control = input(page, { ...options, name: options.controlled.name });
  await control.fill("s");
  await expect(control).toHaveValue("");
  await expect(
    page.getByRole("status", { name: options.controlled.inputStatusName, exact: true }),
  ).toHaveText("");
  await expect(
    page.getByRole("status", { name: options.controlled.selectionStatusName, exact: true }),
  ).toHaveText("vue");
  await expect(
    page.getByRole("status", { name: options.controlled.inputRequestsStatusName }),
  ).toHaveText("1");

  await control.press("ArrowDown");
  await control.press("ArrowDown");
  await control.press("Enter");
  await expect(control).toHaveValue("");
  await expect(
    page.getByRole("status", { name: options.controlled.inputStatusName, exact: true }),
  ).toHaveText("");
  await expect(
    page.getByRole("status", { name: options.controlled.selectionStatusName, exact: true }),
  ).toHaveText("vue");
  await expect(
    page.getByRole("status", { name: options.controlled.inputRequestsStatusName }),
  ).toHaveText("2");
  await expect(
    page.getByRole("status", { name: options.controlled.selectionRequestsStatusName }),
  ).toHaveText("1");
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

      async function CMB_CONTRACT_04({ page }: { page: Page }) {
        await assertComboboxDisabled(page, options);
      }

      async function CMB_CONTRACT_05({ page }: { page: Page }) {
        await assertComboboxReadOnly(page, options);
      }

      async function CMB_CONTRACT_06({ page }: { page: Page }) {
        await assertComboboxPopupBoundary(page, options);
      }

      async function CMB_CONTRACT_07({ page }: { page: Page }) {
        await assertComboboxIme(page, options);
      }

      async function CMB_CONTRACT_08({ page }: { page: Page }) {
        await assertComboboxPointer(page, options);
      }

      async function CMB_CONTRACT_09({ page }: { page: Page }) {
        await assertComboboxControlledState(page, options);
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

      test(
        "Blocks disabled interaction while accepting an external state change",
        { tag: ["@semantics", "@state", "@interaction", `@${CMB_CONTRACT_04.name}`] },
        CMB_CONTRACT_04,
      );

      test(
        "Keeps read-only suggestions inspectable without editing or committing",
        {
          tag: ["@semantics", "@state", "@interaction", "@focus", `@${CMB_CONTRACT_05.name}`],
        },
        CMB_CONTRACT_05,
      );

      test(
        "Synchronizes popup-boundary dismissal without committing provisional state",
        { tag: ["@state", "@interaction", `@${CMB_CONTRACT_06.name}`] },
        CMB_CONTRACT_06,
      );

      test(
        "Defers filtering and navigation until IME composition is committed",
        { tag: ["@state", "@interaction", `@${CMB_CONTRACT_07.name}`] },
        CMB_CONTRACT_07,
      );

      test(
        "Keeps pointer focus on the input and commits only enabled options",
        { tag: ["@state", "@interaction", "@focus", `@${CMB_CONTRACT_08.name}`] },
        CMB_CONTRACT_08,
      );

      test(
        "Repairs rejected controlled input and selection writes to accepted state",
        { tag: ["@state", "@interaction", `@${CMB_CONTRACT_09.name}`] },
        CMB_CONTRACT_09,
      );
    },
  );

  if (options.includeStandardImplementation !== false)
    test.describe(
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
