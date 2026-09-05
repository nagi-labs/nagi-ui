import assert from "node:assert/strict";
import { test } from "@playwright/test";
import { alertDialogDefinition } from "../../packages/core/blueprints/alert-dialog/alert-dialog.definition.ts";
import { buttonDefinition } from "../../packages/core/blueprints/button/button.definition.ts";
import { carouselDefinition } from "../../packages/core/blueprints/carousel/carousel.definition.ts";
import { comboboxDefinition } from "../../packages/core/blueprints/combobox/combobox.definition.ts";
import { dialogDefinition } from "../../packages/core/blueprints/dialog/dialog.definition.ts";
import { datePickerDefinition } from "../../packages/core/blueprints/date-picker/date-picker.definition.ts";

import {
  assertFocusableDisabledButton,
  assertNativeButtonSemantics,
  assertButtonStyle,
  type ButtonContractOptions,
} from "../../packages/core/src/test/button-contract.ts";
import {
  assertCarouselInteraction,
  assertCarouselAnatomy,
  assertCarouselStyle,
  type CarouselContractOptions,
} from "../../packages/core/src/test/carousel-contract.ts";
import {
  assertComboboxActiveRelationship,
  type ComboboxContractOptions,
} from "../../packages/core/src/test/combobox-contract.ts";
import {
  assertDialogCloseAction,
  assertDialogSemantics,
  assertNativeDialogSemantics,
  type DialogContractOptions,
} from "../../packages/core/src/test/dialog-contract.ts";
import {
  assertDatePickerCalendarSemantics,
  assertDatePickerEscapeCancellation,
  assertDatePickerSelectionConstraints,
  assertNativePopoverDatePickerSemantics,
  type DatePickerContractOptions,
} from "../../packages/core/src/test/date-picker-contract.ts";

const buttonBase: ButtonContractOptions = {
  definition: buttonDefinition,
  url: "/definition-mutations.html",
  name: "Mutated non-native button",
};

async function rejectsAt(run: () => Promise<void>, expected: readonly RegExp[]): Promise<void> {
  await assert.rejects(run, (error: unknown) => {
    assert.ok(error instanceof Error);
    for (const pattern of expected) assert.match(error.message, pattern);
    return true;
  });
}

function carouselOptions(
  name: string,
  slidesName: string,
  labelPrefix: string,
): CarouselContractOptions {
  return {
    definition: carouselDefinition,
    url: "/definition-mutations.html",
    name,
    slidesName,
    slides: [
      { label: `${labelPrefix} Alpha`, position: "1 / 2" },
      { label: `${labelPrefix} Beta`, position: "2 / 2" },
    ],
    rootRole: "region",
    modelStatusName: "Mutated interaction model",
    secondAnnouncement: "2 / 2",
  };
}

function comboboxOptions(name: string): ComboboxContractOptions {
  return {
    definition: comboboxDefinition,
    url: "/definition-mutations.html",
    name,
    inputStatusName: "unused",
    selectionStatusName: "unused",
    removeActiveName: "unused",
    dismissName: "unused",
    disabled: {
      name: "unused",
      inputStatusName: "unused",
      selectionStatusName: "unused",
      externalUpdateName: "unused",
    },
    readOnly: {
      name: "unused",
      inputStatusName: "unused",
      selectionStatusName: "unused",
    },
    controlled: {
      name: "unused",
      inputStatusName: "unused",
      selectionStatusName: "unused",
      inputRequestsStatusName: "unused",
      selectionRequestsStatusName: "unused",
    },
  };
}

test.beforeEach(async ({ page }) => {
  await page.goto("/definition-mutations.html");
});

test("Button Implementation rejects a semantic role substituted for its native element", async ({
  page,
}) => {
  await rejectsAt(
    () => assertNativeButtonSemantics(page, buttonBase),
    [/toHaveJSProperty/u, /BUTTON/u, /DIV/u],
  );
});

test("[BTN-INT-02] rejects focusable-disabled activation leaking to the consumer", async ({
  page,
}) => {
  await rejectsAt(
    () =>
      assertFocusableDisabledButton(page, {
        name: "Mutated focusable disabled",
        statusName: "Mutated disabled activations",
      }),
    [/toHaveText/u, /Expected.*0/su, /Received.*1/su],
  );
});

test("[BTN-STYLE-01] rejects a missing finite style-axis declaration", async ({ page }) => {
  await rejectsAt(
    () =>
      assertButtonStyle(page, {
        ...buttonBase,
        name: "Mutated unstyled button",
        style: {
          name: "Mutated unstyled button",
          axes: { "--button-tone": "danger" },
        },
      }),
    [/--button-tone/u, /danger/u],
  );
});

