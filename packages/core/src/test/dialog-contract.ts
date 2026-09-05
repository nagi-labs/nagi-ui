import { expect, test, type Locator, type Page } from "@playwright/test";
import type { ComponentDefinition } from "../definition.ts";
import { inspectAnatomy } from "../definition.ts";
import {
  componentContractAnnotation,
  componentContractRequirementsAnnotation,
  componentImplementationAnnotation,
  componentImplementationRequirementsAnnotation,
  contractTitle,
} from "./definition-contract.ts";

const dialogContractRequirementIds = [
  "DLG_CONTRACT_01",
  "DLG_CONTRACT_02",
  "DLG_CONTRACT_03",
  "DLG_CONTRACT_04",
  "DLG_CONTRACT_05",
  "DLG_CONTRACT_06",
  "DLG_CONTRACT_07",
  "DLG_CONTRACT_08",
] as const;

const nativeDialogImplementationRequirementIds = [
  "DLG_IMPLEMENTATION_01",
  "DLG_IMPLEMENTATION_02",
  "DLG_IMPLEMENTATION_03",
] as const;

export interface DialogContractOptions {
  definition: ComponentDefinition;
  /** Runner metadata used to prove the portable Contract against both forms. */
  fixture?: "package" | "owned";
  /** Set false when a custom implementation supplies its own Implementation suite. */
  includeStandardImplementation?: boolean;
  /** Consumer route that renders the package or owned component. */
  url: string;
  /** Accessible name of the native trigger. */
  triggerName: string;
  /** Accessible name of the dialog after it opens. */
  dialogName: string;
  /** Accessible description expected from `aria-describedby`, when provided. */
  description?: string;
  /** `alertdialog` is reserved for confirmation surfaces. */
  role?: "dialog" | "alertdialog";
  /** Anatomy namespace used by the package or owned Blueprint. */
  scope?: "dialog" | "alert-dialog";
  /** Accessible name of a close action, when the surface provides one. */
  closeName: string;
  /** A second action that must close and restore the invoker. */
  actionName: string;
  /** Exact initially focused action required by the adopted component policy. */
  initialFocusName?: string;
  /** Whether Escape is part of this component's declared dismiss policy. */
  escapeCloses?: boolean;
  /** Whether the adopted `closedby` policy includes native light dismissal. */
  lightDismisses?: boolean;
  /** Native modal dialogs must contain sequential keyboard focus. */
  modal?: boolean;
  /** Consumer-owned model output used to observe native/model synchronization. */
  modelStatusName?: string;
  /** The package Blueprint's functional styling is not imposed on owned markup. */
  verifyPackageStyle?: boolean;
}

export interface DialogComponentContractOptions extends DialogContractOptions {
  controlled: {
    triggerName: string;
    dialogName: string;
    modelStatusName: string;
    requestStatusName: string;
    acceptOpenName: string;
    acceptCloseName: string;
  };
}

function trigger(page: Page, options: DialogContractOptions): Locator {
  return page.getByRole("button", { name: options.triggerName, exact: true });
}

function surface(page: Page, options: DialogContractOptions): Locator {
  return page.getByRole(options.role ?? "dialog", { name: options.dialogName, exact: true });
}

async function open(page: Page, options: DialogContractOptions) {
  const opener = trigger(page, options);
  await opener.click();
  const dialog = surface(page, options);
  await expect(dialog).toBeVisible();
  return { dialog, opener };
}

async function rootFor(dialog: Locator, options: DialogContractOptions): Promise<Locator> {
  const scope = options.scope ?? "dialog";
  return dialog
    .page()
    .locator(`[data-scope="${scope}"][data-part="root"]`)
    .filter({
      has: dialog,
    })
    .first();
}

export async function assertDialogSemantics(page: Page, options: DialogContractOptions) {
  const { dialog } = await open(page, options);
  await expect(dialog).toHaveAccessibleName(options.dialogName);
  if (options.description) await expect(dialog).toHaveAccessibleDescription(options.description);
}

export async function assertNativeDialogSemantics(page: Page, options: DialogContractOptions) {
  const opener = trigger(page, options);
  const targetId = await opener.getAttribute("commandfor");
  const { dialog } = await open(page, options);
  const root = await rootFor(dialog, options);
  expect(await dialog.evaluate((node) => node instanceof HTMLDialogElement)).toBe(true);
  expect(await dialog.evaluate((node) => node.matches(":modal"))).toBe(options.modal ?? true);
  if (targetId !== null) expect(targetId).toBe(await dialog.getAttribute("id"));
  await expect(root).toHaveCount(1);
}

