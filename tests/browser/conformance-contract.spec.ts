import {
  alertDialogContract,
  buttonContract,
  carouselContract,
  comboboxContract,
  dialogContract,
  tabsContract,
} from "@nagi-labs/nagi-ui/test";
import { alertDialogDefinition } from "@nagi-labs/nagi-ui/blueprints/alert-dialog/alert-dialog.definition.ts";
import { buttonDefinition } from "@nagi-labs/nagi-ui/blueprints/button/button.definition.ts";
import { carouselDefinition } from "@nagi-labs/nagi-ui/blueprints/carousel/carousel.definition.ts";
import { comboboxDefinition } from "@nagi-labs/nagi-ui/blueprints/combobox/combobox.definition.ts";
import { dialogDefinition } from "@nagi-labs/nagi-ui/blueprints/dialog/dialog.definition.ts";

buttonContract({
  definition: buttonDefinition,
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
    name: "Package submit",
    statusName: "Package submission result",
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
    name: "Owned submit",
    statusName: "Owned submission result",
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
  url: "/owned-contract.html",
  name: "Package framework",
  inputStatusName: "Package combobox input",
  selectionStatusName: "Package combobox selection",
  removeActiveName: "Remove package active option",
  verifyPackageStyle: true,
});

comboboxContract({
  definition: comboboxDefinition,
  url: "/owned-contract.html",
  name: "Owned framework",
  inputStatusName: "Owned combobox input",
  selectionStatusName: "Owned combobox selection",
  removeActiveName: "Remove owned active option",
});

dialogContract({
  definition: dialogDefinition,
  url: "/owned-contract.html",
  triggerName: "Open package definition dialog",
  dialogName: "Package definition dialog",
  description: "A package dialog exercising native modal state.",
  closeName: "Close",
  modelStatusName: "Package dialog model",
  verifyPackageStyle: true,
});

dialogContract({
  definition: dialogDefinition,
  url: "/owned-contract.html",
  triggerName: "Open owned dialog",
  dialogName: "Owned profile editor",
  description: "Its footer moved before the title and body.",
  closeName: "Dismiss owned dialog",
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
