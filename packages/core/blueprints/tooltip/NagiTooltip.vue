<script setup lang="ts">
import { useTooltip } from "@nagi-labs/nagi-ui";

const props = withDefaults(
  defineProps<{
    triggerLabel: string;
    text: string;
    openDelay?: number;
    closeDelay?: number;
  }>(),
  { openDelay: 150, closeDelay: 0 },
);

const open = defineModel<boolean>("open", { default: false });
const tooltip = useTooltip({
  open,
  openDelay: props.openDelay,
  closeDelay: props.closeDelay,
  anchor: true,
});

defineExpose({ show: tooltip.show, hide: tooltip.hide });
</script>

<template>
  <span class="nagi-tooltip">
    <button class="button" type="button" v-bind="tooltip.triggerProps">
      {{ triggerLabel }}
    </button>
    <span class="zone" popover="hint" v-bind="tooltip.tooltipProps">
      {{ text }}
    </span>
  </span>
</template>

<style scoped>
.nagi-tooltip {
  display: inline-block;
  color: var(--nagi-color-text, #17323b);

  > .button {
    min-block-size: var(--nagi-size-control, 2rem);
    padding: var(--nagi-space-control, 0.5rem 0.75rem);
    border: 1px solid var(--nagi-color-border, #b9cbd1);
    border-radius: var(--nagi-radius-control, 0.55rem);
    background: var(--nagi-color-surface, #fff);
    color: inherit;
    font: inherit;
    cursor: help;

    &:focus-visible {
      outline: none;
      border-color: var(--nagi-color-focus-ring, #75adba);
      box-shadow: var(--nagi-shadow-focus, 0 0 0 2px rgb(117 173 186 / 0.35));
    }
  }

  > .zone {
    max-inline-size: 18rem;
    margin: 0;
    padding: 0.45rem 0.65rem;
    border: 1px solid var(--nagi-color-text, #17323b);
    border-radius: var(--nagi-radius-item, 0.4rem);
    background: var(--nagi-color-text, #17323b);
    color: var(--nagi-color-surface, #fff);
    box-shadow: var(--nagi-shadow-overlay, 0 14px 36px rgb(22 48 60 / 0.2));
    font-size: var(--nagi-font-size-label, 0.72rem);
  }
}
</style>
