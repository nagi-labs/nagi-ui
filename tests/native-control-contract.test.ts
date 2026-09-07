import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repo = path.join(import.meta.dirname, "..");
const blueprints = [
  "input/input.vue",
  "textarea/textarea.vue",
  "select/select.vue",
  "checkbox/checkbox.vue",
  "radio/radio.vue",
  "switch/switch.vue",
  "file-input/file-input.vue",
  "number-field/number-field.vue",
  "slider/slider.vue",
  "meter/meter.vue",
  "progress/progress.vue",
  "accordion/accordion.vue",
  "alert/alert.vue",
  "avatar/avatar.vue",
  "badge/badge.vue",
  "breadcrumb/breadcrumb.vue",
  "button/button.vue",
  "button-group/button-group.vue",
  "card/card.vue",
  "empty-state/empty-state.vue",
  "fieldset/fieldset.vue",
  "input-group/input-group.vue",
  "kbd/kbd.vue",
  "sidebar/sidebar.vue",
  "sidebar/sidebar-link.vue",
  "sidebar/sidebar-section.vue",
  "table/table.vue",
  "toggle/toggle.vue",
  "toggle-group/toggle-group.vue",
];

test("Blueprints disable implicit fallthrough and never bind the $attrs template shorthand", () => {
  for (const blueprint of blueprints) {
    const source = fs.readFileSync(
      path.join(repo, "packages/core/blueprints", blueprint),
      "utf8",
    );

    assert.match(source, /defineOptions\(\{ inheritAttrs: false \}\)/u, blueprint);
    assert.doesNotMatch(source, /v-bind="\$attrs"/u, blueprint);
  }
});
