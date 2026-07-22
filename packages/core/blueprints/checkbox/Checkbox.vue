<script setup lang="ts">
import { ref } from "vue";

import { useNativeCheckbox } from "@nagi-labs/nagi-ui";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    label: string;
    name?: string;
    value?: string;
    form?: string;
    disabled?: boolean;
    required?: boolean;
  }>(),
  {
    value: "on",
    disabled: false,
    required: false,
  },
);

const checked = defineModel<boolean>({ default: false });
const indeterminate = defineModel<boolean>("indeterminate", { default: false });
const input = ref<HTMLInputElement | null>(null);

useNativeCheckbox(input, checked, indeterminate);
</script>

<template>
  <label class="n-checkbox">
    <input
      v-bind="$attrs"
      ref="input"
      v-model="checked"
      class="input"
      type="checkbox"
      :name="name"
      :form="form"
      :value="value"
      :disabled="disabled"
      :required="required"
    />
    <span class="unit">{{ label }}</span>
  </label>
</template>

<style scoped>
.n-checkbox {
  display: inline-flex;
  gap: var(--nagi-space-item-gap);
  align-items: flex-start;
  color: var(--nagi-color-text);
  cursor: pointer;

  &:has(> .input:disabled) {
    > .unit {
      color: var(--nagi-color-text-disabled);
      cursor: not-allowed;
    }
  }

  > .input {
    inline-size: 1.1rem;
    block-size: 1.1rem;
    margin: 0.12rem 0 0;
    accent-color: var(--nagi-color-accent);
    cursor: pointer;

    &:focus-visible {
      outline: none;
      box-shadow: var(--nagi-shadow-focus);
    }

    &:disabled {
      cursor: not-allowed;
    }

    &:user-invalid,
    &[aria-invalid="true"] {
      outline: 1px solid var(--nagi-color-danger);
      outline-offset: 1px;
    }

  }

  > .unit {
    line-height: 1.35;
  }
}

@media (forced-colors: active) {
  .n-checkbox > .input:focus-visible {
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }
}
</style>
