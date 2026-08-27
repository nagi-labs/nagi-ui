<script setup lang="ts">
import { ref } from "vue";

import {
  mergeNagiProps,
  useDateRangePicker,
  type AnchorArea,
  type RangeCalendarValue,
} from "@nagi-labs/nagi-ui";
import { useDateRangePickerNativeForm } from "@nagi-labs/nagi-ui/component-controls";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    label: string;
    startLabel?: string;
    endLabel?: string;
    calendarLabel?: string;
    triggerLabel?: string;
    startName?: string;
    endName?: string;
    form?: string;
    locale?: string;
    timeZone?: string;
    min?: string;
    max?: string;
    unavailableDates?: readonly string[];
    disabled?: boolean;
    readOnly?: boolean;
    required?: boolean;
    invalid?: boolean;
    validationMessage?: string;
    previousLabel?: string;
    nextLabel?: string;
    defaultVisibleMonth?: string;
    area?: AnchorArea;
    offset?: number;
  }>(),
  {
    startLabel: "Start date",
    endLabel: "End date",
    triggerLabel: "Choose date range",
    locale: "en-US",
    timeZone: "UTC",
    unavailableDates: () => [],
    disabled: false,
    readOnly: false,
    required: false,
    invalid: false,
    validationMessage: "Choose an available date range.",
    previousLabel: "Previous month",
    nextLabel: "Next month",
    area: "block-end",
    offset: 4,
  },
);

const model = defineModel<RangeCalendarValue | null>({ default: null });
const open = defineModel<boolean>("open", { default: false });
const startFormControl = ref<HTMLInputElement | null>(null);
const endFormControl = ref<HTMLInputElement | null>(null);
const picker = useDateRangePicker(props, { value: model, open });
useDateRangePickerNativeForm({ start: startFormControl, end: endFormControl }, picker);
</script>

<template>
  <div v-bind="$attrs" class="n-date-range-picker">
    <span class="text -field-title">{{ label }}</span>
    <div class="unit -fields" role="group" :aria-label="label">
      <div
        v-bind="picker.startField.fieldProps"
        class="field -start"
        :aria-describedby="picker.isInvalid.value ? `${picker.startField.fieldProps.id}-error` : undefined"
      >
        <span class="text -assistive">{{ startLabel }}</span>
        <template v-for="segment in picker.startField.segments.value" :key="segment.key">
          <span
            v-bind="picker.startField.segmentProps(segment)"
            class="text -segment"
            :data-literal="segment.type === 'literal' || undefined"
          :data-placeholder="segment.value === undefined || undefined"
          >{{ segment.text }}</span>
        </template>
        <input ref="startFormControl" v-bind="picker.startField.formValueProps" class="input -form-value" />
      </div>
      <span class="text -range-separator" aria-hidden="true">–</span>
      <div
        v-bind="picker.endField.fieldProps"
        class="field -end"
        :aria-describedby="picker.isInvalid.value ? `${picker.startField.fieldProps.id}-error` : undefined"
      >
        <span class="text -assistive">{{ endLabel }}</span>
        <template v-for="segment in picker.endField.segments.value" :key="segment.key">
          <span
            v-bind="picker.endField.segmentProps(segment)"
            class="text -segment"
            :data-literal="segment.type === 'literal' || undefined"
          :data-placeholder="segment.value === undefined || undefined"
          >{{ segment.text }}</span>
        </template>
        <input ref="endFormControl" v-bind="picker.endField.formValueProps" class="input -form-value" />
      </div>
      <button
        v-bind="mergeNagiProps(picker.popover.triggerProps, {
          'aria-haspopup': 'dialog',
          'aria-label': triggerLabel,
          disabled,
        })"
        type="button"
        class="button -trigger"
      >▦</button>
    </div>
    <div
      v-bind="picker.popover.popoverProps"
      class="dialog"
      role="dialog"
      popover
      :aria-label="calendarLabel ?? label"
    >
      <header class="header">
        <button v-bind="picker.calendar.previousButtonProps" class="button -previous">‹</button>
        <h2 class="title" aria-live="polite">{{ picker.calendar.monthLabel.value }}</h2>
        <button v-bind="picker.calendar.nextButtonProps" class="button -next">›</button>
      </header>
      <table
        v-bind="picker.calendar.gridProps"
        class="table"
        :aria-describedby="picker.isInvalid.value ? `${picker.startField.fieldProps.id}-error` : undefined"
      >
        <thead class="thead -head"><tr class="row">
          <th v-for="weekday in picker.calendar.weekdayLabels.value" :key="weekday" class="cell -head" scope="col">{{ weekday }}</th>
        </tr></thead>
        <tbody class="tbody -dates">
          <tr v-for="(week, index) in picker.calendar.weeks.value" :key="index" class="row">
            <td
              v-for="cell in week"
              :key="cell.key"
              v-bind="picker.calendar.gridCellProps(cell)"
              class="cell"
              :data-outside-month="cell.outsideMonth || undefined"
              :data-preview="cell.preview || undefined"
              :data-range-start="cell.rangeStart || undefined"
              :data-range-end="cell.rangeEnd || undefined"
            ><button v-bind="picker.calendar.cellButtonProps(cell)" class="button -day">{{ cell.day }}</button></td>
          </tr>
        </tbody>
      </table>
      <span class="text -assistive" role="status" aria-live="polite" aria-atomic="true">
        {{ picker.calendar.announcement.value }}
      </span>
    </div>
    <span
      v-if="picker.isInvalid.value"
      :id="`${picker.startField.fieldProps.id}-error`"
      class="text -validation"
      role="alert"
    >{{ validationMessage }}</span>
  </div>
