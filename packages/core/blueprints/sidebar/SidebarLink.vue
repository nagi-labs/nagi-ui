<script setup lang="ts">
import { handleLinkClick, mergeElementProps } from "@nagi-labs/nagi-ui";
import { computed, useAttrs } from "vue";

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
const attrs = useAttrs();
const anchorProps = computed(() =>
  mergeElementProps(attrs, {
    href: props.href,
    target: props.target,
    rel: props.rel,
    download: props.download,
    "aria-current": props.current ? "page" : undefined,
  }),
);

function onClick(event: MouseEvent) {
  handleLinkClick(
    {
      navigate: props.navigate,
      target: props.target,
      download: props.download,
    },
    event,
  );
}
</script>

<template>
  <a
    class="n-sidebar-link"
    v-bind="anchorProps"
    @click="onClick"
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
