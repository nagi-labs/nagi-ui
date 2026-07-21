<script setup lang="ts">
import { useId } from "vue";

defineOptions({ inheritAttrs: false });

withDefaults(
  defineProps<{
    label: string;
    id?: string;
    value: number;
    min?: number;
    max?: number;
    low?: number;
    high?: number;
    optimum?: number;
  }>(),
  {
    min: 0,
    max: 1,
  },
);

const generatedId = useId();
const labelId = `${generatedId}-label`;
</script>

<template>
  <div class="nagi-meter">
    <label :id="labelId" class="label" :for="id ?? generatedId">{{ label }}</label>
    <meter
      v-bind="$attrs"
      class="meter"
      :id="id ?? generatedId"
      :aria-labelledby="labelId"
      :value="value"
      :min="min"
      :max="max"
      :low="low"
      :high="high"
      :optimum="optimum"
    >
      {{ value }} / {{ max }}
    </meter>
  </div>
</template>

<style scoped>
.nagi-meter {
  display: grid;
  gap: 0.35rem;
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
