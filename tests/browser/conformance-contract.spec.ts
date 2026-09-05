import {
  alertDialogContract,
  buttonContract,
  carouselContract,
  comboboxContract,
  datePickerContract,
  dialogContract,
  tabsContract,
  toastContract,
} from "@nagi-labs/nagi-ui/test";
import { alertDialogDefinition } from "@nagi-labs/nagi-ui/blueprints/alert-dialog/alert-dialog.definition.ts";
import { buttonDefinition } from "@nagi-labs/nagi-ui/blueprints/button/button.definition.ts";
import { carouselDefinition } from "@nagi-labs/nagi-ui/blueprints/carousel/carousel.definition.ts";
import { comboboxDefinition } from "@nagi-labs/nagi-ui/blueprints/combobox/combobox.definition.ts";
import { dialogDefinition } from "@nagi-labs/nagi-ui/blueprints/dialog/dialog.definition.ts";
import { datePickerDefinition } from "@nagi-labs/nagi-ui/blueprints/date-picker/date-picker.definition.ts";
import { toastDefinition } from "@nagi-labs/nagi-ui/blueprints/toast/toast.definition.ts";

buttonContract({
  definition: buttonDefinition,
  fixture: "package",
  url: "/owned-contract.html",
  name: "Package save",
  nativeDisabledName: "Package native disabled",
  focusableDisabled: {
    name: "Package focusable disabled",
    statusName: "Package disabled activations",
  },
  activation: {
    name: "Package activate",
    statusName: "Package button activations",
    attribute: { name: "data-contract-owner", value: "package" },
  },
  submission: {
    defaultName: "Package form action",
    name: "Package submit",
    resetName: "Package reset",
    inputName: "Package form value",
    initialInputValue: "initial",
    statusName: "Package submission result",
    initialStatus: "none",
    expected: "submitted",
  },
  style: {
    name: "Package styled action",
    axes: {
      "--button-tone": "danger",
      "--button-appearance": "outlined",
      "--button-shape": "rounded",
      "--button-size": "small",
    },
    compiledAxes: [
      "--_button-tone-color",
      "--_button-background",
      "--_button-radius",
      "--_button-min-block-size",
    ],
  },
});

buttonContract({
  definition: buttonDefinition,
  fixture: "owned",
  includeStandardImplementation: false,
  url: "/owned-contract.html",
  name: "Owned save",
  nativeDisabledName: "Owned native disabled",
  focusableDisabled: {
    name: "Owned focusable disabled",
    statusName: "Owned disabled activations",
  },
  activation: {
    name: "Owned activate",
    statusName: "Owned button activations",
    attribute: { name: "data-contract-owner", value: "owned" },
  },
  submission: {
    defaultName: "Owned form action",
    name: "Owned submit",
    resetName: "Owned reset",
    inputName: "Owned form value",
    initialInputValue: "initial",
    statusName: "Owned submission result",
    initialStatus: "none",
    expected: "submitted",
  },
  style: {
    name: "Owned styled action",
    axes: {
      "--button-tone": "danger",
      "--button-appearance": "outlined",
      "--button-shape": "rounded",
      "--button-size": "small",
    },
    compiledAxes: [
      "--_button-tone-color",
      "--_button-background",
      "--_button-radius",
      "--_button-min-block-size",
    ],
  },
});

carouselContract({
  definition: carouselDefinition,
  fixture: "package",
  url: "/owned-contract.html",
  name: "Package release highlights",
  slidesName: "Package release slides",
  slides: [
    { label: "Owned Alpha", position: "1 / 3" },
    { label: "Owned Beta", position: "2 / 3" },
    { label: "Owned Gamma", position: "3 / 3" },
  ],
  rootRole: "region",
  modelStatusName: "Package carousel model",
  secondAnnouncement: "2 / 3",
  externalUpdateName: "Set package carousel to third",
  expectedExternalIndex: "2",
  looped: {
    name: "Package looped highlights",
    modelStatusName: "Package looped carousel model",
  },
  rejected: {
    name: "Package locked highlights",
    modelStatusName: "Package locked carousel model",
    requestStatusName: "Package locked carousel requests",
  },
  outOfRange: {
    name: "Package bounded highlights",
    modelStatusName: "Package bounded carousel model",
    sourceIndex: "99",
    acceptedIndex: 2,
  },
  disabled: {
    name: "Package disabled highlights",
    slidesName: "Package disabled slides",
    modelStatusName: "Package disabled carousel model",
    externalUpdateName: "Set package disabled carousel to second",
    expectedExternalIndex: "1",
  },
});

