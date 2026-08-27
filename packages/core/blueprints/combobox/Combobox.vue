<script lang="ts">
export interface ComboboxOption {
  key: string;
  label: string;
  disabled?: boolean;
}
</script>

<script setup lang="ts">
import { useId, useTemplateRef } from "vue";

import {
  mergeNagiProps,
  useCombobox,
} from "@nagi-labs/nagi-ui";

defineOptions({ inheritAttrs: false });

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
const combobox = useCombobox(props, inputElement, inputValue, selected);
const { visibleItems } = combobox;
</script>

<template>
  <div class="n-combobox">
    <label :id="labelId" class="label" :for="combobox.inputId">{{ label }}</label>
    <div class="unit -control">
      <input
        ref="input"
        class="input"
        type="text"
        :autocomplete="autocomplete"
        :form="form"
        :placeholder="placeholder"
        :aria-busy="loading ? 'true' : undefined"
        v-bind="mergeNagiProps(combobox.inputProps, $attrs)"
      />
      <button
        v-if="clearable && !disabled && !readOnly && (selected !== null || inputValue !== '')"
        class="button -clear"
        type="button"
        :aria-label="clearLabel"
        @click="combobox.clear"
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
      class="unit -popup"
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
.n-combobox {
  --local-label-tracking: 0.05em;

  display: inline-grid;
  min-inline-size: 16rem;
  color: var(--nagi-color-text);

  > .label {
    margin-block-end: var(--n-space-3);
    color: var(--nagi-color-text-muted);
    font-size: var(--nagi-font-size-label);
    font-weight: 750;
    letter-spacing: var(--local-label-tracking);
    text-transform: uppercase;
  }

  > .unit {
    &.-control {
      position: relative;

      > .input {
        inline-size: 100%;
        box-sizing: border-box;
        padding: var(--nagi-space-control);
        padding-inline-end: calc(2 * var(--n-space-8) + var(--n-space-2));
        border: var(--n-border-width-1) solid var(--nagi-color-border);
        border-radius: var(--nagi-radius-control);
        outline: none;
        background: var(--nagi-color-surface);
        color: inherit;
        font: inherit;

        &:focus-visible,
        &[aria-expanded="true"] {
          border-color: var(--nagi-color-focus-ring);
          box-shadow: var(--nagi-shadow-focus);
        }

        &:disabled {
          color: var(--nagi-color-text-disabled);
          background: var(--nagi-color-surface-accent);
        }

        &:read-only {
          color: var(--nagi-color-text-muted);
          background: var(--nagi-color-surface-accent);
        }

        &::placeholder {
          color: var(--nagi-color-text-disabled);
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
          color: var(--nagi-color-text-muted);
          font: inherit;
          cursor: pointer;
        }
      }
    }

    &.-popup {
      min-inline-size: 16rem;
      max-block-size: 15rem;
      margin: 0;
      padding: var(--nagi-space-surface-inset);
      overflow-y: auto;
      border: var(--n-border-width-1) solid var(--nagi-color-border-muted);
      border-radius: var(--nagi-radius-overlay);
      outline: none;
      background: var(--nagi-color-surface);
      box-shadow: var(--nagi-shadow-overlay);
      color: var(--nagi-color-text);
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
          min-block-size: var(--nagi-size-control);
          padding: var(--nagi-space-item);
          border-radius: var(--nagi-radius-item);
          cursor: pointer;

          &[aria-selected="true"] {
            background: var(--nagi-color-surface-active);
            outline: 2px solid var(--nagi-color-focus-ring);
            outline-offset: calc(-1 * var(--n-border-width-2));
          }

          &[aria-disabled="true"] {
            color: var(--nagi-color-text-disabled);
            cursor: not-allowed;
          }
        }
      }

      > .status {
        box-sizing: border-box;
        min-block-size: var(--nagi-size-control);
        padding: var(--nagi-space-item);
        color: var(--nagi-color-text-muted);
        list-style: none;
      }
    }
  }
}

@media (forced-colors: active) {
  .n-combobox > .unit.-control > .input:focus-visible {
    outline: 2px solid Highlight;
    outline-offset: var(--n-border-width-2);
  }
}
</style>
