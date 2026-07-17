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
  <li class="dropdown-submenu" role="none">
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
.dropdown-submenu {
  > .button {
    display: grid;
    grid-template-columns: 1rem minmax(0, 1fr) auto;
    gap: 0.55rem;
    align-items: center;
    inline-size: 100%;
    min-block-size: 2rem;
    padding: 0.35rem 0.55rem;
    border: 0;
    border-radius: 0.4rem;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: start;
    cursor: pointer;

    &[data-active],
    &[aria-expanded="true"] {
      background: #e5f1f4;
      outline: 2px solid #75adba;
      outline-offset: -2px;
    }

    &[aria-disabled="true"] {
      color: #91a1a6;
      cursor: not-allowed;
    }

    > .icon {
      color: #16768b;
      font-size: 0.78rem;
      text-align: center;

      &.-submenu {
        color: #788b91;
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
    padding: 0.4rem;
    border: 1px solid #c8d8dd;
    border-radius: 0.65rem;
    outline: none;
    background: #fff;
    box-shadow: 0 14px 36px rgb(22 48 60 / 0.2);
    color: #17323b;
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
