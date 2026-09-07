<script setup lang="ts">
import type { StyleValue } from "vue";

import { useTimeField, type TimeFieldGranularity } from "@nagi-labs/nagi-ui";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    label: string;
    class?: string;
    style?: StyleValue;
    id?: string;
    name?: string;
    form?: string;
    locale?: string;
    dir?: "ltr" | "rtl";
    granularity?: TimeFieldGranularity;
    hourCycle?: 12 | 24;
    min?: string;
    max?: string;
    disabled?: boolean;
    readOnly?: boolean;
    required?: boolean;
    invalid?: boolean;
    validationMessage?: string;
    hourLabel?: string;
    minuteLabel?: string;
    secondLabel?: string;
    dayPeriodLabel?: string;
    emptyLabel?: string;
    ariaDescribedby?: string;
  }>(),
  {
    locale: "en-US",
    granularity: "minute",
    disabled: false,
    readOnly: false,
    required: false,
    invalid: false,
    validationMessage: "Enter a valid time.",
    hourLabel: "Hour",
    minuteLabel: "Minute",
    secondLabel: "Second",
    dayPeriodLabel: "AM/PM",
    emptyLabel: "Empty",
  },
);
const emit = defineEmits<{ focusout: [event: FocusEvent] }>();

const model = defineModel<string | null>({ default: null });
const behavior = useTimeField(props, model);
</script>

<template>
  <div
    class="n-time-field"
    :class="props.class"
    :style="props.style"
  >
    <span class="text">{{ label }}</span>
    <div
      v-bind="behavior.fieldProps"
      @focusout="emit('focusout', $event)"
      class="field"
      :aria-describedby="behavior.error.describedBy.value"
    >
      <template
        v-for="segment in behavior.segments.value"
        :key="segment.key"
      >
        <span
          v-bind="behavior.segmentProps(segment)"
          class="text -segment"
          :data-literal="segment.type === 'literal' || undefined"
          :data-placeholder="segment.value === undefined || undefined"
          >{{ segment.text }}</span
        >
      </template>
      <input
        v-bind="behavior.formValueProps"
        class="input"
      />
    </div>
    <span
      v-if="behavior.isInvalid.value"
      :id="behavior.error.id"
      class="alert"
      role="alert"
      >{{ behavior.validationMessage.value }}</span
    >
  </div>
</template>

<style scoped>
.n-time-field {
  display: grid;
  gap: var(--nagi-space-item-gap);
  color: var(--nagi-color-text);

  > .text {
    color: var(--nagi-color-text-muted);
    font-size: var(--nagi-font-size-label);
    font-weight: 650;
  }

  > .alert {
    color: var(--nagi-color-danger);
  }

  > .field {
    position: relative;
    display: flex;
    align-items: center;
    inline-size: fit-content;
    min-block-size: var(--nagi-size-control);
    padding: var(--nagi-space-control);
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
      cursor: not-allowed;
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
        box-shadow: inset 0 0 0 var(--n-border-width-1) var(--nagi-color-focus-ring);
      }

      &[data-literal="true"] {
        cursor: default;
      }

      &[data-placeholder="true"] {
        color: var(--nagi-color-text-muted);
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
  .n-time-field {
    > .field {
      &:focus-within {
        outline: 2px solid Highlight;
        outline-offset: var(--n-border-width-2);
      }

      > .text.-segment:focus {
        outline: 1px solid Highlight;
      }
    }
  }
}
</style>
