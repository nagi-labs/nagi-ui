import {
  getCurrentInstance,
  onMounted,
  onUpdated,
} from "vue";

import { useNativeFormReset } from "./native-form.ts";

type ReadonlySliderRef = Readonly<{
  value: HTMLInputElement | null;
}>;

type WritableNumberModel = {
  value: number;
};

/** Keeps the Slider model aligned with the browser's range sanitization. */
export function useSlider(
  input: ReadonlySliderRef,
  model: WritableNumberModel,
): void {
  let initialValue: number | undefined;

  function syncNativeValue(control = input.value): number | undefined {
    if (!control) return undefined;
    const value = control.valueAsNumber;
    if (Number.isNaN(value)) return undefined;
    if (model.value !== value) model.value = value;
    return value;
  }

  useNativeFormReset(input, (control) => {
    if (initialValue !== undefined) control.value = String(initialValue);
    syncNativeValue(control);
  });

  if (getCurrentInstance()) {
    // Range inputs sanitize value against min/max/step after DOM properties are
    // patched. Read the result instead of reproducing that browser algorithm.
    onMounted(() => {
      initialValue = syncNativeValue();
    });
    onUpdated(() => syncNativeValue());
  }
}
