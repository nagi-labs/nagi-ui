<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    tone?: "neutral" | "accent" | "success" | "warning" | "danger";
    role?: "status" | "alert";
  }>(),
  { tone: "neutral", role: "status" },
);
</script>

<template>
  <section
    class="alert"
    :class="tone === 'neutral' ? undefined : tone === 'success' ? '-positive' : `-${tone}`"
    :role="role"
  >
    <h2 class="title">{{ title }}</h2>
    <div class="zone">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.alert {
  padding: 0.75rem 0.85rem;
  border: 1px solid var(--nagi-color-border-muted);
  border-radius: var(--nagi-radius-control);
  background: var(--nagi-color-surface);
  color: var(--nagi-color-text);

  > .title {
    margin: 0;
    font-size: 0.9rem;
  }

  > .zone {
    margin-block-start: 0.25rem;
    font-size: 0.85rem;

    > :first-child {
      margin-block-start: 0;
    }

    > :last-child {
      margin-block-end: 0;
    }
  }

  &.-accent {
    border-color: var(--nagi-color-accent);
    background: var(--nagi-color-surface-accent);
    color: var(--nagi-color-accent);
  }

  &.-positive {
    border-color: var(--nagi-color-success);
    background: var(--nagi-color-surface-success);
    color: var(--nagi-color-success);
  }

  &.-warning {
    border-color: var(--nagi-color-warning);
    background: var(--nagi-color-surface-warning);
    color: var(--nagi-color-warning);
  }

  &.-danger {
    border-color: var(--nagi-color-danger);
    background: var(--nagi-color-surface-danger);
    color: var(--nagi-color-danger);
  }
}
</style>
