<script setup lang="ts">
import { useDialog, useDisclosure, useTooltip } from "@nagi-labs/nagi-ui"

// useDialog — modal, focus trap delegated to the UA, controlled state mirrored.
const dialog = useDialog({ closedby: "any" })
const dialogOpen = dialog.open

// useTooltip — popover="hint", opens on hover/focus, anchored to the trigger.
const tooltip = useTooltip({ anchor: true })

// useDisclosure — <details>-based, exclusive-accordion group via name.
const faq1 = useDisclosure({ name: "faq", defaultOpen: true })
const faq2 = useDisclosure({ name: "faq" })
</script>

<template>
  <main class="n-phase1-lab">
    <h1 class="title">Nagi UI — Phase 1 thin composables</h1>

    <section class="section">
      <h2 class="title">useDialog</h2>
      <p class="text">
        model open: <span class="value" :data-open="dialogOpen">{{ dialogOpen }}</span>
      </p>
      <button class="button -trigger" v-bind="dialog.triggerProps">Open dialog</button>
      <dialog class="dialog" v-bind="dialog.dialogProps">
        <h2 class="title">Confirm</h2>
        <p class="text">
          The UA traps focus and Esc closes it — no custom focus trap. Backdrop
          click dismisses via native <code class="code">closedby="any"</code>.
        </p>
        <footer class="footer">
          <button class="button" @click="dialog.close()">Close</button>
        </footer>
      </dialog>
    </section>

    <section class="section">
      <h2 class="title">useTooltip</h2>
      <p class="text">Hover or keyboard-focus the button; the hint anchors to it.</p>
      <button class="button -trigger" v-bind="tooltip.triggerProps">Hover or focus me</button>
      <div class="unit -hint" popover="hint" v-bind="tooltip.tooltipProps">
        <p class="text">Shown via <code class="code">popover="hint"</code>.</p>
      </div>
    </section>

    <section class="section">
      <h2 class="title">useDisclosure</h2>
      <p class="text">Native <code class="code">&lt;details&gt;</code>; the shared name makes them exclusive.</p>
      <details class="details" v-bind="faq1.detailsProps">
        <summary class="summary">What is Nagi UI?</summary>
        <p class="text">A headless attribute-injection layer over platform primitives.</p>
      </details>
      <details class="details" v-bind="faq2.detailsProps">
        <summary class="summary">Does the core ship CSS?</summary>
        <p class="text">No — core injects attributes only; styling is the Nagi CSS contract.</p>
      </details>
    </section>
  </main>
</template>

<style scoped>
.n-phase1-lab {
  padding: 2rem;
  font-family: ui-sans-serif, system-ui, sans-serif;

  > .title {
    font-size: 1.5rem;
  }

  > .section {
    padding-block: 1rem;

    > .title {
      font-size: 1.1rem;
    }

    > .text {
      max-inline-size: 32rem;

      > .value {
        font-family: ui-monospace, monospace;

        &[data-open="true"] {
          color: #0a8ca8;
        }
      }

      > .code {
        font-family: ui-monospace, monospace;
        background: #eef2f4;
        padding: 0.1em 0.35em;
        border-radius: 0.3em;
      }
    }

    > .button {
      &.-trigger {
        padding: 0.45rem 0.9rem;
        border: 1px solid #c6d6dc;
        border-radius: 0.45rem;
        background: #fff;
        font: inherit;
        cursor: pointer;
      }
    }

    > .dialog {
      padding: 1.25rem 1.5rem;
      border: 1px solid #d2e2e7;
      border-radius: 0.6rem;
      box-shadow: 0 16px 48px rgb(22 48 60 / 0.25);

      &::backdrop {
        background: rgb(22 48 60 / 0.45);
      }

      > .title {
        margin-block-start: 0;
        font-size: 1.05rem;
      }

      > .text {
        max-inline-size: 24rem;

        > .code {
          font-family: ui-monospace, monospace;
        }
      }

      > .footer {
        display: flex;
        gap: 0.5rem;
        margin-block-start: 0.75rem;

        > .button {
          padding: 0.4rem 0.8rem;
        }
      }
    }

    > .unit {
      &.-hint {
        margin: 0;
        padding: 0.5rem 0.75rem;
        border: 1px solid #d2e2e7;
        border-radius: 0.4rem;
        background: #16303c;
        color: #f4f9fa;

        > .text {
          margin: 0;

          > .code {
            font-family: ui-monospace, monospace;
            color: #cdeef5;
          }
        }
      }
    }

    > .details {
      max-inline-size: 32rem;
      padding-block: 0.35rem;

      > .summary {
        cursor: pointer;
      }

      > .text {
        margin-block: 0.35rem 0;
      }
    }
  }
}
</style>
