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
      <div
        v-if="title || $slots.title"
        class="title"
      >
        <slot
          name="title"
          :title="title"
          >{{ title }}</slot
        >
      </div>
      <div
        v-if="description || $slots.description"
        class="text"
      >
        <slot
          name="description"
          :description="description"
          >{{ description }}</slot
        >
      </div>
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

    > .title {
      margin: 0;
      font-size: var(--n-font-size-5);
    }

    > .text {
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
