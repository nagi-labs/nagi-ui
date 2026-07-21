<script setup lang="ts">
import { useId } from "vue";

defineOptions({ inheritAttrs: false });

withDefaults(
  defineProps<{
    label: string;
    id?: string;
    value?: number;
    max?: number;
  }>(),
  { max: 1 },
);

const generatedId = useId();
const labelId = `${generatedId}-label`;
</script>

<template>
  <div class="nagi-progress">
    <label :id="labelId" class="label" :for="id ?? generatedId">{{ label }}</label>
    <progress
      v-bind="$attrs"
      class="progress"
      :id="id ?? generatedId"
      :aria-labelledby="labelId"
      :value="value"
      :max="max"
    >
      {{ value === undefined ? label : `${value} / ${max}` }}
    </progress>
  </div>
</template>

<style scoped>
.nagi-progress {
  display: grid;
  gap: 0.35rem;
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
