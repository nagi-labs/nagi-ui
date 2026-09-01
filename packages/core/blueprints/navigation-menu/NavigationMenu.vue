<script lang="ts">
interface NavigationMenuLinkBase {
  key: string;
  label: string;
  href: string;
  target?: string;
  rel?: string;
  download?: string | boolean;
  navigate?: () => void | Promise<unknown>;
  prefetch?: () => void | Promise<unknown>;
}
export interface NavigationMenuLink extends NavigationMenuLinkBase {
  description?: string;
}
export interface NavigationMenuDirectLink extends NavigationMenuLinkBase {
  children?: never;
}
export interface NavigationMenuPanel {
  key: string;
  label: string;
  href?: never;
  children: readonly [NavigationMenuLink, ...NavigationMenuLink[]];
}
export type NavigationMenuItem = NavigationMenuDirectLink | NavigationMenuPanel;
</script>

<script setup lang="ts">
import type { StyleValue } from "vue";
import { handleLinkClick, prefetchLink, useNavigationMenu } from "@nagi-labs/nagi-ui";

const props = withDefaults(
  defineProps<{
    items: readonly NavigationMenuItem[];
    class?: string;
    style?: StyleValue;
    label?: string;
    closeDelay?: number;
  }>(),
  { label: "Primary navigation", closeDelay: 150 },
);
defineOptions({ inheritAttrs: false });
const open = defineModel<boolean>("open", { default: false });
const navigation = useNavigationMenu(props, open);

function isPanel(item: NavigationMenuItem): item is NavigationMenuPanel {
  return Array.isArray(item.children);
}

function isDirectLink(item: NavigationMenuItem): item is NavigationMenuDirectLink {
  return typeof item.href === "string";
}

function activateLink(item: NavigationMenuLinkBase, event: MouseEvent, closePanel: boolean) {
  if (handleLinkClick(item, event) && closePanel) navigation.close(true);
}
</script>

<template>
  <nav
    v-bind="navigation.navProps"
    class="n-navigation-menu"
    :class="props.class"
    :style="props.style"
  >
    <ul class="list">
      <li
        v-for="item in items"
        :key="item.key"
        class="item"
      >
        <button
          v-if="isPanel(item)"
          v-bind="navigation.navigationTriggerProps(item)"
          class="button -trigger"
        >
          {{ item.label }}
        </button>
        <a
          v-else-if="isDirectLink(item)"
          class="link"
          :href="item.href"
          :target="item.target"
          :rel="item.rel"
          :download="item.download"
          @click="activateLink(item, $event, false)"
          @pointerenter="prefetchLink(item)"
          >{{ item.label }}</a
        >
      </li>
    </ul>
    <div
      v-bind="navigation.popupProps"
      class="unit -popup"
      popover
      :style="navigation.positionStyle.value"
    >
      <ul
        v-if="navigation.activeItem.value?.children"
        class="list"
      >
        <li
          v-for="child in navigation.activeItem.value.children"
          :key="child.key"
          class="item"
        >
          <a
            class="link"
            :href="child.href"
            :target="child.target"
            :rel="child.rel"
            :download="child.download"
            @click="activateLink(child, $event, true)"
            @pointerenter="prefetchLink(child)"
          >
            <span class="title">{{ child.label }}</span>
            <span
              v-if="child.description"
              class="seg -description"
              >{{ child.description }}</span
            >
          </a>
        </li>
      </ul>
    </div>
  </nav>
</template>

<style scoped>
.n-navigation-menu {
  color: var(--nagi-color-text);
  > .list {
    display: flex;
    gap: var(--nagi-space-item-gap);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  > .list > .item > .link,
  > .list > .item > .button.-trigger {
    display: inline-flex;
    min-block-size: var(--nagi-size-control);
    align-items: center;
    padding: var(--nagi-space-control);
    border: 0;
    border-radius: var(--nagi-radius-control);
    background: transparent;
    color: inherit;
    font: inherit;
    text-decoration: none;
    cursor: pointer;
  }
  > .list > .item > .link:hover,
  > .list > .item > .button.-trigger:hover,
  > .list > .item > .button.-trigger[aria-expanded="true"] {
    background: var(--nagi-color-surface-active);
  }
  > .list > .item > :is(.link, .button.-trigger):focus-visible {
    outline: none;
    box-shadow: var(--nagi-shadow-focus);
  }
  > .unit.-popup {
    inline-size: min(20rem, calc(100vw - 1rem));
    min-inline-size: 0;
    margin: 0;
    padding: var(--nagi-space-surface-inset);
    border: var(--n-border-width-1) solid var(--nagi-color-border);
    border-radius: var(--nagi-radius-overlay);
    background: var(--nagi-color-surface);
    box-shadow: var(--nagi-shadow-overlay);
    color: inherit;
  }
  > .unit.-popup > .list {
    display: grid;
    gap: var(--nagi-space-item-gap);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  > .unit.-popup > .list > .item > .link {
    display: grid;
    gap: var(--nagi-space-item-gap);
    min-block-size: var(--nagi-size-control);
    padding: var(--nagi-space-item);
    border-radius: var(--nagi-radius-item);
    color: inherit;
    text-decoration: none;
  }
  > .unit.-popup > .list > .item > .link:hover {
    background: var(--nagi-color-surface-active);
  }
  > .unit.-popup > .list > .item > .link > .seg.-description {
    color: var(--nagi-color-text-muted);
    font-size: var(--nagi-font-size-label);
  }
}
@media (forced-colors: active) {
  .n-navigation-menu > .list > .item > :is(.link, .button.-trigger):focus-visible {
    outline: 2px solid Highlight;
  }
}
</style>
