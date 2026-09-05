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
import { useNavigationMenu } from "@nagi-labs/nagi-ui";

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
          v-if="item.children !== undefined"
          v-bind="navigation.navigationTriggerProps(item)"
          class="button"
        >
          {{ item.label }}
        </button>
        <a
          v-else-if="item.href !== undefined"
          v-bind="navigation.directLinkProps(item)"
          class="link"
          :href="item.href"
          :target="item.target"
          :rel="item.rel"
          :download="item.download"
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
            v-bind="navigation.panelLinkProps(child)"
            class="link"
            :href="child.href"
            :target="child.target"
            :rel="child.rel"
            :download="child.download"
          >
            <span class="text">{{ child.label }}</span>
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

    > .item {
      > :is(.link, .button) {
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

        &:hover {
          background: var(--nagi-color-surface-active);
        }

        &:focus-visible {
          outline: none;
          box-shadow: var(--nagi-shadow-focus);
        }
      }

      > .button[aria-expanded="true"] {
        background: var(--nagi-color-surface-active);
      }
    }
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

    > .list {
      display: grid;
      gap: var(--nagi-space-item-gap);
      margin: 0;
      padding: 0;
      list-style: none;

      > .item {
        > .link {
          display: grid;
          gap: var(--nagi-space-item-gap);
          min-block-size: var(--nagi-size-control);
          padding: var(--nagi-space-item);
          border-radius: var(--nagi-radius-item);
          color: inherit;
          text-decoration: none;

          &:hover {
            background: var(--nagi-color-surface-active);
          }

          > .seg.-description {
            color: var(--nagi-color-text-muted);
            font-size: var(--nagi-font-size-label);
          }
        }
      }
    }
  }
}
@media (forced-colors: active) {
  .n-navigation-menu {
    > .list {
      > .item {
        > :is(.link, .button):focus-visible {
          outline: 2px solid Highlight;
        }
      }
    }
  }
}
</style>
