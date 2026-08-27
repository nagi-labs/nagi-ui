import { computed, type WritableComputedRef } from "vue";

import { useNativeFormReset } from "./native-form.ts";

type ReadonlyInputRef = Readonly<{
  value: HTMLInputElement | null;
}>;

type WritableNullableNumber = {
  value: number | null;
};

export interface NumberFieldBinding {
  value: WritableComputedRef<number | "">;
  decrement: () => void;
  increment: () => void;
}

/** Keeps the nullable model aligned with native number stepping and reset. */
export function useNumberField(
  input: ReadonlyInputRef,
  model: WritableNullableNumber,
): NumberFieldBinding {
  const initialValue = model.value;

  const value = computed<number | "">({
    get: () => model.value ?? "",
    set: (next) => {
      model.value = next === "" ? null : Number(next);
    },
  });

  const syncNativeValue = (control: HTMLInputElement) => {
    model.value = Number.isNaN(control.valueAsNumber) ? null : control.valueAsNumber;
  };

  const decrement = () => {
    const control = input.value;
    if (!control) return;
    control.stepDown();
    syncNativeValue(control);
  };

  const increment = () => {
    const control = input.value;
    if (!control) return;
    control.stepUp();
    syncNativeValue(control);
  };

  useNativeFormReset(input, (control) => {
    model.value = initialValue;
    control.value = initialValue === null ? "" : String(initialValue);
  });

  return { value, decrement, increment };
}
