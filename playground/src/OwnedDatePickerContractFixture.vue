<script setup lang="ts">
import { ref } from "vue";

import { useDatePicker } from "@nagi-labs/nagi-ui";

const props = withDefaults(
  defineProps<{
    label: string;
    calendarLabel: string;
    triggerLabel: string;
    name?: string;
    form?: string;
    locale?: string;
    timeZone?: string;
    defaultVisibleMonth?: string;
    min?: string;
    max?: string;
    unavailableDates?: readonly string[];
    disabled?: boolean;
    readOnly?: boolean;
    required?: boolean;
    invalid?: boolean;
    validationMessage?: string;
  }>(),
  {
    locale: "en-US",
    timeZone: "UTC",
    unavailableDates: () => [],
    disabled: false,
    readOnly: false,
    required: false,
    invalid: false,
    validationMessage: "Choose an available date.",
  },
);

const value = defineModel<string | null>({ default: null });
const open = defineModel<boolean>("open", { default: false });
const formControl = ref<HTMLInputElement | null>(null);
const picker = useDatePicker({
  value,
  open,
  label: () => props.label,
  calendarLabel: () => props.calendarLabel,
  locale: () => props.locale,
  timeZone: () => props.timeZone,
  defaultVisibleMonth: () => props.defaultVisibleMonth,
  name: () => props.name,
  form: () => props.form,
  minValue: () => props.min,
  maxValue: () => props.max,
  unavailableDates: () => props.unavailableDates,
  disabled: () => props.disabled,
  readOnly: () => props.readOnly,
  required: () => props.required,
  invalid: () => props.invalid,
  validationMessage: () => props.validationMessage,
  formControl,
});
</script>

<template>
  <div
    data-scope="date-picker"
    data-part="root"
  >
    <div class="owned-field-layout">
      <div
        v-bind="picker.field.fieldProps"
        data-scope="date-picker"
        data-part="field"
      >
        <span
          v-for="segment in picker.field.segments.value"
          :key="segment.key"
          v-bind="picker.field.segmentProps(segment)"
          data-scope="date-picker"
          data-part="segment"
          >{{ segment.text }}</span
        >
        <span class="owned-trigger-wrapper">
          <button
            v-bind="picker.popover.triggerProps"
            data-scope="date-picker"
            data-part="trigger"
            type="button"
            :aria-label="triggerLabel"
            :disabled="disabled"
          >
            ▦
          </button>
        </span>
        <input
          ref="formControl"
          v-bind="picker.field.formValueProps"
          data-scope="date-picker"
          data-part="form-control"
        />
      </div>
    </div>
    <div class="owned-popup-wrapper">
      <div
        v-bind="picker.popover.popoverProps"
        data-scope="date-picker"
        data-part="popup"
        role="dialog"
        :aria-label="calendarLabel"
        popover
      >
        <header>
          <button v-bind="picker.calendar.previousButtonProps">‹</button>
          <h2 aria-live="polite">{{ picker.calendar.monthLabel.value }}</h2>
          <button v-bind="picker.calendar.nextButtonProps">›</button>
        </header>
        <table
          v-bind="picker.calendar.gridProps"
          data-scope="date-picker"
          data-part="grid"
        >
          <thead>
            <tr>
              <th
                v-for="weekday in picker.calendar.weekdayLabels.value"
                :key="weekday"
                scope="col"
              >
                {{ weekday }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(week, index) in picker.calendar.weeks.value"
              :key="index"
            >
              <td
                v-for="cell in week"
                :key="cell.key"
                v-bind="picker.calendar.gridCellProps(cell)"
              >
                <button
                  v-bind="picker.calendar.cellButtonProps(cell)"
                  data-scope="date-picker"
                  data-part="day"
                >
                  {{ cell.day }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
