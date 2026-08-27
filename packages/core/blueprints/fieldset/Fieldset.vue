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
    class="n-fieldset"
    :disabled="disabled"
  >
    <legend class="legend">{{ legend }}</legend>
    <div class="unit">
      <slot />
    </div>
  </fieldset>
</template>

<style scoped>
.n-fieldset {
  min-inline-size: 0;
  padding: var(--n-space-7);
  border: var(--n-border-width-1) solid var(--nagi-color-border-muted);
  border-radius: var(--nagi-radius-control);
  background: var(--nagi-color-surface);
  color: var(--nagi-color-text);

  > .legend {
    padding-inline: var(--n-space-2);
    font-weight: 650;
  }

  > .unit {
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
