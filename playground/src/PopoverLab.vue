<script setup lang="ts">
import { ref } from "vue"

import { useTemplateRef } from "vue"

import { usePopover, useToast, vPopoverTrigger } from "@nagi-labs/nagi-ui"

import DropdownMenu from "../../packages/core/blueprints/dropdown/DropdownMenu.vue"

const dialogElement = useTemplateRef<HTMLDialogElement>("dialogElement")
const notifier = useToast({ duration: 3000 })
let toastCount = 0

function fireToast() {
  toastCount += 1
  notifier.toast(`Saved! (#${toastCount})`)
}

const basic = usePopover()

const lastPick = ref("(none)")
const menuItems = [
  { key: "rename", label: "Rename" },
  { key: "duplicate", label: "Duplicate" },
  { key: "delete", label: "Delete" },
]

const controlledOpen = ref(false)
const controlled = usePopover({ open: controlledOpen })

async function closeAfterDelay() {
  await new Promise((resolve) => setTimeout(resolve, 600))
  controlledOpen.value = false
}

const hinted = usePopover()
</script>

<template>
  <main class="popover-lab">
    <h1 class="title">Nagi UI — usePopover lab</h1>

    <section class="section -uncontrolled">
      <h2 class="title">Uncontrolled</h2>
      <p class="text">
        The trigger carries only <code class="code">popovertarget</code>;
        open state lives in the UA. Light dismiss just works.
      </p>
      <button class="button -trigger" v-bind="basic.triggerProps">Open menu</button>
      <div class="zone" popover v-bind="basic.popoverProps">
        <ul class="list">
          <li class="item"><button class="button">Rename</button></li>
          <li class="item"><button class="button">Duplicate</button></li>
          <li class="item"><button class="button">Delete</button></li>
        </ul>
      </div>
    </section>

    <section class="section -controlled">
      <h2 class="title">Controlled (v-model style)</h2>
      <p class="text">
        store open: <span class="value" :data-open="controlledOpen">{{ controlledOpen }}</span>
      </p>
      <footer class="footer">
        <button class="button" @click="controlledOpen = true">Open via store</button>
        <button class="button" @click="closeAfterDelay">Close after 600ms</button>
      </footer>
      <button class="button -trigger" v-bind="controlled.triggerProps">Open via trigger</button>
      <div class="zone" popover v-bind="controlled.popoverProps">
        <p class="text">
          This popover mirrors a ref. Light dismiss updates the store; the
          store closes it imperatively.
        </p>
      </div>
    </section>

    <section class="section -directive">
      <h2 class="title">Directive sugar</h2>
      <button class="button -trigger" v-popover-trigger="hinted.id">Directive trigger</button>
      <div class="zone" popover v-bind="hinted.popoverProps">
        <p class="text">Wired by <code class="code">v-popover-trigger</code>.</p>
      </div>
    </section>

    <section class="section -blueprint">
      <h2 class="title">Dropdown blueprint (anchored)</h2>
      <DropdownMenu label="Actions" :items="menuItems" @select="lastPick = $event" />
      <p class="text">
        picked: <span class="value" :data-pick="lastPick">{{ lastPick }}</span>
      </p>
    </section>

    <section class="section -stacking">
      <h2 class="title">Dialog + Toast stacking</h2>
      <p class="text">
        Fire a toast while a modal dialog is open: the region re-promotes
        itself above the newest top-layer entry.
      </p>
      <button class="button" @click="fireToast">Fire toast</button>
      <button class="button" @click="dialogElement?.showModal()">Open modal dialog</button>
      <dialog ref="dialogElement" class="dialog">
        <h2 class="title">Modal dialog</h2>
        <p class="text">Toasts fired now must not sink under the backdrop.</p>
        <footer class="footer">
          <button class="button" @click="fireToast">Fire toast</button>
          <button class="button" @click="dialogElement?.close()">Close</button>
        </footer>
      </dialog>
    </section>

    <div class="zone -toasts" v-bind="notifier.regionProps">
      <ul class="list">
        <li v-for="item in notifier.toasts.value" :key="item.id" class="item">
          {{ item.message }}
        </li>
      </ul>
    </div>
  </main>
</template>

<style scoped>
.popover-lab {
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
      > .code {
        font-family: ui-monospace, monospace;
        background: #eef2f4;
        padding: 0.1em 0.35em;
        border-radius: 0.3em;
      }

      > .value {
        font-family: ui-monospace, monospace;

        &[data-open="true"] {
          color: #0a8ca8;
        }
      }
    }

    > .footer {
      display: flex;
      gap: 0.5rem;
      padding-block-end: 0.5rem;
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
      }

      > .footer {
        display: flex;
        gap: 0.5rem;
        margin-block-start: 0.75rem;
      }
    }

    > .zone {
      padding: 0.75rem 1rem;
      border: 1px solid #d2e2e7;
      border-radius: 0.5rem;
      box-shadow: 0 8px 24px rgb(22 48 60 / 0.12);
      opacity: 0;
      translate: 0 -0.5rem;
      transition:
        opacity 0.18s,
        translate 0.18s,
        overlay 0.18s allow-discrete,
        display 0.18s allow-discrete;

      &:popover-open {
        opacity: 1;
        translate: 0 0;

        @starting-style {
          opacity: 0;
          translate: 0 -0.5rem;
        }
      }

      > .list {
        margin: 0;
        padding: 0;
        list-style: none;
        display: grid;
        gap: 0.25rem;
      }

      > .text {
        margin: 0;
        max-inline-size: 24rem;
      }
    }
  }

  > .zone {
    &.-toasts {
      position: fixed;
      inset: auto 1rem 1rem auto;
      margin: 0;
      padding: 0;
      border: 0;
      background: transparent;

      > .list {
        margin: 0;
        padding: 0;
        list-style: none;
        display: grid;
        gap: 0.5rem;

        > .item {
          padding: 0.6rem 0.9rem;
          border-radius: 0.5rem;
          background: #16303c;
          color: #f4f9fa;
          box-shadow: 0 8px 24px rgb(22 48 60 / 0.3);
        }
      }
    }
  }
}
</style>
