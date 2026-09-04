<script setup lang="ts">
import { computed, ref, useAttrs, useId } from "vue";

import { mergeElementProps } from "@nagi-labs/nagi-ui";
import { useSlider } from "@nagi-labs/nagi-ui/component-controls";

defineOptions({ inheritAttrs: false });

const {
  label,
  id,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
} = defineProps<{
  label: string;
  id?: string;
  min?: number;
  max?: number;
  step?: number | "any";
  disabled?: boolean;
}>();

const attrs = useAttrs();
const model = defineModel<number>({ default: 0 });
const input = ref<HTMLInputElement | null>(null);
const generatedId = useId();
const inputProps = computed(() =>
  mergeElementProps(attrs, {
    type: "range",
    id: id ?? generatedId,
    min,
    max,
    step,
    disabled,
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

useSlider(input, model);
</script>

<template>
  <div class="n-slider">
    <label
      class="label"
      :for="id ?? generatedId"
      >{{ label }}</label
    >
    <input
      ref="input"
      v-model.number="model"
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
    <output
      class="output"
      :for="id ?? generatedId"
      >{{ model }}</output
    >
  </div>
</template>

<style scoped>
.n-slider {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--nagi-space-item-gap);
  align-items: center;
  color: var(--nagi-color-text);

  &:has(> .input:disabled) {
    > .output {
      color: var(--nagi-color-text-disabled);
    }
  }

  > .label {
    color: var(--nagi-color-text-muted);
    font-size: var(--nagi-font-size-label);
    font-weight: 650;
  }

  > .output {
    grid-column: 2;
    grid-row: 1;
    min-inline-size: 3ch;
    color: var(--nagi-color-text);
    font-variant-numeric: tabular-nums;
    text-align: end;
  }

  > .input {
    grid-column: 1 / -1;
    grid-row: 2;
    inline-size: 100%;
    min-block-size: var(--nagi-size-control);
    margin: 0;
    accent-color: var(--nagi-color-accent);
    cursor: pointer;

    &:focus-visible {
      outline: none;
      border-radius: var(--nagi-radius-control);
      box-shadow: var(--nagi-shadow-focus);
    }

    &:disabled {
      cursor: not-allowed;
    }
  }
}

@media (forced-colors: active) {
  .n-slider {
    > .input:focus-visible {
      outline: 2px solid Highlight;
      outline-offset: var(--n-border-width-2);
    }
  }
}
</style>
