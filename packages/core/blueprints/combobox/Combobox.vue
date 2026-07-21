<script lang="ts">
export interface ComboboxOption {
  key: string;
  label: string;
  disabled?: boolean;
}
</script>

<script setup lang="ts">
import { nextTick, useId, useTemplateRef, watchEffect } from "vue";

import { useCombobox, useNativeFormReset } from "@nagi-labs/nagi-ui";

const props = withDefaults(
  defineProps<{
    label: string;
    items: readonly ComboboxOption[];
    placeholder?: string;
    autocomplete?: string;
    disabled?: boolean;
    readOnly?: boolean;
    required?: boolean;
    name?: string;
    form?: string;
    clearable?: boolean;
    clearLabel?: string;
    emptyText?: string;
    loading?: boolean;
    loadingText?: string;
    validationMessage?: string;
  }>(),
  {
    autocomplete: "off",
    disabled: false,
    readOnly: false,
    required: false,
    clearable: false,
    clearLabel: "Clear selection",
    emptyText: "No results",
    loading: false,
    loadingText: "Loading…",
    validationMessage: "Select an option.",
  },
);

const inputValue = defineModel<string>({ default: "" });
const selected = defineModel<string | null>("selected", { default: null });
const labelId = useId();
const inputElement = useTemplateRef<HTMLInputElement>("input");
const initialInputValue = inputValue.value;
const initialSelected = selected.value;

const combobox = useCombobox<ComboboxOption>({
  items: () => (props.loading ? [] : props.items),
  getKey: (item) => item.key,
  getTextValue: (item) => item.label,
  isDisabled: (item) => item.disabled ?? false,
  inputValue,
  selected,
  disabled: () => props.disabled,
  readOnly: () => props.readOnly,
  required: () => props.required,
  openWhenEmpty: true,
});
const { visibleItems } = combobox;

function clear() {
  combobox.clear();
  inputElement.value?.focus();
}

useNativeFormReset(
  inputElement,
  (control) => {
    selected.value = initialSelected;
    combobox.hide();
    // selectedKey watchers canonicalize text to the option label. Reset owns
    // both initial models, so re-apply a deliberately non-canonical initial
    // text (for example key="vue", text="v") after those watchers settle.
    void nextTick(() => {
      inputValue.value = initialInputValue;
      control.value = initialInputValue;
    });
  },
  () => props.form,
);

watchEffect(() => {
  const input = inputElement.value;
  if (!input) return;
  input.setCustomValidity(
    props.required && selected.value === null ? props.validationMessage : "",
  );
});
</script>

