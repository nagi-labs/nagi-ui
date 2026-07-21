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
  border: 1px solid var(--nagi-color-border-muted, #c8d8dd);
  border-radius: var(--nagi-radius-control, 0.55rem);
  background: var(--nagi-color-surface, #fff);
  color: var(--nagi-color-text, #17323b);

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
    border-color: var(--nagi-color-accent, #16768b);
    background: var(--nagi-color-surface-accent, #e5f1f4);
    color: var(--nagi-color-accent, #16768b);
  }

  &.-positive {
    border-color: var(--nagi-color-success, #18794e);
    background: var(--nagi-color-surface-success, #e7f5ed);
    color: var(--nagi-color-success, #18794e);
  }

  &.-warning {
    border-color: var(--nagi-color-warning, #8a5a00);
    background: var(--nagi-color-surface-warning, #fff4d6);
    color: var(--nagi-color-warning, #8a5a00);
  }

  &.-danger {
    border-color: var(--nagi-color-danger, #aa3443);
    background: var(--nagi-color-surface-danger, #fbeaec);
    color: var(--nagi-color-danger, #aa3443);
  }
}
</style>
