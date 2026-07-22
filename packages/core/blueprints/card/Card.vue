<script setup lang="ts">
defineProps<{
  title?: string;
  description?: string;
}>();
</script>

<template>
  <div class="n-card">
    <header v-if="title || description || $slots.title || $slots.description" class="header">
      <div v-if="title || $slots.title" class="title">
        <slot name="title" :title="title">{{ title }}</slot>
      </div>
      <div v-if="description || $slots.description" class="text">
        <slot name="description" :description="description">{{ description }}</slot>
      </div>
    </header>
    <div class="unit">
      <slot />
    </div>
    <div v-if="$slots.footer" class="unit -secondary">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped>
.n-card {
  overflow: hidden;
  border: 1px solid var(--nagi-color-border-muted);
  border-radius: var(--nagi-radius-overlay);
  background: var(--nagi-color-surface);
  color: var(--nagi-color-text);
  box-shadow: var(--nagi-shadow-overlay);

  > .header {
    padding: 1rem 1rem 0;

    > .title {
      margin: 0;
      font-size: 1.05rem;
    }

    > .text {
      margin-block: 0.35rem 0;
      color: var(--nagi-color-text-muted);
      font-size: 0.9rem;
    }
  }

  > .unit {
    padding: 1rem;
  }

  > .unit.-secondary {
    padding: 0 1rem 1rem;
  }
}
</style>
