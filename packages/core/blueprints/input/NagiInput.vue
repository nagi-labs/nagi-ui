<script setup lang="ts">
import { ref, useAttrs } from "vue";

import { useNativeFormReset } from "@nagi-labs/nagi-ui";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    label: string;
    type?:
      | "text"
      | "email"
      | "password"
      | "search"
      | "tel"
      | "url"
      | "number"
      | "date"
      | "datetime-local"
      | "month"
      | "time"
      | "week";
    name?: string;
    form?: string;
    disabled?: boolean;
    required?: boolean;
    readOnly?: boolean;
  }>(),
  {
    type: "text",
    disabled: false,
    required: false,
    readOnly: false,
  },
);

const model = defineModel<string>({ default: "" });
const attrs = useAttrs();
const input = ref<HTMLInputElement | null>(null);
const initialValue = model.value;

useNativeFormReset(
  input,
  (control) => {
    model.value = initialValue;
    control.value = initialValue;
  },
  () => props.form,
);
</script>

<template>
  <label class="nagi-input">
    <span class="zone">{{ label }}</span>
    <input
      v-bind="attrs"
      ref="input"
      v-model="model"
      class="input"
      :type="type"
      :name="name"
      :form="form"
      :disabled="disabled"
      :required="required"
      :readonly="readOnly"
    />
  </label>
</template>

<style scoped>
.nagi-input {
  display: grid;
  gap: var(--nagi-space-item-gap, 0.55rem);
  color: var(--nagi-color-text, #17323b);

  > .zone {
    color: var(--nagi-color-text-muted, #50676f);
    font-size: var(--nagi-font-size-label, 0.72rem);
    font-weight: 650;
  }

  > .input {
    box-sizing: border-box;
    inline-size: 100%;
    min-block-size: var(--nagi-size-control, 2rem);
    padding: var(--nagi-space-control, 0.5rem 0.75rem);
    border: 1px solid var(--nagi-color-border, #b9cbd1);
    border-radius: var(--nagi-radius-control, 0.55rem);
    background: var(--nagi-color-surface, #fff);
    color: var(--nagi-color-text, #17323b);
    font: inherit;

    &::placeholder {
      color: var(--nagi-color-text-muted, #50676f);
    }

    &:focus-visible {
      outline: none;
      border-color: var(--nagi-color-focus-ring, #75adba);
      box-shadow: var(--nagi-shadow-focus, 0 0 0 2px rgb(117 173 186 / 0.35));
    }

    &:read-only {
      background: var(--nagi-color-surface-active, #e5f1f4);
    }

    &:disabled {
      color: var(--nagi-color-text-disabled, #91a1a6);
      cursor: not-allowed;
    }

    &:user-invalid,
    &[aria-invalid="true"] {
      border-color: var(--nagi-color-danger, #aa3443);
    }
  }
}
</style>
