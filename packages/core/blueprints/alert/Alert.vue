<script setup lang="ts">
import { mergeElementProps } from "@nagi-labs/nagi-ui";
import { computed, useAttrs } from "vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    title: string;
    tone?: "neutral" | "accent" | "success" | "warning" | "danger";
    role?: "status" | "alert";
  }>(),
  { tone: "neutral", role: "status" },
);
const attrs = useAttrs();
const sectionProps = computed(() => mergeElementProps(attrs, { role: props.role }));
</script>

<template>
  <section
    class="n-alert"
    v-bind="sectionProps"
    :data-tone="tone"
  >
    <span
      v-if="$slots.icon"
      class="icon"
    >
      <slot name="icon" />
    </span>
    <h2 class="title">
      <slot
        name="title"
        :title="title"
        >{{ title }}</slot
      >
    </h2>
    <div class="unit">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.n-alert {
  padding: var(--n-space-7) var(--n-space-7);
  border: var(--n-border-width-1) solid var(--nagi-color-border-muted);
  border-radius: var(--nagi-radius-control);
  background: var(--nagi-color-surface);
  color: var(--nagi-color-text);

  &:has(> .icon) {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    column-gap: var(--nagi-space-item-gap);

    > .icon {
      grid-row: 1 / span 2;
      align-self: start;
      display: inline-flex;
    }

    > .title,
    > .unit {
      grid-column: 2;
    }
  }

  > .title {
    margin: 0;
    font-size: var(--n-font-size-3);
  }

  > .unit {
    margin-block-start: var(--n-space-2);
    font-size: var(--n-font-size-3);

    > :first-child {
      margin-block-start: 0;
    }

    > :last-child {
      margin-block-end: 0;
    }
  }

  &[data-tone="accent"] {
    border-color: var(--nagi-color-accent);
    background: var(--nagi-color-surface-accent);
    color: var(--nagi-color-accent);
  }

  &[data-tone="success"] {
    border-color: var(--nagi-color-success);
    background: var(--nagi-color-surface-success);
    color: var(--nagi-color-success);
  }

  &[data-tone="warning"] {
    border-color: var(--nagi-color-warning);
    background: var(--nagi-color-surface-warning);
    color: var(--nagi-color-warning);
  }

  &[data-tone="danger"] {
    border-color: var(--nagi-color-danger);
    background: var(--nagi-color-surface-danger);
    color: var(--nagi-color-danger);
  }
}
</style>
