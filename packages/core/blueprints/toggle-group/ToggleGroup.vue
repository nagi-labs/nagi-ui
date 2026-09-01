<script lang="ts">
export interface ToggleGroupItem {
  key: string;
  label: string;
  disabled?: boolean;
}

export type { ToggleGroupValue } from "@nagi-labs/nagi-ui";
</script>

<script setup lang="ts">
import { useToggleGroup, type ToggleGroupValue } from "@nagi-labs/nagi-ui";
import type { StyleValue } from "vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    label: string;
    items: readonly ToggleGroupItem[];
    mode?: "single" | "multiple";
    disabled?: boolean;
    id?: string;
    class?: string;
    style?: StyleValue;
    title?: string;
    ariaDescribedby?: string;
  }>(),
  {
    mode: "single",
    disabled: false,
  },
);

const model = defineModel<ToggleGroupValue>({ required: true });
const toggleGroup = useToggleGroup(
  {
    get mode() {
      return props.mode;
    },
    get disabled() {
      return props.disabled;
    },
  },
  model,
);
</script>

<template>
  <div
    class="n-toggle-group"
    :id="id"
    :class="props.class"
    v-bind="props.style ? { style: props.style } : undefined"
    :title="title"
    role="group"
    :aria-label="label"
    :aria-describedby="ariaDescribedby"
  >
    <button
      v-for="item in items"
      :key="item.key"
      class="button"
      type="button"
      :aria-pressed="toggleGroup.isPressed(item.key)"
      :disabled="disabled || item.disabled"
      @click="toggleGroup.toggle(item.key, item.disabled)"
    >
      {{ item.label }}
    </button>
  </div>
</template>

<style scoped>
.n-toggle-group {
  display: inline-flex;
  gap: var(--nagi-space-item-gap);
  align-items: center;
  color: var(--nagi-color-text);

  > .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-block-size: var(--nagi-size-control);
    padding: var(--nagi-space-control);
    border: var(--n-border-width-1) solid var(--nagi-color-border);
    border-radius: var(--nagi-radius-control);
    background: var(--nagi-color-surface);
    color: inherit;
    font: inherit;
    font-weight: 650;
    cursor: pointer;

    &:hover:not(:disabled) {
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
}

@media (forced-colors: active) {
  .n-toggle-group > .button[aria-pressed="true"] {
    border-width: var(--n-border-width-2);
  }

  .n-toggle-group > .button:focus-visible {
    outline: 2px solid Highlight;
    outline-offset: var(--n-border-width-2);
  }
}
</style>
