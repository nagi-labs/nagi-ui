<script setup lang="ts">
defineProps<{
  label: string;
}>();
</script>

<template>
  <kbd class="n-kbd">{{ label }}</kbd>
</template>

<style scoped>
.n-kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-block-size: 1.5rem;
  padding-inline: 0.45rem;
  border: 1px solid var(--nagi-color-border-muted);
  border-radius: var(--nagi-radius-item);
  background: var(--nagi-color-surface-active);
  color: var(--nagi-color-text);
  box-shadow: inset 0 -1px 0 var(--nagi-color-border);
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: var(--nagi-font-size-label);
  font-weight: 650;
  line-height: 1;
  white-space: nowrap;
}
</style>
