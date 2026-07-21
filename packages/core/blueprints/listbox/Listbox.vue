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
  <div class="n-listbox">
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
.n-listbox {
  display: inline-block;
  min-inline-size: 14rem;

  > .text {
    margin-block: 0 0.35rem;
    color: var(--nagi-color-text-muted);
    font-size: var(--nagi-font-size-label);
    font-weight: 750;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  > .list {
    margin: 0;
    padding: var(--nagi-space-surface-inset);
    border: 1px solid var(--nagi-color-border-muted);
    border-radius: var(--nagi-radius-overlay);
    outline: none;
    background: var(--nagi-color-surface);
    color: var(--nagi-color-text);
    list-style: none;

    &:focus-visible {
      border-color: var(--nagi-color-focus-ring);
      box-shadow: var(--nagi-shadow-focus);
    }

    > .item {
      display: grid;
      grid-template-columns: 1rem minmax(0, 1fr);
      gap: var(--nagi-space-item-gap);
      align-items: center;
      min-block-size: var(--nagi-size-control);
      padding: var(--nagi-space-item);
      border-radius: var(--nagi-radius-item);
      cursor: pointer;

      &[data-active] {
        background: var(--nagi-color-surface-active);
        outline: 2px solid var(--nagi-color-focus-ring);
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
        color: var(--nagi-color-text-disabled);
        cursor: not-allowed;
      }

      > .icon {
        color: var(--nagi-color-accent);
        font-size: var(--nagi-font-size-icon);
        text-align: center;
      }
    }
  }
}
</style>
