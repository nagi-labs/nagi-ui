<script setup lang="ts">
import { useButton } from "@nagi-labs/nagi-ui/component-controls";

const props = withDefaults(
  defineProps<{
    variant?: "default" | "accent" | "danger";
    size?: "small" | "default" | "large";
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
    /** Keep the button in the tab order while suppressing activation. */
    focusableWhenDisabled?: boolean;
  }>(),
  {
    variant: "default",
    size: "default",
    type: "button",
    disabled: false,
    focusableWhenDisabled: false,
  },
);

const button = useButton(props);
</script>

<template>
  <button
    class="n-button"
    :data-variant="variant"
    :data-size="size"
    :type="type"
    v-bind="button.buttonProps"
  >
    <slot />
  </button>
</template>

<style scoped>
.n-button {
  display: inline-flex;
  gap: var(--n-space-5);
  align-items: center;
  justify-content: center;
  min-block-size: var(--nagi-size-control);
  padding: var(--nagi-space-control);
  border: var(--n-border-width-1) solid var(--nagi-color-border);
  border-radius: var(--nagi-radius-control);
  background: var(--nagi-color-surface);
  color: var(--nagi-color-text);
  font: inherit;
  font-weight: 650;
  cursor: pointer;

  &:hover {
    background: var(--nagi-color-surface-active);
  }

  &:focus-visible {
    outline: none;
    border-color: var(--nagi-color-focus-ring);
    box-shadow: var(--nagi-shadow-focus);
  }

  &:disabled,
  &[aria-disabled="true"] {
    color: var(--nagi-color-text-disabled);
    background: var(--nagi-color-surface);
    cursor: not-allowed;
  }

  &[data-variant="accent"] {
    border-color: var(--nagi-color-accent);
    color: var(--nagi-color-accent);
  }

  &[data-variant="danger"] {
    border-color: var(--nagi-color-danger);
    color: var(--nagi-color-danger);
  }

  &[data-size="small"] {
    min-block-size: 1.75rem;
    padding: var(--n-space-3) var(--nagi-space-item-gap);
    font-size: var(--n-font-size-3);
  }

  &[data-size="large"] {
    min-block-size: 2.5rem;
    padding: var(--n-space-6) var(--n-space-8);
    font-size: var(--n-font-size-5);
  }
}

@media (forced-colors: active) {
  .n-button:focus-visible {
    outline: 2px solid Highlight;
    outline-offset: var(--n-border-width-2);
  }
}
</style>