</template>

<style scoped>
.n-date-range-picker {
  display: grid;
  gap: var(--nagi-space-item-gap);
  inline-size: fit-content;
  color: var(--nagi-color-text);

  > .text.-field-title {
    color: var(--nagi-color-text-muted);
    font-size: var(--nagi-font-size-label);
    font-weight: 650;
  }

  > .text.-validation {
    color: var(--nagi-color-danger);
    font-size: var(--nagi-font-size-label);
  }

  > .unit.-fields {
    display: flex;
    align-items: stretch;
    border: var(--n-border-width-1) solid var(--nagi-color-border);
    border-radius: var(--nagi-radius-control);
    background: var(--nagi-color-surface);

    &:focus-within { border-color: var(--nagi-color-focus-ring); box-shadow: var(--nagi-shadow-focus); }

    > .field {
      position: relative;
      display: flex;
      align-items: center;
      gap: var(--nagi-space-item-gap);
      min-block-size: var(--nagi-size-control);
      padding-inline: var(--nagi-space-control);
      font-variant-numeric: tabular-nums;

      > .text.-assistive {
        position: absolute;
        inline-size: 1px;
        block-size: 1px;
        clip-path: inset(50%);
        overflow: hidden;
        white-space: nowrap;
      }
      > .text.-segment {
        border-radius: var(--nagi-radius-control);
        outline: none;
        cursor: text;
        &:focus { background: var(--nagi-color-surface-active); color: var(--nagi-color-text); }
        &[data-literal="true"] { cursor: default; }
        &[data-placeholder="true"] { color: var(--nagi-color-text-muted); }
      }
      &[aria-disabled="true"] { color: var(--nagi-color-text-disabled); }
      &[aria-readonly="true"] { background: var(--nagi-color-surface-active); }
      &[aria-invalid="true"] { color: var(--nagi-color-danger); }
      > .input.-form-value {
        position: absolute;
        inline-size: 1px;
        block-size: 1px;
        padding: 0;
        border: 0;
        clip-path: inset(50%);
        overflow: hidden;
        white-space: nowrap;
      }
    }

    > .text.-range-separator { align-self: center; color: var(--nagi-color-text-muted); }
    > .button.-trigger {
      min-inline-size: var(--nagi-size-control);
      border: 0;
      border-inline-start: var(--n-border-width-1) solid var(--nagi-color-border);
      border-radius: 0 var(--nagi-radius-control) var(--nagi-radius-control) 0;
      background: var(--nagi-color-surface-accent);
      color: inherit;
      font: inherit;
      cursor: pointer;
      &:hover:not(:disabled) { background: var(--nagi-color-surface-active); }
      &:focus-visible { outline: none; box-shadow: var(--nagi-shadow-focus); }
      &:disabled { color: var(--nagi-color-text-disabled); cursor: not-allowed; }
    }
  }

  > .dialog {
    margin: 0;
    padding: var(--nagi-space-control);
    border: var(--n-border-width-1) solid var(--nagi-color-border-muted);
    border-radius: var(--nagi-radius-overlay);
    background: var(--nagi-color-surface);
    color: var(--nagi-color-text);
    box-shadow: var(--nagi-shadow-overlay);

    > .text.-assistive {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      clip-path: inset(50%);
      overflow: hidden;
      white-space: nowrap;
    }

    > .header {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      align-items: center;
      gap: var(--nagi-space-item-gap);
      > .title { margin: 0; text-align: center; font-size: var(--nagi-font-size-label); }
      > .button {
        inline-size: var(--nagi-size-control);
        min-block-size: var(--nagi-size-control);
        padding: 0;
        border: var(--n-border-width-1) solid var(--nagi-color-border);
        border-radius: var(--nagi-radius-control);
        background: var(--nagi-color-surface);
        color: inherit;
        font: inherit;
        cursor: pointer;
        &:hover:not(:disabled) { background: var(--nagi-color-surface-active); }
        &:focus-visible { outline: none; border-color: var(--nagi-color-focus-ring); box-shadow: var(--nagi-shadow-focus); }
        &:disabled { color: var(--nagi-color-text-disabled); cursor: not-allowed; }
      }
    }

    > .table {
      border-collapse: collapse;
      > .thead.-head > .row > .cell.-head {
        min-inline-size: var(--nagi-size-control);
        block-size: var(--nagi-size-control);
        color: var(--nagi-color-text-muted);
        font-size: var(--nagi-font-size-label);
        font-weight: 650;
      }
      > .tbody.-dates > .row > .cell {
        padding: 0;
        > .button.-day {
          inline-size: var(--nagi-size-control);
          min-block-size: var(--nagi-size-control);
          padding: 0;
          border: var(--n-border-width-1) solid transparent;
          border-radius: var(--nagi-radius-control);
          background: transparent;
          color: inherit;
          font: inherit;
          cursor: pointer;
          &:hover:not(:disabled) { background: var(--nagi-color-surface-active); }
          &:focus-visible { outline: none; border-color: var(--nagi-color-focus-ring); box-shadow: var(--nagi-shadow-focus); }
          &:disabled { color: var(--nagi-color-text-disabled); cursor: not-allowed; }
        }
        &[data-outside-month] > .button.-day { color: var(--nagi-color-text-muted); }
        &[data-preview] > .button.-day { background: var(--nagi-color-surface-active); }
        &[aria-selected="true"] > .button.-day {
          border-radius: 0;
          background: var(--nagi-color-surface-accent);
          color: var(--nagi-color-text);
          box-shadow: inset 0 0 0 var(--n-border-width-1) var(--nagi-color-accent);
        }
        &[data-range-start] > .button.-day {
          border-start-start-radius: var(--nagi-radius-control);
          border-end-start-radius: var(--nagi-radius-control);
        }
        &[data-range-end] > .button.-day {
          border-start-end-radius: var(--nagi-radius-control);
          border-end-end-radius: var(--nagi-radius-control);
        }
      }
    }
  }
}

@media (forced-colors: active) {
  .n-date-range-picker > .unit.-fields > .field > :is(.button, .text.-segment):focus-visible,
  .n-date-range-picker > .dialog > .header > .button:focus-visible,
  .n-date-range-picker > .dialog > .table > .tbody.-dates > .row > .cell > .button.-day:focus-visible {
    outline: 2px solid Highlight;
    outline-offset: var(--n-border-width-2);
  }
  .n-date-range-picker > .dialog > .table > .tbody.-dates > .row > .cell[aria-selected="true"] > .button.-day {
    outline: 2px solid CanvasText;
  }
}
</style>
