<script setup lang="ts">
import { mergeElementProps } from "@nagi-labs/nagi-ui";
import { computed, useAttrs, useId } from "vue";

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  label: string;
  /** Stable ID for the visible section heading. */
  headingId?: string;
}>();
const attrs = useAttrs();
const generatedHeadingId = useId();
const headingId = computed(() => props.headingId ?? generatedHeadingId);
const sectionProps = computed(() =>
  mergeElementProps(attrs, { "aria-labelledby": headingId.value }),
);
</script>

<template>
  <section
    class="n-sidebar-section"
    v-bind="sectionProps"
  >
    <h2
      :id="headingId"
      class="title"
    >
      {{ label }}
    </h2>
    <div class="unit">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.n-sidebar-section {
  --local-title-tracking: 0.06em;

  display: grid;
  gap: var(--n-space-1);

  > .title {
    margin: 0 0 var(--n-space-2);
    color: var(--nagi-color-text-muted);
    font-size: var(--nagi-font-size-label);
    font-weight: 600;
    letter-spacing: var(--local-title-tracking);
    text-transform: uppercase;
  }

  > .unit {
    display: grid;
    gap: var(--n-space-1);
  }
}
</style>
