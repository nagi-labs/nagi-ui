<script setup lang="ts">
import { ref } from "vue";

import ActionMenu, { type ActionMenuItem } from "../../packages/core/blueprints/menu/ActionMenu.vue";

const items: readonly ActionMenuItem[] = [
  { key: "duplicate", label: "Duplicate" },
  { key: "archive", label: "Archive", disabled: true },
  { key: "rename", label: "Rename" },
  { key: "share", label: "Share" },
];
const selected = ref("none");

function select(item: ActionMenuItem) {
  selected.value = item.key;
}
</script>

<template>
  <main class="n-phase2-lab">
    <h1 class="title">Nagi UI — Phase 2 Menu DX</h1>
    <p class="text">
      DOM focus stays on the menu while <code class="code">itemProps(item)</code>
      drives the active descendant.
    </p>
    <ActionMenu label="Actions" :items="items" @select="select" />
    <p class="text">
      selected: <output class="output">{{ selected }}</output>
    </p>
    <button id="after-menu" class="button" type="button">After menu</button>
  </main>
</template>

<style scoped>
.n-phase2-lab {
  padding: 2rem;
  font-family: ui-sans-serif, system-ui, sans-serif;

  > .title {
    font-size: 1.5rem;
  }

  > .text {
    max-inline-size: 38rem;

    > .code,
    > .output {
      font-family: ui-monospace, monospace;
    }
  }

  > .button {
    margin-block-start: 1rem;
  }
}
</style>
