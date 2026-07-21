<script lang="ts">
export interface TabsItem {
  key: string;
  label: string;
  disabled?: boolean;
  /** Plain-text fallback used when the panel slot is omitted. */
  content?: string;
}
</script>

<script setup lang="ts">
import { ref, watch } from "vue";
import {
  useTabs,
  type MenuDirection,
  type TabsActivationMode,
  type TabsOrientation,
} from "@nagi-labs/nagi-ui";

const props = withDefaults(
  defineProps<{
    label: string;
    items: readonly TabsItem[];
    activationMode?: TabsActivationMode;
    orientation?: TabsOrientation;
    dir?: MenuDirection;
    loop?: boolean;
  }>(),
  {
    activationMode: "automatic",
    orientation: "horizontal",
    dir: "ltr",
    loop: true,
  },
);

const selectedModel = defineModel<string | null>("selected", { default: null });
const selected = ref<string | null>(selectedModel.value);

// defineModel emits to a controlled parent synchronously, but its getter can
// keep returning the previous prop until the parent renders again. useTabs
// needs a synchronously writable source for SSR and dynamic focus repair. The
// bridge is registered before useTabs so its immediate snapshot watcher can be
// the single canonicalization path for both package and core consumers.
watch(
  selectedModel,
  (value) => {
    selected.value = value;
  },
  { flush: "sync" },
);
watch(
  selected,
  () => {
    const canonical = selected.value;
    if (selectedModel.value !== canonical) selectedModel.value = canonical;
  },
  { flush: "sync" },
);

const tabs = useTabs<TabsItem>({
  items: () => props.items,
  getKey: (item) => item.key,
  isDisabled: (item) => item.disabled ?? false,
  selected,
  label: props.label,
  activationMode: props.activationMode,
  orientation: props.orientation,
  dir: props.dir,
  loop: props.loop,
});
</script>

<template>
  <div class="n-tabs">
    <div class="list" v-bind="tabs.tablistProps">
      <button
        v-for="item in items"
        :key="item.key"
        class="button"
        v-bind="tabs.tabProps(item)"
      >
        {{ item.label }}
      </button>
    </div>
    <section
      v-for="item in items"
      :key="item.key"
      class="section"
      v-bind="tabs.panelProps(item)"
    >
      <slot name="panel" :item="item">
        <p v-if="item.content" class="text">{{ item.content }}</p>
      </slot>
    </section>
  </div>
</template>

<style scoped>
.n-tabs {
  display: grid;
  gap: var(--nagi-space-item-gap);
  color: var(--nagi-color-text);

  &:has(> .list[aria-orientation="vertical"]) {
    grid-template-columns: minmax(9rem, max-content) minmax(0, 1fr);
    align-items: start;
  }

  > .list {
    display: flex;
    gap: 0.25rem;
    padding: 0.25rem;
    border: 1px solid var(--nagi-color-border-muted);
    border-radius: var(--nagi-radius-control);
    background: var(--nagi-color-surface);

    &[aria-orientation="vertical"] {
      flex-direction: column;
    }

    > .button {
      min-block-size: var(--nagi-size-control);
      padding: var(--nagi-space-control);
      border: 1px solid transparent;
      border-radius: var(--nagi-radius-item);
      background: transparent;
      color: inherit;
      font: inherit;
      font-weight: 650;
      text-align: start;
      cursor: pointer;

      &:hover:not(:disabled) {
        background: var(--nagi-color-surface-active);
      }

      &[aria-selected="true"] {
        border-color: var(--nagi-color-accent);
        background: var(--nagi-color-surface-accent);
        color: var(--nagi-color-accent);
      }

      &:focus-visible {
        outline: none;
        border-color: var(--nagi-color-focus-ring);
        box-shadow: var(--nagi-shadow-focus);
      }

      &:disabled {
        color: var(--nagi-color-text-disabled);
        cursor: not-allowed;
      }
    }
  }

  > .section {
    min-block-size: 7rem;
    padding: var(--nagi-space-surface-inset);
    border: 1px solid var(--nagi-color-border-muted);
    border-radius: var(--nagi-radius-overlay);
    outline: none;
    background: var(--nagi-color-surface);

    &:focus-visible {
      border-color: var(--nagi-color-focus-ring);
      box-shadow: var(--nagi-shadow-focus);
    }

    > .text {
      margin: 0;
      padding: 0.6rem;
      color: var(--nagi-color-text-muted);
    }
  }
}

@media (max-width: 38rem) {
  .n-tabs:has(> .list[aria-orientation="vertical"]) {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (forced-colors: active) {
  .n-tabs > .list > .button[aria-selected="true"] {
    border-width: 2px;
  }

  .n-tabs > .list > .button:focus-visible {
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }

  .n-tabs > .section:focus-visible {
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }
}
</style>
