import assert from "node:assert/strict";
import test from "node:test";

import { effectScope, nextTick, ref } from "vue";

import {
  useNativeCheckedReset,
  useNativeCheckboxControl,
  useNativeCustomValidity,
  useNativeFormReset,
  useNativeNumberReset,
  useNativeRadioReset,
  useNativeValueReset,
} from "@nagi-labs/nagi-ui";

test("native custom validity follows reactive message and control changes", async () => {
  const messages: string[] = [];
  const control = ref({
    setCustomValidity(message: string) {
      messages.push(message);
    },
  } as unknown as HTMLInputElement);
  const message = ref("Select an option.");
  const scope = effectScope();

  scope.run(() => useNativeCustomValidity(control, message));
  assert.deepEqual(messages, ["Select an option."]);

  message.value = "";
  await nextTick();
  assert.deepEqual(messages, ["Select an option.", ""]);
  scope.stop();
});

test("native form reset synchronization waits for the browser default action", async () => {
  const form = new EventTarget();
  const control = ref({ form } as unknown as HTMLInputElement);
  const calls: string[] = [];
  const scope = effectScope();

  scope.run(() => useNativeFormReset(control, () => calls.push("reset")));
  await nextTick();
  form.dispatchEvent(new Event("reset"));

  await Promise.resolve();
  assert.deepEqual(calls, [], "a microtask is too early for native form reset");

  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(calls, ["reset"]);
  scope.stop();
});

test("a canceled native form reset does not change the controlled state", async () => {
  const form = new EventTarget();
  const control = ref({ form } as unknown as HTMLInputElement);
  const calls: string[] = [];
  const scope = effectScope();

  scope.run(() => useNativeFormReset(control, () => calls.push("reset")));
  await nextTick();
  form.addEventListener("reset", (event) => event.preventDefault());
  form.dispatchEvent(new Event("reset", { cancelable: true }));
  await new Promise<void>((resolve) => setTimeout(resolve, 0));

  assert.deepEqual(calls, []);
  scope.stop();
});

test("small native reset helpers restore their fixed model and DOM channels", async () => {
  const form = new EventTarget();
  const valueControl = ref(
    { form, value: "changed" } as unknown as HTMLInputElement,
  );
  const numberControl = ref(
    { form, value: "99" } as unknown as HTMLInputElement,
  );
  const checkedControl = ref(
    { form, checked: false } as unknown as HTMLInputElement,
  );
  const radioControl = ref(
    { form, value: "email", checked: false } as unknown as HTMLInputElement,
  );
  const checkboxControl = ref(
    Object.assign(new EventTarget(), {
      form,
      checked: true,
      indeterminate: false,
    }) as unknown as HTMLInputElement,
  );
  const value = ref("initial");
  const number = ref(40);
  const checked = ref(true);
  const radio = ref<string | null>("email");
  const checkboxChecked = ref(false);
  const checkboxIndeterminate = ref(true);
  const scope = effectScope();

  scope.run(() => {
    useNativeValueReset(valueControl, value);
    useNativeNumberReset(numberControl, number);
    useNativeCheckedReset(checkedControl, checked);
    useNativeRadioReset(radioControl, radio);
    useNativeCheckboxControl(
      checkboxControl,
      checkboxChecked,
      checkboxIndeterminate,
    );
  });
  await nextTick();

  checkboxControl.value.indeterminate = false;
  checkboxControl.value.dispatchEvent(new Event("change"));
  assert.equal(checkboxIndeterminate.value, false);

  value.value = "changed";
  number.value = 99;
  checked.value = false;
  radio.value = "sms";
  checkboxChecked.value = true;
  checkboxIndeterminate.value = false;
  form.dispatchEvent(new Event("reset"));
  await new Promise<void>((resolve) => setTimeout(resolve, 0));

  assert.equal(value.value, "initial");
  assert.equal(valueControl.value.value, "initial");
  assert.equal(number.value, 40);
  assert.equal(numberControl.value.value, "40");
  assert.equal(checked.value, true);
  assert.equal(checkedControl.value.checked, true);
  assert.equal(radio.value, "email");
  assert.equal(radioControl.value.checked, true);
  assert.equal(checkboxChecked.value, false);
  assert.equal(checkboxIndeterminate.value, true);
  assert.equal(checkboxControl.value.checked, false);
  assert.equal(checkboxControl.value.indeterminate, true);
  scope.stop();
});

test("native form reset rebinds when the control ref changes owner", async () => {
  const firstForm = new EventTarget();
  const secondForm = new EventTarget();
  const control = ref({ form: firstForm } as unknown as HTMLInputElement);
  const calls: string[] = [];
  const scope = effectScope();

  scope.run(() => useNativeFormReset(control, () => calls.push("reset")));
  await nextTick();
  control.value = { form: secondForm } as unknown as HTMLInputElement;
  await nextTick();

  firstForm.dispatchEvent(new Event("reset"));
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(calls, []);

  secondForm.dispatchEvent(new Event("reset"));
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(calls, ["reset"]);
  scope.stop();
});
