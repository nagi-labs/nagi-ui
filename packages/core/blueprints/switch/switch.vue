<script setup lang="ts">
import { computed, ref, useAttrs } from "vue";

import { mergeElementProps, useNativeCheckedReset } from "@nagi-labs/nagi-ui";

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
const input = ref<HTMLInputElement | null>(null);
const inputProps = computed(() =>
  mergeElementProps(attrs, {
    type: "checkbox",
    role: "switch",
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

useNativeCheckedReset(input, checked);
</script>

<template>
  <label class="n-switch">
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
.n-switch {
  --local-round: 999px;

  display: inline-flex;
  gap: var(--nagi-space-item-gap);
  align-items: center;
  color: var(--nagi-color-text);
  cursor: pointer;

  &:has(> .input:disabled) {
    > .unit {
      color: var(--nagi-color-text-disabled);
      cursor: not-allowed;
    }
  }

  > .input {
    appearance: none;
    flex: 0 0 auto;
    inline-size: 2.5rem;
    block-size: 1.4rem;
    margin: 0;
    border: var(--n-border-width-1) solid var(--nagi-color-border);
    border-radius: var(--local-round);
    background-color: var(--nagi-color-border);
    background-image: radial-gradient(
      circle at 0.65rem 50%,
      var(--nagi-color-surface) 0 0.45rem,
      transparent 0.48rem
    );
    cursor: pointer;
    transition:
      border-color 120ms ease,
      background-color 120ms ease;

    &:checked {
      border-color: var(--nagi-color-accent);
      background-color: var(--nagi-color-accent);
      background-image: radial-gradient(
        circle at calc(100% - 0.65rem) 50%,
        var(--nagi-color-surface) 0 0.45rem,
        transparent 0.48rem
      );
    }

    &:focus-visible {
      outline: none;
      box-shadow: var(--nagi-shadow-focus);
    }

    &:disabled {
      border-color: var(--nagi-color-border-muted);
      background-color: var(--nagi-color-text-disabled);
      cursor: not-allowed;
    }

    &:user-invalid,
    &[aria-invalid="true"] {
      border-color: var(--nagi-color-danger);
    }
  }

  > .unit {
    line-height: 1.35;
  }
}

@media (forced-colors: active) {
  .n-switch {
    > .input {
      appearance: auto;
      inline-size: auto;
      block-size: auto;

      &:focus-visible {
        outline: 2px solid Highlight;
        outline-offset: var(--n-border-width-2);
      }
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .n-switch {
    > .input {
      transition: none;
    }
  }
}
</style>
