<script setup lang="ts">
import { ref, useAttrs, watchEffect } from "vue";

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
const indeterminate = defineModel<boolean>("indeterminate", { default: false });
const attrs = useAttrs();
const input = ref<HTMLInputElement | null>(null);
const initialChecked = checked.value;
const initialIndeterminate = indeterminate.value;

watchEffect(() => {
  if (input.value) input.value.indeterminate = indeterminate.value;
});

function handleChange() {
  if (indeterminate.value) indeterminate.value = false;
}

useNativeFormReset(
  input,
  (control) => {
    checked.value = initialChecked;
    indeterminate.value = initialIndeterminate;
    control.checked = initialChecked;
    control.indeterminate = initialIndeterminate;
  },
  () => props.form,
);
</script>

<template>
  <label class="nagi-checkbox">
    <input
      v-bind="attrs"
      ref="input"
      v-model="checked"
      class="input"
      type="checkbox"
      :name="name"
      :form="form"
      :value="value"
      :disabled="disabled"
      :required="required"
      @change="handleChange"
    />
    <span class="zone">{{ label }}</span>
  </label>
</template>

<style scoped>
.nagi-checkbox {
  display: inline-flex;
  gap: var(--nagi-space-item-gap, 0.55rem);
  align-items: flex-start;
  color: var(--nagi-color-text, #17323b);
  cursor: pointer;

  &:has(> .input:disabled) {
    > .zone {
      color: var(--nagi-color-text-disabled, #91a1a6);
      cursor: not-allowed;
    }
  }

  > .input {
    inline-size: 1.1rem;
    block-size: 1.1rem;
    margin: 0.12rem 0 0;
    accent-color: var(--nagi-color-accent, #16768b);
    cursor: pointer;

    &:focus-visible {
      outline: none;
      box-shadow: var(--nagi-shadow-focus, 0 0 0 2px rgb(117 173 186 / 0.35));
    }

    &:disabled {
      cursor: not-allowed;
    }

    &:user-invalid,
    &[aria-invalid="true"] {
      outline: 1px solid var(--nagi-color-danger, #aa3443);
      outline-offset: 1px;
    }

  }

  > .zone {
    line-height: 1.35;
  }
}
</style>
