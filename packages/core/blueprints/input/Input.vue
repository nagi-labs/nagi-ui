<script setup lang="ts">
import { ref } from "vue";

import { useNativeValueReset } from "@nagi-labs/nagi-ui";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    label: string;
    type?:
      | "text"
      | "email"
      | "password"
      | "search"
      | "tel"
      | "url"
      | "date"
      | "datetime-local"
      | "month"
      | "time"
      | "week";
    name?: string;
    form?: string;
    disabled?: boolean;
    required?: boolean;
    readOnly?: boolean;
  }>(),
  {
    type: "text",
    disabled: false,
    required: false,
    readOnly: false,
  },
);

const model = defineModel<string>({ default: "" });
const input = ref<HTMLInputElement | null>(null);

useNativeValueReset(input, model);
</script>

<template>
  <label class="n-input">
    <span class="unit">{{ label }}</span>
    <input
      v-bind="$attrs"
      ref="input"
      v-model="model"
      class="input"
      :type="type"
      :name="name"
      :form="form"
      :disabled="disabled"
      :required="required"
      :readonly="readOnly"
    />
  </label>
</template>

<style scoped>
.n-input {
  display: grid;
  gap: var(--nagi-space-item-gap);
  color: var(--nagi-color-text);

  > .unit {
    color: var(--nagi-color-text-muted);
    font-size: var(--nagi-font-size-label);
    font-weight: 650;
  }

  > .input {
    box-sizing: border-box;
    inline-size: 100%;
    min-block-size: var(--nagi-size-control);
    padding: var(--nagi-space-control);
    border: var(--n-border-width-1) solid var(--nagi-color-border);
    border-radius: var(--nagi-radius-control);
    background: var(--nagi-color-surface);
    color: var(--nagi-color-text);
    font: inherit;

    &::placeholder {
      color: var(--nagi-color-text-muted);
    }

    &:focus-visible {
      outline: none;
      border-color: var(--nagi-color-focus-ring);
      box-shadow: var(--nagi-shadow-focus);
    }

    &:read-only {
      background: var(--nagi-color-surface-active);
    }

    &:disabled {
      color: var(--nagi-color-text-disabled);
      cursor: not-allowed;
    }

    &:user-invalid,
    &[aria-invalid="true"] {
      border-color: var(--nagi-color-danger);
    }
  }
}

@media (forced-colors: active) {
  .n-input > .input:focus-visible {
    outline: 2px solid Highlight;
    outline-offset: var(--n-border-width-2);
  }
}
</style>
