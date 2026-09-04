<script setup lang="ts">
import { computed, ref, useAttrs, useId } from "vue";

import { mergeElementProps, useNativeRadioReset } from "@nagi-labs/nagi-ui";

defineOptions({ inheritAttrs: false });

const {
  label,
  value,
  id,
  disabled = false,
  required = false,
} = defineProps<{
  label: string;
  value: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
}>();

const attrs = useAttrs();
const model = defineModel<string | null>({ default: null });
const generatedId = useId();
const input = ref<HTMLInputElement | null>(null);
const inputProps = computed(() =>
  mergeElementProps(attrs, {
    type: "radio",
    id: id ?? generatedId,
    value,
    disabled,
    required,
  }),
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

useNativeRadioReset(input, model);
</script>

<template>
  <div class="n-radio">
    <input
      ref="input"
      v-model="model"
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
    <label
      class="label"
      :for="id ?? generatedId"
      >{{ label }}</label
    >
  </div>
</template>

<style scoped>
.n-radio {
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
      outline-offset: var(--n-border-width-1);
    }

    &:disabled {
      cursor: not-allowed;
    }
  }
}

@media (forced-colors: active) {
  .n-radio {
    > .input:focus-visible {
      outline: 2px solid Highlight;
      outline-offset: var(--n-border-width-2);
    }
  }
}
</style>
