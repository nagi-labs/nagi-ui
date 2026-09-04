import { expect, test, type Locator, type Page } from "@playwright/test";

import type { ComponentDefinition } from "../definition.ts";
import { inspectAnatomy } from "../definition.ts";
import {
  componentContractAnnotation,
  componentContractRequirementsAnnotation,
  componentImplementationAnnotation,
  componentImplementationRequirementsAnnotation,
} from "./definition-contract.ts";

const datePickerContractRequirementIds = [
  "DTP_CONTRACT_01",
  "DTP_CONTRACT_02",
  "DTP_CONTRACT_03",
  "DTP_CONTRACT_04",
  "DTP_CONTRACT_05",
  "DTP_CONTRACT_06",
  "DTP_CONTRACT_07",
  "DTP_CONTRACT_08",
  "DTP_CONTRACT_09",
  "DTP_CONTRACT_10",
] as const;

const nativePopoverDatePickerImplementationRequirementIds = [
  "DTP_IMPLEMENTATION_01",
  "DTP_IMPLEMENTATION_02",
  "DTP_IMPLEMENTATION_03",
] as const;

export interface DatePickerContractOptions {
  definition: ComponentDefinition;
  /** Runner metadata used to prove the portable Contract against both forms. */
  fixture?: "package" | "owned";
  /** Set false when a custom implementation supplies its own Implementation suite. */
  includeStandardImplementation?: boolean;
  url: string;
  triggerName: string;
  fieldName: string;
  calendarName: string;
  selectedDateName: string;
  nextDateName: string;
  initialValue: string;
  committedValue: string;
  modelStatusName: string;
  openStatusName?: string;
  /** Observable form result promised by the Component Contract. */
  submission: {
    buttonName: string;
    statusName: string;
    expected: string;
  };
  /** Public date constraints and the required-form result they protect. */
  constraints: {
    beforeMinimumDateName: string;
    unavailableDateName: string;
    afterMaximumDateName: string;
    clearButtonName: string;
    forceInvalidButtonName: string;
    formName: string;
    validationMessage: string;
    initialSubmissionStatus: string;
  };
  /** The package Blueprint's functional styling is not imposed on owned markup. */
  verifyPackageStyle?: boolean;
}

function trigger(page: Page, options: DatePickerContractOptions): Locator {
  return page.getByRole("button", { name: options.triggerName, exact: true });
}

async function rootFor(page: Page, options: DatePickerContractOptions): Promise<Locator> {
  return page
    .locator('[data-scope="date-picker"][data-part="root"]')
    .filter({
      has: trigger(page, options),
    })
    .first();
}

async function openPicker(page: Page, options: DatePickerContractOptions) {
  const opener = trigger(page, options);
  const dialog = page.getByRole("dialog", { name: options.calendarName, exact: true });
  if (!(await dialog.isVisible())) await opener.click();
  await expect(dialog).toBeVisible();
  return { dialog, opener };
}

export async function assertDatePickerFieldSemantics(
  page: Page,
  options: DatePickerContractOptions,
) {
  const field = page.getByRole("group", { name: options.fieldName, exact: true });
  await expect(field).toHaveCount(1);
  await expect(field.getByRole("spinbutton")).toHaveCount(3);
}

export async function assertDatePickerCalendarSemantics(
  page: Page,
  options: DatePickerContractOptions,
) {
  const { dialog } = await openPicker(page, options);
  const grid = dialog.getByRole("grid", { name: options.calendarName, exact: true });
  await expect(grid).toHaveCount(1);
  const cells = grid.getByRole("gridcell");
  expect(await cells.count()).toBeGreaterThan(0);
  expect(
    await cells.evaluateAll((cells) =>
      cells.every((cell) => /^(?:true|false)$/u.test(cell.getAttribute("aria-selected") ?? "")),
    ),
  ).toBe(true);
  const selectedCell = grid.getByRole("gridcell", { selected: true });
  await expect(selectedCell).toHaveCount(1);
  await expect(
    selectedCell.getByRole("button", { name: options.selectedDateName, exact: true }),
  ).toHaveCount(1);
}

