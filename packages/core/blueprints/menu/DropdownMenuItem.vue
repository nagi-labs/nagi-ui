<script setup lang="ts">
import { useId } from "vue";

import type { UseMenuReturn } from "@nagi-labs/nagi-ui";

import DropdownSubmenu from "./DropdownSubmenu.vue";
import {
  actionEntry,
  checkboxEntry,
  linkEntry,
  radioEntry,
  type DropdownMenuEntry,
  type DropdownMenuNode,
} from "./dropdown-schema.ts";
import {
  actionOptions,
  checkboxOptions,
  linkOptions,
  prefetchLink,
  radioOptions,
} from "./dropdown-options.ts";

defineProps<{
  menu: UseMenuReturn<DropdownMenuEntry>;
  node: DropdownMenuNode;
}>();
defineOptions({ inheritAttrs: false });

const labelId = useId();
</script>

<template>
  <li
    v-if="node.type === 'separator'"
    class="n-dropdown-menu-item"
    role="separator"
  ></li>

  <li
    v-else-if="node.type === 'group'"
    class="n-dropdown-menu-item"
    role="group"
    :aria-labelledby="node.label ? labelId : undefined"
  >
    <div
      v-if="node.label"
      :id="labelId"
      class="text -category"
    >
      {{ node.label }}
    </div>
    <ul
      class="list -items"
      role="presentation"
    >
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
    <div
      v-if="node.label"
      :id="labelId"
      class="text -category"
    >
      {{ node.label }}
    </div>
    <ul
      class="list -items"
      role="presentation"
    >
      <li
        v-for="item in node.items"
        :key="item.key"
        class="item"
        role="none"
      >
        <button
          class="button"
          type="button"
          v-bind="menu.radioItemProps(radioEntry(node, item), radioOptions(node, item))"
        >
          <span
            class="icon -dot"
            aria-hidden="true"
            >●</span
          >
          <span class="text">{{ item.label }}</span>
        </button>
      </li>
    </ul>
  </li>

  <DropdownSubmenu
    v-else-if="node.type === 'submenu'"
    :menu="menu"
    :node="node"
  />

  <li
    v-else-if="node.type === 'checkbox'"
    class="n-dropdown-menu-item"
    role="none"
  >
    <button
      class="button"
      type="button"
      v-bind="menu.checkboxItemProps(checkboxEntry(node), checkboxOptions(node))"
    >
      <span
        class="icon -check"
        aria-hidden="true"
        >✓</span
      >
      <span class="text">{{ node.label }}</span>
      <span
        v-if="node.shortcut"
        class="text -shortcut"
        aria-hidden="true"
        >{{ node.shortcut }}</span
      >
    </button>
  </li>

  <li
    v-else-if="node.type === 'link'"
    class="n-dropdown-menu-item"
    role="none"
  >
    <a
      class="link"
      :href="node.href"
      :target="node.target"
      :rel="node.rel"
      :download="node.download"
      v-bind="menu.itemProps(linkEntry(node), linkOptions(node))"
      @pointerenter="prefetchLink(node)"
    >
      <span
        class="icon"
        aria-hidden="true"
      ></span>
      <span class="text">{{ node.label }}</span>
      <span
        v-if="node.shortcut"
        class="text -shortcut"
        aria-hidden="true"
        >{{ node.shortcut }}</span
      >
    </a>
  </li>

  <li
    v-else
    class="n-dropdown-menu-item"
    role="none"
  >
    <button
      class="button"
      type="button"
      :data-variant="node.variant"
      v-bind="menu.itemProps(actionEntry(node), actionOptions(node))"
    >
      <span
        class="icon"
        aria-hidden="true"
      ></span>
      <span class="text">{{ node.label }}</span>
      <span
        v-if="node.shortcut"
        class="text -shortcut"
        aria-hidden="true"
        >{{ node.shortcut }}</span
      >
    </button>
  </li>
</template>

<style scoped>
.n-dropdown-menu-item {
  --local-label-tracking: 0.05em;

  &[role="separator"] {
    box-sizing: content-box;
    block-size: 1px;
    padding: var(--n-space-3) var(--n-space-2);
    background: var(--nagi-color-border-muted);
    background-clip: content-box;
  }

  &[role="group"] {
    > .text {
      &.-category {
        padding: var(--n-space-3) var(--n-space-6) var(--n-space-2);
        color: var(--nagi-color-text-muted);
        font-size: var(--nagi-font-size-label);
        font-weight: 750;
        letter-spacing: var(--local-label-tracking);
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

            &:focus {
              background: var(--nagi-color-surface-active);
              outline: 2px solid var(--nagi-color-focus-ring);
              outline-offset: calc(-1 * var(--n-border-width-2));
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
                font-size: var(--n-font-size-1);
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

    &:focus {
      background: var(--nagi-color-surface-active);
      outline: 2px solid var(--nagi-color-focus-ring);
      outline-offset: calc(-1 * var(--n-border-width-2));
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

    &[data-variant="danger"] {
      color: var(--nagi-color-danger);
    }

    > .icon {
      color: var(--nagi-color-accent);
      font-size: var(--nagi-font-size-icon);
      text-align: center;

      &.-dot {
        font-size: var(--n-font-size-1);
      }
    }

    > .text {
      &.-shortcut {
        color: var(--nagi-color-text-muted);
        font-size: var(--n-font-size-2);
      }
    }
  }
}
</style>
