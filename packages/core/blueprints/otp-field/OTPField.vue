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
    "--otp-max-inline-size": `calc(${count} * var(--nagi-size-control) + ${count - 1} * var(--nagi-space-item-gap))`,
    "--otp-columns": String(count),
  };
});
useNativeValueReset(input, model);
</script>

<template>
  <label class="n-otp-field">
    <span class="label">{{ label }}</span>
    <span class="field" :style="fieldStyle">
      <input ref="input" v-bind="mergeNagiProps(field.otpInputProps, $attrs)" class="input" />
      <span class="cells" aria-hidden="true">
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

  > .label { color: var(--nagi-color-text-muted); font-size: var(--nagi-font-size-label); font-weight: 650; }

  > .field {
    position: relative;
    display: inline-grid;
    inline-size: 100%;
    max-inline-size: var(--otp-max-inline-size);

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
      letter-spacing: 1em;
    }

    > .cells {
      display: grid;
      grid-template-columns: repeat(var(--otp-columns), minmax(0, 1fr));
      gap: var(--nagi-space-item-gap);

      > .cell {
        display: grid;
        place-items: center;
        min-inline-size: 0;
        min-block-size: var(--nagi-size-control);
        border: 1px solid var(--nagi-color-border);
        border-radius: var(--nagi-radius-control);
        background: var(--nagi-color-surface);
        font-variant-numeric: tabular-nums;
      }
    }

    &:focus-within > .cells > .cell { border-color: var(--nagi-color-focus-ring); }
    &:focus-within { border-radius: var(--nagi-radius-control); box-shadow: var(--nagi-shadow-focus); }
    &:has(> :is(.input:invalid, .input[aria-invalid="true"])) > .cells > .cell {
      border-color: var(--nagi-color-danger);
    }
    &:has(> .input:disabled) > .cells > .cell {
      background: var(--nagi-color-surface-active);
      color: var(--nagi-color-text-disabled);
    }
    &:has(> .input:read-only) > .cells > .cell { background: var(--nagi-color-surface-active); }
  }
}

@media (forced-colors: active) {
  .n-otp-field > .field:focus-within { outline: 2px solid Highlight; }
}
</style>
