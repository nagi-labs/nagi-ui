<script lang="ts">
export interface TreeNode {
  key: string;
  label: string;
  disabled?: boolean;
  loading?: boolean;
  hasChildren?: boolean;
  children?: readonly TreeNode[];
}
</script>

<script setup lang="ts">
import { useTree } from "@nagi-labs/nagi-ui";

import TreeBranch from "./TreeBranch.vue";

const props = withDefaults(defineProps<{
  items: readonly TreeNode[];
  label: string;
  expandLabel?: string;
  collapseLabel?: string;
}>(), { expandLabel: "Expand", collapseLabel: "Collapse" });
const selected = defineModel<string | null>({ default: null });
const expanded = defineModel<readonly string[]>("expanded", { default: () => [] });
const tree = useTree(props, { selected, expanded });
</script>

<template>
  <ul v-bind="tree.treeProps" class="n-tree">
    <TreeBranch
      :nodes="items"
      :tree="tree"
      :expand-label="expandLabel"
      :collapse-label="collapseLabel"
    />
  </ul>
</template>

<style scoped>
.n-tree {
  padding: var(--nagi-space-item-gap);
  border: var(--n-border-width-1) solid var(--nagi-color-border);
  border-radius: var(--nagi-radius-control);
  outline: 0;
  background: var(--nagi-color-surface);
  color: var(--nagi-color-text);
  list-style: none;

  &:focus-visible { box-shadow: var(--nagi-shadow-focus); }
}

@media (forced-colors: active) {
  .n-tree:focus-visible { outline: 2px solid Highlight; }
}
</style>
