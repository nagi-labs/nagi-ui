<script lang="ts">
export interface ComboboxOption {
  key: string;
  label: string;
  disabled?: boolean;
}
</script>

<script setup lang="ts">
import { useId } from "vue";

import { useCombobox } from "@nagi-labs/nagi-ui";

const props = defineProps<{
  label: string;
  items: readonly ComboboxOption[];
  placeholder?: string;
}>();

const inputValue = defineModel<string>({ default: "" });
const selected = defineModel<string | null>("selected", { default: null });
const labelId = useId();

const combobox = useCombobox<ComboboxOption>({
  items: () => props.items,
  getKey: (item) => item.key,
  getTextValue: (item) => item.label,
  isDisabled: (item) => item.disabled ?? false,
  inputValue,
  selected,
});
const { visibleItems } = combobox;
</script>

<template>
  <div class="combobox">
    <label :id="labelId" class="label" :for="combobox.inputId">{{ label }}</label>
    <input
      class="input"
      type="text"
      autocomplete="off"
      :placeholder="placeholder"
      v-bind="combobox.inputProps"
    />
    <ul
      class="list"
      popover
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

  > .input {
    inline-size: 100%;
    box-sizing: border-box;
    padding: var(--nagi-space-control, 0.5rem 0.75rem);
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

    &::placeholder {
      color: var(--nagi-color-text-disabled, #91a1a6);
    }
  }

  > .list {
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

    > .item {
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
}
</style>
