<script setup lang="ts">
import { computed, ref, type StyleValue } from "vue";

import { useDateField } from "@nagi-labs/nagi-ui";
import { useDateFieldNativeForm } from "@nagi-labs/nagi-ui/component-controls";

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
    min?: string;
    max?: string;
    disabled?: boolean;
    readOnly?: boolean;
    required?: boolean;
    invalid?: boolean;
    validationMessage?: string;
    yearLabel?: string;
    monthLabel?: string;
    dayLabel?: string;
    emptyLabel?: string;
    ariaDescribedby?: string;
  }>(),
  {
    locale: "en-US",
    disabled: false,
    readOnly: false,
    required: false,
    invalid: false,
    validationMessage: "Enter a valid date.",
    yearLabel: "Year",
    monthLabel: "Month",
    dayLabel: "Day",
    emptyLabel: "Empty",
  },
);
const emit = defineEmits<{ focusout: [event: FocusEvent] }>();

const model = defineModel<string | null>({ default: null });
const formControl = ref<HTMLInputElement | null>(null);
const behavior = useDateField(props, model);
useDateFieldNativeForm(formControl, behavior);
const describedBy = computed(
  () =>
    [
      props.ariaDescribedby,
      behavior.isInvalid.value ? `${behavior.fieldProps.id}-error` : undefined,
    ]
      .filter(Boolean)
      .join(" ") || undefined,
);
</script>

<template>
  <div
    class="n-date-field"
    :class="props.class"
    :style="props.style"
  >
    <span class="text">{{ label }}</span>
    <div
      v-bind="behavior.fieldProps"
      @focusout="emit('focusout', $event)"
      class="field"
      :aria-describedby="describedBy"
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
        ref="formControl"
        v-bind="behavior.formValueProps"
        class="input"
      />
    </div>
    <span
      v-if="behavior.isInvalid.value"
      :id="`${behavior.fieldProps.id}-error`"
      class="alert"
      role="alert"
      >{{ validationMessage }}</span
    >
  </div>
</template>

<style scoped>
.n-date-field {
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
  .n-date-field {
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
