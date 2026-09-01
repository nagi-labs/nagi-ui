<script setup lang="ts">
import { computed, useAttrs, useId } from "vue";

import { mergeElementProps } from "@nagi-labs/nagi-ui";

defineOptions({ inheritAttrs: false });

const {
  label,
  id,
  value,
  min = 0,
  max = 1,
  low,
  high,
  optimum,
} = defineProps<{
  label: string;
  id?: string;
  value: number;
  min?: number;
  max?: number;
  low?: number;
  high?: number;
  optimum?: number;
}>();

const attrs = useAttrs();
const generatedId = useId();
const labelId = `${generatedId}-label`;
const meterProps = computed(() =>
  mergeElementProps({ "aria-labelledby": labelId }, attrs, {
    id: id ?? generatedId,
    value,
    min,
    max,
    low,
    high,
    optimum,
  }),
);
</script>

<template>
  <div class="n-meter">
    <label
      :id="labelId"
      class="label"
      :for="id ?? generatedId"
      >{{ label }}</label
    >
    <meter
      class="meter"
      v-bind="meterProps"
    >
      {{ value }} / {{ max }}
    </meter>
  </div>
</template>

<style scoped>
.n-meter {
  display: grid;
  gap: var(--n-space-3);
  color: var(--nagi-color-text);
  font: inherit;

  > .label {
    color: var(--nagi-color-text-muted);
    font-size: var(--nagi-font-size-label);
    font-weight: 650;
  }

  > .meter {
    inline-size: 100%;
    block-size: 0.65rem;
    accent-color: var(--nagi-color-accent);
  }
}
</style>
