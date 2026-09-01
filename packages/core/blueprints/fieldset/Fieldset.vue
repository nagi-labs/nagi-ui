<script setup lang="ts">
import { computed, useAttrs } from "vue";

import { mergeElementProps } from "@nagi-labs/nagi-ui";

defineOptions({ inheritAttrs: false });

const { legend, disabled = false } = defineProps<{
  legend: string;
  disabled?: boolean;
}>();

const attrs = useAttrs();
const fieldsetProps = computed(() => mergeElementProps(attrs, { disabled }));
</script>

<template>
  <fieldset
    class="n-fieldset"
    v-bind="fieldsetProps"
  >
    <legend class="legend">{{ legend }}</legend>
    <div class="unit">
      <slot />
    </div>
  </fieldset>
</template>

<style scoped>
.n-fieldset {
  min-inline-size: 0;
  padding: var(--n-space-7);
  border: var(--n-border-width-1) solid var(--nagi-color-border-muted);
  border-radius: var(--nagi-radius-control);
  background: var(--nagi-color-surface);
  color: var(--nagi-color-text);

  > .legend {
    padding-inline: var(--n-space-2);
    font-weight: 650;
  }

  > .unit {
    display: grid;
    gap: var(--nagi-space-item-gap);
  }

  &:disabled {
    > .legend {
      color: var(--nagi-color-text-disabled);
    }
  }
}
</style>
