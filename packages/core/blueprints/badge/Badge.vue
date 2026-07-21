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
    class="n-badge"
    :class="tone === 'neutral' ? undefined : tone === 'success' ? '-positive' : `-${tone}`"
  >
    <slot name="label" :label="label">{{ label }}</slot>
  </span>
</template>

<style scoped>
.n-badge {
  display: inline-flex;
  align-items: center;
  min-block-size: 1.5rem;
  padding-inline: 0.5rem;
  border: 1px solid var(--nagi-color-border-muted);
  border-radius: 999px;
  background: var(--nagi-color-surface);
  color: var(--nagi-color-text);
  font-size: var(--nagi-font-size-label);
  font-weight: 700;
  line-height: 1;

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
