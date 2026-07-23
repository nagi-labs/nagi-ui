<script lang="ts">
interface ContextMenuItemBase {
  key: string;
  label: string;
  disabled?: boolean;
}
export interface ContextMenuCommandItem extends ContextMenuItemBase { href?: never }
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
import { useContextMenu } from "@nagi-labs/nagi-ui";

const props = withDefaults(defineProps<{
  items: readonly ContextMenuItem[];
  label?: string;
  dir?: "ltr" | "rtl";
  loop?: boolean;
  longPressDelay?: number;
}>(), {
  label: "Context menu",
  dir: "ltr",
  loop: true,
  longPressDelay: 600,
});
const emit = defineEmits<{ select: [item: ContextMenuItem] }>();
const open = defineModel<boolean>("open", { default: false });
const context = useContextMenu(props, { open, onSelect: (item) => emit("select", item) });

function activateLink(item: ContextMenuLinkItem, event: MouseEvent) {
  const modified = event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
  if (!item.navigate || modified || (item.target && item.target !== "_self") || item.download !== undefined) return;
  event.preventDefault();
  void item.navigate();
}

function prefetchLink(item: ContextMenuLinkItem) {
  if (!item.disabled) void item.prefetch?.();
}
</script>

<template>
  <div class="n-context-menu">
    <span :id="`${context.menu.id}-trigger`" class="label">{{ label }}</span>
    <span
      :ref="(element) => context.setAnchorElement(element as HTMLElement | null)"
      class="anchor"
      aria-hidden="true"
      :style="context.anchorStyle.value"
    ></span>
    <div
      v-bind="context.contextTriggerProps"
      :ref="(element) => context.setContextElement(element as HTMLElement | null)"
      class="content"
      tabindex="-1"
    ><slot /></div>
    <ul
      v-bind="context.menu.menuProps"
      class="popup"
      popover
      :aria-label="label"
      :style="context.positionStyle.value"
    >
      <li v-for="item in items" :key="item.key" class="entry" role="none">
        <a
          v-if="'href' in item && !item.disabled"
          v-bind="context.menu.itemProps(item, { nativeLink: true })"
          class="item"
          :href="item.href"
          :target="item.target"
          :rel="item.rel"
          :download="item.download"
          @click="activateLink(item, $event)"
          @pointerenter="prefetchLink(item)"
        >{{ item.label }}</a>
        <button
          v-else
          v-bind="context.menu.itemProps(item)"
          class="item"
          type="button"
        >{{ item.label }}</button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.n-context-menu {
  display: contents;
  > .label { position: absolute; inline-size: 1px; block-size: 1px; clip-path: inset(50%); overflow: hidden; }
  > .anchor { position: fixed; }
  > .content { display: block; }
  > .popup {
    min-inline-size: 12rem; margin: 0; padding: var(--nagi-space-surface-inset); border: 1px solid var(--nagi-color-border);
    border-radius: var(--nagi-radius-overlay); outline: 0; background: var(--nagi-color-surface); box-shadow: var(--nagi-shadow-overlay); color: var(--nagi-color-text);
    > .entry {
      list-style: none;

      > .item {
      display: flex; box-sizing: border-box; inline-size: 100%; min-block-size: var(--nagi-size-control); align-items: center;
      padding: var(--nagi-space-item); border: 0; border-radius: var(--nagi-radius-item); background: transparent; color: inherit; font: inherit; text-decoration: none; cursor: pointer;
      &:focus { background: var(--nagi-color-surface-active); outline: 2px solid var(--nagi-color-focus-ring); }
      &[aria-disabled="true"] { color: var(--nagi-color-text-disabled); cursor: not-allowed; }
      }
    }
  }
}
@media (forced-colors: active) { .n-context-menu > .popup > .entry > .item:focus { outline: 2px solid Highlight; } }
</style>
