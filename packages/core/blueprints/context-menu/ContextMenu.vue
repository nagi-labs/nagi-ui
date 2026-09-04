<script lang="ts">
interface ContextMenuItemBase {
  key: string;
  label: string;
  disabled?: boolean;
}
export interface ContextMenuCommandItem extends ContextMenuItemBase {
  href?: never;
}
export interface ContextMenuLinkItem extends ContextMenuItemBase {
  href: string;
  target?: string;
  rel?: string;
  download?: string | boolean;
  navigate?: () => void | Promise<unknown>;
  prefetch?: () => void | Promise<unknown>;
}
export type ContextMenuItem = ContextMenuCommandItem | ContextMenuLinkItem;
</script>

<script setup lang="ts">
import type { StyleValue } from "vue";
import { handleLinkClick, prefetchLink, useContextMenu } from "@nagi-labs/nagi-ui";

const props = withDefaults(
  defineProps<{
    items: readonly ContextMenuItem[];
    id?: string;
    class?: string;
    style?: StyleValue;
    label?: string;
    dir?: "ltr" | "rtl";
    loop?: boolean;
    longPressDelay?: number;
  }>(),
  {
    label: "Context menu",
    dir: "ltr",
    loop: true,
    longPressDelay: 600,
  },
);
defineOptions({ inheritAttrs: false });
const emit = defineEmits<{ select: [item: ContextMenuItem] }>();
const open = defineModel<boolean>("open", { default: false });
const context = useContextMenu(props, { open, onSelect: (item) => emit("select", item) });

function isLink(item: ContextMenuItem): item is ContextMenuLinkItem {
  return typeof item.href === "string";
}
</script>

<template>
  <div
    class="n-context-menu"
    :id="id"
    :class="props.class"
    :style="props.style"
  >
    <span
      :id="`${context.menu.id}-trigger`"
      class="text"
      >{{ label }}</span
    >
    <span
      v-bind="context.anchorProps"
      class="unit -positioner"
      aria-hidden="true"
      :style="context.anchorStyle.value"
    ></span>
    <div
      v-bind="context.contextTriggerProps"
      class="unit -target"
      tabindex="-1"
    >
      <slot />
    </div>
    <ul
      v-bind="context.menu.menuProps"
      class="list"
      popover
      :aria-label="label"
      :style="context.positionStyle.value"
    >
      <li
        v-for="item in items"
        :key="item.key"
        class="item"
        role="none"
      >
        <a
          v-if="isLink(item) && !item.disabled"
          v-bind="context.menu.itemProps(item, { nativeLink: true })"
          class="link"
          :href="item.href"
          :target="item.target"
          :rel="item.rel"
          :download="item.download"
          @click="handleLinkClick(item, $event)"
          @pointerenter="prefetchLink(item)"
          >{{ item.label }}</a
        >
        <button
          v-else
          v-bind="context.menu.itemProps(item)"
          class="button"
          type="button"
        >
          {{ item.label }}
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.n-context-menu {
  display: contents;
  > .text {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    clip-path: inset(50%);
    overflow: hidden;
  }
  > .unit.-positioner {
    position: fixed;
  }
  > .unit.-target {
    display: block;
  }
  > .list {
    min-inline-size: 12rem;
    margin: 0;
    padding: var(--nagi-space-surface-inset);
    border: var(--n-border-width-1) solid var(--nagi-color-border);
    border-radius: var(--nagi-radius-overlay);
    outline: 0;
    background: var(--nagi-color-surface);
    box-shadow: var(--nagi-shadow-overlay);
    color: var(--nagi-color-text);
    > .item {
      list-style: none;

      > :is(.link, .button) {
        display: flex;
        box-sizing: border-box;
        inline-size: 100%;
        min-block-size: var(--nagi-size-control);
        align-items: center;
        padding: var(--nagi-space-item);
        border: 0;
        border-radius: var(--nagi-radius-item);
        background: transparent;
        color: inherit;
        font: inherit;
        text-decoration: none;
        cursor: pointer;
        &:focus {
          background: var(--nagi-color-surface-active);
          outline: 2px solid var(--nagi-color-focus-ring);
        }
        &[aria-disabled="true"] {
          color: var(--nagi-color-text-disabled);
          cursor: not-allowed;
        }
      }
    }
  }
}
@media (forced-colors: active) {
  .n-context-menu {
    > .list {
      > .item {
        > :is(.link, .button):focus {
          outline: 2px solid Highlight;
        }
      }
    }
  }
}
</style>
