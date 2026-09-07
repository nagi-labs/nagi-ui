<script setup lang="ts">
import { computed, useAttrs } from "vue";
import { mergeElementProps, useResizable } from "@nagi-labs/nagi-ui";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    label?: string;
    orientation?: "horizontal" | "vertical";
    dir?: "ltr" | "rtl";
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
  }>(),
  {
    label: "Resize panels",
    orientation: "horizontal",
    dir: "ltr",
    min: 10,
    max: 90,
    step: 1,
    disabled: false,
  },
);

const model = defineModel<number>({ default: 50 });
const resizable = useResizable(props, model);
const layoutStyle = computed(() => ({
  "--local-first-basis": resizable.firstBasis.value,
}));
const attrs = useAttrs();
const divProps = computed(() =>
  mergeElementProps(attrs, {
    style: layoutStyle.value,
    dir: props.dir,
  }),
);
</script>

<template>
  <div
    class="n-resizable"
    :data-orientation="orientation"
    v-bind="divProps"
  >
    <section
      v-bind="resizable.primaryPanelProps"
      class="section -first"
    >
      <slot name="first" />
    </section>
    <div
      v-bind="resizable.separatorProps"
      class="unit -separator"
    >
      <span class="seg -handle"></span>
    </div>
    <section class="section -second"><slot name="second" /></section>
  </div>
</template>

<style scoped>
.n-resizable {
  display: flex;
  min-inline-size: 0;
  min-block-size: calc(var(--nagi-size-control) * 4);
  color: var(--nagi-color-text);

  > .section {
    box-sizing: border-box;
    min-inline-size: 0;
    min-block-size: 0;
    padding: var(--nagi-space-surface-inset);
    overflow: auto;
  }
  > .section.-first {
    flex: 0 0 max(0px, calc(var(--local-first-basis) - var(--nagi-space-item-gap) / 2));
  }
  > .section.-second {
    flex: 1 1 0;
  }
  > .unit.-separator {
    display: grid;
    flex: 0 0 var(--nagi-space-item-gap);
    place-items: center;
    background: var(--nagi-color-border-muted);
    cursor: col-resize;
    touch-action: none;

    > .seg.-handle {
      inline-size: 2px;
      block-size: var(--nagi-size-control);
      background: var(--nagi-color-border);
    }
    &:focus-visible {
      outline: none;
      box-shadow: var(--nagi-shadow-focus);
    }
  }

  &[data-orientation="vertical"] {
    block-size: calc(var(--nagi-size-control) * 8);
    flex-direction: column;
    > .unit.-separator {
      cursor: row-resize;
      > .seg.-handle {
        inline-size: var(--nagi-size-control);
        block-size: 2px;
      }
    }
  }
}

@media (forced-colors: active) {
  .n-resizable {
    > .unit.-separator:focus-visible {
      outline: 2px solid Highlight;
    }
  }
}
</style>
