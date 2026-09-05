<script setup lang="ts">
import { useSidebarLink } from "@nagi-labs/nagi-ui/component-controls";
import { useAttrs } from "vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    href: string;
    current?: boolean;
    navigate?: () => void | Promise<unknown>;
    target?: string;
    rel?: string;
    download?: string;
  }>(),
  { current: false },
);
const link = useSidebarLink(props, useAttrs());
</script>

<template>
  <a
    class="n-sidebar-link"
    v-bind="link.anchorProps"
  >
    <slot />
  </a>
</template>

<style scoped>
.n-sidebar-link {
  display: block;
  padding: var(--n-space-2) var(--n-space-4);
  border-radius: var(--nagi-radius-item);
  color: var(--nagi-color-text-muted);
  font-size: var(--n-font-size-3);
  font-weight: 500;
  text-decoration: none;

  &:hover,
  &[aria-current="page"] {
    background: var(--nagi-color-surface-active);
    color: var(--nagi-color-text);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--nagi-shadow-focus);
  }
}

@media (forced-colors: active) {
  .n-sidebar-link:focus-visible {
    outline: 2px solid Highlight;
    outline-offset: var(--n-border-width-2);
  }
}
</style>
