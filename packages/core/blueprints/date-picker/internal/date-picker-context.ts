import type { DatePickerBinding } from "@nagi-labs/nagi-ui";
import { inject, provide, type InjectionKey } from "vue";

const datePickerContextKey: InjectionKey<DatePickerBinding> = Symbol("DatePicker");

export function provideDatePickerContext(picker: DatePickerBinding): void {
  provide(datePickerContextKey, picker);
}

export function useDatePickerContext(): DatePickerBinding {
  const picker = inject(datePickerContextKey);
  if (!picker) {
    throw new Error("DatePickerPopup must be rendered inside DatePicker.");
  }
  return picker;
}
