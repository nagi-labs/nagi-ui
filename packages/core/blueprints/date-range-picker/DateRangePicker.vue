<script setup lang="ts">
import type { StyleValue } from "vue";

import { useDateRangePicker, type AnchorArea, type RangeCalendarValue } from "@nagi-labs/nagi-ui";

import DateRangePickerPopup from "./internal/DateRangePickerPopup.vue";
import { provideDateRangePickerContext } from "./internal/date-range-picker-context.ts";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    label: string;
    id?: string;
    class?: string;
    style?: StyleValue;
    title?: string;
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
const picker = useDateRangePicker(props, { value: model, open });
provideDateRangePickerContext(picker);
</script>

<template>
  <div
    :id="props.id"
    class="n-date-range-picker"
    :class="props.class"
    :style="props.style"
    :title="props.title"
  >
    <span class="text -field-title">{{ label }}</span>
    <div
      class="group"
      role="group"
      :aria-label="label"
    >
      <div
        v-bind="picker.startField.fieldProps"
        class="field -start"
        :aria-describedby="picker.error.describedBy.value"
      >
        <template
          v-for="segment in picker.startField.segments.value"
          :key="segment.key"
        >
          <span
            v-bind="picker.startField.segmentProps(segment)"
            class="text -segment"
            :data-literal="segment.type === 'literal' || undefined"
            :data-placeholder="segment.value === undefined || undefined"
            >{{ segment.text }}</span
          >
        </template>
        <input
          v-bind="picker.startField.formValueProps"
          class="input -form-value"
        />
      </div>
      <span
        class="text -range-separator"
        aria-hidden="true"
        >–</span
      >
      <div
        v-bind="picker.endField.fieldProps"
        class="field -end"
        :aria-describedby="picker.error.describedBy.value"
      >
        <template
          v-for="segment in picker.endField.segments.value"
          :key="segment.key"
        >
          <span
            v-bind="picker.endField.segmentProps(segment)"
            class="text -segment"
            :data-literal="segment.type === 'literal' || undefined"
            :data-placeholder="segment.value === undefined || undefined"
            >{{ segment.text }}</span
          >
        </template>
        <input
          v-bind="picker.endField.formValueProps"
          class="input -form-value"
        />
      </div>
      <button
        v-bind="picker.popover.triggerProps"
        type="button"
        class="button"
        :aria-label="triggerLabel"
        :disabled="disabled"
      >
        ▦
      </button>
    </div>
    <DateRangePickerPopup />
    <span
      v-if="picker.isInvalid.value"
      :id="picker.error.id"
      class="alert"
      role="alert"
      >{{ picker.startField.validationMessage.value }}</span
    >
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

  > .alert {
    color: var(--nagi-color-danger);
    font-size: var(--nagi-font-size-label);
  }

  > .group {
    display: flex;
    align-items: stretch;
    border: var(--n-border-width-1) solid var(--nagi-color-border);
    border-radius: var(--nagi-radius-control);
    background: var(--nagi-color-surface);

    &:focus-within {
      border-color: var(--nagi-color-focus-ring);
      box-shadow: var(--nagi-shadow-focus);
    }

    > .field {
      position: relative;
      display: flex;
      align-items: center;
      gap: var(--nagi-space-item-gap);
      min-block-size: var(--nagi-size-control);
      padding-inline: var(--nagi-space-control);
      font-variant-numeric: tabular-nums;

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
      &[aria-disabled="true"] {
        color: var(--nagi-color-text-disabled);
      }
      &[aria-readonly="true"] {
        background: var(--nagi-color-surface-active);
      }
      &[aria-invalid="true"] {
        color: var(--nagi-color-danger);
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

    > .text.-range-separator {
      align-self: center;
      color: var(--nagi-color-text-muted);
    }
    > .button {
      min-inline-size: var(--nagi-size-control);
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
  }
}

@media (forced-colors: active) {
  .n-date-range-picker {
    > .group {
      > .field {
        > :is(.button, .text.-segment):focus-visible {
          outline: 2px solid Highlight;
          outline-offset: var(--n-border-width-2);
        }
      }
    }
  }
}
</style>
