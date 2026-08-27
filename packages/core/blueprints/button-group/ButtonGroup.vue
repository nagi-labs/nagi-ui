<script setup lang="ts">
withDefaults(
  defineProps<{
    /** Optional accessible name when nearby text does not label the group. */
    label?: string;
    orientation?: "horizontal" | "vertical";
  }>(),
  { orientation: "horizontal" },
);
</script>

<template>
  <div
    class="n-button-group"
    :data-orientation="orientation"
    role="group"
    :aria-label="label"
  >
    <slot />
  </div>
</template>

<style scoped>
.n-button-group {
  display: inline-flex;
  gap: var(--nagi-space-item-gap);
  align-items: center;

  &[data-orientation="vertical"] {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
