<script setup lang="ts">
import type { StyleValue } from "vue";
import { usePopover, type AnchorArea } from "@nagi-labs/nagi-ui";

const props = withDefaults(
  defineProps<{
    triggerLabel: string;
    id?: string;
    class?: string;
    style?: StyleValue;
    disabled?: boolean;
    area?: AnchorArea;
    offset?: number;
  }>(),
  { disabled: false, area: "block-end", offset: 4 },
);
defineOptions({ inheritAttrs: false });

const open = defineModel<boolean>("open", { default: false });
const popover = usePopover(props, open);

defineExpose({ show: popover.show, hide: popover.hide, toggle: popover.toggle });
</script>

<template>
  <div
    class="n-popover"
    data-scope="popover"
    data-part="root"
    :id="id"
    :class="props.class"
    :style="props.style"
  >
    <button
      class="button"
      data-scope="popover"
      data-part="trigger"
      type="button"
      :disabled="disabled"
      v-bind="popover.triggerProps"
    >
      {{ triggerLabel }}
    </button>
    <div
      class="unit"
      data-scope="popover"
      data-part="surface"
      popover
      v-bind="popover.popoverProps"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
.n-popover {
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

  > .unit {
    max-inline-size: 24rem;
    margin: 0;
    padding: var(--n-space-7) var(--n-space-8);
    border: var(--n-border-width-1) solid var(--nagi-color-border-muted);
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

@media (forced-colors: active) {
  .n-popover > .button:focus-visible {
    outline: 2px solid Highlight;
    outline-offset: var(--n-border-width-2);
  }
}
</style>
