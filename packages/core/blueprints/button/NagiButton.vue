<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    variant?: "default" | "accent" | "danger";
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
    /** Keep the button in the tab order while suppressing activation. */
    focusableWhenDisabled?: boolean;
  }>(),
  {
    variant: "default",
    type: "button",
    disabled: false,
    focusableWhenDisabled: false,
  },
);

function guardFocusableDisabled(event: MouseEvent) {
  if (!props.disabled || !props.focusableWhenDisabled) return;
  event.preventDefault();
  event.stopImmediatePropagation();
}
</script>

<template>
  <button
    class="nagi-button"
    :class="variant === 'default' ? undefined : `-${variant}`"
    :type="type"
    :disabled="disabled && !focusableWhenDisabled"
    :aria-disabled="disabled && focusableWhenDisabled ? 'true' : undefined"
    @click.capture="guardFocusableDisabled"
  >
    <slot />
  </button>
</template>

<style scoped>
.nagi-button {
  display: inline-flex;
  gap: 0.5rem;
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

  &.-accent {
    border-color: var(--nagi-color-accent);
    color: var(--nagi-color-accent);
  }

  &.-danger {
    border-color: var(--nagi-color-danger);
    color: var(--nagi-color-danger);
  }
}
</style>
