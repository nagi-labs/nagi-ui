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
    color: var(--nagi-color-text-muted, #50676f);
    font-size: var(--nagi-font-size-label, 0.72rem);
    font-weight: 750;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  > .list {
    margin: 0;
    padding: 0.4rem;
    border: 1px solid var(--nagi-color-border-muted, #c8d8dd);
    border-radius: var(--nagi-radius-overlay, 0.65rem);
    outline: none;
    background: var(--nagi-color-surface, #fff);
    color: var(--nagi-color-text, #17323b);
    list-style: none;

    &:focus-visible {
      border-color: var(--nagi-color-focus-ring, #75adba);
      box-shadow: var(--nagi-shadow-focus, 0 0 0 2px rgb(117 173 186 / 0.35));
    }

    > .item {
      display: grid;
      grid-template-columns: 1rem minmax(0, 1fr);
      gap: 0.55rem;
      align-items: center;
      min-block-size: var(--nagi-size-control, 2rem);
      padding: 0.35rem 0.55rem;
      border-radius: var(--nagi-radius-item, 0.4rem);
      cursor: pointer;

      &[data-active] {
        background: var(--nagi-color-surface-active, #e5f1f4);
        outline: 2px solid var(--nagi-color-focus-ring, #75adba);
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
        color: var(--nagi-color-text-disabled, #91a1a6);
        cursor: not-allowed;
      }

      > .icon {
        color: var(--nagi-color-accent, #16768b);
        font-size: var(--nagi-font-size-icon, 0.78rem);
        text-align: center;
      }
    }
  }
}
</style>
