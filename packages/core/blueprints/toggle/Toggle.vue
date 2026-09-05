<script setup lang="ts">
import { useToggle } from "@nagi-labs/nagi-ui";
import { useAttrs } from "vue";

defineOptions({ inheritAttrs: false });

const { disabled = false } = defineProps<{
  disabled?: boolean;
}>();

const pressed = defineModel<boolean>({ default: false });
const toggle = useToggle(
  {
    get disabled() {
      return disabled;
    },
  },
  pressed,
  useAttrs(),
);

const emit = defineEmits<{
  blur: [event: FocusEvent];
  click: [event: MouseEvent];
  dblclick: [event: MouseEvent];
  focus: [event: FocusEvent];
  keydown: [event: KeyboardEvent];
  keyup: [event: KeyboardEvent];
}>();
</script>

<template>
  <button
    v-bind="toggle.buttonProps"
    class="n-toggle"
    @blur="emit('blur', $event)"
    @click="emit('click', $event)"
    @dblclick="emit('dblclick', $event)"
    @focus="emit('focus', $event)"
    @keydown="emit('keydown', $event)"
    @keyup="emit('keyup', $event)"
  >
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
    border-width: calc(var(--n-border-width-1) + var(--n-border-width-2));
  }

  .n-toggle:focus-visible {
    outline: 2px solid Highlight;
    outline-offset: var(--n-border-width-2);
  }
}
</style>
