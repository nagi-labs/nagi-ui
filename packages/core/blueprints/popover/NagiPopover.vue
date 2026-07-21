<script setup lang="ts">
import { usePopover, type AnchorArea } from "@nagi-labs/nagi-ui";

const props = withDefaults(
  defineProps<{
    triggerLabel: string;
    disabled?: boolean;
    area?: AnchorArea;
    offset?: number;
  }>(),
  { disabled: false, area: "block-end", offset: 4 },
);

const open = defineModel<boolean>("open", { default: false });
const popover = usePopover({
  open,
  anchor: { area: props.area, offset: props.offset },
});

defineExpose({ show: popover.show, hide: popover.hide, toggle: popover.toggle });
</script>

<template>
  <div class="nagi-popover">
    <button
      class="button"
      type="button"
      :disabled="disabled"
      v-bind="popover.triggerProps"
    >
      {{ triggerLabel }}
    </button>
    <div class="zone" popover v-bind="popover.popoverProps">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.nagi-popover {
  display: inline-block;
  color: var(--nagi-color-text);

  > .button {
    min-block-size: var(--nagi-size-control);
    padding: var(--nagi-space-control);
    border: 1px solid var(--nagi-color-border);
    border-radius: var(--nagi-radius-control);
    background: var(--nagi-color-surface);
    color: inherit;
    font: inherit;
    cursor: pointer;

    &:hover {
      background: var(--nagi-color-surface-active);
    }

    &:focus-visible {
      outline: none;
      border-color: var(--nagi-color-focus-ring);
      box-shadow: var(--nagi-shadow-focus);
    }

    &:disabled {
      color: var(--nagi-color-text-disabled);
      cursor: not-allowed;
    }
  }

  > .zone {
    max-inline-size: 24rem;
    margin: 0;
    padding: 0.75rem 1rem;
    border: 1px solid var(--nagi-color-border-muted);
    border-radius: var(--nagi-radius-overlay);
    background: var(--nagi-color-surface);
    color: var(--nagi-color-text);
    box-shadow: var(--nagi-shadow-overlay);
    opacity: 0;
    translate: 0 -0.35rem;
    transition:
      opacity 0.16s,
      translate 0.16s,
      overlay 0.16s allow-discrete,
      display 0.16s allow-discrete;

    &:popover-open {
      opacity: 1;
      translate: 0 0;

      @starting-style {
        opacity: 0;
        translate: 0 -0.35rem;
      }
    }
  }
}
</style>
