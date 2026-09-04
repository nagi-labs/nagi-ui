<script setup lang="ts">
import { computed, ref, useAttrs } from "vue";

import { mergeElementProps, useNativeValueReset } from "@nagi-labs/nagi-ui";

defineOptions({ inheritAttrs: false });

const {
  label,
  disabled = false,
  required = false,
  readOnly = false,
} = defineProps<{
  label: string;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
}>();

const attrs = useAttrs();
const model = defineModel<string>({ default: "" });
const textarea = ref<HTMLTextAreaElement | null>(null);
const textareaProps = computed(() =>
  mergeElementProps(attrs, { disabled, required, readonly: readOnly }),
);

const emit = defineEmits<{
  beforeinput: [event: InputEvent];
  blur: [event: FocusEvent];
  change: [event: Event];
  click: [event: MouseEvent];
  compositionend: [event: CompositionEvent];
  compositionstart: [event: CompositionEvent];
  compositionupdate: [event: CompositionEvent];
  copy: [event: ClipboardEvent];
  cut: [event: ClipboardEvent];
  focus: [event: FocusEvent];
  input: [event: Event];
  invalid: [event: Event];
  keydown: [event: KeyboardEvent];
  keypress: [event: KeyboardEvent];
  keyup: [event: KeyboardEvent];
  paste: [event: ClipboardEvent];
  select: [event: Event];
}>();

useNativeValueReset(textarea, model);
</script>

<template>
  <label class="n-textarea">
    <span class="unit">{{ label }}</span>
    <textarea
      ref="textarea"
      v-model="model"
      class="textarea"
      v-bind="textareaProps"
      @beforeinput="emit('beforeinput', $event)"
      @blur="emit('blur', $event)"
      @change="emit('change', $event)"
      @click="emit('click', $event)"
      @compositionend="emit('compositionend', $event)"
      @compositionstart="emit('compositionstart', $event)"
      @compositionupdate="emit('compositionupdate', $event)"
      @copy="emit('copy', $event)"
      @cut="emit('cut', $event)"
      @focus="emit('focus', $event)"
      @input="emit('input', $event)"
      @invalid="emit('invalid', $event)"
      @keydown="emit('keydown', $event)"
      @keypress="emit('keypress', $event)"
      @keyup="emit('keyup', $event)"
      @paste="emit('paste', $event)"
      @select="emit('select', $event)"
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
    border: var(--n-border-width-1) solid var(--nagi-color-border);
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
  .n-textarea {
    > .textarea:focus-visible {
      outline: 2px solid Highlight;
      outline-offset: var(--n-border-width-2);
    }
  }
}
</style>
