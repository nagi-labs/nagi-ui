<script lang="ts">
interface MenubarActionBase {
  key: string;
  label: string;
  disabled?: boolean;
}
export interface MenubarCommandAction extends MenubarActionBase { href?: never }
export interface MenubarLinkAction extends MenubarActionBase {
  href: string;
  target?: string;
  rel?: string;
  download?: string | boolean;
  navigate?: () => void | Promise<unknown>;
  prefetch?: () => void | Promise<unknown>;
}
export type MenubarAction = MenubarCommandAction | MenubarLinkAction;
export interface MenubarMenu {
  key: string;
  label: string;
  disabled?: boolean;
  items: readonly MenubarAction[];
}
</script>

<script setup lang="ts">
import { useMenubar } from "@nagi-labs/nagi-ui";

const props = withDefaults(defineProps<{
  items: readonly MenubarMenu[];
  label?: string;
  dir?: "ltr" | "rtl";
}>(), { label: "Application menu", dir: "ltr" });
const emit = defineEmits<{ select: [item: MenubarAction] }>();
const open = defineModel<boolean>("open", { default: false });
const menubar = useMenubar(props, { open, onSelect: (item) => emit("select", item) });

function isLink(item: MenubarAction): item is MenubarLinkAction {
  return typeof item.href === "string";
}

function activateLink(item: MenubarLinkAction, event: MouseEvent) {
  const modified = event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
  if (!item.navigate || modified || (item.target && item.target !== "_self") || item.download !== undefined) return;
  event.preventDefault();
  void item.navigate();
}

function prefetchLink(item: MenubarLinkAction) {
  if (!item.disabled) void item.prefetch?.();
}
</script>

<template>
  <div class="n-menubar">
    <div v-bind="menubar.menubarProps" class="list">
      <button
        v-for="menu in items"
        :key="menu.key"
        v-bind="menubar.menubarTriggerProps(menu)"
        class="button -trigger"
        type="button"
      >{{ menu.label }}</button>
    </div>
    <ul v-bind="menubar.menuProps" class="list -popup" popover :style="menubar.positionStyle.value">
      <li v-for="item in menubar.activeItems()" :key="item.key" class="item" role="none">
        <a
          v-if="isLink(item) && !item.disabled"
          v-bind="menubar.actionProps(item)"
          class="link"
          :href="item.href"
          :target="item.target"
          :rel="item.rel"
          :download="item.download"
          @click="activateLink(item, $event)"
          @pointerenter="prefetchLink(item)"
        >{{ item.label }}</a>
        <button
          v-else
          v-bind="menubar.actionProps(item)"
          class="button"
          type="button"
        >{{ item.label }}</button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.n-menubar {
  color: var(--nagi-color-text);
  > .list { display: flex; gap: var(--nagi-space-item-gap); align-items: center; inline-size: fit-content; padding: var(--nagi-space-item-gap); border: var(--n-border-width-1) solid var(--nagi-color-border); border-radius: var(--nagi-radius-control); background: var(--nagi-color-surface); }
  > .list > .button.-trigger { min-block-size: var(--nagi-size-control); padding: var(--nagi-space-control); border: 0; border-radius: var(--nagi-radius-control); background: transparent; color: inherit; font: inherit; cursor: pointer; }
  > .list > .button.-trigger:hover:not([aria-disabled="true"]), > .list > .button.-trigger[aria-expanded="true"] { background: var(--nagi-color-surface-active); }
  > .list > .button.-trigger:focus-visible { outline: none; box-shadow: var(--nagi-shadow-focus); }
  > .list > .button.-trigger[aria-disabled="true"] { color: var(--nagi-color-text-disabled); cursor: not-allowed; }
  > .list.-popup {
    min-inline-size: 12rem; margin: 0; padding: var(--nagi-space-surface-inset); border: var(--n-border-width-1) solid var(--nagi-color-border); border-radius: var(--nagi-radius-overlay);
    outline: 0; background: var(--nagi-color-surface); box-shadow: var(--nagi-shadow-overlay); color: inherit;
    > .item { list-style: none; }
    > .item > :is(.link, .button) { display: flex; box-sizing: border-box; inline-size: 100%; min-block-size: var(--nagi-size-control); align-items: center; padding: var(--nagi-space-item); border: 0; border-radius: var(--nagi-radius-item); background: transparent; color: inherit; font: inherit; text-decoration: none; cursor: pointer; }
    > .item > :is(.link, .button):focus { background: var(--nagi-color-surface-active); outline: 2px solid var(--nagi-color-focus-ring); }
    > .item > :is(.link, .button)[aria-disabled="true"] { color: var(--nagi-color-text-disabled); cursor: not-allowed; }
  }
}
@media (forced-colors: active) { .n-menubar > .list > .button.-trigger:focus-visible { outline: 2px solid Highlight; } }
</style>
