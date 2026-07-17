<script lang="ts">
export interface ListboxOption {
  key: string;
  label: string;
  disabled?: boolean;
}
</script>

<script setup lang="ts">
import { useId } from "vue";

import { useListbox, type ListboxSelectionMode } from "@nagi-labs/nagi-ui";

const props = withDefaults(
  defineProps<{
    label: string;
    items: readonly ListboxOption[];
    mode?: ListboxSelectionMode;
  }>(),
  { mode: "single" },
);

const selected = defineModel<readonly string[]>("selected", { default: () => [] });

const labelId = useId();

const listbox = useListbox<ListboxOption>({
  items: () => props.items,
  getKey: (item) => item.key,
  getTextValue: (item) => item.label,
  isDisabled: (item) => item.disabled ?? false,
  mode: props.mode,
  selected,
});
</script>

<template>
  <div class="listbox">
    <p :id="labelId" class="text">{{ label }}</p>
    <ul class="list" v-bind="listbox.listboxProps" :aria-labelledby="labelId">
      <li
        v-for="item in items"
        :key="item.key"
        class="item"
        v-bind="listbox.optionProps(item)"
      >
        <span class="icon -check" aria-hidden="true">✓</span>
        <span class="text">{{ item.label }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.listbox {
  display: inline-block;
  min-inline-size: 14rem;

  > .text {
    margin-block: 0 0.35rem;
    color: #50676f;
    font-size: 0.72rem;
    font-weight: 750;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  > .list {
    margin: 0;
    padding: 0.4rem;
    border: 1px solid #c8d8dd;
    border-radius: 0.65rem;
    outline: none;
    background: #fff;
    color: #17323b;
    list-style: none;

    &:focus-visible {
      border-color: #75adba;
      box-shadow: 0 0 0 2px rgb(117 173 186 / 0.35);
    }

    > .item {
      display: grid;
      grid-template-columns: 1rem minmax(0, 1fr);
      gap: 0.55rem;
      align-items: center;
      min-block-size: 2rem;
      padding: 0.35rem 0.55rem;
      border-radius: 0.4rem;
      cursor: pointer;

      &[data-active] {
        background: #e5f1f4;
        outline: 2px solid #75adba;
        outline-offset: -2px;
      }

      &[aria-selected="true"] {
        background: #dcebef;
        font-weight: 650;
      }

      &[aria-selected="false"] {
        > .icon {
          opacity: 0;
        }
      }

      &[aria-disabled="true"] {
        color: #91a1a6;
        cursor: not-allowed;
      }

      > .icon {
        color: #16768b;
        font-size: 0.78rem;
        text-align: center;
      }
    }
  }
}
</style>
