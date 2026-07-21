<script setup lang="ts">
import { ref, useId } from "vue";

import { useNativeRadioReset } from "@nagi-labs/nagi-ui";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    label: string;
    value: string;
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

const model = defineModel<string | null>({ default: null });
const generatedId = useId();
const input = ref<HTMLInputElement | null>(null);

useNativeRadioReset(input, model);
</script>

<template>
  <div class="nagi-radio">
    <input
      ref="input"
      v-model="model"
      v-bind="$attrs"
      class="input"
      type="radio"
      :id="id ?? generatedId"
      :value="value"
      :name="name"
      :disabled="disabled"
      :required="required"
      :form="form"
    />
    <label class="label" :for="id ?? generatedId">{{ label }}</label>
  </div>
</template>

<style scoped>
.nagi-radio {
  display: inline-flex;
  gap: var(--nagi-space-item-gap);
  align-items: center;
  color: var(--nagi-color-text);
  font: inherit;
  cursor: pointer;

  &:has(> .input:disabled) {
    cursor: not-allowed;

    > .label {
      color: var(--nagi-color-text-disabled);
    }
  }

  > .input {
    inline-size: 1rem;
    block-size: 1rem;
    margin: 0;
    accent-color: var(--nagi-color-accent);
    cursor: inherit;

    &:focus-visible {
      outline: none;
      box-shadow: var(--nagi-shadow-focus);
    }

    &:user-invalid,
    &[aria-invalid="true"] {
      outline: 1px solid var(--nagi-color-danger);
      outline-offset: 1px;
    }

    &:disabled {
      cursor: not-allowed;
    }
  }
}
</style>
