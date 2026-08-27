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
  <div class="n-dropdown-menu">
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
.n-dropdown-menu {
  display: inline-block;

  > .button {
    &.-trigger {
      display: inline-flex;
      gap: var(--n-space-5);
      align-items: center;
      padding: var(--nagi-space-control);
      border: var(--n-border-width-1) solid var(--nagi-color-border);
      border-radius: var(--nagi-radius-control);
      background: var(--nagi-color-surface);
      color: var(--nagi-color-text);
      font: inherit;
      font-weight: 650;
      cursor: pointer;

      &:hover,
      &[aria-expanded="true"] {
        background: var(--nagi-color-surface-active);
      }

      > .icon {
        color: var(--nagi-color-text-muted);
        line-height: 1;
      }
    }
  }

  > .list {
    min-inline-size: 16rem;
    margin: 0;
    padding: var(--nagi-space-surface-inset);
    border: var(--n-border-width-1) solid var(--nagi-color-border-muted);
    border-radius: var(--nagi-radius-overlay);
    outline: none;
    background: var(--nagi-color-surface);
    box-shadow: var(--nagi-shadow-overlay);
    color: var(--nagi-color-text);
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
