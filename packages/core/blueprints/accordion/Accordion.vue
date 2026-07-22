<script lang="ts">
export interface AccordionItem {
  key: string;
  /** Required plain-text summary and fallback for the rich summary slot. */
  summary: string;
  /** Plain-text fallback used when the panel slot is omitted. */
  content?: string;
  /** Suppress summary activation while retaining a focusable summary. */
  disabled?: boolean;
}
</script>

<script setup lang="ts">
import { useAccordion } from "@nagi-labs/nagi-ui/component-controls";

const props = withDefaults(
  defineProps<{
    items: readonly AccordionItem[];
    /** Omit the shared name so the browser allows multiple open items. */
    multiple?: boolean;
    /** Initial keys used only when `v-model:open-keys` is absent. */
    defaultOpenKeys?: readonly string[];
  }>(),
  {
    multiple: false,
    defaultOpenKeys: () => [],
  },
);

const openKeys = defineModel<readonly string[]>("openKeys");
const accordion = useAccordion(props, openKeys);
</script>

<template>
  <div class="n-accordion">
    <details
      v-for="item in items"
      :key="item.key"
      class="details"
      v-bind="accordion.detailsProps(item.key)"
    >
      <summary
        class="summary"
        v-bind="accordion.summaryProps(item.disabled)"
      >
        <slot name="summary" :item="item" :summary="item.summary">{{ item.summary }}</slot>
      </summary>
      <section class="section">
        <slot name="panel" :item="item">
          <p v-if="item.content" class="text">{{ item.content }}</p>
        </slot>
      </section>
    </details>
  </div>
</template>

<style scoped>
.n-accordion {
  display: grid;
  gap: var(--nagi-space-item-gap);
  color: var(--nagi-color-text);

  > .details {
    overflow: hidden;
    border: 1px solid var(--nagi-color-border-muted);
    border-radius: var(--nagi-radius-control);
    background: var(--nagi-color-surface);

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
      padding: var(--nagi-space-control);
      color: var(--nagi-color-text-muted);

      > .text {
        margin: 0;
      }
    }
  }
}

@media (forced-colors: active) {
  .n-accordion > .details > .summary:focus-visible {
    outline: 2px solid Highlight;
    outline-offset: -2px;
  }
}
</style>
