<script lang="ts">
export interface ToolbarItem {
  key: string;
  label: string;
  href?: string;
  target?: string;
  rel?: string;
  download?: string | boolean;
  disabled?: boolean;
}
</script>

<script setup lang="ts">
import type { StyleValue } from "vue";
import { useToolbar } from "@nagi-labs/nagi-ui";

const props = withDefaults(
  defineProps<{
    items: readonly ToolbarItem[];
    class?: string;
    style?: StyleValue;
    label?: string;
    orientation?: "horizontal" | "vertical";
    dir?: "ltr" | "rtl";
    loop?: boolean;
  }>(),
  {
    label: "Toolbar",
    orientation: "horizontal",
    dir: "ltr",
    loop: true,
  },
);
defineOptions({ inheritAttrs: false });

const emit = defineEmits<{ activate: [item: ToolbarItem] }>();
const toolbar = useToolbar(props);
</script>

<template>
  <div
    v-bind="toolbar.toolbarProps"
    class="n-toolbar"
    :class="props.class"
    :style="props.style"
    :data-orientation="orientation"
    :dir="dir"
  >
    <template
      v-for="item in items"
      :key="item.key"
    >
      <a
        v-if="item.href && !item.disabled"
        v-bind="toolbar.itemProps(item)"
        class="link"
        :href="item.href"
        :target="item.target"
        :rel="item.rel"
        :download="item.download"
        @click="emit('activate', item)"
        >{{ item.label }}</a
      >
      <button
        v-else
        v-bind="toolbar.itemProps(item)"
        class="button"
        type="button"
        :disabled="item.disabled"
        @click="emit('activate', item)"
      >
        {{ item.label }}
      </button>
    </template>
  </div>
</template>

<style scoped>
.n-toolbar {
  display: flex;
  gap: var(--nagi-space-item-gap);
  align-items: center;
  inline-size: fit-content;
  padding: var(--nagi-space-item-gap);
  border: var(--n-border-width-1) solid var(--nagi-color-border);
  border-radius: var(--nagi-radius-control);
  background: var(--nagi-color-surface);

  &[data-orientation="vertical"] {
    flex-direction: column;
    align-items: stretch;
  }

  > :is(.link, .button) {
    min-block-size: var(--nagi-size-control);
    padding: var(--nagi-space-control);
    border: 0;
    border-radius: var(--nagi-radius-control);
    background: transparent;
    color: var(--nagi-color-text);
    font: inherit;
    text-decoration: none;
    cursor: pointer;

    &:hover:not(:disabled) {
      background: var(--nagi-color-surface-active);
    }
    &:focus-visible {
      outline: none;
      box-shadow: var(--nagi-shadow-focus);
    }
    &:disabled {
      color: var(--nagi-color-text-disabled);
      cursor: not-allowed;
    }
  }
}

@media (forced-colors: active) {
  .n-toolbar > :is(.link, .button):focus-visible {
    outline: 2px solid Highlight;
  }
}
</style>
