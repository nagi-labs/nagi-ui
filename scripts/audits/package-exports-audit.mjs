import assert from "node:assert/strict";

const contractRunners = await import("../../packages/core/dist/test/index.js");
const carousel = await import("../../packages/core/dist/contracts/carousel.js");
const combobox = await import("../../packages/core/dist/contracts/combobox.js");
const dialog = await import("../../packages/core/dist/contracts/dialog.js");
const toast = await import("../../packages/core/dist/contracts/toast.js");
const definition = await import("../../packages/core/dist/definition.js");

assert.equal(typeof contractRunners.carouselContract, "function");
assert.equal(typeof contractRunners.inspectAnatomy, "function");
assert.equal(typeof contractRunners.toastContract, "function");
assert.equal(typeof definition.defineComponentDefinition, "function");
assert.equal(carousel.carouselContract.id, "nagi/carousel");
assert.equal(carousel.carouselContract.revision, "1");
assert.equal(combobox.comboboxContract.id, "nagi/combobox");
assert.equal(combobox.comboboxContract.revision, "2");
assert.equal(dialog.dialogComponentContract.id, "nagi/dialog");
assert.equal(dialog.dialogComponentContract.revision, "2");
assert.equal(dialog.nagiDialogRequirementsV2.version, "2");
assert.equal(toast.toastContract.id, "nagi/toast");
assert.equal(toast.toastContract.revision, "1");

console.log("Package Contract and runner exports are executable JavaScript.");
