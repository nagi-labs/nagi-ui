<script setup lang="ts">
import { ref, useTemplateRef } from "vue";

import {
  Button,
  Dialog,
  Disclosure,
  Popover,
  Toast,
  Tooltip,
} from "@nagi-labs/nagi-ui/components";

interface ToastHandle {
  toast: (message: string, options?: { duration?: number }) => number;
  dismiss: (toastId: number) => void;
}

const dialogOpen = ref(false);
const disclosureOpen = ref(false);
const toaster = useTemplateRef<ToastHandle>("toaster");
let toastCount = 0;

function showToast() {
  toastCount += 1;
  toaster.value?.toast(`Catalog notification ${toastCount}`, { duration: 0 });
}
</script>

<template>
  <main class="catalog-lab">
    <header class="header">
      <p class="text -eyebrow">Package components</p>
      <h1 class="title">Thin platform Blueprint catalog</h1>
      <p class="text">
        These examples import raw SFCs from the package. The same files are copied by
        <code class="code">nagi-ui own</code>.
      </p>
    </header>

    <section class="section" aria-labelledby="popover-heading">
      <h2 id="popover-heading" class="title">Popover</h2>
      <Popover trigger-label="Open package popover">
        <p class="text">Popover body belongs to the application slot.</p>
      </Popover>
    </section>

    <section class="section" aria-labelledby="dialog-heading">
      <h2 id="dialog-heading" class="title">Dialog</h2>
      <p class="text">model open: {{ dialogOpen }}</p>
      <Dialog
        v-model:open="dialogOpen"
        trigger-label="Open package dialog"
        title="Package dialog"
      >
        <p class="text">The browser owns modality, focus trapping, and Escape.</p>
      </Dialog>
    </section>

    <section class="section" aria-labelledby="tooltip-heading">
      <h2 id="tooltip-heading" class="title">Tooltip</h2>
      <Tooltip
        trigger-label="More information"
        text="This hint is linked with aria-describedby."
        :open-delay="0"
      />
    </section>

    <section class="section" aria-labelledby="disclosure-heading">
      <h2 id="disclosure-heading" class="title">Disclosure</h2>
      <Disclosure v-model:open="disclosureOpen" summary="What does native mean?">
        <p class="text">The details element owns disclosure state and keyboard behavior.</p>
      </Disclosure>
    </section>

    <section class="section" aria-labelledby="toast-heading">
      <h2 id="toast-heading" class="title">Toast</h2>
      <Button @click="showToast">Show toast</Button>
      <Toast ref="toaster" :duration="0" />
    </section>
  </main>
</template>

<style scoped>
.catalog-lab {
  display: grid;
  gap: 1rem;
  max-inline-size: 62rem;
  padding: 2rem;
  color: var(--nagi-color-text, #17323b);
  font-family: ui-sans-serif, system-ui, sans-serif;

  > .header {
    > .title {
      margin-block: 0.35rem 0;
      font-size: 1.65rem;
    }

    > .text {
      max-inline-size: 44rem;
      color: var(--nagi-color-text-muted, #50676f);

      &.-eyebrow {
        margin: 0;
        color: var(--nagi-color-accent, #16768b);
        font-size: var(--nagi-font-size-label, 0.72rem);
        font-weight: 750;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      > .code {
        font-family: ui-monospace, monospace;
      }
    }
  }

  > .section {
    padding: 1rem;
    border: 1px solid var(--nagi-color-border-muted, #c8d8dd);
    border-radius: var(--nagi-radius-overlay, 0.65rem);
    background: var(--nagi-color-surface, #fff);

    > .title {
      margin-block: 0 0.75rem;
      font-size: 1.05rem;
    }

    > .text {
      color: var(--nagi-color-text-muted, #50676f);
    }
  }
}
</style>
