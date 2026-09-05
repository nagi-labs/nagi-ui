<script setup lang="ts">
import { useAttrs, type StyleValue } from "vue";

import { useNumberField } from "@nagi-labs/nagi-ui/component-controls";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    label: string;
    id?: string;
    class?: string;
    style?: StyleValue;
    title?: string;
    tabindex?: number;
    name?: string;
    form?: string;
    autocomplete?: string;
    autofocus?: boolean;
    enterkeyhint?: "enter" | "done" | "go" | "next" | "previous" | "search" | "send";
    inputmode?: "none" | "text" | "decimal" | "numeric" | "tel" | "search" | "email" | "url";
    list?: string;
    maxlength?: number;
    minlength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    placeholder?: string;
    step?: number;
    disabled?: boolean;
    readOnly?: boolean;
    required?: boolean;
    decrementLabel?: string;
    incrementLabel?: string;
    ariaLabel?: string;
    ariaLabelledby?: string;
    ariaDescribedby?: string;
    ariaDetails?: string;
    ariaErrormessage?: string;
    ariaInvalid?: "true" | "false" | "grammar" | "spelling";
  }>(),
  {
    step: 1,
    disabled: false,
    readOnly: false,
    required: false,
    decrementLabel: "Decrease value",
    incrementLabel: "Increase value",
  },
);

const model = defineModel<number | null>({ default: null });
const numberField = useNumberField(props, model, useAttrs());
const { value: inputValue } = numberField;

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
</script>

<template>
  <div class="n-number-field">
    <label
      class="label"
      v-bind="numberField.labelProps"
      >{{ label }}</label
    >
    <div class="unit">
      <button
        v-bind="numberField.decrementButtonProps"
        class="button -decrement"
        type="button"
      >
        −
      </button>
      <input
        v-model="inputValue"
        class="input"
        v-bind="numberField.inputProps"
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
      <button
        v-bind="numberField.incrementButtonProps"
        class="button -increment"
        type="button"
      >
        +
      </button>
    </div>
  </div>
</template>

<style scoped>
.n-number-field {
  display: grid;
  gap: var(--nagi-space-item-gap);
  color: var(--nagi-color-text);

  > .label {
    color: var(--nagi-color-text-muted);
    font-size: var(--nagi-font-size-label);
    font-weight: 650;
  }

  > .unit {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;

    > .button {
      box-sizing: border-box;
      inline-size: var(--nagi-size-control);
      min-block-size: var(--nagi-size-control);
      padding: 0;
      border: var(--n-border-width-1) solid var(--nagi-color-border);
      background: var(--nagi-color-surface-accent);
      color: var(--nagi-color-text);
      font: inherit;
      font-weight: 650;
      cursor: pointer;

      &:hover:not(:disabled) {
        background: var(--nagi-color-surface-active);
      }

      &:focus-visible {
        z-index: 1;
        outline: none;
        border-color: var(--nagi-color-focus-ring);
        box-shadow: var(--nagi-shadow-focus);
      }

      &:disabled {
        color: var(--nagi-color-text-disabled);
        background: var(--nagi-color-surface);
        cursor: not-allowed;
      }

      &.-decrement {
        border-radius: var(--nagi-radius-control) 0 0 var(--nagi-radius-control);
      }

      &.-increment {
        border-radius: 0 var(--nagi-radius-control) var(--nagi-radius-control) 0;
      }
    }

    > .input {
      box-sizing: border-box;
      min-inline-size: 4ch;
      min-block-size: var(--nagi-size-control);
      padding: var(--nagi-space-control);
      border: var(--n-border-width-1) solid var(--nagi-color-border);
      border-inline: 0;
      border-radius: 0;
      background: var(--nagi-color-surface);
      color: var(--nagi-color-text);
      font: inherit;
      font-variant-numeric: tabular-nums;
      appearance: textfield;

      &:focus-visible {
        z-index: 1;
        outline: none;
        border-color: var(--nagi-color-focus-ring);
        box-shadow: var(--nagi-shadow-focus);
      }

      &:read-only {
        background: var(--nagi-color-surface-active);
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
}

@media (forced-colors: active) {
  .n-number-field {
    > .unit {
      > :is(.button, .input):focus-visible {
        outline: 2px solid Highlight;
        outline-offset: var(--n-border-width-2);
      }
    }
  }
}
</style>
