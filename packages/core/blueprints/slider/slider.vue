<script setup lang="ts">
import { useAttrs } from "vue";

import { useSlider } from "@nagi-labs/nagi-ui/component-controls";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    label: string;
    id?: string;
    min?: number;
    max?: number;
    step?: number | "any";
    disabled?: boolean;
  }>(),
  {
    min: 0,
    max: 100,
    step: 1,
    disabled: false,
  },
);

const model = defineModel<number>({ default: 0 });
const slider = useSlider(props, model, useAttrs());

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
</script>

<template>
  <div class="n-slider">
    <label
      class="label"
      v-bind="slider.labelProps"
      >{{ props.label }}</label
    >
    <input
      v-model.number="model"
      class="input"
      v-bind="slider.inputProps"
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
      v-bind="slider.outputProps"
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