carouselContract({
  definition: carouselDefinition,
  fixture: "owned",
  includeStandardImplementation: false,
  url: "/owned-contract.html",
  name: "Owned release highlights",
  slidesName: "Owned release slides",
  carouselRoleDescription: "owned carousel",
  slidesRoleDescription: "owned slides",
  slideRoleDescription: "owned slide",
  slides: [
    { label: "Owned Alpha", position: "1 / 3" },
    { label: "Owned Beta", position: "2 / 3" },
    { label: "Owned Gamma", position: "3 / 3" },
  ],
  rootRole: "region",
  modelStatusName: "Owned carousel model",
  secondAnnouncement: "2 / 3",
  externalUpdateName: "Set owned carousel to third",
  expectedExternalIndex: "2",
  looped: {
    name: "Owned looped highlights",
    modelStatusName: "Owned looped carousel model",
  },
  rejected: {
    name: "Owned locked highlights",
    modelStatusName: "Owned locked carousel model",
    requestStatusName: "Owned locked carousel requests",
  },
  outOfRange: {
    name: "Owned bounded highlights",
    modelStatusName: "Owned bounded carousel model",
    sourceIndex: "99",
    acceptedIndex: 2,
  },
  disabled: {
    name: "Owned disabled highlights",
    slidesName: "Owned disabled slides",
    modelStatusName: "Owned disabled carousel model",
    externalUpdateName: "Set owned disabled carousel to second",
    expectedExternalIndex: "1",
  },
});

comboboxContract({
  definition: comboboxDefinition,
  fixture: "package",
  url: "/owned-contract.html",
  name: "Package framework",
  inputStatusName: "Package combobox input",
  selectionStatusName: "Package combobox selection",
  removeActiveName: "Remove package active option",
  dismissName: "Dismiss package combobox popup",
  disabled: {
    name: "Package disabled framework",
    inputStatusName: "Package disabled combobox input",
    selectionStatusName: "Package disabled combobox selection",
    externalUpdateName: "Set package disabled combobox to Solid",
  },
  readOnly: {
    name: "Package readonly framework",
    inputStatusName: "Package readonly combobox input",
    selectionStatusName: "Package readonly combobox selection",
  },
  controlled: {
    name: "Package controlled framework",
    inputStatusName: "Package controlled combobox input",
    selectionStatusName: "Package controlled combobox selection",
    inputRequestsStatusName: "Package controlled combobox input requests",
    selectionRequestsStatusName: "Package controlled combobox selection requests",
  },
  verifyPackageStyle: true,
});

comboboxContract({
  definition: comboboxDefinition,
  fixture: "owned",
  includeStandardImplementation: false,
  url: "/owned-contract.html",
  name: "Owned framework",
  inputStatusName: "Owned combobox input",
  selectionStatusName: "Owned combobox selection",
  removeActiveName: "Remove owned active option",
  dismissName: "Dismiss owned combobox popup",
  disabled: {
    name: "Owned disabled framework",
    inputStatusName: "Owned disabled combobox input",
    selectionStatusName: "Owned disabled combobox selection",
    externalUpdateName: "Set owned disabled combobox to Solid",
  },
  readOnly: {
    name: "Owned readonly framework",
    inputStatusName: "Owned readonly combobox input",
    selectionStatusName: "Owned readonly combobox selection",
  },
  controlled: {
    name: "Owned controlled framework",
    inputStatusName: "Owned controlled combobox input",
    selectionStatusName: "Owned controlled combobox selection",
    inputRequestsStatusName: "Owned controlled combobox input requests",
    selectionRequestsStatusName: "Owned controlled combobox selection requests",
  },
});