test("Carousel Implementation rejects markup that no longer identifies its behavior viewport", async ({
  page,
}) => {
  await rejectsAt(
    () =>
      assertCarouselAnatomy(
        page,
        carouselOptions("Mutated anatomy carousel", "Mutated anatomy slides", "Anatomy"),
      ),
    [/missing-part/u, /viewport/u],
  );
});

test("[CAR-INT-01] rejects a next action that no longer updates owned state", async ({ page }) => {
  await rejectsAt(
    () =>
      assertCarouselInteraction(
        page,
        carouselOptions(
          "Mutated interaction carousel",
          "Mutated interaction slides",
          "Interaction",
        ),
      ),
    [/toHaveText/u, /Expected.*1/su, /Received.*0/su],
  );
});

test("[CAR-STYLE-01] rejects removal of the declared native scroll-snap style", async ({
  page,
}) => {
  await rejectsAt(
    () =>
      assertCarouselStyle(
        page,
        carouselOptions("Mutated style carousel", "Mutated style slides", "Style"),
      ),
    [/mandatory/u],
  );
});

test("[CMB-SEM-04][CMB-STATE-02] rejects a stale active descendant after collection removal", async ({
  page,
}) => {
  const options = comboboxOptions("Mutated stale framework");
  await rejectsAt(
    () => assertComboboxActiveRelationship(page, options),
    [/toHaveCount/u, /Expected.*1/su, /Received.*0/su],
  );
});

test("[CMB-FOCUS-01] rejects moving DOM focus from the input to the active option", async ({
  page,
}) => {
  const options = comboboxOptions("Mutated focus framework");
  await page.locator("#mutated-focus-combobox-list").evaluate((listbox) => {
    (listbox.parentElement as HTMLElement & { showPopover: () => void }).showPopover();
  });
  await page.locator("#mutated-focus-option").focus();
  await rejectsAt(() => assertComboboxActiveRelationship(page, options, true), [/toBeFocused/u]);
});

test("[DLG-SEM-01] rejects a role-equivalent non-native Dialog surface", async ({ page }) => {
  const options: DialogContractOptions = {
    definition: dialogDefinition,
    url: "/definition-mutations.html",
    triggerName: "Open mutated fake dialog",
    dialogName: "Mutated fake dialog",
    description: "Not a native dialog.",
    closeName: "Close fake dialog",
  };
  await rejectsAt(
    () => assertNativeDialogSemantics(page, options),
    [/Expected.*true/su, /Received.*false/su],
  );
});

test("[DLG-STATE-02] rejects a native Dialog opened outside its modal-default profile", async ({
  page,
}) => {
  const options: DialogContractOptions = {
    definition: dialogDefinition,
    url: "/definition-mutations.html",
    triggerName: "Open mutated non-modal dialog",
    dialogName: "Mutated non-modal dialog",
    description: "Opened with show instead of showModal.",
    closeName: "Close mutated non-modal dialog",
  };
  await rejectsAt(
    () => assertNativeDialogSemantics(page, options),
    [/Expected.*true/su, /Received.*false/su],
  );
});

test("[DLG-FOCUS-02] rejects close restoration redirected away from the invoker", async ({
  page,
}) => {
  const options: DialogContractOptions = {
    definition: dialogDefinition,
    url: "/definition-mutations.html",
    triggerName: "Open mutated restoration dialog",
    dialogName: "Mutated restoration dialog",
    closeName: "Close mutated restoration dialog",
  };
  await rejectsAt(() => assertDialogCloseAction(page, options), [/toBeFocused/u]);
});

test("[ALD-DIALOG-SEM-02] rejects an AlertDialog whose required message is no longer described", async ({
  page,
}) => {
  await page.goto("/owned-contract.html");
  const options: DialogContractOptions = {
    definition: alertDialogDefinition,
    url: "/owned-contract.html",
    triggerName: "Review package contract deletion",
    dialogName: "Delete package contract?",
    description: "This package contract cannot be restored.",
    role: "alertdialog",
    scope: "alert-dialog",
  };
  await page
    .locator('[data-scope="alert-dialog"][data-part="surface"]')
    .filter({ hasText: "Delete package contract?" })
    .evaluate((surface) => surface.removeAttribute("aria-describedby"));

  await rejectsAt(
    () => assertDialogSemantics(page, options),
    [/toHaveAccessibleDescription/u, /Received.*""/su],
  );
});

