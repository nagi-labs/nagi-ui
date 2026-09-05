import type { DateRangePickerBinding } from "@nagi-labs/nagi-ui";
import { inject, provide, type InjectionKey } from "vue";

const dateRangePickerContextKey: InjectionKey<DateRangePickerBinding> = Symbol("DateRangePicker");

export function provideDateRangePickerContext(picker: DateRangePickerBinding): void {
  provide(dateRangePickerContextKey, picker);
}

export function useDateRangePickerContext(): DateRangePickerBinding {
  const picker = inject(dateRangePickerContextKey);
  if (!picker) {
    throw new Error("DateRangePickerPopup must be rendered inside DateRangePicker.");
  }
  return picker;
}
