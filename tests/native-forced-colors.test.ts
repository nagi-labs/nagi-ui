import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repo = path.join(import.meta.dirname, "..");
const blueprints = path.join(repo, "packages/core/blueprints");

const focusFallbacks = [
  ["alert-dialog/AlertDialog.vue", ".n-alert-dialog > .button:focus-visible"],
  ["breadcrumb/Breadcrumb.vue", ".n-breadcrumb > .list > .item > .link:focus-visible"],
  ["button/Button.vue", ".n-button:focus-visible"],
  ["checkbox/Checkbox.vue", ".n-checkbox > .input:focus-visible"],
  ["combobox/Combobox.vue", ".n-combobox > .unit.-control > .input:focus-visible"],
  ["dialog/Dialog.vue", ".n-dialog > .button:focus-visible"],
  ["disclosure/Disclosure.vue", ".n-disclosure > .summary:focus-visible"],
  ["file-input/FileInput.vue", ".n-file-input > .input:focus-visible"],
  ["input/Input.vue", ".n-input > .input:focus-visible"],
  ["popover/Popover.vue", ".n-popover > .button:focus-visible"],
  ["radio/Radio.vue", ".n-radio > .input:focus-visible"],
  ["select/Select.vue", ".n-select > .select:focus-visible"],
  ["slider/Slider.vue", ".n-slider > .input:focus-visible"],
  ["switch/Switch.vue", "&:focus-visible"],
  ["textarea/Textarea.vue", ".n-textarea > .textarea:focus-visible"],
  ["toggle/Toggle.vue", ".n-toggle:focus-visible"],
  ["tooltip/Tooltip.vue", ".n-tooltip > .button:focus-visible"],
] as const;

test("native form controls retain a system focus outline in forced colors", () => {
  for (const [file, selector] of focusFallbacks) {
    const source = fs.readFileSync(path.join(blueprints, file), "utf8");
    const forcedColors =
      source.match(/@media \(forced-colors: active\) \{[\s\S]*\n\}/u)?.[0] ?? "";

    assert.match(
      forcedColors,
      new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "u"),
      file,
    );
    assert.match(forcedColors, /outline:\s*2px solid Highlight/u, file);
    assert.match(forcedColors, /outline-offset:\s*2px/u, file);
  }
});

test("generic Input keeps its string model contract by leaving numbers to NumberField", () => {
  const source = fs.readFileSync(path.join(blueprints, "input/Input.vue"), "utf8");

  assert.match(source, /defineModel<string>\(\{ default: "" \}\)/u);
  assert.doesNotMatch(source, /\|\s*"number"/u);
});

test("Toggle keeps a non-color pressed indicator in forced colors", () => {
  const source = fs.readFileSync(path.join(blueprints, "toggle/Toggle.vue"), "utf8");
  const forcedColors =
    source.match(/@media \(forced-colors: active\) \{[\s\S]*\n\}/u)?.[0] ?? "";

  assert.match(forcedColors, /\.n-toggle\[aria-pressed="true"\]\s*\{[\s\S]*border-width:\s*3px/u);
});

test("activedescendant containers keep a real item outline instead of duplicating focus", () => {
  for (const [file, state] of [
    ["listbox/Listbox.vue", "data-active"],
    ["combobox/Combobox.vue", "aria-selected"],
  ] as const) {
    const source = fs.readFileSync(path.join(blueprints, file), "utf8");
    const stateRule = new RegExp(
      `\\[${state}(?:="true")?\\][\\s\\S]{0,180}outline:\\s*2px solid var\\(--nagi-color-focus-ring\\)`,
      "u",
    );

    assert.match(source, stateRule, file);
  }
});

test("Menu items use their native focus state instead of a duplicated data attribute", () => {
  for (const file of [
    "menu/DropdownMenuItem.vue",
    "menu/DropdownSubmenu.vue",
  ] as const) {
    const source = fs.readFileSync(path.join(blueprints, file), "utf8");
    assert.match(
      source,
      /&:focus[\s\S]{0,220}outline:\s*2px solid var\(--nagi-color-focus-ring\)/u,
      file,
    );
    assert.doesNotMatch(source, /\[data-active\]/u, file);
  }
});