test("[DTP_IMPLEMENTATION_01] rejects a modal claim added to the native-popover DatePicker surface", async ({
  page,
}) => {
  await page.goto("/date-time.html");
  const options: DatePickerContractOptions = {
    definition: datePickerDefinition,
    url: "/date-time.html",
    triggerName: "Choose picked date",
    fieldName: "Picked date",
    calendarName: "Picked date calendar",
    selectedDateName: "Friday, July 24, 2026",
    nextDateName: "Saturday, July 25, 2026",
    initialValue: "2026-07-24",
    committedValue: "2026-07-25",
    modelStatusName: "Picked date model",
    openStatusName: "Picked date open state",
  };
  await page
    .locator('[data-scope="date-picker"][data-part="popup"]')
    .filter({ has: page.getByRole("grid", { name: options.calendarName, includeHidden: true }) })
    .evaluate((surface) => surface.setAttribute("aria-modal", "true"));

  await rejectsAt(
    () => assertNativePopoverDatePickerSemantics(page, options),
    [/not.*toHaveAttribute/su, /aria-modal/u],
  );
});

test("[DTP_CONTRACT_08] rejects a selectable date below the declared minimum", async ({ page }) => {
  await page.goto("/definition-stress.html");
  const options: DatePickerContractOptions = {
    definition: datePickerDefinition,
    url: "/definition-stress.html",
    triggerName: "Choose package delivery date",
    fieldName: "Package delivery date",
    calendarName: "Package delivery date calendar",
    selectedDateName: "Friday, July 24, 2026",
    nextDateName: "Saturday, July 25, 2026",
    initialValue: "2026-07-24",
    committedValue: "2026-07-25",
    modelStatusName: "Package date model",
    submission: {
      buttonName: "Submit package date",
      statusName: "Package date submission",
      expected: '{"packageDeliveryDate":"2026-07-24"}',
    },
    constraints: {
      beforeMinimumDateName: "Thursday, July 23, 2026",
      unavailableDateName: "Sunday, July 26, 2026",
      afterMaximumDateName: "Tuesday, July 28, 2026",
      clearButtonName: "Clear package date",
      forceInvalidButtonName: "Invalidate package date",
      formName: "Package date form",
      validationMessage: "Package delivery date is invalid.",
      initialSubmissionStatus: "not submitted",
    },
  };
  await page.getByRole("button", { name: options.triggerName, exact: true }).click();
  const dialog = page.getByRole("dialog", { name: options.calendarName, exact: true });
  await dialog
    .getByRole("button", { name: options.constraints.beforeMinimumDateName, exact: true })
    .evaluate((button) => button.remove());
  await dialog
    .getByRole("button", { name: options.nextDateName, exact: true })
    .evaluate(
      (button, name) => button.setAttribute("aria-label", name),
      options.constraints.beforeMinimumDateName,
    );

  await rejectsAt(() => assertDatePickerSelectionConstraints(page, options), [/toBeDisabled/u]);
});

test("[DTP_CONTRACT_06] rejects committing provisional navigation on Escape", async ({ page }) => {
  await page.goto("/date-time.html");
  const options: DatePickerContractOptions = {
    definition: datePickerDefinition,
    url: "/date-time.html",
    triggerName: "Choose picked date",
    fieldName: "Picked date",
    calendarName: "Picked date calendar",
    selectedDateName: "Friday, July 24, 2026",
    nextDateName: "Saturday, July 25, 2026",
    initialValue: "2026-07-24",
    committedValue: "2026-07-25",
    modelStatusName: "Picked date model",
    openStatusName: "Picked date open state",
  };
  await page.evaluate(() => {
    document.addEventListener(
      "keydown",
      (event) => {
        if (event.key !== "Escape") return;
        if (document.activeElement instanceof HTMLButtonElement) {
          document.activeElement.click();
        }
      },
      { capture: true },
    );
  });

  await rejectsAt(
    () => assertDatePickerEscapeCancellation(page, options),
    [/toHaveText/u, /Expected:/u, /Received:/u],
  );
});

test("[DTP_CONTRACT_02] rejects a calendar without its selected date state", async ({ page }) => {
  await page.goto("/date-time.html");
  const options: DatePickerContractOptions = {
    definition: datePickerDefinition,
    url: "/date-time.html",
    triggerName: "Choose picked date",
    fieldName: "Picked date",
    calendarName: "Picked date calendar",
    selectedDateName: "Friday, July 24, 2026",
    nextDateName: "Saturday, July 25, 2026",
    initialValue: "2026-07-24",
    committedValue: "2026-07-25",
    modelStatusName: "Picked date model",
    openStatusName: "Picked date open state",
  };
  await page
    .getByRole("grid", { name: options.calendarName, includeHidden: true })
    .getByRole("gridcell", { selected: true, includeHidden: true })
    .evaluate((cell) => cell.setAttribute("aria-selected", "false"));

  await rejectsAt(
    () => assertDatePickerCalendarSemantics(page, options),
    [/toHaveCount/u, /Expected.*1/su, /Received.*0/su],
  );
});
