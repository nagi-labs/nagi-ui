<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
}>();
</script>

<template>
  <div class="n-empty-state">
    <div class="unit">
      <div class="title">{{ title }}</div>
      <div v-if="description" class="text">{{ description }}</div>
    </div>
    <div v-if="$slots.default" class="actions">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.n-empty-state {
  display: grid;
  gap: var(--nagi-space-item-gap);
  justify-items: center;
  padding: calc(2 * var(--n-space-8));
  border: var(--n-border-width-1) dashed var(--nagi-color-border-muted);
  border-radius: var(--nagi-radius-overlay);
  background: var(--nagi-color-surface);
  color: var(--nagi-color-text);
  text-align: center;

  > .unit {
    display: grid;
    gap: var(--n-space-2);
    max-inline-size: 32rem;

    > .title {
      font-size: var(--n-font-size-5);
      font-weight: 700;
    }

    > .text {
      color: var(--nagi-color-text-muted);
      font-size: var(--n-font-size-3);
    }
  }

  > .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--nagi-space-item-gap);
    justify-content: center;
  }
}
</style>
