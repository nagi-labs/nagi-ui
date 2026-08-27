<script setup lang="ts">
import { useTooltip, type AnchorArea } from "@nagi-labs/nagi-ui";

const props = withDefaults(
  defineProps<{
    triggerLabel: string;
    text: string;
    openDelay?: number;
    closeDelay?: number;
    disabled?: boolean;
    area?: AnchorArea;
    offset?: number;
  }>(),
  {
    openDelay: 150,
    closeDelay: 0,
    disabled: false,
    area: "block-start",
    offset: 4,
  },
);

const open = defineModel<boolean>("open", { default: false });
const tooltip = useTooltip(props, open);

defineExpose({ show: tooltip.show, hide: tooltip.hide });
</script>

<template>
  <span class="n-tooltip">
    <button class="button" type="button" :disabled="disabled" v-bind="tooltip.triggerProps">
      {{ triggerLabel }}
    </button>
    <span class="unit" popover="hint" v-bind="tooltip.tooltipProps">
      {{ text }}
    </span>
  </span>
</template>

<style scoped>
.n-tooltip {
  display: inline-block;
  color: var(--nagi-color-text);

  > .button {
    min-block-size: var(--nagi-size-control);
    padding: var(--nagi-space-control);
    border: var(--n-border-width-1) solid var(--nagi-color-border);
    border-radius: var(--nagi-radius-control);
    background: var(--nagi-color-surface);
    color: inherit;
    font: inherit;
    cursor: help;

    &:disabled {
      color: var(--nagi-color-text-disabled);
      cursor: not-allowed;
    }

    &:focus-visible {
      outline: none;
      border-color: var(--nagi-color-focus-ring);
      box-shadow: var(--nagi-shadow-focus);
    }
  }

  > .unit {
    max-inline-size: 18rem;
    margin: 0;
    padding: var(--n-space-4) var(--n-space-6);
    border: var(--n-border-width-1) solid var(--nagi-color-text);
    border-radius: var(--nagi-radius-item);
    background: var(--nagi-color-text);
    color: var(--nagi-color-surface);
    box-shadow: var(--nagi-shadow-overlay);
    font-size: var(--nagi-font-size-label);
  }
}

@media (forced-colors: active) {
  .n-tooltip > .button:focus-visible {
    outline: 2px solid Highlight;
    outline-offset: var(--n-border-width-2);
  }
}
</style>
