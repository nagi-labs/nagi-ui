<script setup lang="ts">
import { computed, useAttrs } from "vue";

import { mergeElementProps } from "@nagi-labs/nagi-ui";

defineOptions({ inheritAttrs: false });

const attrs = useAttrs();
const skeletonProps = computed(() =>
  mergeElementProps(attrs, {
    "aria-hidden": "true",
  }),
);
</script>

<template>
  <span
    class="n-skeleton"
    v-bind="skeletonProps"
  ></span>
</template>

<style scoped>
.n-skeleton {
  display: block;
  inline-size: 100%;
  min-block-size: 1em;
  border-radius: var(--nagi-radius-item);
  background: var(--nagi-color-surface-active);
  animation: nagi-skeleton-pulse 1.5s ease-in-out infinite alternate;
}

@keyframes nagi-skeleton-pulse {
  to {
    opacity: 0.55;
  }
}

@media (prefers-reduced-motion: reduce) {
  .n-skeleton {
    animation: none;
  }
}
</style>
