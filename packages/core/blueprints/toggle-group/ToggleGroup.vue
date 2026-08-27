<script lang="ts">
export interface ToggleGroupItem {
  key: string;
  label: string;
  disabled?: boolean;
}

export type ToggleGroupValue = string | null | readonly string[];
</script>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    label: string;
    items: readonly ToggleGroupItem[];
    mode?: "single" | "multiple";
    disabled?: boolean;
  }>(),
  {
    mode: "single",
    disabled: false,
  },
);

const model = defineModel<ToggleGroupValue>({ required: true });

function isPressed(item: ToggleGroupItem) {
  if (props.mode === "multiple") {
    return Array.isArray(model.value) && model.value.includes(item.key);
  }
  return model.value === item.key;
}

function toggleItem(item: ToggleGroupItem) {
  if (props.disabled || item.disabled) return;

  if (props.mode === "multiple") {
    const selected = Array.isArray(model.value) ? model.value : [];
    model.value = selected.includes(item.key)
      ? selected.filter((key) => key !== item.key)
      : [...selected, item.key];
    return;
  }

  model.value = model.value === item.key ? null : item.key;
}
</script>

<template>
  <div class="n-toggle-group" role="group" :aria-label="label">
    <button
      v-for="item in items"
      :key="item.key"
      class="button"
      type="button"
      :aria-pressed="isPressed(item)"
      :disabled="disabled || item.disabled"
      @click="toggleItem(item)"
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
