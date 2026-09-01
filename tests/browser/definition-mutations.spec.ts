import assert from "node:assert/strict";
import { test } from "@playwright/test";
import { alertDialogDefinition } from "../../packages/core/blueprints/alert-dialog/alert-dialog.definition.ts";
import { buttonDefinition } from "../../packages/core/blueprints/button/button.definition.ts";
import { carouselDefinition } from "../../packages/core/blueprints/carousel/carousel.definition.ts";
import { comboboxDefinition } from "../../packages/core/blueprints/combobox/combobox.definition.ts";
import { dialogDefinition } from "../../packages/core/blueprints/dialog/dialog.definition.ts";
import { datePickerDefinition } from "../../packages/core/blueprints/date-picker/date-picker.definition.ts";

import {
  assertButtonDisabledPolicy,
  assertButtonSemantics,
  assertButtonStyle,
  type ButtonContractOptions,
} from "../../packages/core/src/test/button-contract.ts";
import {
  assertCarouselInteraction,
  assertCarouselSemantics,
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
  type DialogContractOptions,
} from "../../packages/core/src/test/dialog-contract.ts";
import {
  assertDatePickerSemantics,
  type DatePickerContractOptions,
} from "../../packages/core/src/test/date-picker-contract.ts";

const buttonBase: ButtonContractOptions = {
  definition: buttonDefinition,
  url: "/definition-mutations.html",
  name: "Mutated non-native button",
};

async function rejectsAt(
  run: () => Promise<void>,
  expected: readonly RegExp[],
): Promise<void> {
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

test.beforeEach(async ({ page }) => {
  await page.goto("/definition-mutations.html");
});

test("[BTN-SEM-01] rejects a semantic role substituted for the required native element", async ({ page }) => {
  await rejectsAt(
    () => assertButtonSemantics(page, buttonBase),
    [/toHaveJSProperty/u, /BUTTON/u, /DIV/u],
  );
});

test("[BTN-INT-02] rejects focusable-disabled activation leaking to the consumer", async ({ page }) => {
  await rejectsAt(
    () => assertButtonDisabledPolicy(page, {
      ...buttonBase,
      name: "Mutated focusable disabled",
      focusableDisabled: {
        name: "Mutated focusable disabled",
        statusName: "Mutated disabled activations",
      },
    }),
    [/toHaveText/u, /Expected.*0/su, /Received.*1/su],
  );
});

test("[BTN-STYLE-01] rejects a missing finite style-axis declaration", async ({ page }) => {
  await rejectsAt(
    () => assertButtonStyle(page, {
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

test("[CAR-ANAT-01] rejects semantics that no longer identify the behavior viewport", async ({ page }) => {
  await rejectsAt(
    () => assertCarouselSemantics(
      page,
      carouselOptions("Mutated anatomy carousel", "Mutated anatomy slides", "Anatomy"),
    ),
    [/missing-part/u, /viewport/u],
  );
});

test("[CAR-INT-01] rejects a next action that no longer updates owned state", async ({ page }) => {
  await rejectsAt(
    () => assertCarouselInteraction(
      page,
      carouselOptions("Mutated interaction carousel", "Mutated interaction slides", "Interaction"),
    ),
    [/toHaveText/u, /Expected.*1/su, /Received.*0/su],
  );
});

test("[CAR-STYLE-01] rejects removal of the declared native scroll-snap style", async ({ page }) => {
  await rejectsAt(
    () => assertCarouselStyle(
      page,
      carouselOptions("Mutated style carousel", "Mutated style slides", "Style"),
    ),
    [/mandatory/u],
  );
});

test("[CMB-SEM-04][CMB-STATE-02] rejects a stale active descendant after collection removal", async ({ page }) => {
  const options: ComboboxContractOptions = {
    definition: comboboxDefinition,
    url: "/definition-mutations.html",
    name: "Mutated stale framework",
    inputStatusName: "unused",
    selectionStatusName: "unused",
    removeActiveName: "unused",
  };
  await rejectsAt(
    () => assertComboboxActiveRelationship(page, options),
    [/toHaveCount/u, /Expected.*1/su, /Received.*0/su],
  );
});

test("[CMB-FOCUS-01] rejects moving DOM focus from the input to the active option", async ({ page }) => {
  const options: ComboboxContractOptions = {
    definition: comboboxDefinition,
    url: "/definition-mutations.html",
    name: "Mutated focus framework",
    inputStatusName: "unused",
    selectionStatusName: "unused",
    removeActiveName: "unused",
  };
  await page.locator("#mutated-focus-combobox-list").evaluate((listbox) => {
    (listbox.parentElement as HTMLElement & { showPopover: () => void }).showPopover();
  });
  await page.locator("#mutated-focus-option").focus();
  await rejectsAt(
    () => assertComboboxActiveRelationship(page, options, true),
    [/toBeFocused/u],
  );
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
    () => assertDialogSemantics(page, options),
    [/Expected.*true/su, /Received.*false/su],
  );
});

test("[DLG-STATE-02] rejects a native Dialog opened outside its modal-default profile", async ({ page }) => {
  const options: DialogContractOptions = {
    definition: dialogDefinition,
    url: "/definition-mutations.html",
    triggerName: "Open mutated non-modal dialog",
    dialogName: "Mutated non-modal dialog",
    description: "Opened with show instead of showModal.",
    closeName: "Close mutated non-modal dialog",
  };
  await rejectsAt(
    () => assertDialogSemantics(page, options),
    [/Expected.*true/su, /Received.*false/su],
  );
});

test("[DLG-FOCUS-02] rejects close restoration redirected away from the invoker", async ({ page }) => {
  const options: DialogContractOptions = {
    definition: dialogDefinition,
    url: "/definition-mutations.html",
    triggerName: "Open mutated restoration dialog",
    dialogName: "Mutated restoration dialog",
    closeName: "Close mutated restoration dialog",
  };
  await rejectsAt(
    () => assertDialogCloseAction(page, options),
    [/toBeFocused/u],
  );
});

test("[ALD-DIALOG-SEM-02] rejects an AlertDialog whose required message is no longer described", async ({ page }) => {
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
  await page.locator('[data-scope="alert-dialog"][data-part="surface"]')
    .filter({ hasText: "Delete package contract?" })
    .evaluate((surface) => surface.removeAttribute("aria-describedby"));

  await rejectsAt(
    () => assertDialogSemantics(page, options),
    [/toHaveAccessibleDescription/u, /Received.*""/su],
  );
});

test("[DTP-SEM-02] rejects a modal claim added to the non-modal DatePicker surface", async ({ page }) => {
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
    openStatusName: "Picked date open state",
  };
  await page.locator('[data-scope="date-picker"][data-part="popup"]')
    .filter({ has: page.getByRole("grid", { name: options.calendarName, includeHidden: true }) })
    .evaluate((surface) => surface.setAttribute("aria-modal", "true"));

  await rejectsAt(
    () => assertDatePickerSemantics(page, options),
    [/not.*toHaveAttribute/su, /aria-modal/u],
  );
});
