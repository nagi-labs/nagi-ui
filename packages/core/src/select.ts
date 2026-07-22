import {
  getCurrentInstance,
  onMounted,
  onUpdated,
} from "vue";

import { useNativeFormReset } from "./native-form.ts";

type ReadonlySelectRef = Readonly<{
  value: HTMLSelectElement | null;
}>;

type WritableSelectModel = {
  value: string | undefined;
};

export interface SelectBinding {
  selectedProps: (value: string) => { selected?: boolean };
  onChange: (event: Event) => void;
}

/** Keeps the Select model aligned with native default-option and reset rules. */
export function useSelect(
  select: ReadonlySelectRef,
  model: WritableSelectModel,
): SelectBinding {
  let initialValue = model.value;
  let initialCaptured = model.value !== undefined;

  function nativeValue(control: HTMLSelectElement): string | undefined {
    return control.selectedIndex < 0 ? undefined : control.value;
  }

  function syncNativeValue(control = select.value): string | undefined {
    if (!control) return undefined;
    const value = nativeValue(control);
    if (model.value !== value) model.value = value;
    return value;
  }

  function hasOption(control: HTMLSelectElement, value: string): boolean {
    return Array.from(control.options).some((option) => option.value === value);
  }

  useNativeFormReset(select, (control) => {
    if (!initialCaptured) {
      syncNativeValue(control);
      return;
    }

    if (initialValue === undefined) control.selectedIndex = -1;
    else if (hasOption(control, initialValue)) control.value = initialValue;
    syncNativeValue(control);
  });

  if (getCurrentInstance()) {
    onMounted(() => {
      initialValue = syncNativeValue();
      initialCaptured = true;
    });
    // Option/model updates can cause the browser to select a fallback. Keep
    // the controlled model aligned with the selected option after DOM patching.
    onUpdated(() => syncNativeValue());
  }

  return {
    selectedProps(value) {
      return model.value === undefined ? {} : { selected: model.value === value };
    },
    onChange(event) {
      syncNativeValue(event.currentTarget as HTMLSelectElement);
    },
  };
}
