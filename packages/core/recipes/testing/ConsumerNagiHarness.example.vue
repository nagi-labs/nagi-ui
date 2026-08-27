<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

import { assertNagiDom } from "@nagi-labs/nagi-ui";
import { Button, DropdownMenu } from "@nagi-labs/nagi-ui/components";
import type { DropdownMenuNode } from "@nagi-labs/nagi-ui/components";

declare global {
  interface Window {
    __assertConsumerNagiDom?: () => void;
  }
}

const selectedAction = ref("none");
const submittedProject = ref("none");
const contractRoot = ref<HTMLElement>();

const items: readonly DropdownMenuNode[] = [
  {
    type: "action",
    key: "rename",
    label: "Rename",
    onSelect: () => {
      selectedAction.value = "rename";
    },
  },
  {
    type: "action",
    key: "archive",
    label: "Archive",
    disabled: true,
    onSelect: () => {
      selectedAction.value = "archive";
    },
  },
];

function submitProject(event: Event) {
  const form = event.currentTarget as HTMLFormElement;
  submittedProject.value = String(new FormData(form).get("project"));
}

function assertConsumerNagiDom() {
  assertNagiDom(contractRoot.value);
}

onMounted(() => {
  // Test-only bridge for a routed Playwright test. Do not expose this in production.
  window.__assertConsumerNagiDom = assertConsumerNagiDom;
});

onUnmounted(() => {
  delete window.__assertConsumerNagiDom;
});
</script>

<template>
  <!-- Replace this harness with the smallest real consumer view that owns the contract. -->
  <main ref="contractRoot" data-testid="nagi-contract-root">
    <h1>Nagi contract harness</h1>

    <section aria-labelledby="menu-heading">
      <h2 id="menu-heading">Menu behavior</h2>
      <DropdownMenu label="File actions" :items="items" />
      <button type="button">After menu</button>
      <output data-testid="selected-action">{{ selectedAction }}</output>
    </section>

    <section aria-labelledby="form-heading">
      <h2 id="form-heading">Form behavior</h2>
      <form @submit.prevent="submitProject">
        <label for="project">Project</label>
        <input id="project" name="project" value="Nagi" />
        <Button type="submit">Save</Button>
      </form>
      <output data-testid="submitted-project">{{ submittedProject }}</output>
    </section>
  </main>
</template>
