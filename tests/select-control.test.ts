import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { effectScope, nextTick, ref } from "vue";

import { useSelect } from "@nagi-labs/nagi-ui";

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

test("Select SFC delegates native default selection and reset to useSelect", () => {
  const source = fs.readFileSync(sourcePath, "utf8");

  assert.match(source, /useSelect\(model/u);
  assert.match(source, /attrs,[\s\S]*id: \(\) => id/u);
  assert.match(source, /v-bind="select\.selectProps"/u);
  assert.match(source, /v-bind="select\.selectedProps\(option\.value\)"/u);
  assert.doesNotMatch(source, /mergeElementProps|computed\(|useId\(/u);
  assert.doesNotMatch(source, /ref="select"|function onChange/u);
  assert.doesNotMatch(source, /v-model="model"|useNativeValueReset|watch|onMounted|onUpdated/u);
});

test("Select component overload owns the complete native binding and change notification", () => {
  const model = ref<string>();
  const changes: Event[] = [];
  const scope = effectScope();
  const binding = scope.run(() =>
    useSelect(model, {
      attrs: { class: "n-select -quiet", "data-testid": "plan" },
      id: "plan",
      disabled: true,
      required: true,
      onChange: (event) => changes.push(event),
    }),
  );
  const select = {
    form: null,
    options: [{ value: "standard" }],
    selectedIndex: 0,
    value: "standard",
  } as unknown as HTMLSelectElement;

  assert.ok(binding);
  assert.equal(binding.labelProps.for, "plan");
  assert.equal(binding.selectProps.id, "plan");
  assert.equal(binding.selectProps.class, "-quiet");
  assert.equal(binding.selectProps.disabled, true);
  assert.equal(binding.selectProps.required, true);
  assert.equal(binding.selectProps["data-testid"], "plan");
  binding.selectProps.ref(select);
  const event = { currentTarget: select } as unknown as Event;
  binding.selectProps.onChange(event);
  assert.equal(model.value, "standard");
  assert.deepEqual(changes, [event]);
  scope.stop();
});
