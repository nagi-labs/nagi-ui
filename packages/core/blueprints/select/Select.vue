<script lang="ts">
export interface NagiSelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}
</script>

<script setup lang="ts">
import { ref, useId } from "vue";

import { useSelect } from "@nagi-labs/nagi-ui/component-controls";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    label: string;
    options: readonly NagiSelectOption[];
    id?: string;
    name?: string;
    disabled?: boolean;
    required?: boolean;
    form?: string;
  }>(),
  {
    disabled: false,
    required: false,
  },
);

const model = defineModel<string | undefined>();
const generatedId = useId();
const select = ref<HTMLSelectElement | null>(null);
const selectBinding = useSelect(select, model);
</script>

<template>
  <div class="n-select">
    <label class="label" :for="id ?? generatedId">{{ label }}</label>
    <select
      ref="select"
      v-bind="$attrs"
      class="select"
      :id="id ?? generatedId"
      :name="name"
      :disabled="disabled"
      :required="required"
      :form="form"
      @change="selectBinding.onChange"
    >
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
        :disabled="option.disabled"
        v-bind="selectBinding.selectedProps(option.value)"
      >
        {{ option.label }}
      </option>
    </select>
  </div>
</template>

<style scoped>
.n-select {
  display: grid;
  gap: 0.35rem;
  color: var(--nagi-color-text);
  font: inherit;

  > .label {
    color: var(--nagi-color-text-muted);
    font-size: var(--nagi-font-size-label);
    font-weight: 650;
  }

  > .select {
    min-block-size: var(--nagi-size-control);
    padding: var(--nagi-space-control);
    border: 1px solid var(--nagi-color-border);
    border-radius: var(--nagi-radius-control);
    background: var(--nagi-color-surface);
    color: var(--nagi-color-text);
    font: inherit;

    &:focus-visible {
      outline: none;
      border-color: var(--nagi-color-focus-ring);
      box-shadow: var(--nagi-shadow-focus);
    }

    &:disabled {
      color: var(--nagi-color-text-disabled);
      background: var(--nagi-color-surface);
      cursor: not-allowed;
    }

    &:user-invalid,
    &[aria-invalid="true"] {
      border-color: var(--nagi-color-danger);
    }
  }
}

@media (forced-colors: active) {
  .n-select > .select:focus-visible {
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }
}
</style>