export async function assertNativePopoverDatePickerSemantics(
  page: Page,
  options: DatePickerContractOptions,
) {
  const root = await rootFor(page, options);
  const formControl = root.locator('input[type="date"][data-part="form-control"]');
  await expect(formControl).toHaveCount(1);
  await expect(formControl).toHaveValue(options.initialValue);

  const opener = trigger(page, options);
  await expect(opener).toHaveJSProperty("tagName", "BUTTON");
  await expect(opener).toHaveAttribute("aria-haspopup", "dialog");
  const popupId = await opener.getAttribute("popovertarget");
  expect(popupId, "DatePicker trigger must control one popup with popovertarget.").toBeTruthy();
  const popup = root.locator(`[data-part="popup"][id="${popupId}"]`);
  await expect(popup).toHaveCount(1);
  await expect(popup).toHaveAttribute("popover");

  const { dialog } = await openPicker(page, options);
  await expect(dialog).not.toHaveAttribute("aria-modal");
  const dayButtons = dialog
    .getByRole("grid", { name: options.calendarName, exact: true })
    .getByRole("button");
  expect(await dayButtons.count()).toBeGreaterThan(0);
  expect(
    await dayButtons.evaluateAll((buttons) =>
      buttons.every((button) => button.tagName === "BUTTON"),
    ),
  ).toBe(true);
}

export async function assertDatePickerAnatomy(page: Page, options: DatePickerContractOptions) {
  const root = await rootFor(page, options);
  await expect
    .poll(async () => root.evaluate(inspectAnatomy, options.definition.anatomy))
    .toEqual([]);
}

/** Compatibility assertion retained for mutation probes during migration. */
export async function assertDatePickerSemantics(page: Page, options: DatePickerContractOptions) {
  await assertDatePickerFieldSemantics(page, options);
  await assertDatePickerCalendarSemantics(page, options);
  await page.reload();
  await assertNativePopoverDatePickerSemantics(page, options);
  await assertDatePickerAnatomy(page, options);
}

/** Selection and navigation use the grid's declared roving focus and model. */
export async function assertDatePickerInteraction(page: Page, options: DatePickerContractOptions) {
  const { dialog } = await openPicker(page, options);
  const grid = dialog.getByRole("grid", { name: options.calendarName, exact: true });
  const selected = grid.getByRole("button", { name: options.selectedDateName, exact: true });
  await selected.press("ArrowRight");
  await expect(grid.getByRole("button", { name: options.nextDateName, exact: true })).toBeFocused();
}

export async function assertDatePickerFocusEntry(page: Page, options: DatePickerContractOptions) {
  const { dialog } = await openPicker(page, options);
  await expect(
    dialog.getByRole("button", { name: options.selectedDateName, exact: true }),
  ).toBeFocused();
}

export async function assertDatePickerEscapeCancellation(
  page: Page,
  options: DatePickerContractOptions,
) {
  const model = page.getByRole("status", { name: options.modelStatusName });
  await expect(model).toHaveText(options.initialValue);
  const { dialog, opener } = await openPicker(page, options);
  await dialog.getByRole("button", { name: options.nextDateName, exact: true }).focus();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(model).toHaveText(options.initialValue);
  if (options.openStatusName) {
    await expect(page.getByRole("status", { name: options.openStatusName })).toHaveText("false");
  }
  await expect(opener).toBeFocused();
}

export async function assertDatePickerControlledState(
  page: Page,
  options: DatePickerContractOptions,
) {
  const model = page.getByRole("status", { name: options.modelStatusName });
  await expect(model).toHaveText(options.initialValue);
  const { dialog } = await openPicker(page, options);
  if (options.openStatusName) {
    await expect(page.getByRole("status", { name: options.openStatusName })).toHaveText("true");
  }
  await dialog.getByRole("button", { name: options.nextDateName, exact: true }).click();
  await expect(dialog).toBeHidden();
  if (options.openStatusName) {
    await expect(page.getByRole("status", { name: options.openStatusName })).toHaveText("false");
  }
  await expect(model).toHaveText(options.committedValue);
}

export async function assertDatePickerFormSubmission(
  page: Page,
  options: DatePickerContractOptions,
) {
  await page.getByRole("button", { name: options.submission.buttonName, exact: true }).click();
  await expect(
    page.getByRole("status", { name: options.submission.statusName, exact: true }),
  ).toHaveText(options.submission.expected);
}

