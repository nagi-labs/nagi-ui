<script setup lang="ts">
defineOptions({ inheritAttrs: false });

defineProps<{
  label?: string;
}>();
</script>

<template>
  <span
    v-bind="$attrs"
    class="n-spinner"
    :role="label ? 'status' : undefined"
    :aria-label="label || undefined"
    :aria-hidden="label ? undefined : 'true'"
  ></span>
</template>

<style scoped>
.n-spinner {
  display: inline-block;
  box-sizing: border-box;
  inline-size: 1em;
  aspect-ratio: 1;
  border: 0.15em solid var(--nagi-color-border-muted);
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
