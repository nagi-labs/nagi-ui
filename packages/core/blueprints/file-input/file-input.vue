<script setup lang="ts">
import { computed, useAttrs } from "vue";

import { mergeElementProps } from "@nagi-labs/nagi-ui";

defineOptions({ inheritAttrs: false });

const {
  label,
  multiple = false,
  disabled = false,
  required = false,
} = defineProps<{
  label: string;
  multiple?: boolean;
  disabled?: boolean;
  required?: boolean;
}>();
const attrs = useAttrs();
const inputProps = computed(() =>
  mergeElementProps(attrs, { type: "file", multiple, disabled, required }),
);

const emit = defineEmits<{
  blur: [event: FocusEvent];
  change: [event: Event];
  click: [event: MouseEvent];
  focus: [event: FocusEvent];
  input: [event: Event];
  invalid: [event: Event];
}>();
</script>

<template>
  <label class="n-file-input">
    <span class="unit">{{ label }}</span>
    <input
      class="input"
      v-bind="inputProps"
      @blur="emit('blur', $event)"
      @change="emit('change', $event)"
      @click="emit('click', $event)"
      @focus="emit('focus', $event)"
      @input="emit('input', $event)"
      @invalid="emit('invalid', $event)"
    />
  </label>
</template>

<style scoped>
.n-file-input {
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
    border: 0;
    background: transparent;
    color: var(--nagi-color-text-muted);

    &::file-selector-button {
      box-sizing: border-box;
      min-block-size: var(--nagi-size-control);
      margin-inline-end: var(--nagi-space-item-gap);
      padding: var(--nagi-space-item);
      border: var(--n-border-width-1) solid var(--nagi-color-border);
      border-radius: var(--nagi-radius-control);
      background: var(--nagi-color-surface);
      color: var(--nagi-color-text);
      font-weight: 650;
      cursor: pointer;
    }

    &:hover::file-selector-button {
      background: var(--nagi-color-surface-active);
    }

    &:focus-visible {
      outline: none;
    }

    &:focus-visible::file-selector-button {
      border-color: var(--nagi-color-focus-ring);
      box-shadow: var(--nagi-shadow-focus);
    }

    &:disabled {
      color: var(--nagi-color-text-disabled);
      cursor: not-allowed;

      &::file-selector-button {
        color: var(--nagi-color-text-disabled);
        background: var(--nagi-color-surface);
        cursor: not-allowed;
      }
    }

    &:user-invalid,
    &[aria-invalid="true"] {
      &::file-selector-button {
        border-color: var(--nagi-color-danger);
      }
    }
  }
}

@media (forced-colors: active) {
  .n-file-input {
    > .input:focus-visible {
      outline: 2px solid Highlight;
      outline-offset: var(--n-border-width-2);
    }
  }
}
</style>
