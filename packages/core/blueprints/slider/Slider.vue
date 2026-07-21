<script setup lang="ts">
import { ref, useId } from "vue";

import { useNativeNumberReset } from "@nagi-labs/nagi-ui";

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
const input = ref<HTMLInputElement | null>(null);
const generatedId = useId();

useNativeNumberReset(input, model);
</script>

<template>
  <div class="n-slider">
    <label class="label" :for="id ?? generatedId">{{ label }}</label>
    <input
      v-bind="$attrs"
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
.n-slider {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--nagi-space-item-gap);
  align-items: center;
  color: var(--nagi-color-text);

  &:has(> .input:disabled) {
    > .output {
      color: var(--nagi-color-text-disabled);
    }
  }

  > .label {
    color: var(--nagi-color-text-muted);
    font-size: var(--nagi-font-size-label);
    font-weight: 650;
  }

  > .output {
    grid-column: 2;
    grid-row: 1;
    min-inline-size: 3ch;
    color: var(--nagi-color-text);
    font-variant-numeric: tabular-nums;
    text-align: end;
  }

  > .input {
    grid-column: 1 / -1;
    grid-row: 2;
    inline-size: 100%;
    min-block-size: var(--nagi-size-control);
    margin: 0;
    accent-color: var(--nagi-color-accent);
    cursor: pointer;

    &:focus-visible {
      outline: none;
      border-radius: var(--nagi-radius-control);
      box-shadow: var(--nagi-shadow-focus);
    }

    &:disabled {
      cursor: not-allowed;
    }

  }
}
</style>
