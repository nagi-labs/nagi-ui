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
  assertDatePickerControlledRejection,
  assertDatePickerDisabledState,
  assertDatePickerEscapeCancellation,
  assertDatePickerFormSubmission,
  assertDatePickerInteraction,
  assertDatePickerLightDismissal,
  assertDatePickerReadOnlyState,
  assertDatePickerSegmentedEditing,
  assertDatePickerSelectionConstraints,
  assertNativePopoverDatePickerSemantics,
  type DatePickerContractOptions,
} from "../../packages/core/src/test/date-picker-contract.ts";

const datePickerUnexercisedFlows = {
  outsideButtonName: "Outside package DatePicker",
  navigation: {
    triggerName: "Choose package keyboard date",
    calendarName: "Package keyboard date calendar",
    selectedDateName: "Friday, July 24, 2026",
    arrowRightDateName: "Saturday, July 25, 2026",
    arrowDownDateName: "Saturday, August 1, 2026",
    homeDateName: "Sunday, July 26, 2026",
    endDateName: "Saturday, August 1, 2026",
    pageUpDateName: "Wednesday, July 1, 2026",
    pageDownDateName: "Saturday, August 1, 2026",
    shiftPageDownDateName: "Sunday, August 1, 2027",
  },
  disabled: {
    fieldName: "Package disabled date",
    triggerName: "Choose package disabled date",
    modelStatusName: "Package disabled date model",
    externalUpdateName: "Set package disabled date to July 25",
  },
  readOnly: {
    fieldName: "Package readonly date",
    triggerName: "Choose package readonly date",
    calendarName: "Package readonly date calendar",
    selectedDateName: "Friday, July 24, 2026",
    nextDateName: "Saturday, July 25, 2026",
    modelStatusName: "Package readonly date model",
  },
  controlled: {
    fieldName: "Package controlled date",
    triggerName: "Choose package controlled date",
    calendarName: "Package controlled date calendar",
    selectedDateName: "Friday, July 24, 2026",
    nextDateName: "Saturday, July 25, 2026",
    modelStatusName: "Package controlled date model",
    openStatusName: "Package controlled date open",
    dateRequestsStatusName: "Package controlled date requests",
    openRequestsStatusName: "Package controlled open requests",
    acceptOpenName: "Accept package controlled date open",
    acceptCloseName: "Accept package controlled date close",
  },
} as const;

function packageDatePickerOptions(): DatePickerContractOptions {
  return {
    ...datePickerUnexercisedFlows,
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
}

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
    ...datePickerUnexercisedFlows,
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
  const options = packageDatePickerOptions();
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
    ...datePickerUnexercisedFlows,
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

test("[DTP_CONTRACT_04] rejects a calendar that drops page navigation", async ({ page }) => {
  await page.goto("/definition-stress.html");
  const options = packageDatePickerOptions();
  await page.evaluate(() => {
    document.addEventListener(
      "keydown",
      (event) => {
        if (event.key !== "PageUp") return;
        event.preventDefault();
        event.stopImmediatePropagation();
      },
      { capture: true },
    );
  });

  await rejectsAt(() => assertDatePickerInteraction(page, options), [/toBeFocused/u]);
});

test("[DTP_CONTRACT_07] rejects a date detached from its selected form", async ({ page }) => {
  await page.goto("/definition-stress.html");
  const options = packageDatePickerOptions();
  await page
    .locator('[data-scope="date-picker"][data-part="root"]')
    .filter({ has: page.getByRole("button", { name: options.triggerName, exact: true }) })
    .locator('[data-part="form-control"]')
    .evaluate((control) => control.removeAttribute("form"));

  await rejectsAt(
    () => assertDatePickerFormSubmission(page, options),
    [/toHaveText/u, /packageDeliveryDate/u],
  );
});

test("[DTP_CONTRACT_11] rejects a segmented field that ignores increment keys", async ({
  page,
}) => {
  await page.goto("/definition-stress.html");
  const options = packageDatePickerOptions();
  await page
    .getByRole("group", { name: options.fieldName, exact: true })
    .getByRole("spinbutton", { name: "Day", exact: true })
    .evaluate((day) => {
      day.addEventListener(
        "keydown",
        (event) => {
          event.preventDefault();
          event.stopImmediatePropagation();
        },
        { capture: true },
      );
    });

  await rejectsAt(
    () => assertDatePickerSegmentedEditing(page, options),
    [/toHaveAttribute/u, /aria-valuenow/u],
  );
});

test("[DTP_CONTRACT_12] rejects light dismissal that steals focus from its target", async ({
  page,
}) => {
  await page.goto("/definition-stress.html");
  const options = packageDatePickerOptions();
  const outside = page.getByRole("button", { name: options.outsideButtonName, exact: true });
  await outside.evaluate((button, triggerName) => {
    button.addEventListener("click", () => {
      queueMicrotask(() => {
        const trigger = Array.from(document.querySelectorAll("button")).find(
          (candidate) => candidate.getAttribute("aria-label") === triggerName,
        );
        if (trigger instanceof HTMLButtonElement) trigger.focus();
      });
    });
  }, options.triggerName);

  await rejectsAt(() => assertDatePickerLightDismissal(page, options), [/toBeFocused/u]);
});

test("[DTP_CONTRACT_13] rejects a disabled DatePicker that drops external updates", async ({
  page,
}) => {
  await page.goto("/definition-stress.html");
  const options = packageDatePickerOptions();
  await page
    .getByRole("button", { name: options.disabled.externalUpdateName, exact: true })
    .evaluate((button) => {
      button.addEventListener(
        "click",
        (event) => {
          event.preventDefault();
          event.stopImmediatePropagation();
        },
        { capture: true },
      );
    });

  await rejectsAt(
    () => assertDatePickerDisabledState(page, options),
    [/toHaveText/u, /Received:/u],
  );
});

test("[DTP_CONTRACT_14] rejects a read-only field without read-only segment semantics", async ({
  page,
}) => {
  await page.goto("/definition-stress.html");
  const options = packageDatePickerOptions();
  await page
    .getByRole("group", { name: options.readOnly.fieldName, exact: true })
    .getByRole("spinbutton")
    .first()
    .evaluate((segment) => segment.removeAttribute("aria-readonly"));

  await rejectsAt(() => assertDatePickerReadOnlyState(page, options), [/toBe/u]);
});

test("[DTP_CONTRACT_15] rejects a controlled trigger that drops its visibility request", async ({
  page,
}) => {
  await page.goto("/definition-stress.html");
  const options = packageDatePickerOptions();
  await page
    .getByRole("button", { name: options.controlled.triggerName, exact: true })
    .evaluate((trigger) => trigger.removeAttribute("popovertarget"));

  await rejectsAt(
    () => assertDatePickerControlledRejection(page, options),
    [/toHaveText/u, /Expected.*1/su, /Received.*0/su],
  );
});

test("[DTP_CONTRACT_02] rejects a calendar without its selected date state", async ({ page }) => {
  await page.goto("/date-time.html");
  const options: DatePickerContractOptions = {
    ...datePickerUnexercisedFlows,
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
