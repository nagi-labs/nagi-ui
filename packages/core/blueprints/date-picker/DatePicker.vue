<script setup lang="ts">
import { ref, type StyleValue } from "vue";

import { useDatePicker, type AnchorArea } from "@nagi-labs/nagi-ui";
import { useDatePickerNativeForm } from "@nagi-labs/nagi-ui/component-controls";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    label: string;
    id?: string;
    class?: string;
    style?: StyleValue;
    title?: string;
    calendarLabel?: string;
    triggerLabel?: string;
    name?: string;
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
    triggerLabel: "Choose date",
    locale: "en-US",
    timeZone: "UTC",
    unavailableDates: () => [],
    disabled: false,
    readOnly: false,
    required: false,
    invalid: false,
    validationMessage: "Choose an available date.",
    previousLabel: "Previous month",
    nextLabel: "Next month",
    area: "block-end",
    offset: 4,
  },
);

const model = defineModel<string | null>({ default: null });
const open = defineModel<boolean>("open", { default: false });
const formControl = ref<HTMLInputElement | null>(null);
const picker = useDatePicker(props, { value: model, open });
useDatePickerNativeForm(formControl, picker);
</script>

<template>
  <div
    :id="props.id"
    data-scope="date-picker"
    data-part="root"
    class="n-date-picker"
    :class="props.class"
    :style="props.style"
    :title="props.title"
  >
    <span class="text -field-title">{{ label }}</span>
    <div
      v-bind="picker.field.fieldProps"
      data-scope="date-picker"
      data-part="field"
      class="field"
      :aria-describedby="picker.isInvalid.value ? `${picker.field.fieldProps.id}-error` : undefined"
    >
      <template
        v-for="segment in picker.field.segments.value"
        :key="segment.key"
      >
        <span
          v-bind="picker.field.segmentProps(segment)"
          data-scope="date-picker"
          data-part="segment"
          class="text -segment"
          :data-literal="segment.type === 'literal' || undefined"
          :data-placeholder="segment.value === undefined || undefined"
          >{{ segment.text }}</span
        >
      </template>
      <button
        v-bind="picker.popover.triggerProps"
        data-scope="date-picker"
        data-part="trigger"
        type="button"
        class="button -trigger"
        :aria-label="triggerLabel"
        :disabled="disabled"
      >
        ▦
      </button>
      <input
        ref="formControl"
        v-bind="picker.field.formValueProps"
        data-scope="date-picker"
        data-part="form-control"
        class="input -form-value"
      />
    </div>
    <div
      v-bind="picker.popover.popoverProps"
      data-scope="date-picker"
      data-part="popup"
      class="unit"
      role="dialog"
      popover
      :aria-label="calendarLabel ?? label"
    >
      <header class="header">
        <button
          v-bind="picker.calendar.previousButtonProps"
          class="button -previous"
        >
          ‹
        </button>
        <h2
          class="title"
          aria-live="polite"
        >
          {{ picker.calendar.monthLabel.value }}
        </h2>
        <button
          v-bind="picker.calendar.nextButtonProps"
          class="button -next"
        >
          ›
        </button>
      </header>
      <table
        v-bind="picker.calendar.gridProps"
        data-scope="date-picker"
        data-part="grid"
        class="table"
        :aria-describedby="
          picker.isInvalid.value ? `${picker.field.fieldProps.id}-error` : undefined
        "
      >
        <thead class="thead -head">
          <tr class="row">
            <th
              v-for="weekday in picker.calendar.weekdayLabels.value"
              :key="weekday"
              class="cell -head"
              scope="col"
            >
              {{ weekday }}
            </th>
          </tr>
        </thead>
        <tbody class="tbody -dates">
          <tr
            v-for="(week, index) in picker.calendar.weeks.value"
            :key="index"
            class="row"
          >
            <td
              v-for="cell in week"
              :key="cell.key"
              v-bind="picker.calendar.gridCellProps(cell)"
              class="cell"
              :data-outside-month="cell.outsideMonth || undefined"
            >
              <button
                v-bind="picker.calendar.cellButtonProps(cell)"
                data-scope="date-picker"
                data-part="day"
                class="button -day"
              >
                {{ cell.day }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <span
      v-if="picker.isInvalid.value"
      :id="`${picker.field.fieldProps.id}-error`"
      class="text -validation"
      role="alert"
      >{{ validationMessage }}</span
    >
  </div>
</template>

<style scoped>
.n-date-picker {
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

  > .field {
    position: relative;
    display: flex;
    align-items: center;
    min-block-size: var(--nagi-size-control);
    padding-inline-start: var(--nagi-space-control);
    border: var(--n-border-width-1) solid var(--nagi-color-border);
    border-radius: var(--nagi-radius-control);
    background: var(--nagi-color-surface);
    font-variant-numeric: tabular-nums;

    &:focus-within {
      border-color: var(--nagi-color-focus-ring);
      box-shadow: var(--nagi-shadow-focus);
    }
    &[aria-disabled="true"] {
      color: var(--nagi-color-text-disabled);
    }
    &[aria-readonly="true"] {
      background: var(--nagi-color-surface-active);
    }
    &[aria-invalid="true"] {
      border-color: var(--nagi-color-danger);
    }

    > .text.-segment {
      border-radius: var(--nagi-radius-control);
      outline: none;
      cursor: text;
      &:focus {
        background: var(--nagi-color-surface-active);
        color: var(--nagi-color-text);
      }
      &[data-literal="true"] {
        cursor: default;
      }
      &[data-placeholder="true"] {
        color: var(--nagi-color-text-muted);
      }
    }

    > .button.-trigger {
      align-self: stretch;
      min-inline-size: var(--nagi-size-control);
      margin-inline-start: var(--nagi-space-item-gap);
      border: 0;
      border-inline-start: var(--n-border-width-1) solid var(--nagi-color-border);
      border-radius: 0 var(--nagi-radius-control) var(--nagi-radius-control) 0;
      background: var(--nagi-color-surface-accent);
      color: inherit;
      font: inherit;
      cursor: pointer;
      &:hover:not(:disabled) {
        background: var(--nagi-color-surface-active);
      }
      &:focus-visible {
        outline: none;
        box-shadow: var(--nagi-shadow-focus);
      }
      &:disabled {
        color: var(--nagi-color-text-disabled);
        cursor: not-allowed;
      }
    }

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

  > .unit {
    margin: 0;
    padding: var(--nagi-space-control);
    border: var(--n-border-width-1) solid var(--nagi-color-border-muted);
    border-radius: var(--nagi-radius-overlay);
    background: var(--nagi-color-surface);
    color: var(--nagi-color-text);
    box-shadow: var(--nagi-shadow-overlay);

    > .header {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      align-items: center;
      gap: var(--nagi-space-item-gap);

      > .title {
        margin: 0;
        text-align: center;
        font-size: var(--nagi-font-size-label);
      }
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
        &:hover:not(:disabled) {
          background: var(--nagi-color-surface-active);
        }
        &:focus-visible {
          outline: none;
          border-color: var(--nagi-color-focus-ring);
          box-shadow: var(--nagi-shadow-focus);
        }
        &:disabled {
          color: var(--nagi-color-text-disabled);
          cursor: not-allowed;
        }
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
          &:hover:not(:disabled) {
            background: var(--nagi-color-surface-active);
          }
          &:focus-visible {
            outline: none;
            border-color: var(--nagi-color-focus-ring);
            box-shadow: var(--nagi-shadow-focus);
          }
          &:disabled {
            color: var(--nagi-color-text-disabled);
            cursor: not-allowed;
          }
        }
        &[data-outside-month] > .button.-day {
          color: var(--nagi-color-text-muted);
        }
        &[aria-selected="true"] > .button.-day {
          background: var(--nagi-color-surface-accent);
          color: var(--nagi-color-text);
          box-shadow: inset 0 0 0 var(--n-border-width-1) var(--nagi-color-accent);
        }
      }
    }
  }
}

@media (forced-colors: active) {
  .n-date-picker > .field > :is(.button, .text.-segment):focus-visible,
  .n-date-picker > .unit > .header > .button:focus-visible,
  .n-date-picker > .unit > .table > .tbody.-dates > .row > .cell > .button.-day:focus-visible {
    outline: 2px solid Highlight;
    outline-offset: var(--n-border-width-2);
  }
  .n-date-picker
    > .unit
    > .table
    > .tbody.-dates
    > .row
    > .cell[aria-selected="true"]
    > .button.-day {
    outline: 2px solid CanvasText;
  }
}
</style>
