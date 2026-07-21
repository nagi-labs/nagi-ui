<script setup lang="ts">
import { ref, useAttrs, useId } from "vue";

import { useNativeFormReset } from "@nagi-labs/nagi-ui";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    label: string;
    id?: string;
    name?: string;
    form?: string;
    min?: number;
    max?: number;
    step?: number | "any";
    disabled?: boolean;
  }>(),
  {
    min: 0,
    max: 100,
    step: 1,
    disabled: false,
  },
);

const model = defineModel<number>({ default: 0 });
const attrs = useAttrs();
const input = ref<HTMLInputElement | null>(null);
const generatedId = useId();
const initialValue = model.value;

useNativeFormReset(
  input,
  (control) => {
    model.value = initialValue;
    control.value = String(initialValue);
  },
  () => props.form,
);
</script>

<template>
  <div class="nagi-slider">
    <label class="label" :for="id ?? generatedId">{{ label }}</label>
    <input
      v-bind="attrs"
      ref="input"
      v-model.number="model"
      class="input"
      type="range"
      :id="id ?? generatedId"
      :name="name"
      :form="form"
      :min="min"
      :max="max"
      :step="step"
      :disabled="disabled"
    />
    <output class="output" :for="id ?? generatedId">{{ model }}</output>
  </div>
</template>

<style scoped>
.nagi-slider {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--nagi-space-item-gap, 0.55rem);
  align-items: center;
  color: var(--nagi-color-text, #17323b);

  &:has(> .input:disabled) {
    > .output {
      color: var(--nagi-color-text-disabled, #91a1a6);
    }
  }

  > .label {
    color: var(--nagi-color-text-muted, #50676f);
    font-size: var(--nagi-font-size-label, 0.72rem);
    font-weight: 650;
  }

  > .output {
    grid-column: 2;
    grid-row: 1;
    min-inline-size: 3ch;
    color: var(--nagi-color-text, #17323b);
    font-variant-numeric: tabular-nums;
    text-align: end;
  }

  > .input {
    grid-column: 1 / -1;
    grid-row: 2;
    inline-size: 100%;
    min-block-size: var(--nagi-size-control, 2rem);
    margin: 0;
    accent-color: var(--nagi-color-accent, #16768b);
    cursor: pointer;

    &:focus-visible {
      outline: none;
      border-radius: var(--nagi-radius-control, 0.55rem);
      box-shadow: var(--nagi-shadow-focus, 0 0 0 2px rgb(117 173 186 / 0.35));
    }

    &:disabled {
      cursor: not-allowed;
    }

  }
}
</style>
