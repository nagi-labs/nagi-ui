<script setup lang="ts">
import { computed } from "vue";
import { useResizable } from "@nagi-labs/nagi-ui";

const props = withDefaults(defineProps<{
  label?: string;
  orientation?: "horizontal" | "vertical";
  dir?: "ltr" | "rtl";
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}>(), {
  label: "Resize panels",
  orientation: "horizontal",
  dir: "ltr",
  min: 10,
  max: 90,
  step: 1,
  disabled: false,
});

const model = defineModel<number>({ default: 50 });
const resizable = useResizable(props, model);
const style = computed(() => ({
  "--first-basis": resizable.firstBasis.value,
  "--second-basis": resizable.secondBasis.value,
}));
</script>

<template>
  <div
    class="n-resizable"
    :class="orientation === 'vertical' ? '-vertical' : undefined"
    :dir="dir"
    :style="style"
  >
    <section v-bind="resizable.primaryPanelProps" class="panel -first"><slot name="first" /></section>
    <div v-bind="resizable.separatorProps" class="separator"><span class="handle"></span></div>
    <section class="panel -second"><slot name="second" /></section>
  </div>
</template>

<style scoped>
.n-resizable {
  display: flex;
  min-inline-size: 0;
  min-block-size: calc(var(--nagi-size-control) * 4);
  color: var(--nagi-color-text);

  > .panel {
    box-sizing: border-box;
    min-inline-size: 0;
    min-block-size: 0;
    padding: var(--nagi-space-surface-inset);
    overflow: auto;
  }
  > .panel.-first { flex: 0 0 max(0px, calc(var(--first-basis) - var(--nagi-space-item-gap) / 2)); }
  > .panel.-second { flex: 0 0 max(0px, calc(var(--second-basis) - var(--nagi-space-item-gap) / 2)); }
  > .separator {
    display: grid;
    flex: 0 0 var(--nagi-space-item-gap);
    place-items: center;
    background: var(--nagi-color-border-muted);
    cursor: col-resize;
    touch-action: none;

    > .handle { inline-size: 2px; block-size: var(--nagi-size-control); background: var(--nagi-color-border); }
    &:focus-visible { outline: none; box-shadow: var(--nagi-shadow-focus); }
  }

  &.-vertical {
    block-size: calc(var(--nagi-size-control) * 8);
    flex-direction: column;
    > .separator {
      cursor: row-resize;
      > .handle { inline-size: var(--nagi-size-control); block-size: 2px; }
    }
  }
}

@media (forced-colors: active) {
  .n-resizable > .separator:focus-visible { outline: 2px solid Highlight; }
}
</style>
