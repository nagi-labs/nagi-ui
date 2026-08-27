<script setup lang="ts">
import { useDisclosure } from "@nagi-labs/nagi-ui";

const props = defineProps<{
  summary: string;
  name?: string;
  disabled?: boolean;
}>();

const open = defineModel<boolean>("open", { default: false });
const disclosure = useDisclosure(props, open);

defineExpose({ show: disclosure.show, hide: disclosure.hide, toggle: disclosure.toggle });
</script>

<template>
  <details class="n-disclosure" v-bind="disclosure.detailsProps">
    <summary class="summary" v-bind="disclosure.summaryProps">
      <slot name="summary" :summary="summary">{{ summary }}</slot>
    </summary>
    <section class="section">
      <slot />
    </section>
  </details>
</template>

<style scoped>
.n-disclosure {
  max-inline-size: 36rem;
  border: var(--n-border-width-1) solid var(--nagi-color-border-muted);
  border-radius: var(--nagi-radius-control);
  background: var(--nagi-color-surface);
  color: var(--nagi-color-text);

  > .summary {
    padding: var(--nagi-space-control);
    font-weight: 650;
    cursor: pointer;

    &[aria-disabled="true"] {
      color: var(--nagi-color-text-disabled);
      cursor: not-allowed;
    }

    &:focus-visible {
      outline: none;
      border-radius: var(--nagi-radius-control);
      box-shadow: var(--nagi-shadow-focus);
    }
  }

  > .section {
    padding: 0 var(--n-space-7) var(--n-space-7);
    color: var(--nagi-color-text-muted);
  }
}

@media (forced-colors: active) {
  .n-disclosure > .summary:focus-visible {
    outline: 2px solid Highlight;
    outline-offset: var(--n-border-width-2);
  }
}
</style>