export async function assertDatePickerSelectionConstraints(
  page: Page,
  options: DatePickerContractOptions,
) {
  const { dialog } = await openPicker(page, options);
  await expect(
    dialog.getByRole("button", { name: options.constraints.beforeMinimumDateName, exact: true }),
  ).toBeDisabled();
  await expect(
    dialog.getByRole("button", { name: options.constraints.unavailableDateName, exact: true }),
  ).toBeDisabled();
  await expect(
    dialog.getByRole("button", { name: options.constraints.afterMaximumDateName, exact: true }),
  ).toBeDisabled();
}

export async function assertDatePickerRequiredSubmission(
  page: Page,
  options: DatePickerContractOptions,
) {
  await page
    .getByRole("button", { name: options.constraints.clearButtonName, exact: true })
    .click();
  await page.getByRole("button", { name: options.submission.buttonName, exact: true }).click();
  await expect(
    page.getByRole("status", { name: options.submission.statusName, exact: true }),
  ).toHaveText(options.constraints.initialSubmissionStatus);
}

export async function assertDatePickerForcedInvalid(
  page: Page,
  options: DatePickerContractOptions,
) {
  await page
    .getByRole("button", { name: options.constraints.forceInvalidButtonName, exact: true })
    .click();
  const form = page.getByRole("form", { name: options.constraints.formName, exact: true });
  expect(await form.evaluate((element: HTMLFormElement) => element.checkValidity())).toBe(false);
  expect(
    await form.evaluate((element: HTMLFormElement) => {
      const invalid = element.querySelector(":invalid");
      if (invalid === null || !("validationMessage" in invalid)) return "";
      return String(invalid.validationMessage);
    }),
  ).toBe(options.constraints.validationMessage);
}

/** Compatibility aggregate for callers that need the complete constraint policy. */
export async function assertDatePickerConstraints(page: Page, options: DatePickerContractOptions) {
  await assertDatePickerSelectionConstraints(page, options);
  await page.reload();
  await assertDatePickerRequiredSubmission(page, options);
  await page.reload();
  await assertDatePickerForcedInvalid(page, options);
}

/** Functional focus and selected-state indicators remain visible in forced colors. */
export async function assertDatePickerStyle(page: Page, options: DatePickerContractOptions) {
  const { dialog } = await openPicker(page, options);
  const selected = dialog.getByRole("button", { name: options.selectedDateName, exact: true });
  await expect(selected).toBeFocused();
  await page.emulateMedia({ forcedColors: "active" });
  expect(
    await selected.evaluate((element) => {
      const style = getComputedStyle(element);
      return style.outlineStyle !== "none" || style.boxShadow !== "none";
    }),
  ).toBe(true);
}

const datePickerContractReferences = [
  {
    type: "reference",
    description:
      "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/",
  },
  {
    type: "reference",
    description: "https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/",
  },
];

const nativePopoverDatePickerImplementationReferences = [
  {
    type: "reference",
    description: "https://html.spec.whatwg.org/multipage/popover.html#the-popover-attribute",
  },
  {
    type: "reference",
    description: "https://html.spec.whatwg.org/multipage/input.html#date-state-(type=date)",
  },
];

