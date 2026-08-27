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
    :data-tone="tone"
  >
    <slot name="label" :label="label">{{ label }}</slot>
  </span>
</template>

<style scoped>
.n-badge {
  --local-round: 999px;

  display: inline-flex;
  align-items: center;
  min-block-size: 1.5rem;
  padding-inline: var(--n-space-5);
  border: var(--n-border-width-1) solid var(--nagi-color-border-muted);
  border-radius: var(--local-round);
  background: var(--nagi-color-surface);
  color: var(--nagi-color-text);
  font-size: var(--nagi-font-size-label);
  font-weight: 700;
  line-height: 1;

  &[data-tone="accent"] {
    border-color: var(--nagi-color-accent);
    background: var(--nagi-color-surface-accent);
    color: var(--nagi-color-accent);
  }

  &[data-tone="success"] {
    border-color: var(--nagi-color-success);
    background: var(--nagi-color-surface-success);
    color: var(--nagi-color-success);
  }

  &[data-tone="warning"] {
    border-color: var(--nagi-color-warning);
    background: var(--nagi-color-surface-warning);
    color: var(--nagi-color-warning);
  }

  &[data-tone="danger"] {
    border-color: var(--nagi-color-danger);
    background: var(--nagi-color-surface-danger);
    color: var(--nagi-color-danger);
  }
}
</style>
