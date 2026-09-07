import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repo = path.join(import.meta.dirname, "..");
const blueprints = path.join(repo, "packages/core/blueprints");

const focusFallbacks = [
  ["alert-dialog/alert-dialog.vue", ".n-alert-dialog > .button:focus-visible"],
  ["breadcrumb/breadcrumb.vue", ".n-breadcrumb > .list > .item > .link:focus-visible"],
  ["button/button.vue", ".n-button:focus-visible"],
  ["checkbox/checkbox.vue", ".n-checkbox > .input:focus-visible"],
  ["combobox/combobox.vue", ".n-combobox > .unit.-control > .input:focus-visible"],
  ["dialog/dialog.vue", ".n-dialog > .button:focus-visible"],
  ["disclosure/disclosure.vue", ".n-disclosure > .summary:focus-visible"],
  ["file-input/file-input.vue", ".n-file-input > .input:focus-visible"],
  ["input/input.vue", ".n-input > .input:focus-visible"],
  ["popover/popover.vue", ".n-popover > .button:focus-visible"],
  ["radio/radio.vue", ".n-radio > .input:focus-visible"],
  ["select/select.vue", ".n-select > .select:focus-visible"],
  ["slider/slider.vue", ".n-slider > .input:focus-visible"],
  ["switch/switch.vue", "&:focus-visible"],
  ["textarea/textarea.vue", ".n-textarea > .textarea:focus-visible"],
  ["toggle/toggle.vue", ".n-toggle:focus-visible"],
  ["tooltip/tooltip.vue", ".n-tooltip > .button:focus-visible"],
] as const;

test("native form controls retain a system focus outline in forced colors", () => {
  for (const [file, selector] of focusFallbacks) {
    const source = fs.readFileSync(path.join(blueprints, file), "utf8");
    const forcedColors = source.match(/@media \(forced-colors: active\) \{[\s\S]*\n\}/u)?.[0] ?? "";

    const selectorParts = selector
      .split(" > ")
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const nestedOrFlatSelector = selectorParts.join("[\\s\\S]*>\\s*");

    assert.match(forcedColors, new RegExp(nestedOrFlatSelector, "u"), file);
    assert.match(
      forcedColors,
      /outline:\s*(?:2px|var\(--n-border-width-2\)) solid Highlight/u,
      file,
    );
    assert.match(forcedColors, /outline-offset:\s*(?:2px|var\(--n-border-width-2\))/u, file);
  }
});

test("generic Input keeps its string model contract by leaving numbers to NumberField", () => {
  const source = fs.readFileSync(path.join(blueprints, "input/input.vue"), "utf8");

  assert.match(source, /defineModel<string>\(\{ default: "" \}\)/u);
  assert.doesNotMatch(source, /\|\s*"number"/u);
});

test("Toggle keeps a non-color pressed indicator in forced colors", () => {
  const source = fs.readFileSync(path.join(blueprints, "toggle/toggle.vue"), "utf8");
  const forcedColors = source.match(/@media \(forced-colors: active\) \{[\s\S]*\n\}/u)?.[0] ?? "";

  assert.match(
    forcedColors,
    /\.n-toggle\[aria-pressed="true"\]\s*\{[\s\S]*border-width:\s*calc\(var\(--n-border-width-1\) \+ var\(--n-border-width-2\)\)/u,
  );
});

test("activedescendant containers keep a real item outline instead of duplicating focus", () => {
  for (const [file, state] of [
    ["listbox/listbox.vue", "data-active"],
    ["combobox/combobox.vue", "aria-selected"],
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
    "menu/internal/dropdown-menu-item.vue",
    "menu/internal/dropdown-menu-group.vue",
    "menu/internal/dropdown-submenu.vue",
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