export function datePickerContract(options: DatePickerContractOptions): void {
  test.describe(
    `DatePicker / Component Contract / ${options.calendarName}`,
    {
      tag: [
        "@definition",
        "@date-picker",
        "@component-contract",
        ...(options.fixture ? [`@fixture-${options.fixture}`] : []),
      ],
      annotation: [
        ...datePickerContractReferences,
        componentContractAnnotation(options.definition),
        componentContractRequirementsAnnotation(datePickerContractRequirementIds),
      ],
    },
    () => {
      test.beforeEach(async ({ page }) => page.goto(options.url));

      async function DTP_CONTRACT_01({ page }: { page: Page }) {
        await assertDatePickerFieldSemantics(page, options);
      }

      async function DTP_CONTRACT_02({ page }: { page: Page }) {
        await assertDatePickerCalendarSemantics(page, options);
      }

      async function DTP_CONTRACT_03({ page }: { page: Page }) {
        await assertDatePickerControlledState(page, options);
      }

      async function DTP_CONTRACT_04({ page }: { page: Page }) {
        await assertDatePickerInteraction(page, options);
      }

      async function DTP_CONTRACT_05({ page }: { page: Page }) {
        await assertDatePickerFocusEntry(page, options);
      }

      async function DTP_CONTRACT_06({ page }: { page: Page }) {
        await assertDatePickerEscapeCancellation(page, options);
      }

      test(
        "Exposes one named segmented date field with three spinbuttons",
        { tag: ["@semantics", `@${DTP_CONTRACT_01.name}`] },
        DTP_CONTRACT_01,
      );

      test(
        "Exposes one named calendar grid with selected date state",
        { tag: ["@semantics", "@state", `@${DTP_CONTRACT_02.name}`] },
        DTP_CONTRACT_02,
      );

      test(
        "Activating an available day commits the date and closes the controlled popup",
        { tag: ["@state", "@interaction", `@${DTP_CONTRACT_03.name}`] },
        DTP_CONTRACT_03,
      );

      test(
        "ArrowRight moves roving focus to the next date",
        { tag: ["@interaction", "@focus", `@${DTP_CONTRACT_04.name}`] },
        DTP_CONTRACT_04,
      );

      test(
        "Opening places focus on the selected date",
        { tag: ["@interaction", "@focus", `@${DTP_CONTRACT_05.name}`] },
        DTP_CONTRACT_05,
      );

      test(
        "Escape closes the popup without committing and restores the local trigger",
        {
          tag: ["@interaction", "@state", "@focus", `@${DTP_CONTRACT_06.name}`],
        },
        DTP_CONTRACT_06,
      );

      async function DTP_CONTRACT_07({ page }: { page: Page }) {
        await assertDatePickerFormSubmission(page, options);
      }

      test(
        "Submits the accepted ISO date under the authored field name",
        {
          tag: ["@semantics", "@state", "@interaction", `@${DTP_CONTRACT_07.name}`],
        },
        DTP_CONTRACT_07,
      );

      async function DTP_CONTRACT_08({ page }: { page: Page }) {
        await assertDatePickerSelectionConstraints(page, options);
      }

      test(
        "Rejects dates below minimum, above maximum, or explicitly unavailable",
        {
          tag: ["@state", "@interaction", `@${DTP_CONTRACT_08.name}`],
        },
        DTP_CONTRACT_08,
      );

      async function DTP_CONTRACT_09({ page }: { page: Page }) {
        await assertDatePickerRequiredSubmission(page, options);
      }

      test(
        "Blocks form submission when the required accepted date is empty",
        {
          tag: ["@state", "@interaction", `@${DTP_CONTRACT_09.name}`],
        },
        DTP_CONTRACT_09,
      );

      async function DTP_CONTRACT_10({ page }: { page: Page }) {
        await assertDatePickerForcedInvalid(page, options);
      }

      test(
        "Exposes forced invalidity with the authored validation message",
        {
          tag: ["@semantics", "@state", `@${DTP_CONTRACT_10.name}`],
        },
        DTP_CONTRACT_10,
      );
    },
  );

  if (options.includeStandardImplementation !== false)
    test.describe(
      `DatePicker / Implementation / ${options.calendarName}`,
      {
        tag: [
          "@definition",
          "@date-picker",
          "@implementation",
          ...(options.fixture ? [`@fixture-${options.fixture}`] : []),
        ],
        annotation: [
          ...nativePopoverDatePickerImplementationReferences,
          componentImplementationAnnotation(options.definition),
          componentImplementationRequirementsAnnotation(
            nativePopoverDatePickerImplementationRequirementIds,
          ),
        ],
      },
      () => {
        test.beforeEach(async ({ page }) => page.goto(options.url));

        async function DTP_IMPLEMENTATION_01({ page }: { page: Page }) {
          await assertNativePopoverDatePickerSemantics(page, options);
        }

        async function DTP_IMPLEMENTATION_02({ page }: { page: Page }) {
          await assertDatePickerAnatomy(page, options);
        }

        test(
          "Uses native trigger and day buttons with one date form control and popover",
          { tag: ["@semantics", `@${DTP_IMPLEMENTATION_01.name}`] },
          DTP_IMPLEMENTATION_01,
        );

        test(
          "Scopes the field, form channel, popup, grid, and days to one root",
          { tag: ["@anatomy", `@${DTP_IMPLEMENTATION_02.name}`] },
          DTP_IMPLEMENTATION_02,
        );

        if (options.verifyPackageStyle !== false) {
          async function DTP_IMPLEMENTATION_03({ page }: { page: Page }) {
            await assertDatePickerStyle(page, options);
          }

          test(
            "Keeps calendar focus visible in forced colors",
            { tag: ["@style", "@focus", `@${DTP_IMPLEMENTATION_03.name}`] },
            DTP_IMPLEMENTATION_03,
          );
        }
      },
    );
}
