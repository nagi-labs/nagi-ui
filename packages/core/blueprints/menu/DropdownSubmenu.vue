<script setup lang="ts">
import { useSubmenu, type UseMenuReturn } from "@nagi-labs/nagi-ui";

import DropdownMenuItem from "./DropdownMenuItem.vue";
import {
  menuEntries,
  submenuEntry,
  type DropdownMenuEntry,
  type DropdownMenuSubmenuNode,
} from "./dropdown-schema.ts";

const props = defineProps<{
  menu: UseMenuReturn<DropdownMenuEntry>;
  node: DropdownMenuSubmenuNode;
}>();

const submenu = useSubmenu(props.menu, submenuEntry(props.node), {
  items: () => menuEntries(props.node.items),
  getKey: (entry) => entry.key,
  getTextValue: (entry) => entry.label,
  isDisabled: (entry) => entry.disabled,
});
</script>

<template>
  <li class="n-dropdown-submenu" role="none">
    <button
      class="button"
      type="button"
      v-bind="menu.submenuTriggerProps(submenuEntry(node), submenu)"
    >
      <span class="icon" aria-hidden="true"></span>
      <span class="text">{{ node.label }}</span>
      <span class="icon -submenu" aria-hidden="true">›</span>
    </button>

    <ul class="list -submenu" popover v-bind="submenu.menuProps">
      <DropdownMenuItem
        v-for="child in node.items"
        :key="child.key"
        :menu="submenu"
        :node="child"
      />
    </ul>
  </li>
</template>

<style scoped>
.n-dropdown-submenu {
  > .button {
    display: grid;
    grid-template-columns: 1rem minmax(0, 1fr) auto;
    gap: var(--nagi-space-item-gap);
    align-items: center;
    inline-size: 100%;
    min-block-size: var(--nagi-size-control);
    padding: var(--nagi-space-item);
    border: 0;
    border-radius: var(--nagi-radius-item);
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: start;
    cursor: pointer;

    &[data-active],
    &[aria-expanded="true"] {
      background: var(--nagi-color-surface-active);
      outline: 2px solid var(--nagi-color-focus-ring);
      outline-offset: -2px;
    }

    &[aria-disabled="true"] {
      color: var(--nagi-color-text-disabled);
      cursor: not-allowed;
    }

    > .icon {
      color: var(--nagi-color-accent);
      font-size: var(--nagi-font-size-icon);
      text-align: center;

      &.-submenu {
        color: var(--nagi-color-text-muted);
        font-size: 0.75rem;
      }
    }

    > .text {
      color: inherit;
    }
  }

  > .list {
    min-inline-size: 12rem;
    margin: 0;
    padding: var(--nagi-space-surface-inset);
    border: 1px solid var(--nagi-color-border-muted);
    border-radius: var(--nagi-radius-overlay);
    outline: none;
    background: var(--nagi-color-surface);
    box-shadow: var(--nagi-shadow-overlay);
    color: var(--nagi-color-text);
    list-style: none;
    opacity: 0;
    transform: translateX(-0.25rem) scale(0.98);
    transform-origin: left top;
    transition:
      opacity 0.14s,
      transform 0.14s,
      overlay 0.14s allow-discrete,
      display 0.14s allow-discrete;

    &:popover-open {
      opacity: 1;
      transform: translateX(0) scale(1);

      @starting-style {
        opacity: 0;
        transform: translateX(-0.25rem) scale(0.98);
      }
    }

    &[dir="rtl"] {
      transform-origin: right top;
    }
  }

  &:dir(rtl) {
    > .button {
      > .icon {
        &.-submenu {
          transform: scaleX(-1);
        }
      }
    }
  }
}
</style>
