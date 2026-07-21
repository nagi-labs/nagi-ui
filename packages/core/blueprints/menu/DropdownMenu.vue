<script setup lang="ts">
import { useMenu, type MenuDirection } from "@nagi-labs/nagi-ui";

import DropdownMenuItem from "./DropdownMenuItem.vue";
import { menuEntries, type DropdownMenuEntry, type DropdownMenuNode } from "./dropdown-schema.ts";

const props = withDefaults(
  defineProps<{
    label: string;
    items: readonly DropdownMenuNode[];
    dir?: MenuDirection;
  }>(),
  { dir: "ltr" },
);

const menu = useMenu<DropdownMenuEntry>({
  items: () => menuEntries(props.items),
  getKey: (entry) => entry.key,
  getTextValue: (entry) => entry.label,
  isDisabled: (entry) => entry.disabled,
  anchor: true,
  dir: props.dir,
});
</script>

<template>
  <div class="dropdown-menu">
    <button class="button -trigger" type="button" v-bind="menu.triggerProps">
      {{ label }}
      <span class="icon -trigger" aria-hidden="true">⌄</span>
    </button>

    <ul class="list" popover v-bind="menu.menuProps">
      <DropdownMenuItem v-for="node in items" :key="node.key" :menu="menu" :node="node" />
    </ul>
  </div>
</template>

<style scoped>
.dropdown-menu {
  display: inline-block;

  > .button {
    &.-trigger {
      display: inline-flex;
      gap: 0.5rem;
      align-items: center;
      padding: var(--nagi-space-control, 0.5rem 0.75rem);
      border: 1px solid var(--nagi-color-border, #b9cbd1);
      border-radius: var(--nagi-radius-control, 0.55rem);
      background: var(--nagi-color-surface, #fff);
      color: var(--nagi-color-text, #17323b);
      font: inherit;
      font-weight: 650;
      cursor: pointer;

      &:hover,
      &[aria-expanded="true"] {
        background: var(--nagi-color-surface-active, #e5f1f4);
      }

      > .icon {
        color: var(--nagi-color-text-muted, #50676f);
        line-height: 1;
      }
    }
  }

  > .list {
    min-inline-size: 16rem;
    margin: 0;
    padding: var(--nagi-space-surface-inset, 0.4rem);
    border: 1px solid var(--nagi-color-border-muted, #c8d8dd);
    border-radius: var(--nagi-radius-overlay, 0.65rem);
    outline: none;
    background: var(--nagi-color-surface, #fff);
    box-shadow: var(--nagi-shadow-overlay, 0 14px 36px rgb(22 48 60 / 0.2));
    color: var(--nagi-color-text, #17323b);
    list-style: none;
    opacity: 0;
    transform: translateY(-0.35rem) scale(0.98);
    transform-origin: top;
    transition:
      opacity 0.14s,
      transform 0.14s,
      overlay 0.14s allow-discrete,
      display 0.14s allow-discrete;

    &:popover-open {
      opacity: 1;
      transform: translateY(0) scale(1);

      @starting-style {
        opacity: 0;
        transform: translateY(-0.35rem) scale(0.98);
      }
    }
  }
}
</style>
