<script setup lang="ts">
import { useAttrs } from "vue";

defineOptions({ inheritAttrs: false });

const { prefix, suffix } = defineProps<{
  prefix?: string;
  suffix?: string;
}>();

const attrs = useAttrs();
</script>

<template>
  <div
    class="n-input-group"
    v-bind="attrs"
  >
    <span
      v-if="prefix || $slots.prefix"
      class="unit -prefix"
    >
      <slot
        name="prefix"
        :prefix="prefix"
        >{{ prefix }}</slot
      >
    </span>
    <div class="unit -control">
      <slot />
    </div>
    <span
      v-if="suffix || $slots.suffix"
      class="unit -suffix"
    >
      <slot
        name="suffix"
        :suffix="suffix"
        >{{ suffix }}</slot
      >
    </span>
    <div
      v-if="$slots.action"
      class="unit -action"
    >
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
  border: var(--n-border-width-1) solid var(--nagi-color-border);
  border-radius: var(--nagi-radius-control);
  background: var(--nagi-color-surface);
  color: var(--nagi-color-text);
  font: inherit;

  &:focus-within {
    border-color: var(--nagi-color-focus-ring);
    box-shadow: var(--nagi-shadow-focus);
  }

  &:has(> .unit > :deep(.n-input-group-control:user-invalid)),
  &:has(> .unit > :deep(.n-input-group-control[aria-invalid="true"])) {
    border-color: var(--nagi-color-danger);
  }

  > .unit {
    display: inline-flex;
    align-items: center;
    padding: var(--nagi-space-control);
    background: var(--nagi-color-surface-accent);
    color: var(--nagi-color-text-muted);
    white-space: nowrap;

    &.-prefix {
      flex: 0 1 auto;
      min-inline-size: 0;
      overflow: hidden;
      border-inline-end: var(--n-border-width-1) solid var(--nagi-color-border);
      text-overflow: ellipsis;
    }

    &.-suffix {
      flex: 0 1 auto;
      min-inline-size: 0;
      overflow: hidden;
      border-inline-start: var(--n-border-width-1) solid var(--nagi-color-border);
      text-overflow: ellipsis;
    }

    &.-control {
      display: flex;
      flex: 1 1 0;
      min-inline-size: 4ch;
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
      flex: none;
      padding: 0;
      border-inline-start: var(--n-border-width-1) solid var(--nagi-color-border);
      background: transparent;

      > :slotted(.n-input-group-action) {
        min-block-size: 100%;
        border: 0;
        border-radius: 0;
      }

      > :slotted(.n-input-group-action:focus-visible) {
        z-index: 1;
        outline: 2px solid var(--nagi-color-focus-ring);
        outline-offset: calc(-1 * var(--n-border-width-2));
      }
    }
  }
}

@media (forced-colors: active) {
  .n-input-group:focus-within {
    outline: 2px solid Highlight;
    outline-offset: var(--n-border-width-2);
  }

  .n-input-group {
    > .unit {
      > :slotted(.n-input-group-action:focus-visible) {
        outline-color: Highlight;
      }
    }
  }
}
</style>
