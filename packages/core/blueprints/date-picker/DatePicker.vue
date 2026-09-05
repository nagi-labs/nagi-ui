<script setup lang="ts">
import type { StyleValue } from "vue";

import { useDatePicker, type AnchorArea } from "@nagi-labs/nagi-ui";

import DatePickerPopup from "./internal/DatePickerPopup.vue";
import { provideDatePickerContext } from "./internal/date-picker-context.ts";

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
const picker = useDatePicker(props, { value: model, open });
provideDatePickerContext(picker);
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
      :aria-describedby="picker.error.describedBy.value"
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
        class="button"
        :aria-label="triggerLabel"
        :disabled="disabled"
      >
        ▦
      </button>
      <input
        v-bind="picker.field.formValueProps"
        data-scope="date-picker"
        data-part="form-control"
        class="input"
      />
    </div>
    <DatePickerPopup />
    <span
      v-if="picker.isInvalid.value"
      :id="picker.error.id"
      class="alert"
      role="alert"
      >{{ picker.field.validationMessage.value }}</span
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

  > .alert {
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

    > .button {
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

    > .input {
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
}

@media (forced-colors: active) {
  .n-date-picker {
    > .field {
      > :is(.button, .text.-segment):focus-visible {
        outline: 2px solid Highlight;
        outline-offset: var(--n-border-width-2);
      }
    }
  }
}
</style>
