<script lang="ts">
export interface NagiSelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}
</script>

<script setup lang="ts">
import { ref, useId } from "vue";

import { useNativeFormReset } from "@nagi-labs/nagi-ui";

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

const model = defineModel<string>();
const generatedId = useId();
const select = ref<HTMLSelectElement | null>(null);
const initialValue = model.value;

useNativeFormReset(
  select,
  (control) => {
    model.value = initialValue;
    control.value = initialValue ?? "";
  },
  () => props.form,
);
</script>

<template>
  <div class="nagi-select">
    <label class="label" :for="id ?? generatedId">{{ label }}</label>
    <select
      ref="select"
      v-model="model"
      v-bind="$attrs"
      class="select"
      :id="id ?? generatedId"
      :name="name"
      :disabled="disabled"
      :required="required"
      :form="form"
    >
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
        :disabled="option.disabled"
      >
        {{ option.label }}
      </option>
    </select>
  </div>
</template>

<style scoped>
.nagi-select {
  display: grid;
  gap: 0.35rem;
  color: var(--nagi-color-text, #17323b);
  font: inherit;

  > .label {
    color: var(--nagi-color-text-muted, #50676f);
    font-size: var(--nagi-font-size-label, 0.72rem);
    font-weight: 650;
  }

  > .select {
    min-block-size: var(--nagi-size-control, 2rem);
    padding: var(--nagi-space-control, 0.5rem 0.75rem);
    border: 1px solid var(--nagi-color-border, #b9cbd1);
    border-radius: var(--nagi-radius-control, 0.55rem);
    background: var(--nagi-color-surface, #fff);
    color: var(--nagi-color-text, #17323b);
    font: inherit;

    &:focus-visible {
      outline: none;
      border-color: var(--nagi-color-focus-ring, #75adba);
      box-shadow: var(--nagi-shadow-focus, 0 0 0 2px rgb(117 173 186 / 0.35));
    }

    &:disabled {
      color: var(--nagi-color-text-disabled, #91a1a6);
      background: var(--nagi-color-surface, #fff);
      cursor: not-allowed;
    }

    &:user-invalid,
    &[aria-invalid="true"] {
      border-color: var(--nagi-color-danger, #aa3443);
    }
  }
}
</style>
