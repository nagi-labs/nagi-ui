<script setup lang="ts">
import { ref, useAttrs } from "vue";

import { useNativeFormReset } from "@nagi-labs/nagi-ui";

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
const attrs = useAttrs();
const input = ref<HTMLInputElement | null>(null);
const initialChecked = checked.value;

useNativeFormReset(
  input,
  (control) => {
    checked.value = initialChecked;
    control.checked = initialChecked;
  },
  () => props.form,
);
</script>

<template>
  <label class="nagi-switch">
    <input
      v-bind="attrs"
      ref="input"
      v-model="checked"
      class="input"
      type="checkbox"
      role="switch"
      :name="name"
      :form="form"
      :value="value"
      :disabled="disabled"
      :required="required"
    />
    <span class="zone">{{ label }}</span>
  </label>
</template>

<style scoped>
.nagi-switch {
  display: inline-flex;
  gap: var(--nagi-space-item-gap, 0.55rem);
  align-items: center;
  color: var(--nagi-color-text, #17323b);
  cursor: pointer;

  &:has(> .input:disabled) {
    > .zone {
      color: var(--nagi-color-text-disabled, #91a1a6);
      cursor: not-allowed;
    }
  }

  > .input {
    appearance: none;
    flex: 0 0 auto;
    inline-size: 2.5rem;
    block-size: 1.4rem;
    margin: 0;
    border: 1px solid var(--nagi-color-border, #b9cbd1);
    border-radius: 999px;
    background-color: var(--nagi-color-border, #b9cbd1);
    background-image: radial-gradient(
      circle at 0.65rem 50%,
      var(--nagi-color-surface, #fff) 0 0.45rem,
      transparent 0.48rem
    );
    cursor: pointer;
    transition: border-color 120ms ease, background-color 120ms ease;

    &:checked {
      border-color: var(--nagi-color-accent, #16768b);
      background-color: var(--nagi-color-accent, #16768b);
      background-image: radial-gradient(
        circle at calc(100% - 0.65rem) 50%,
        var(--nagi-color-surface, #fff) 0 0.45rem,
        transparent 0.48rem
      );
    }

    &:focus-visible {
      outline: none;
      box-shadow: var(--nagi-shadow-focus, 0 0 0 2px rgb(117 173 186 / 0.35));
    }

    &:disabled {
      border-color: var(--nagi-color-border-muted, #c8d8dd);
      background-color: var(--nagi-color-text-disabled, #91a1a6);
      cursor: not-allowed;
    }

    &:user-invalid,
    &[aria-invalid="true"] {
      border-color: var(--nagi-color-danger, #aa3443);
    }

  }

  > .zone {
    line-height: 1.35;
  }
}

@media (forced-colors: active) {
  .nagi-switch {
    > .input {
      appearance: auto;
      inline-size: auto;
      block-size: auto;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .nagi-switch {
    > .input {
      transition: none;
    }
  }
}
</style>
