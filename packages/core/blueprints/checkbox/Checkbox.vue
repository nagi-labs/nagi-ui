<script setup lang="ts">
import { computed, ref, useAttrs } from "vue";

import { mergeElementProps, useNativeCheckbox } from "@nagi-labs/nagi-ui";

defineOptions({ inheritAttrs: false });

const {
  label,
  value = "on",
  disabled = false,
  required = false,
} = defineProps<{
  label: string;
  value?: string;
  disabled?: boolean;
  required?: boolean;
}>();

const attrs = useAttrs();
const checked = defineModel<boolean>({ default: false });
const indeterminate = defineModel<boolean>("indeterminate", { default: false });
const input = ref<HTMLInputElement | null>(null);
const inputProps = computed(() =>
  mergeElementProps(attrs, { type: "checkbox", value, disabled, required }),
);

const emit = defineEmits<{
  blur: [event: FocusEvent];
  change: [event: Event];
  click: [event: MouseEvent];
  focus: [event: FocusEvent];
  input: [event: Event];
  invalid: [event: Event];
  keydown: [event: KeyboardEvent];
  keyup: [event: KeyboardEvent];
}>();

useNativeCheckbox(input, checked, indeterminate);
</script>

<template>
  <label class="n-checkbox">
    <input
      ref="input"
      v-model="checked"
      class="input"
      v-bind="inputProps"
      @blur="emit('blur', $event)"
      @change="emit('change', $event)"
      @click="emit('click', $event)"
      @focus="emit('focus', $event)"
      @input="emit('input', $event)"
      @invalid="emit('invalid', $event)"
      @keydown="emit('keydown', $event)"
      @keyup="emit('keyup', $event)"
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
    margin: var(--n-space-1) 0 0;
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
      outline-offset: var(--n-border-width-1);
    }
  }

  > .unit {
    line-height: 1.35;
  }
}

@media (forced-colors: active) {
  .n-checkbox > .input:focus-visible {
    outline: 2px solid Highlight;
    outline-offset: var(--n-border-width-2);
  }
}
</style>
