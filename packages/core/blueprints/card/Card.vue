<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
}>();
</script>

<template>
  <article class="card">
    <header class="header">
      <h2 class="title">{{ title }}</h2>
      <p v-if="description" class="text">{{ description }}</p>
    </header>
    <section class="section">
      <slot />
    </section>
  </article>
</template>

<style scoped>
.card {
  overflow: hidden;
  border: 1px solid var(--nagi-color-border-muted, #c8d8dd);
  border-radius: var(--nagi-radius-overlay, 0.65rem);
  background: var(--nagi-color-surface, #fff);
  color: var(--nagi-color-text, #17323b);
  box-shadow: var(--nagi-shadow-overlay, 0 14px 36px rgb(22 48 60 / 0.2));

  > .header {
    padding: 1rem 1rem 0;

    > .title {
      margin: 0;
      font-size: 1.05rem;
    }

    > .text {
      margin-block: 0.35rem 0;
      color: var(--nagi-color-text-muted, #50676f);
      font-size: 0.9rem;
    }
  }

  > .section {
    padding: 1rem;
  }
}
</style>
