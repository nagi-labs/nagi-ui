<script setup lang="ts">
import { computed, useAttrs, useId } from "vue";

import { mergeElementProps } from "@nagi-labs/nagi-ui";

defineOptions({ inheritAttrs: false });

const {
  label,
  id,
  value,
  max = 1,
} = defineProps<{
  label: string;
  id?: string;
  value?: number;
  max?: number;
}>();

const attrs = useAttrs();
const generatedId = useId();
const labelId = `${generatedId}-label`;
const progressProps = computed(() =>
  mergeElementProps({ "aria-labelledby": labelId }, attrs, { id: id ?? generatedId, value, max }),
);
</script>

<template>
  <div class="n-progress">
    <label
      :id="labelId"
      class="label"
      :for="id ?? generatedId"
      >{{ label }}</label
    >
    <progress
      class="progress"
      v-bind="progressProps"
    >
      {{ value === undefined ? label : `${value} / ${max}` }}
    </progress>
  </div>
</template>

<style scoped>
.n-progress {
  display: grid;
  gap: var(--n-space-3);
  color: var(--nagi-color-text);
  font: inherit;

  > .label {
    color: var(--nagi-color-text-muted);
    font-size: var(--nagi-font-size-label);
    font-weight: 650;
  }

  > .progress {
    inline-size: 100%;
    block-size: 0.65rem;
    accent-color: var(--nagi-color-accent);
  }
}
</style>
