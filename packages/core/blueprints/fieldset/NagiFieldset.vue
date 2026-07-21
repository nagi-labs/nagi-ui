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
  border: 1px solid var(--nagi-color-border-muted);
  border-radius: var(--nagi-radius-control);
  background: var(--nagi-color-surface);
  color: var(--nagi-color-text);

  > .legend {
    padding-inline: 0.25rem;
    font-weight: 650;
  }

  > .zone {
    display: grid;
    gap: var(--nagi-space-item-gap);
  }

  &:disabled {
    > .legend {
      color: var(--nagi-color-text-disabled);
    }
  }
}
</style>
