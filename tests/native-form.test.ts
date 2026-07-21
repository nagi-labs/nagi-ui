import assert from "node:assert/strict";
import test from "node:test";

import { effectScope, nextTick, ref } from "vue";

import { useNativeFormReset } from "@nagi-labs/nagi-ui";

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
