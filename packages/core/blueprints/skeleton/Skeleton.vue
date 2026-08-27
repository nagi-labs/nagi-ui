<script setup lang="ts">
defineOptions({ inheritAttrs: false });
</script>

<template>
  <span v-bind="$attrs" class="n-skeleton" aria-hidden="true"></span>
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
