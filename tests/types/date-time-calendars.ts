import { ref } from "vue";

import {
  useCalendar,
  useDatePicker,
  useDateRangePicker,
  useRangeCalendar,
  type CalendarComponentProps,
  type DatePickerComponentProps,
  type DateRangePickerComponentProps,
  type RangeCalendarComponentProps,
  type RangeCalendarValue,
} from "@nagi-labs/nagi-ui";

const date = ref<string | null>("2026-07-23");
const range = ref<RangeCalendarValue | null>({
  start: "2026-07-23",
  end: "2026-07-25",
});
const open = ref(false);

useCalendar({ value: date, label: "Calendar", locale: "en-US" });
useRangeCalendar({ value: range, label: "Range", locale: "en-US" });

const calendarProps: CalendarComponentProps = {
  label: "Calendar",
  locale: "en-US",
  timeZone: "UTC",
  unavailableDates: [],
  disabled: false,
  readOnly: false,
  required: false,
  invalid: false,
  validationMessage: "Choose an available date.",
  previousLabel: "Previous month",
  nextLabel: "Next month",
};
useCalendar(calendarProps, date);

const rangeProps: RangeCalendarComponentProps = { ...calendarProps };
useRangeCalendar(rangeProps, range);

const pickerProps: DatePickerComponentProps = {
  ...calendarProps,
  triggerLabel: "Choose date",
  area: "block-end",
  offset: 4,
};
useDatePicker(pickerProps, { value: date, open });

const rangePickerProps: DateRangePickerComponentProps = {
  ...pickerProps,
  startLabel: "Start date",
  endLabel: "End date",
};
useDateRangePicker(rangePickerProps, { value: range, open });

// @ts-expect-error RangeCalendar requires a complete range model.
useRangeCalendar({ value: date, label: "Wrong model" });

// @ts-expect-error DatePicker component overload requires both value and open state.
useDatePicker(pickerProps, date);
