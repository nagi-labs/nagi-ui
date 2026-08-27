<script setup lang="ts">
import { computed, ref } from "vue";

import { mergeNagiProps, useOTPField } from "@nagi-labs/nagi-ui";
import { useNativeValueReset } from "@nagi-labs/nagi-ui/component-controls";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<{
  label: string;
  length?: number;
  kind?: "numeric" | "alphanumeric";
  name?: string;
  form?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  invalid?: boolean;
}>(), {
  length: 6,
  kind: "numeric",
  disabled: false,
  readOnly: false,
  required: false,
  invalid: false,
});

const model = defineModel<string>({ default: "" });
const input = ref<HTMLInputElement | null>(null);
const field = useOTPField(props, model);
const fieldStyle = computed(() => {
  const count = field.cells.value.length;
  return {
    "--local-otp-max-inline-size": `calc(${count} * var(--nagi-size-control) + ${count - 1} * var(--nagi-space-item-gap))`,
    "--local-otp-columns": String(count),
  };
});
useNativeValueReset(input, model);
</script>

<template>
  <label class="n-otp-field">
    <span class="value -prompt">{{ label }}</span>
    <span class="field" :style="fieldStyle">
      <input ref="input" v-bind="mergeNagiProps(field.otpInputProps, $attrs)" class="input" />
      <span class="unit -digits" aria-hidden="true">
        <span
          v-for="(_cell, index) in field.cells.value"
          :key="index"
          class="cell"
        >{{ field.cells.value[index] || '·' }}</span>
      </span>
    </span>
  </label>
</template>

<style scoped>
.n-otp-field {
  display: grid;
  gap: var(--nagi-space-item-gap);
  color: var(--nagi-color-text);

  > .value.-prompt { color: var(--nagi-color-text-muted); font-size: var(--nagi-font-size-label); font-weight: 650; }

  > .field {
    position: relative;
    display: inline-grid;
    inline-size: 100%;
    max-inline-size: var(--local-otp-max-inline-size);

    > .input {
      position: absolute;
      z-index: 1;
      inset: 0;
      inline-size: 100%;
      block-size: 100%;
      border: 0;
      padding: 0;
      outline: 0;
      background: transparent;
      color: transparent;
      caret-color: var(--nagi-color-text);
      font: inherit;
      letter-spacing: var(--n-font-size-4);
    }

    > .unit.-digits {
      display: grid;
      grid-template-columns: repeat(var(--local-otp-columns), minmax(0, 1fr));
      gap: var(--nagi-space-item-gap);

      > .cell {
        display: grid;
        place-items: center;
        min-inline-size: 0;
        min-block-size: var(--nagi-size-control);
        border: var(--n-border-width-1) solid var(--nagi-color-border);
        border-radius: var(--nagi-radius-control);
        background: var(--nagi-color-surface);
        font-variant-numeric: tabular-nums;
      }
    }

    &:focus-within > .unit.-digits > .cell { border-color: var(--nagi-color-focus-ring); }
    &:focus-within { border-radius: var(--nagi-radius-control); box-shadow: var(--nagi-shadow-focus); }
    &:has(> :is(.input:invalid, .input[aria-invalid="true"])) > .unit.-digits > .cell {
      border-color: var(--nagi-color-danger);
    }
    &:has(> .input:disabled) > .unit.-digits > .cell {
      background: var(--nagi-color-surface-active);
      color: var(--nagi-color-text-disabled);
    }
    &:has(> .input:read-only) > .unit.-digits > .cell { background: var(--nagi-color-surface-active); }
  }
}

@media (forced-colors: active) {
  .n-otp-field > .field:focus-within { outline: 2px solid Highlight; }
}
</style>