export async function assertDialogAnatomy(page: Page, options: DialogContractOptions) {
  const { dialog } = await open(page, options);
  const root = await rootFor(dialog, options);
  expect(await root.evaluate(inspectAnatomy, options.definition.anatomy)).toEqual([]);
}

export async function assertDialogLightDismissal(page: Page, options: DialogContractOptions) {
  const { dialog, opener } = await open(page, options);
  await page.mouse.click(4, 4);
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
  if (options.modelStatusName) {
    await expect(page.getByRole("status", { name: options.modelStatusName })).toHaveText("false");
  }
}

export async function assertDialogFocusEntry(page: Page, options: DialogContractOptions) {
  const { dialog, opener } = await open(page, options);
  await expect(opener).not.toBeFocused();
  await expect
    .poll(() => dialog.evaluate((node) => node.contains(document.activeElement)))
    .toBe(true);
  if (options.initialFocusName) {
    await expect(
      dialog.getByRole("button", { name: options.initialFocusName, exact: true }),
    ).toBeFocused();
  }
}

export async function assertDialogEscapeAndRestoration(page: Page, options: DialogContractOptions) {
  const { dialog, opener } = await open(page, options);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
  if (options.modelStatusName) {
    await expect(page.getByRole("status", { name: options.modelStatusName })).toHaveText("false");
  }
}

