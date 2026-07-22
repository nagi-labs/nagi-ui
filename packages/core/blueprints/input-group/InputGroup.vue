<script setup lang="ts">
defineProps<{
  prefix?: string;
  suffix?: string;
}>();
</script>

<template>
  <div class="n-input-group">
    <span v-if="prefix || $slots.prefix" class="unit -prefix">
      <slot name="prefix" :prefix="prefix">{{ prefix }}</slot>
    </span>
    <div class="unit -control">
      <slot />
    </div>
    <span v-if="suffix || $slots.suffix" class="unit -suffix">
      <slot name="suffix" :suffix="suffix">{{ suffix }}</slot>
    </span>
    <div v-if="$slots.action" class="unit -action">
      <slot name="action" />
    </div>
  </div>
</template>

<style scoped>
.n-input-group {
  display: flex;
  align-items: stretch;
  inline-size: 100%;
  min-block-size: var(--nagi-size-control);
  overflow: hidden;
  border: 1px solid var(--nagi-color-border);
  border-radius: var(--nagi-radius-control);
  background: var(--nagi-color-surface);
  color: var(--nagi-color-text);
  font: inherit;

  &:focus-within {
    border-color: var(--nagi-color-focus-ring);
    box-shadow: var(--nagi-shadow-focus);
  }

  &:has(> .unit > .n-input-group-control:user-invalid),
  &:has(> .unit > .n-input-group-control[aria-invalid="true"]) {
    border-color: var(--nagi-color-danger);
  }

  > .unit {
    display: inline-flex;
    flex: none;
    align-items: center;
    padding: var(--nagi-space-control);
    background: var(--nagi-color-surface-accent);
    color: var(--nagi-color-text-muted);
    white-space: nowrap;

    &.-prefix {
      border-inline-end: 1px solid var(--nagi-color-border);
    }

    &.-suffix {
      border-inline-start: 1px solid var(--nagi-color-border);
    }

    &.-control {
      display: flex;
      flex: 1 1 auto;
      min-inline-size: 0;
      padding: 0;
      background: transparent;

      > :slotted(.n-input-group-control) {
        box-sizing: border-box;
        flex: 1 1 auto;
        min-inline-size: 0;
        min-block-size: var(--nagi-size-control);
        padding: var(--nagi-space-control);
        border: 0;
        border-radius: 0;
        outline: none;
        background: transparent;
        color: var(--nagi-color-text);
        font: inherit;
      }

      > :slotted(.n-input-group-control:disabled) {
        color: var(--nagi-color-text-disabled);
        cursor: not-allowed;
      }
    }

    &.-action {
      padding: 0;
      border-inline-start: 1px solid var(--nagi-color-border);
      background: transparent;

      > :slotted(.n-input-group-action) {
        min-block-size: 100%;
        border: 0;
        border-radius: 0;
        box-shadow: none;
      }
    }
  }
}

@media (forced-colors: active) {
  .n-input-group:focus-within {
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }
}
</style>
