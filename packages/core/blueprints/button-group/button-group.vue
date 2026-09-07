<script setup lang="ts">
import { mergeElementProps } from "@nagi-labs/nagi-ui";
import { computed, useAttrs } from "vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    /** Optional accessible name when nearby text does not label the group. */
    label?: string;
    orientation?: "horizontal" | "vertical";
  }>(),
  { orientation: "horizontal" },
);
const attrs = useAttrs();
const divProps = computed(() =>
  mergeElementProps(attrs, {
    role: "group",
    "aria-label": props.label,
  }),
);
</script>

<template>
  <div
    class="n-button-group"
    v-bind="divProps"
    :data-orientation="orientation"
  >
    <slot />
  </div>
</template>

<style scoped>
.n-button-group {
  display: inline-flex;
  gap: var(--nagi-space-item-gap);
  align-items: center;

  &[data-orientation="vertical"] {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