export async function assertDialogFocusContainment(page: Page, options: DialogContractOptions) {
  const { dialog } = await open(page, options);
  const focusable = dialog.locator(
    'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  );
  const count = await focusable.count();
  expect(count, "A modal dialog needs at least one sequential focus target.").toBeGreaterThan(0);
  for (const key of ["Tab", "Shift+Tab"] as const) {
    for (let index = 0; index <= count; index += 1) {
      await page.keyboard.press(key);
      expect(
        await dialog.evaluate((node) => {
          const active = document.activeElement;
          return active === node || node.contains(active);
        }),
      ).toBe(true);
    }
  }
}

export async function assertDialogCloseAction(page: Page, options: DialogContractOptions) {
  const { dialog, opener } = await open(page, options);
  await dialog.getByRole("button", { name: options.closeName, exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
}

export async function assertDialogPrimaryAction(page: Page, options: DialogContractOptions) {
  const { dialog, opener } = await open(page, options);
  await dialog.getByRole("button", { name: options.actionName, exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
}

/** Controlled visibility repairs rejected user intent and follows accepted owner updates. */
export async function assertDialogControlledVisibility(
  page: Page,
  options: DialogComponentContractOptions,
) {
  const controlled = options.controlled;
  const opener = page.getByRole("button", { name: controlled.triggerName, exact: true });
  const dialog = page.getByRole("dialog", {
    name: controlled.dialogName,
    exact: true,
    includeHidden: true,
  });
  const model = page.getByRole("status", { name: controlled.modelStatusName, exact: true });
  const requests = page.getByRole("status", { name: controlled.requestStatusName, exact: true });

  await expect(dialog).toBeHidden();
  await expect(model).toHaveText("false");
  await expect(requests).toHaveText("0");

  await opener.click();
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
  await expect(model).toHaveText("false");
  await expect(requests).toHaveText("1");

  await page.getByRole("button", { name: controlled.acceptOpenName, exact: true }).click();
  await expect(dialog).toBeVisible();
  await expect(model).toHaveText("true");
  await expect
    .poll(() => dialog.evaluate((node) => node.contains(document.activeElement)))
    .toBe(true);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  await expect(model).toHaveText("true");
  await expect(requests).toHaveText("2");
  await expect
    .poll(() => dialog.evaluate((node) => node.contains(document.activeElement)))
    .toBe(true);

  await dialog.getByRole("button", { name: controlled.acceptCloseName, exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(model).toHaveText("false");
}

export async function assertDialogRejectsLightDismissal(
  page: Page,
  options: DialogContractOptions,
) {
  const { dialog } = await open(page, options);
  await page.mouse.click(4, 4);
  await expect(dialog).toBeVisible();
  if (options.modelStatusName) {
    await expect(page.getByRole("status", { name: options.modelStatusName })).toHaveText("true");
  }
}

export async function assertDialogStyle(page: Page, options: DialogContractOptions) {
  const { dialog } = await open(page, options);
  const size = await dialog.evaluate((element) => ({
    width: element.getBoundingClientRect().width,
    viewport: document.documentElement.clientWidth,
    backdrop: getComputedStyle(element, "::backdrop").backgroundColor,
  }));
  expect(size.width).toBeLessThanOrEqual(size.viewport);
  expect(size.backdrop).not.toBe("rgba(0, 0, 0, 0)");

  await page.emulateMedia({ forcedColors: "active" });
  await page.keyboard.press("Tab");
  const focused = dialog.locator(":focus");
  await expect(focused).toHaveCount(1);
  expect(await focused.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe(
    "none",
  );
}

const dialogContractReferences = [
  {
    type: "reference",
    description: "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/",
  },
];

const nativeDialogImplementationReferences = [
  {
    type: "reference",
    description:
      "https://html.spec.whatwg.org/multipage/interactive-elements.html#the-dialog-element",
  },
];

const alertDialogCompatibilityRequirements = {
  semantics: [
    "ALD-DIALOG-SEM-01",
    "ALD-DIALOG-SEM-02",
    "ALD-DIALOG-SEM-03",
    "ALD-DIALOG-STATE-01",
    "ALD-DIALOG-STATE-02",
    "ALD-ANAT-01",
  ],
  focusEntry: ["ALD-DIALOG-FOCUS-01", "ALD-FOCUS-01"],
  escape: ["ALD-DIALOG-INT-01", "ALD-DIALOG-FOCUS-02"],
  lightDismiss: ["ALD-DIALOG-INT-01"],
  focusContainment: ["ALD-DIALOG-FOCUS-01"],
  closeAction: ["ALD-DIALOG-INT-01", "ALD-DIALOG-FOCUS-02", "ALD-INT-01"],
  primaryAction: ["ALD-DIALOG-INT-01", "ALD-DIALOG-FOCUS-02", "ALD-INT-01"],
  style: ["ALD-STYLE-01"],
} as const;

function registerAlertDialogCompatibilityContract(options: DialogContractOptions): void {
  test.describe(`AlertDialog compatibility contract: ${options.dialogName}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(options.url);
    });

    test(
      contractTitle(
        options.definition,
        alertDialogCompatibilityRequirements.semantics,
        "uses one named native alert surface with executable anatomy",
      ),
      async ({ page }) => {
        await assertDialogSemantics(page, options);
        await page.reload();
        await assertNativeDialogSemantics(page, options);
        await page.reload();
        await assertDialogAnatomy(page, options);
      },
    );

    test(
      contractTitle(
        options.definition,
        alertDialogCompatibilityRequirements.focusEntry,
        "moves focus to its declared initial destination",
      ),
      async ({ page }) => assertDialogFocusEntry(page, options),
    );

    test(
      contractTitle(
        options.definition,
        alertDialogCompatibilityRequirements.escape,
        "closes with Escape and restores trigger focus",
      ),
      async ({ page }) => assertDialogEscapeAndRestoration(page, options),
    );

    test(
      contractTitle(
        options.definition,
        alertDialogCompatibilityRequirements.lightDismiss,
        "rejects light dismissal under its native close policy",
      ),
      async ({ page }) => assertDialogRejectsLightDismissal(page, options),
    );

    test(
      contractTitle(
        options.definition,
        alertDialogCompatibilityRequirements.focusContainment,
        "contains sequential focus while open",
      ),
      async ({ page }) => assertDialogFocusContainment(page, options),
    );

    if (options.closeName) {
      test(
        contractTitle(
          options.definition,
          alertDialogCompatibilityRequirements.closeAction,
          "restores trigger focus after its close action",
        ),
        async ({ page }) => assertDialogCloseAction(page, options),
      );
    }

    if (options.actionName) {
      test(
        contractTitle(
          options.definition,
          alertDialogCompatibilityRequirements.primaryAction,
          "closes through its primary action and restores the trigger",
        ),
        async ({ page }) => assertDialogPrimaryAction(page, options),
      );
    }

    if (options.verifyPackageStyle) {
      test(
        contractTitle(
          options.definition,
          alertDialogCompatibilityRequirements.style,
          "preserves modal and forced-colors functional styling",
        ),
        async ({ page }) => assertDialogStyle(page, options),
      );
    }
  });
}

function registerDialogContract(options: DialogComponentContractOptions): void {
  if (
    options.escapeCloses === false ||
    options.lightDismisses === false ||
    options.modal === false
  ) {
    throw new Error(
      "nagi/dialog@3 fixes modal containment, Escape dismissal, light dismissal, and controlled visibility repair; a different policy needs another Component Contract.",
    );
  }

  test.describe(
    `Dialog / Component Contract / ${options.dialogName}`,
    {
      tag: [
        "@definition",
        "@dialog",
        "@component-contract",
        ...(options.fixture ? [`@fixture-${options.fixture}`] : []),
      ],
      annotation: [
        ...dialogContractReferences,
        componentContractAnnotation(options.definition),
        componentContractRequirementsAnnotation(dialogContractRequirementIds),
      ],
    },
    () => {
      test.beforeEach(async ({ page }) => {
        await page.goto(options.url);
      });

      async function DLG_CONTRACT_01({ page }: { page: Page }) {
        await assertDialogSemantics(page, options);
      }

      async function DLG_CONTRACT_02({ page }: { page: Page }) {
        await assertDialogFocusEntry(page, options);
      }

      test(
        "Exposes one named dialog with its authored description",
        { tag: ["@semantics", `@${DLG_CONTRACT_01.name}`] },
        DLG_CONTRACT_01,
      );

      test(
        "Moves focus to the declared initial destination",
        { tag: ["@interaction", "@focus", `@${DLG_CONTRACT_02.name}`] },
        DLG_CONTRACT_02,
      );

      async function DLG_CONTRACT_03({ page }: { page: Page }) {
        await assertDialogEscapeAndRestoration(page, options);
      }

      test(
        "Escape closes the visible dialog, synchronizes its model, and restores trigger focus",
        { tag: ["@interaction", "@state", "@focus", `@${DLG_CONTRACT_03.name}`] },
        DLG_CONTRACT_03,
      );

      async function DLG_CONTRACT_04({ page }: { page: Page }) {
        await assertDialogLightDismissal(page, options);
      }

      test(
        "Light dismisses through the declared close policy",
        {
          tag: ["@interaction", "@state", "@focus", `@${DLG_CONTRACT_04.name}`],
        },
        DLG_CONTRACT_04,
      );

      async function DLG_CONTRACT_05({ page }: { page: Page }) {
        await assertDialogFocusContainment(page, options);
      }

      test(
        "Contains sequential focus while open",
        { tag: ["@focus", `@${DLG_CONTRACT_05.name}`] },
        DLG_CONTRACT_05,
      );

      async function DLG_CONTRACT_06({ page }: { page: Page }) {
        await assertDialogCloseAction(page, options);
      }

      test(
        "Restores trigger focus after the visible close action",
        { tag: ["@interaction", "@focus", `@${DLG_CONTRACT_06.name}`] },
        DLG_CONTRACT_06,
      );

      async function DLG_CONTRACT_07({ page }: { page: Page }) {
        await assertDialogPrimaryAction(page, options);
      }

      test(
        "Closes through its primary action and restores the trigger",
        { tag: ["@interaction", "@focus", `@${DLG_CONTRACT_07.name}`] },
        DLG_CONTRACT_07,
      );

      async function DLG_CONTRACT_08({ page }: { page: Page }) {
        await assertDialogControlledVisibility(page, options);
      }

      test(
        "Keeps controlled visibility authoritative across rejected open and close requests",
        { tag: ["@state", "@interaction", "@focus", `@${DLG_CONTRACT_08.name}`] },
        DLG_CONTRACT_08,
      );
    },
  );

  if (options.includeStandardImplementation !== false)
    test.describe(
      `Dialog / Implementation / ${options.dialogName}`,
      {
        tag: [
          "@definition",
          "@dialog",
          "@implementation",
          ...(options.fixture ? [`@fixture-${options.fixture}`] : []),
        ],
        annotation: [
          ...nativeDialogImplementationReferences,
          componentImplementationAnnotation(options.definition),
          componentImplementationRequirementsAnnotation(nativeDialogImplementationRequirementIds),
        ],
      },
      () => {
        test.beforeEach(async ({ page }) => {
          await page.goto(options.url);
        });

        async function DLG_IMPLEMENTATION_01({ page }: { page: Page }) {
          await assertNativeDialogSemantics(page, options);
        }

        async function DLG_IMPLEMENTATION_02({ page }: { page: Page }) {
          await assertDialogAnatomy(page, options);
        }

        test(
          "Uses one native dialog opened with the declared modality",
          { tag: ["@semantics", "@state", `@${DLG_IMPLEMENTATION_01.name}`] },
          DLG_IMPLEMENTATION_01,
        );

        test(
          "Binds the invoker and native surface inside one owned scope",
          { tag: ["@anatomy", `@${DLG_IMPLEMENTATION_02.name}`] },
          DLG_IMPLEMENTATION_02,
        );

        if (options.verifyPackageStyle) {
          async function DLG_IMPLEMENTATION_03({ page }: { page: Page }) {
            await assertDialogStyle(page, options);
          }

          test(
            "Preserves backdrop, viewport bounds, and forced-colors focus",
            { tag: ["@style", "@focus", `@${DLG_IMPLEMENTATION_03.name}`] },
            DLG_IMPLEMENTATION_03,
          );
        }
      },
    );
}

export function dialogContract(options: DialogComponentContractOptions): void {
  registerDialogContract(options);
}

export function alertDialogContract(options: DialogContractOptions): void {
  registerAlertDialogCompatibilityContract({
    ...options,
    role: "alertdialog",
    scope: "alert-dialog",
    modal: true,
    lightDismisses: false,
  });
}
