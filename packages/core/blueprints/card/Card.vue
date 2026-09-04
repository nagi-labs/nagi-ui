<script setup lang="ts">
import { useAttrs } from "vue";

defineOptions({ inheritAttrs: false });

defineProps<{
  title?: string;
  description?: string;
}>();
const attrs = useAttrs();
</script>

<template>
  <div
    class="n-card"
    v-bind="attrs"
  >
    <header
      v-if="title || description || $slots.title || $slots.description"
      class="header"
    >
      <span
        v-if="title || $slots.title"
        class="text"
      >
        <slot
          name="title"
          :title="title"
          >{{ title }}</slot
        >
      </span>
      <p
        v-if="description || $slots.description"
        class="p"
      >
        <slot
          name="description"
          :description="description"
          >{{ description }}</slot
        >
      </p>
    </header>
    <div class="unit">
      <slot />
    </div>
    <div
      v-if="$slots.footer"
      class="unit -secondary"
    >
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped>
.n-card {
  overflow: hidden;
  border: var(--n-border-width-1) solid var(--nagi-color-border-muted);
  border-radius: var(--nagi-radius-overlay);
  background: var(--nagi-color-surface);
  color: var(--nagi-color-text);
  box-shadow: var(--nagi-shadow-overlay);

  > .header {
    padding: var(--n-space-8) var(--n-space-8) 0;

    > .text {
      margin: 0;
      font-size: var(--n-font-size-5);
      font-weight: 700;
    }

    > .p {
      margin-block: var(--n-space-3) 0;
      color: var(--nagi-color-text-muted);
      font-size: var(--n-font-size-3);
    }
  }

  > .unit {
    padding: var(--n-space-8);
  }

  > .unit.-secondary {
    padding: 0 var(--n-space-8) var(--n-space-8);
  }
}
</style>
