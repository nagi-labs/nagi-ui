<script setup lang="ts">
import { useAttrs } from "vue";

defineOptions({ inheritAttrs: false });

defineProps<{
  title: string;
  description?: string;
}>();
const attrs = useAttrs();
</script>

<template>
  <div
    class="n-empty-state"
    v-bind="attrs"
  >
    <div class="unit">
      <span class="text -primary">{{ title }}</span>
      <span
        v-if="description"
        class="text -secondary"
      >
        {{ description }}
      </span>
    </div>
    <div
      v-if="$slots.default"
      class="actions"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
.n-empty-state {
  display: grid;
  gap: var(--nagi-space-item-gap);
  justify-items: center;
  padding: calc(2 * var(--n-space-8));
  border: var(--n-border-width-1) dashed var(--nagi-color-border-muted);
  border-radius: var(--nagi-radius-overlay);
  background: var(--nagi-color-surface);
  color: var(--nagi-color-text);
  text-align: center;

  > .unit {
    display: grid;
    gap: var(--n-space-2);
    max-inline-size: 32rem;

    > .text.-primary {
      font-size: var(--n-font-size-5);
      font-weight: 700;
    }

    > .text.-secondary {
      color: var(--nagi-color-text-muted);
      font-size: var(--n-font-size-3);
    }
  }

  > .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--nagi-space-item-gap);
    justify-content: center;
  }
}
</style>