datePickerContract({
  definition: datePickerDefinition,
  fixture: "package",
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
});

datePickerContract({
  definition: datePickerDefinition,
  fixture: "owned",
  includeStandardImplementation: false,
  url: "/definition-stress.html",
  triggerName: "Choose owned delivery date",
  fieldName: "Owned delivery date",
  calendarName: "Owned delivery date calendar",
  selectedDateName: "Friday, July 24, 2026",
  nextDateName: "Saturday, July 25, 2026",
  initialValue: "2026-07-24",
  committedValue: "2026-07-25",
  modelStatusName: "Owned date model",
  submission: {
    buttonName: "Submit owned date",
    statusName: "Owned date submission",
    expected: '{"ownedDeliveryDate":"2026-07-24"}',
  },
  constraints: {
    beforeMinimumDateName: "Thursday, July 23, 2026",
    unavailableDateName: "Sunday, July 26, 2026",
    afterMaximumDateName: "Tuesday, July 28, 2026",
    clearButtonName: "Clear owned date",
    forceInvalidButtonName: "Invalidate owned date",
    formName: "Owned date form",
    validationMessage: "Owned delivery date is invalid.",
    initialSubmissionStatus: "not submitted",
  },
  verifyPackageStyle: false,
});

dialogContract({
  definition: dialogDefinition,
  fixture: "package",
  url: "/owned-contract.html",
  triggerName: "Open package definition dialog",
  dialogName: "Package definition dialog",
  description: "A package dialog exercising native modal state.",
  closeName: "Close",
  actionName: "Save package dialog",
  modelStatusName: "Package dialog model",
  controlled: {
    triggerName: "Request package controlled open",
    dialogName: "Package controlled dialog",
    modelStatusName: "Package controlled dialog model",
    requestStatusName: "Package controlled dialog requests",
    acceptOpenName: "Accept package controlled open",
    acceptCloseName: "Accept package controlled close",
  },
  verifyPackageStyle: true,
});

dialogContract({
  definition: dialogDefinition,
  fixture: "owned",
  includeStandardImplementation: false,
  url: "/owned-contract.html",
  triggerName: "Open owned dialog",
  dialogName: "Owned profile editor",
  description: "Its footer moved before the title and body.",
  closeName: "Dismiss owned dialog",
  actionName: "Save owned dialog",
  modelStatusName: "Owned dialog model",
  controlled: {
    triggerName: "Request owned controlled open",
    dialogName: "Owned controlled dialog",
    modelStatusName: "Owned controlled dialog model",
    requestStatusName: "Owned controlled dialog requests",
    acceptOpenName: "Accept owned controlled open",
    acceptCloseName: "Accept owned controlled close",
  },
});

alertDialogContract({
  definition: alertDialogDefinition,
  url: "/owned-contract.html",
  triggerName: "Review package contract deletion",
  dialogName: "Delete package contract?",
  description: "This package contract cannot be restored.",
  closeName: "Keep package contract",
  actionName: "Delete package contract",
  initialFocusName: "Keep package contract",
  modelStatusName: "Package alert dialog model",
  verifyPackageStyle: true,
});

toastContract({
  definition: toastDefinition,
  fixture: "package",
  url: "/catalog.html",
  regionName: "Notifications",
  secondaryRegionName: "Secondary notifications",
});

alertDialogContract({
  definition: alertDialogDefinition,
  url: "/owned-contract.html",
  triggerName: "Review owned contract deletion",
  dialogName: "Delete owned contract?",
  description: "This owned contract cannot be restored.",
  closeName: "Keep owned contract",
  actionName: "Delete owned contract",
  initialFocusName: "Keep owned contract",
  modelStatusName: "Owned alert dialog model",
});

tabsContract({
  url: "/tabs.html",
  name: "Account sections",
  activation: "automatic",
});

tabsContract({
  url: "/owned-contract.html",
  name: "Owned account sections",
  orientation: "vertical",
  activation: "manual",
});
