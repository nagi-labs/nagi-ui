<script setup lang="ts">
import { ref } from "vue";

import { useNativeValueReset } from "@nagi-labs/nagi-ui";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    label: string;
    name?: string;
    form?: string;
    rows?: number;
    disabled?: boolean;
    required?: boolean;
    readOnly?: boolean;
  }>(),
  {
    disabled: false,
    required: false,
    readOnly: false,
  },
);

const model = defineModel<string>({ default: "" });
const textarea = ref<HTMLTextAreaElement | null>(null);

useNativeValueReset(textarea, model);
</script>

<template>
  <label class="n-textarea">
    <span class="unit">{{ label }}</span>
    <textarea
      v-bind="$attrs"
      ref="textarea"
      v-model="model"
      class="textarea"
      :name="name"
      :form="form"
      :rows="rows"
      :disabled="disabled"
      :required="required"
      :readonly="readOnly"
    />
  </label>
</template>

<style scoped>
.n-textarea {
  display: grid;
  gap: var(--nagi-space-item-gap);
  color: var(--nagi-color-text);

  > .unit {
    color: var(--nagi-color-text-muted);
    font-size: var(--nagi-font-size-label);
    font-weight: 650;
  }

  > .textarea {
    box-sizing: border-box;
    inline-size: 100%;
    min-block-size: var(--nagi-size-control);
    padding: var(--nagi-space-control);
    border: 1px solid var(--nagi-color-border);
    border-radius: var(--nagi-radius-control);
    background: var(--nagi-color-surface);
    color: var(--nagi-color-text);
    font: inherit;

    &::placeholder {
      color: var(--nagi-color-text-muted);
    }

    &:focus-visible {
      outline: none;
      border-color: var(--nagi-color-focus-ring);
      box-shadow: var(--nagi-shadow-focus);
    }

    &:read-only {
      background: var(--nagi-color-surface-active);
    }

    &:disabled {
      color: var(--nagi-color-text-disabled);
      cursor: not-allowed;
    }

    &:user-invalid,
    &[aria-invalid="true"] {
      border-color: var(--nagi-color-danger);
    }
  }
}

@media (forced-colors: active) {
  .n-textarea > .textarea:focus-visible {
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }
}
</style>
