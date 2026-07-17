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
  color: #17323b;

  > .label {
    margin-block-end: 0.35rem;
    color: #667d84;
    font-size: 0.72rem;
    font-weight: 750;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  > .input {
    inline-size: 100%;
    box-sizing: border-box;
    padding: 0.55rem 0.7rem;
    border: 1px solid #b9cbd1;
    border-radius: 0.55rem;
    outline: none;
    background: #fff;
    color: inherit;
    font: inherit;

    &:focus-visible,
    &[aria-expanded="true"] {
      border-color: #75adba;
      box-shadow: 0 0 0 2px rgb(117 173 186 / 0.35);
    }

    &::placeholder {
      color: #91a1a6;
    }
  }

  > .list {
    min-inline-size: 16rem;
    max-block-size: 15rem;
    margin: 0;
    padding: 0.4rem;
    overflow-y: auto;
    border: 1px solid #c8d8dd;
    border-radius: 0.65rem;
    outline: none;
    background: #fff;
    box-shadow: 0 14px 36px rgb(22 48 60 / 0.2);
    color: #17323b;
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
      min-block-size: 2rem;
      padding: 0.4rem 0.6rem;
      border-radius: 0.4rem;
      cursor: pointer;

      &[aria-selected="true"] {
        background: #e5f1f4;
        outline: 2px solid #75adba;
        outline-offset: -2px;
      }

      &[aria-disabled="true"] {
        color: #91a1a6;
        cursor: not-allowed;
      }
    }
  }
}
</style>
