import assert from "node:assert/strict";
import test from "node:test";

import { effectScope, nextTick, ref } from "vue";

import { useNumberField } from "@nagi-labs/nagi-ui/component-controls";

test("NumberField control normalizes empty values and follows native stepping", () => {
  let nativeValue = 2;
  const control = {
    form: null,
    value: "2",
    get valueAsNumber() {
      return nativeValue;
    },
    stepDown() {
      nativeValue -= 1;
      this.value = String(nativeValue);
    },
    stepUp() {
      nativeValue += 1;
      this.value = String(nativeValue);
    },
  } as unknown as HTMLInputElement;
  const input = ref<HTMLInputElement | null>(control);
  const model = ref<number | null>(2);
  const scope = effectScope();
  const numberField = scope.run(() => useNumberField(input, model));

  assert.ok(numberField);
  numberField.value.value = "";
  assert.equal(model.value, null);
  numberField.value.value = 4;
  assert.equal(model.value, 4);

  nativeValue = 4;
  control.value = "4";
  numberField.increment();
  assert.equal(model.value, 5);
  numberField.decrement();
  assert.equal(model.value, 4);
  scope.stop();
});

test("NumberField control restores its initial nullable model after native reset", async () => {
  const form = new EventTarget();
  const control = {
    form,
    value: "",
    valueAsNumber: Number.NaN,
    stepDown() {},
    stepUp() {},
  } as unknown as HTMLInputElement;
  const input = ref<HTMLInputElement | null>(control);
  const model = ref<number | null>(null);
  const scope = effectScope();

  scope.run(() => useNumberField(input, model));
  await nextTick();

  model.value = 7;
  control.value = "7";
  form.dispatchEvent(new Event("reset"));
  await new Promise<void>((resolve) => setTimeout(resolve, 0));

  assert.equal(model.value, null);
  assert.equal(control.value, "");
  scope.stop();
});
