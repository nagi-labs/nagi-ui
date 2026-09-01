import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repo = path.join(import.meta.dirname, "..");
const blueprints = [
  "input/Input.vue",
  "textarea/Textarea.vue",
  "select/Select.vue",
  "checkbox/Checkbox.vue",
  "radio/Radio.vue",
  "switch/Switch.vue",
  "file-input/FileInput.vue",
  "number-field/NumberField.vue",
  "slider/Slider.vue",
  "meter/Meter.vue",
  "progress/Progress.vue",
  "accordion/Accordion.vue",
  "alert/Alert.vue",
  "avatar/Avatar.vue",
  "badge/Badge.vue",
  "breadcrumb/Breadcrumb.vue",
  "button/Button.vue",
  "button-group/ButtonGroup.vue",
  "card/Card.vue",
  "empty-state/EmptyState.vue",
  "fieldset/Fieldset.vue",
  "input-group/InputGroup.vue",
  "kbd/Kbd.vue",
  "sidebar/Sidebar.vue",
  "sidebar/SidebarLink.vue",
  "sidebar/SidebarSection.vue",
  "table/Table.vue",
  "toggle/Toggle.vue",
  "toggle-group/ToggleGroup.vue",
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
