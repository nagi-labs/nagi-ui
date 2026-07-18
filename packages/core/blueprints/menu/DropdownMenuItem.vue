<script setup lang="ts">
import { useId } from "vue";

import type { UseMenuReturn } from "@nagi-labs/nagi-ui";

import DropdownSubmenu from "./DropdownSubmenu.vue";
import {
  actionEntry,
  checkboxEntry,
  radioEntry,
  type DropdownMenuActionNode,
  type DropdownMenuCheckboxNode,
  type DropdownMenuEntry,
  type DropdownMenuNode,
  type DropdownMenuRadioGroupNode,
  type DropdownMenuRadioItem,
} from "./dropdown-schema.ts";

defineProps<{
  menu: UseMenuReturn<DropdownMenuEntry>;
  node: DropdownMenuNode;
}>();

const labelId = useId();

function actionOptions(node: DropdownMenuActionNode) {
  return {
    onSelect: () => node.onSelect(),
    ...(node.closeOnSelect === undefined ? {} : { closeOnSelect: node.closeOnSelect }),
  };
}

function checkboxOptions(node: DropdownMenuCheckboxNode) {
  return {
    checked: node.checked,
    onCheckedChange: node.onCheckedChange,
    ...(node.closeOnSelect === undefined ? {} : { closeOnSelect: node.closeOnSelect }),
  };
}

function radioOptions(group: DropdownMenuRadioGroupNode, item: DropdownMenuRadioItem) {
  return {
    checked: group.value === item.key,
    onSelect: () => group.onValueChange(item.key),
    ...(group.closeOnSelect === undefined ? {} : { closeOnSelect: group.closeOnSelect }),
  };
}
</script>

<template>
  <li v-if="node.type === 'separator'" class="dropdown-menu-item" role="separator"></li>

  <li
    v-else-if="node.type === 'group'"
    class="dropdown-menu-item"
    role="group"
    :aria-labelledby="node.label ? labelId : undefined"
  >
    <div v-if="node.label" :id="labelId" class="text -category">{{ node.label }}</div>
    <ul class="list -items" role="presentation">
      <DropdownMenuItem
        v-for="child in node.items"
        :key="child.key"
        :menu="menu"
        :node="child"
      />
    </ul>
  </li>

  <li
    v-else-if="node.type === 'radio-group'"
    class="dropdown-menu-item"
    role="group"
    :aria-labelledby="node.label ? labelId : undefined"
  >
    <div v-if="node.label" :id="labelId" class="text -category">{{ node.label }}</div>
    <ul class="list -items" role="presentation">
      <li v-for="item in node.items" :key="item.key" class="item" role="none">
        <button
          class="button"
          type="button"
          v-bind="menu.radioItemProps(radioEntry(node, item), radioOptions(node, item))"
        >
          <span class="icon -dot" aria-hidden="true">●</span>
          <span class="text">{{ item.label }}</span>
        </button>
      </li>
    </ul>
  </li>

  <DropdownSubmenu v-else-if="node.type === 'submenu'" :menu="menu" :node="node" />

  <li v-else-if="node.type === 'checkbox'" class="dropdown-menu-item" role="none">
    <button
      class="button"
      type="button"
      v-bind="menu.checkboxItemProps(checkboxEntry(node), checkboxOptions(node))"
    >
      <span class="icon -check" aria-hidden="true">✓</span>
      <span class="text">{{ node.label }}</span>
      <span v-if="node.shortcut" class="text -shortcut" aria-hidden="true">{{ node.shortcut }}</span>
    </button>
  </li>

  <li v-else class="dropdown-menu-item" role="none">
    <button
      class="button"
      type="button"
      :class="node.variant === 'danger' ? '-danger' : undefined"
      v-bind="menu.itemProps(actionEntry(node), actionOptions(node))"
    >
      <span class="icon" aria-hidden="true"></span>
      <span class="text">{{ node.label }}</span>
      <span v-if="node.shortcut" class="text -shortcut" aria-hidden="true">{{ node.shortcut }}</span>
    </button>
  </li>
</template>

<style scoped>
.dropdown-menu-item {
  &[role="separator"] {
    box-sizing: content-box;
    block-size: 1px;
    padding: 0.35rem 0.3rem;
    background: #dbe6e9;
    background-clip: content-box;
  }

  &[role="group"] {
    > .text {
      &.-category {
        padding: 0.35rem 0.6rem 0.25rem;
        color: var(--nagi-color-text-muted, #50676f);
        font-size: var(--nagi-font-size-label, 0.72rem);
        font-weight: 750;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }
    }

    > .list {
      &.-items {
        margin: 0;
        padding: 0;
        list-style: none;

        > .item {
          > .button {
            display: grid;
            grid-template-columns: 1rem minmax(0, 1fr) auto;
            gap: 0.55rem;
            align-items: center;
            inline-size: 100%;
            min-block-size: var(--nagi-size-control, 2rem);
            padding: 0.35rem 0.55rem;
            border: 0;
            border-radius: var(--nagi-radius-item, 0.4rem);
            background: transparent;
            color: inherit;
            font: inherit;
            text-align: start;
            cursor: pointer;

            &[data-active] {
              background: var(--nagi-color-surface-active, #e5f1f4);
              outline: 2px solid var(--nagi-color-focus-ring, #75adba);
              outline-offset: -2px;
            }

            &[aria-disabled="true"] {
              color: var(--nagi-color-text-disabled, #91a1a6);
              cursor: not-allowed;
            }

            &[aria-checked="false"] {
              > .icon {
                opacity: 0;
              }
            }

            > .icon {
              color: var(--nagi-color-accent, #16768b);
              font-size: var(--nagi-font-size-icon, 0.78rem);
              text-align: center;

              &.-dot {
                font-size: 0.55rem;
              }
            }
          }
        }
      }
    }
  }

  > .button {
    display: grid;
    grid-template-columns: 1rem minmax(0, 1fr) auto;
    gap: 0.55rem;
    align-items: center;
    inline-size: 100%;
    min-block-size: var(--nagi-size-control, 2rem);
    padding: 0.35rem 0.55rem;
    border: 0;
    border-radius: var(--nagi-radius-item, 0.4rem);
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: start;
    cursor: pointer;

    &[data-active] {
      background: var(--nagi-color-surface-active, #e5f1f4);
      outline: 2px solid var(--nagi-color-focus-ring, #75adba);
      outline-offset: -2px;
    }

    &[aria-disabled="true"] {
      color: var(--nagi-color-text-disabled, #91a1a6);
      cursor: not-allowed;
    }

    &[aria-checked="false"] {
      > .icon {
        opacity: 0;
      }
    }

    &.-danger {
      color: #aa3443;
    }

    > .icon {
      color: var(--nagi-color-accent, #16768b);
      font-size: var(--nagi-font-size-icon, 0.78rem);
      text-align: center;

      &.-dot {
        font-size: 0.55rem;
      }
    }

    > .text {
      &.-shortcut {
        color: var(--nagi-color-text-muted, #50676f);
        font-size: 0.75rem;
      }
    }
  }
}
</style>
