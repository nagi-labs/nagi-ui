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
  min-block-size: var(--nagi-size-control, 2rem);
  padding: var(--nagi-space-control, 0.5rem 0.75rem);
  border: 1px solid var(--nagi-color-border, #b9cbd1);
  border-radius: var(--nagi-radius-control, 0.55rem);
  background: var(--nagi-color-surface, #fff);
  color: var(--nagi-color-text, #17323b);
  font: inherit;
  font-weight: 650;
  cursor: pointer;

  &:hover {
    background: var(--nagi-color-surface-active, #e5f1f4);
  }

  &:focus-visible {
    outline: none;
    border-color: var(--nagi-color-focus-ring, #75adba);
    box-shadow: var(--nagi-shadow-focus, 0 0 0 2px rgb(117 173 186 / 0.35));
  }

  &:disabled,
  &[aria-disabled="true"] {
    color: var(--nagi-color-text-disabled, #91a1a6);
    background: var(--nagi-color-surface, #fff);
    cursor: not-allowed;
  }

  &.-accent {
    border-color: var(--nagi-color-accent, #16768b);
    color: var(--nagi-color-accent, #16768b);
  }

  &.-danger {
    border-color: var(--nagi-color-danger, #aa3443);
    color: var(--nagi-color-danger, #aa3443);
  }
}
</style>
