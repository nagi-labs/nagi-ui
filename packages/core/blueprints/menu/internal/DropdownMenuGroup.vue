<script setup lang="ts">
import type { UseMenuReturn } from "@nagi-labs/nagi-ui";
import { useId } from "vue";

import DropdownMenuItem from "./DropdownMenuItem.vue";
import { radioOptions } from "../dropdown-options.ts";
import {
  radioEntry,
  type DropdownMenuEntry,
  type DropdownMenuGroupNode,
  type DropdownMenuRadioGroupNode,
} from "../dropdown-schema.ts";

const props = defineProps<{
  menu: UseMenuReturn<DropdownMenuEntry>;
  node: DropdownMenuGroupNode | DropdownMenuRadioGroupNode;
}>();
defineOptions({ inheritAttrs: false });

const labelId = useId();
</script>

<template>
  <li
    class="n-dropdown-menu-group"
    role="group"
    :aria-labelledby="props.node.label ? labelId : undefined"
  >
    <div
      v-if="props.node.label"
      :id="labelId"
      class="text -category"
    >
      {{ props.node.label }}
    </div>
    <ul
      class="list"
      role="presentation"
    >
      <DropdownMenuItem
        v-if="props.node.type === 'group'"
        v-for="child in props.node.items"
        :key="child.key"
        :menu="props.menu"
        :node="child"
      />
      <li
        v-else
        v-for="item in props.node.items"
        :key="item.key"
        class="item"
        role="none"
      >
        <button
          class="button"
          type="button"
          v-bind="
            props.menu.radioItemProps(radioEntry(props.node, item), radioOptions(props.node, item))
          "
        >
          <span
            class="icon"
            aria-hidden="true"
            >●</span
          >
          <span class="text">{{ item.label }}</span>
        </button>
      </li>
    </ul>
  </li>
</template>

<style scoped>
.n-dropdown-menu-group {
  --local-label-tracking: 0.05em;

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
          font-size: var(--n-font-size-1);
          text-align: center;
        }
      }
    }
  }
}
</style>
