<script setup lang="ts">
import { useId } from "vue";

import type { UseMenuReturn } from "@nagi-labs/nagi-ui";

import DropdownSubmenu from "./DropdownSubmenu.vue";
import {
  actionEntry,
  checkboxEntry,
  linkEntry,
  radioEntry,
  type DropdownMenuActionNode,
  type DropdownMenuCheckboxNode,
  type DropdownMenuEntry,
  type DropdownMenuLinkNode,
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

function linkOptions(node: DropdownMenuLinkNode) {
  return {
    onSelect: (_entry: DropdownMenuEntry, event?: Event) => {
      // DOM focus stays on the menu container (aria-activedescendant), so a
      // keyboard activation has no native anchor default action to follow.
      // A configured router adapter takes over ordinary activation while the
      // real href remains available to SSR, no-JS, modified clicks, and copy.
      const pointerEvent = typeof MouseEvent !== "undefined" && event instanceof MouseEvent;
      const modifiedPointer =
        pointerEvent &&
        (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey);
      if (node.navigate && !modifiedPointer) {
        event?.preventDefault();
        void node.navigate();
      } else if (!node.navigate && event?.type === "keydown" && typeof window !== "undefined") {
        window.location.assign(node.href);
      }
    },
    ...(node.closeOnSelect === undefined ? {} : { closeOnSelect: node.closeOnSelect }),
  };
}

function prefetchLink(node: DropdownMenuLinkNode) {
  if (!node.disabled) void node.prefetch?.();
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
  <li v-if="node.type === 'separator'" class="n-dropdown-menu-item" role="separator"></li>

  <li
    v-else-if="node.type === 'group'"
    class="n-dropdown-menu-item"
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
    class="n-dropdown-menu-item"
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

  <li v-else-if="node.type === 'checkbox'" class="n-dropdown-menu-item" role="none">
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

  <li v-else-if="node.type === 'link'" class="n-dropdown-menu-item" role="none">
    <a
      class="link"
      :href="node.href"
      v-bind="menu.itemProps(linkEntry(node), linkOptions(node))"
      @pointerenter="prefetchLink(node)"
    >
      <span class="icon" aria-hidden="true"></span>
      <span class="text">{{ node.label }}</span>
      <span v-if="node.shortcut" class="text -shortcut" aria-hidden="true">{{ node.shortcut }}</span>
    </a>
  </li>

  <li v-else class="n-dropdown-menu-item" role="none">
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
.n-dropdown-menu-item {
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
        color: var(--nagi-color-text-muted);
        font-size: var(--nagi-font-size-label);
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

            &[data-active] {
              background: var(--nagi-color-surface-active);
              outline: 2px solid var(--nagi-color-focus-ring);
              outline-offset: -2px;
            }

            &[aria-disabled="true"] {
              color: var(--nagi-color-text-disabled);
              cursor: not-allowed;
            }

            &[aria-checked="false"] {
              > .icon {
                opacity: 0;
              }
            }

            > .icon {
              color: var(--nagi-color-accent);
              font-size: var(--nagi-font-size-icon);
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

  > .button,
  > .link {
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
    text-decoration: none;
    text-align: start;
    cursor: pointer;

    &[data-active] {
      background: var(--nagi-color-surface-active);
      outline: 2px solid var(--nagi-color-focus-ring);
      outline-offset: -2px;
    }

    &[aria-disabled="true"] {
      color: var(--nagi-color-text-disabled);
      cursor: not-allowed;
    }

    &[aria-checked="false"] {
      > .icon {
        opacity: 0;
      }
    }

    &.-danger {
      color: var(--nagi-color-danger);
    }

    > .icon {
      color: var(--nagi-color-accent);
      font-size: var(--nagi-font-size-icon);
      text-align: center;

      &.-dot {
        font-size: 0.55rem;
      }
    }

    > .text {
      &.-shortcut {
        color: var(--nagi-color-text-muted);
        font-size: 0.75rem;
      }
    }
  }
}
</style>
