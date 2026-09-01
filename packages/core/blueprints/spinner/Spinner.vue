<script setup lang="ts">
import { computed, useAttrs } from "vue";

import { mergeElementProps } from "@nagi-labs/nagi-ui";

defineOptions({ inheritAttrs: false });

const { label } = defineProps<{
  label?: string;
}>();

const attrs = useAttrs();
const spinnerProps = computed(() =>
  mergeElementProps(attrs, {
    role: label ? "status" : undefined,
    "aria-label": label || undefined,
    "aria-hidden": label ? undefined : "true",
  }),
);
</script>

<template>
  <span
    class="n-spinner"
    v-bind="spinnerProps"
  ></span>
</template>

<style scoped>
.n-spinner {
  --local-stroke-width: 0.15em;

  display: inline-block;
  box-sizing: border-box;
  inline-size: 1em;
  aspect-ratio: 1;
  border: var(--local-stroke-width) solid var(--nagi-color-border-muted);
  border-block-start-color: var(--nagi-color-accent);
  border-radius: 50%;
  animation: nagi-spinner-spin 0.8s linear infinite;
}

@keyframes nagi-spinner-spin {
  to {
    rotate: 1turn;
  }
}

@media (prefers-reduced-motion: reduce) {
  .n-spinner {
    animation: none;
  }
}
</style>
