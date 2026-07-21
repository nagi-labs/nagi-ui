<script setup lang="ts">
import { useDisclosure } from "@nagi-labs/nagi-ui";

const props = defineProps<{
  summary: string;
  name?: string;
}>();

const open = defineModel<boolean>("open", { default: false });
const disclosure = useDisclosure({
  open,
  ...(props.name ? { name: props.name } : {}),
});

defineExpose({ show: disclosure.show, hide: disclosure.hide, toggle: disclosure.toggle });
</script>

<template>
  <details class="nagi-disclosure" v-bind="disclosure.detailsProps">
    <summary class="summary">{{ summary }}</summary>
    <section class="section">
      <slot />
    </section>
  </details>
</template>

<style scoped>
.nagi-disclosure {
  max-inline-size: 36rem;
  border: 1px solid var(--nagi-color-border-muted, #c8d8dd);
  border-radius: var(--nagi-radius-control, 0.55rem);
  background: var(--nagi-color-surface, #fff);
  color: var(--nagi-color-text, #17323b);

  > .summary {
    padding: var(--nagi-space-control, 0.5rem 0.75rem);
    font-weight: 650;
    cursor: pointer;

    &:focus-visible {
      outline: none;
      border-radius: var(--nagi-radius-control, 0.55rem);
      box-shadow: var(--nagi-shadow-focus, 0 0 0 2px rgb(117 173 186 / 0.35));
    }
  }

  > .section {
    padding: 0 0.75rem 0.75rem;
    color: var(--nagi-color-text-muted, #50676f);
  }
}
</style>
