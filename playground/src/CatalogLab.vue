<script setup lang="ts">
import { ref, useTemplateRef } from "vue";

import {
  Alert,
  Badge,
  Button,
  Card,
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
const focusableDisabledClicks = ref(0);
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
      <h1 class="title">Package Blueprint catalog</h1>
      <p class="text">
        These examples import raw SFCs from the package. The same files are copied by
        <code class="code">nagi-ui own</code>.
      </p>
    </header>

    <section class="section" aria-labelledby="styling-heading">
      <h2 id="styling-heading" class="title">Styling-only baseline</h2>
      <Card
        class="card"
        title="Package-first surface"
        description="Theme by default; own only when the structure must change."
      >
        <div class="card-content">
          <p class="text">The consumer owns and styles this declared slot sub-surface.</p>
          <div class="list" aria-label="Package status badges">
            <Badge label="Neutral" />
            <Badge label="Accent" tone="accent" />
            <Badge label="Ready" tone="success" />
            <Badge label="Review" tone="warning" />
            <Badge label="Blocked" tone="danger" />
          </div>
          <Alert title="Catalog ready" tone="success">
            <p class="text">Card, Alert, and Badge complete the initial styling-only baseline.</p>
          </Alert>
          <Alert title="Destructive action" tone="danger" role="alert">
            <p class="text">Use assertive semantics only for urgent, newly surfaced information.</p>
          </Alert>
          <div class="list" aria-label="Disabled button examples">
            <Button disabled>Native disabled</Button>
            <Button
              disabled
              focusable-when-disabled
              @click="focusableDisabledClicks += 1"
            >
              Focusable disabled
            </Button>
            <output data-testid="focusable-disabled-clicks">
              activations: {{ focusableDisabledClicks }}
            </output>
          </div>
        </div>
      </Card>
    </section>

    <section class="section" aria-labelledby="popover-heading">
      <h2 id="popover-heading" class="title">Popover</h2>
      <Popover trigger-label="Open package popover" area="block-end" :offset="8">
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
        description="Confirm the package-level action before continuing."
      >
        <p class="text">The browser owns modality, focus trapping, and Escape.</p>
        <template #actions>
          <Button
            class="nagi-dialog-actions"
            variant="accent"
            @click="dialogOpen = false"
          >
            Confirm
          </Button>
        </template>
      </Dialog>
    </section>

    <section class="section" aria-labelledby="tooltip-heading">
      <h2 id="tooltip-heading" class="title">Tooltip</h2>
      <Tooltip
        trigger-label="More information"
        text="This hint is linked with aria-describedby."
        :open-delay="0"
        area="block-start"
        :offset="8"
      />
      <Tooltip
        trigger-label="Unavailable information"
        text="Disabled tooltips do not open."
        disabled
        :open-delay="0"
      />
    </section>

    <section class="section" aria-labelledby="disclosure-heading">
      <h2 id="disclosure-heading" class="title">Disclosure</h2>
      <Disclosure v-model:open="disclosureOpen" summary="What does native mean?">
        <p class="text">The details element owns disclosure state and keyboard behavior.</p>
      </Disclosure>
      <Disclosure summary="Unavailable disclosure" disabled>
        <p class="text">Disabled disclosure content.</p>
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

    > .card {
      .card-content {
        display: grid;
        gap: 0.75rem;

        > .text {
          margin: 0;
          color: var(--nagi-color-text-muted, #50676f);
        }

        > .list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }
      }
    }
  }
}
</style>
