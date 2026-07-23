<script setup lang="ts">
import type { TreeBinding } from "@nagi-labs/nagi-ui";

import type { TreeNode } from "./Tree.vue";

defineOptions({ name: "TreeBranch" });
const props = defineProps<{
  nodes: readonly TreeNode[];
  tree: TreeBinding<TreeNode, string>;
  expandLabel: string;
  collapseLabel: string;
}>();
</script>

<template>
  <li
    v-for="node in nodes"
    :key="node.key"
    v-bind="tree.treeItemProps(node)"
    class="n-tree-branch"
  >
    <div class="row">
      <button
        v-if="node.hasChildren || node.children?.length"
        class="button -toggle"
        type="button"
        tabindex="-1"
        :aria-label="`${tree.expanded.value.includes(node.key) ? collapseLabel : expandLabel} ${node.label}`"
        :disabled="node.disabled || node.loading"
        @click.stop="(event) => { tree.focusOwner(event); tree.activate(node); tree.toggle(node); }"
      >{{ tree.expanded.value.includes(node.key) ? '−' : '+' }}</button>
      <span v-else class="spacer" aria-hidden="true"></span>
      <span class="text">{{ node.label }}</span>
    </div>
    <ul
      v-if="node.children?.length && tree.expanded.value.includes(node.key)"
      v-bind="tree.groupProps"
      class="group"
    >
      <TreeBranch
        :nodes="node.children"
        :tree="tree"
        :expand-label="expandLabel"
        :collapse-label="collapseLabel"
      />
    </ul>
  </li>
</template>

<style scoped>
.n-tree-branch {
  min-block-size: var(--nagi-size-control);
  border-radius: var(--nagi-radius-item);
  list-style: none;
  cursor: default;

  &[data-active] { outline: 2px solid var(--nagi-color-focus-ring); outline-offset: -2px; }
  &[aria-selected="true"] { background: var(--nagi-color-surface-accent); }
  &[aria-disabled="true"] { color: var(--nagi-color-text-disabled); }

  > .row {
    display: flex;
    gap: var(--nagi-space-item-gap);
    align-items: center;
    min-block-size: var(--nagi-size-control);

    > .button, > .spacer {
      display: grid;
      place-items: center;
      inline-size: var(--nagi-size-control);
      min-block-size: var(--nagi-size-control);
      border: 0;
      background: transparent;
      color: inherit;
      font: inherit;
    }
  }

  > .group {
    margin: 0;
    padding-block: 0;
    padding-inline: var(--nagi-space-surface-inset) 0;
    list-style: none;
  }
}

@media (forced-colors: active) {
  .n-tree-branch[data-active] { outline: 2px solid Highlight; }
}
</style>