<template>
  <div class="combobox">
    <label :id="labelId" class="label" :for="combobox.inputId">{{ label }}</label>
    <div class="zone -control">
      <input
        ref="input"
        class="input"
        type="text"
        :autocomplete="autocomplete"
        :form="form"
        :placeholder="placeholder"
        :aria-busy="loading ? 'true' : undefined"
        v-bind="combobox.inputProps"
      />
      <button
        v-if="clearable && !disabled && !readOnly && (selected !== null || inputValue !== '')"
        class="button -clear"
        type="button"
        :aria-label="clearLabel"
        @click="clear"
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
    <input
      v-if="name"
      class="input -form-value"
      type="hidden"
      :name="name"
      :form="form"
      :value="selected ?? ''"
      :disabled="disabled"
    />
    <div
      class="zone -popup"
      popover
      :aria-busy="loading ? 'true' : undefined"
      v-bind="combobox.popupProps"
    >
      <ul
        class="list"
        :aria-labelledby="labelId"
        v-bind="combobox.listboxProps"
      >
        <li
          v-for="item in visibleItems"
          :key="item.key"
          class="item"
          v-bind="combobox.optionProps(item)"
        >
          <span class="text">{{ item.label }}</span>
        </li>
      </ul>
      <div v-if="loading" class="status" role="status">{{ loadingText }}</div>
      <div v-else-if="visibleItems.length === 0" class="status" role="status">
        {{ emptyText }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.combobox {
  display: inline-grid;
  min-inline-size: 16rem;
  color: var(--nagi-color-text, #17323b);

  > .label {
    margin-block-end: 0.35rem;
    color: var(--nagi-color-text-muted, #50676f);
    font-size: var(--nagi-font-size-label, 0.72rem);
    font-weight: 750;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  > .zone {
    &.-control {
      position: relative;

      > .input {
        inline-size: 100%;
        box-sizing: border-box;
        padding: var(--nagi-space-control, 0.5rem 0.75rem);
        padding-inline-end: 2.25rem;
        border: 1px solid var(--nagi-color-border, #b9cbd1);
        border-radius: var(--nagi-radius-control, 0.55rem);
        outline: none;
        background: var(--nagi-color-surface, #fff);
        color: inherit;
        font: inherit;

        &:focus-visible,
        &[aria-expanded="true"] {
          border-color: var(--nagi-color-focus-ring, #75adba);
          box-shadow: var(--nagi-shadow-focus, 0 0 0 2px rgb(117 173 186 / 0.35));
        }

        &:disabled {
          color: var(--nagi-color-text-disabled, #91a1a6);
          background: var(--nagi-color-surface-accent, #e5f1f4);
        }

        &:read-only {
          color: var(--nagi-color-text-muted, #50676f);
          background: var(--nagi-color-surface-accent, #e5f1f4);
        }

        &::placeholder {
          color: var(--nagi-color-text-disabled, #91a1a6);
        }
      }

      > .button {
        &.-clear {
          position: absolute;
          inset-block: 0;
          inset-inline-end: 0.35rem;
          inline-size: 1.75rem;
          padding: 0;
          border: 0;
          background: transparent;
          color: var(--nagi-color-text-muted, #50676f);
          font: inherit;
          cursor: pointer;
        }
      }
    }

    &.-popup {
      min-inline-size: 16rem;
      max-block-size: 15rem;
      margin: 0;
      padding: var(--nagi-space-surface-inset, 0.4rem);
      overflow-y: auto;
      border: 1px solid var(--nagi-color-border-muted, #c8d8dd);
      border-radius: var(--nagi-radius-overlay, 0.65rem);
      outline: none;
      background: var(--nagi-color-surface, #fff);
      box-shadow: var(--nagi-shadow-overlay, 0 14px 36px rgb(22 48 60 / 0.2));
      color: var(--nagi-color-text, #17323b);
      list-style: none;
      opacity: 0;
      transform: translateY(-0.25rem) scale(0.99);
      transform-origin: top;
      transition:
        opacity 0.12s,
        transform 0.12s,
        overlay 0.12s allow-discrete,
        display 0.12s allow-discrete;

      &:popover-open {
        opacity: 1;
        transform: translateY(0) scale(1);

        @starting-style {
          opacity: 0;
          transform: translateY(-0.25rem) scale(0.99);
        }
      }

      > .list {
        margin: 0;
        padding: 0;
        list-style: none;

        > .item {
          box-sizing: border-box;
          min-block-size: var(--nagi-size-control, 2rem);
          padding: var(--nagi-space-item, 0.35rem 0.55rem);
          border-radius: var(--nagi-radius-item, 0.4rem);
          cursor: pointer;

          &[aria-selected="true"] {
            background: var(--nagi-color-surface-active, #e5f1f4);
            outline: 2px solid var(--nagi-color-focus-ring, #75adba);
            outline-offset: -2px;
          }

          &[aria-disabled="true"] {
            color: var(--nagi-color-text-disabled, #91a1a6);
            cursor: not-allowed;
          }
        }
      }

      > .status {
        box-sizing: border-box;
        min-block-size: var(--nagi-size-control, 2rem);
        padding: var(--nagi-space-item, 0.35rem 0.55rem);
        color: var(--nagi-color-text-muted, #50676f);
        list-style: none;
      }
    }
  }
}
</style>
