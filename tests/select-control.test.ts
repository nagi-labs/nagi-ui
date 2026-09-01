import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { effectScope, nextTick, ref } from "vue";

import { useSelect } from "@nagi-labs/nagi-ui/component-controls";

const repo = path.join(import.meta.dirname, "..");
const sourcePath = path.join(repo, "packages/core/blueprints/select/Select.vue");

test("Select adopts the browser-selected option when its model starts undefined", () => {
  const select = ref({
    form: null,
    options: [{ value: "standard" }, { value: "pro" }],
    selectedIndex: 0,
    value: "standard",
  } as unknown as HTMLSelectElement);
  const model = ref<string>();
  const scope = effectScope();
  const binding = scope.run(() => useSelect(select, model));

  assert.ok(binding);
  assert.deepEqual(binding.selectedProps("standard"), {});
  binding.onChange({ currentTarget: select.value } as unknown as Event);
  assert.equal(model.value, "standard");
  assert.deepEqual(binding.selectedProps("standard"), { selected: true });
  assert.deepEqual(binding.selectedProps("pro"), { selected: false });
  scope.stop();
});

test("Select reset restores the canonical initial option instead of an empty value", async () => {
  const form = new EventTarget();
  const select = ref({
    form,
    options: [{ value: "standard" }, { value: "pro" }],
    selectedIndex: 1,
    value: "pro",
  } as unknown as HTMLSelectElement);
  const model = ref<string | undefined>("pro");
  const scope = effectScope();

  scope.run(() => useSelect(select, model));
  await nextTick();

  model.value = "standard";
  select.value.value = "standard";
  select.value.selectedIndex = 0;
  form.dispatchEvent(new Event("reset"));
  await new Promise<void>((resolve) => setTimeout(resolve, 0));

  assert.equal(model.value, "pro");
  assert.equal(select.value.value, "pro");
  scope.stop();
});

test("Select reset keeps the browser fallback when the initial option was removed", async () => {
  const form = new EventTarget();
  const select = ref({
    form,
    options: [{ value: "standard" }, { value: "pro" }],
    selectedIndex: 0,
    value: "standard",
  } as unknown as HTMLSelectElement);
  const model = ref<string | undefined>("standard");
  const scope = effectScope();

  scope.run(() => useSelect(select, model));
  await nextTick();

  Object.assign(select.value, {
    options: [{ value: "pro" }],
    selectedIndex: 0,
    value: "pro",
  });
  model.value = "pro";
  form.dispatchEvent(new Event("reset"));
  await new Promise<void>((resolve) => setTimeout(resolve, 0));

  assert.equal(model.value, "pro");
  assert.equal(select.value.value, "pro");
  assert.equal(select.value.selectedIndex, 0);
  scope.stop();
});

test("Select SFC delegates native default selection and reset to one adapter", () => {
  const source = fs.readFileSync(sourcePath, "utf8");

  assert.match(source, /useSelect\(select, model\)/u);
  assert.match(source, /selectBinding\.onChange\(event\)/u);
  assert.match(source, /v-bind="selectBinding\.selectedProps\(option\.value\)"/u);
  assert.doesNotMatch(source, /v-model="model"|useNativeValueReset|watch|onMounted|onUpdated/u);
});
