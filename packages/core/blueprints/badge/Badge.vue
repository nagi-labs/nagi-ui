<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string;
    tone?: "neutral" | "accent" | "success" | "warning" | "danger";
  }>(),
  { tone: "neutral" },
);
</script>

<template>
  <span
    class="badge"
    :class="tone === 'neutral' ? undefined : tone === 'success' ? '-positive' : `-${tone}`"
  >
    {{ label }}
  </span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  min-block-size: 1.5rem;
  padding-inline: 0.5rem;
  border: 1px solid var(--nagi-color-border-muted, #c8d8dd);
  border-radius: 999px;
  background: var(--nagi-color-surface, #fff);
  color: var(--nagi-color-text, #17323b);
  font-size: var(--nagi-font-size-label, 0.72rem);
  font-weight: 700;
  line-height: 1;

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
