<script setup lang="ts">
withDefaults(
  defineProps<{
    legend: string;
    disabled?: boolean;
  }>(),
  { disabled: false },
);
</script>

<template>
  <fieldset
    class="nagi-fieldset"
    :disabled="disabled"
  >
    <legend class="legend">{{ legend }}</legend>
    <div class="zone">
      <slot />
    </div>
  </fieldset>
</template>

<style scoped>
.nagi-fieldset {
  min-inline-size: 0;
  padding: 0.75rem;
  border: 1px solid var(--nagi-color-border-muted, #c8d8dd);
  border-radius: var(--nagi-radius-control, 0.55rem);
  background: var(--nagi-color-surface, #fff);
  color: var(--nagi-color-text, #17323b);

  > .legend {
    padding-inline: 0.25rem;
    font-weight: 650;
  }

  > .zone {
    display: grid;
    gap: var(--nagi-space-item-gap, 0.55rem);
  }

  &:disabled {
    > .legend {
      color: var(--nagi-color-text-disabled, #91a1a6);
    }
  }
}
</style>
