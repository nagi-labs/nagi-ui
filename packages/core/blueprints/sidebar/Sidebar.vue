<script setup lang="ts">
import { mergeElementProps } from "@nagi-labs/nagi-ui";
import { computed, useAttrs, useSlots } from "vue";

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  /** Accessible name for the persistent navigation landmark. */
  label: string;
}>();
const attrs = useAttrs();
const slots = useSlots();
const asideProps = computed(() => mergeElementProps(attrs, { "aria-label": props.label }));
</script>

<template>
  <aside
    class="n-sidebar"
    v-bind="asideProps"
  >
    <nav
      class="nav"
      :aria-label="label"
    >
      <slot />
    </nav>
    <footer
      v-if="slots.footer"
      class="footer"
    >
      <slot name="footer" />
    </footer>
  </aside>
</template>

<style scoped>
.n-sidebar {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  min-inline-size: 0;
  padding: var(--n-space-7);
  overflow-y: auto;
  overscroll-behavior: contain;
  border-inline-end: var(--n-border-width-1) solid var(--nagi-color-border-muted);
  background: var(--nagi-color-surface);
  color: var(--nagi-color-text);

  > .nav {
    display: grid;
    align-content: start;
    gap: var(--n-space-7);
  }

  > .footer {
    padding-block-start: var(--n-space-7);
    color: var(--nagi-color-text-muted);
    font-size: var(--n-font-size-2);
  }
}
</style>
