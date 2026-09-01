<script lang="ts">
export interface NagiSelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}
</script>

<script setup lang="ts">
import { computed, ref, useAttrs, useId } from "vue";

import { mergeElementProps } from "@nagi-labs/nagi-ui";
import { useSelect } from "@nagi-labs/nagi-ui/component-controls";

defineOptions({ inheritAttrs: false });

const {
  label,
  options,
  id,
  disabled = false,
  required = false,
} = defineProps<{
  label: string;
  options: readonly NagiSelectOption[];
  id?: string;
  disabled?: boolean;
  required?: boolean;
}>();

const attrs = useAttrs();
const model = defineModel<string | undefined>();
const generatedId = useId();
const select = ref<HTMLSelectElement | null>(null);
const selectBinding = useSelect(select, model);
const selectProps = computed(() =>
  mergeElementProps(attrs, {
    id: id ?? generatedId,
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

function onChange(event: Event) {
  selectBinding.onChange(event);
  emit("change", event);
}
</script>

<template>
  <div class="n-select">
    <label
      class="label"
      :for="id ?? generatedId"
      >{{ label }}</label
    >
    <select
      ref="select"
      class="select"
      v-bind="selectProps"
      @blur="emit('blur', $event)"
      @change="onChange"
      @click="emit('click', $event)"
      @focus="emit('focus', $event)"
      @input="emit('input', $event)"
      @invalid="emit('invalid', $event)"
      @keydown="emit('keydown', $event)"
      @keyup="emit('keyup', $event)"
    >
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
        :disabled="option.disabled"
        v-bind="selectBinding.selectedProps(option.value)"
      >
        {{ option.label }}
      </option>
    </select>
  </div>
</template>

<style scoped>
.n-select {
  display: grid;
  gap: var(--n-space-3);
  color: var(--nagi-color-text);
  font: inherit;

  > .label {
    color: var(--nagi-color-text-muted);
    font-size: var(--nagi-font-size-label);
    font-weight: 650;
  }

  > .select {
    min-block-size: var(--nagi-size-control);
    padding: var(--nagi-space-control);
    border: var(--n-border-width-1) solid var(--nagi-color-border);
    border-radius: var(--nagi-radius-control);
    background: var(--nagi-color-surface);
    color: var(--nagi-color-text);
    font: inherit;

    &:focus-visible {
      outline: none;
      border-color: var(--nagi-color-focus-ring);
      box-shadow: var(--nagi-shadow-focus);
    }

    &:disabled {
      color: var(--nagi-color-text-disabled);
      background: var(--nagi-color-surface);
      cursor: not-allowed;
    }

    &:user-invalid,
    &[aria-invalid="true"] {
      border-color: var(--nagi-color-danger);
    }
  }
}

@media (forced-colors: active) {
  .n-select > .select:focus-visible {
    outline: 2px solid Highlight;
    outline-offset: var(--n-border-width-2);
  }
}
</style>
