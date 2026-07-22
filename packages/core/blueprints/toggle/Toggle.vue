<script setup lang="ts">
import { useToggle } from "@nagi-labs/nagi-ui";

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
  }>(),
  { disabled: false },
);

const pressed = defineModel<boolean>({ default: false });
const toggle = useToggle(props, pressed);
</script>

<template>
  <button v-bind="toggle.buttonProps" class="n-toggle">
    <slot />
  </button>
</template>

<style scoped>
.n-toggle {
  display: inline-flex;
  gap: var(--nagi-space-item-gap);
  align-items: center;
  justify-content: center;
  min-block-size: var(--nagi-size-control);
  padding: var(--nagi-space-control);
  border: 1px solid var(--nagi-color-border);
  border-radius: var(--nagi-radius-control);
  background: var(--nagi-color-surface);
  color: var(--nagi-color-text);
  font: inherit;
  font-weight: 650;
  cursor: pointer;

  &:hover {
    background: var(--nagi-color-surface-active);
  }

  &[aria-pressed="true"] {
    border-color: var(--nagi-color-accent);
    background: var(--nagi-color-surface-accent);
    color: var(--nagi-color-accent);
  }

  &:focus-visible {
    outline: none;
    border-color: var(--nagi-color-focus-ring);
    box-shadow: var(--nagi-shadow-focus);
  }

  &:disabled {
    border-color: var(--nagi-color-border-muted);
    background: var(--nagi-color-surface);
    color: var(--nagi-color-text-disabled);
    cursor: not-allowed;
  }
}

@media (forced-colors: active) {
  .n-toggle[aria-pressed="true"] {
    border-width: 3px;
  }

  .n-toggle:focus-visible {
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }
}
</style>
