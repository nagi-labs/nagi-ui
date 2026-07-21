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
  color: var(--nagi-color-text, #17323b);

  > .button {
    min-block-size: var(--nagi-size-control, 2rem);
    padding: var(--nagi-space-control, 0.5rem 0.75rem);
    border: 1px solid var(--nagi-color-border, #b9cbd1);
    border-radius: var(--nagi-radius-control, 0.55rem);
    background: var(--nagi-color-surface, #fff);
    color: inherit;
    font: inherit;
    cursor: pointer;

    &:hover {
      background: var(--nagi-color-surface-active, #e5f1f4);
    }

    &:focus-visible {
      outline: none;
      border-color: var(--nagi-color-focus-ring, #75adba);
      box-shadow: var(--nagi-shadow-focus, 0 0 0 2px rgb(117 173 186 / 0.35));
    }

    &:disabled {
      color: var(--nagi-color-text-disabled, #91a1a6);
      cursor: not-allowed;
    }
  }

  > .zone {
    max-inline-size: 24rem;
    margin: 0;
    padding: 0.75rem 1rem;
    border: 1px solid var(--nagi-color-border-muted, #c8d8dd);
    border-radius: var(--nagi-radius-overlay, 0.65rem);
    background: var(--nagi-color-surface, #fff);
    color: var(--nagi-color-text, #17323b);
    box-shadow: var(--nagi-shadow-overlay, 0 14px 36px rgb(22 48 60 / 0.2));
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
