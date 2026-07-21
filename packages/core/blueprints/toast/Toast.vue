<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, useTemplateRef, watch } from "vue";

import {
  createToastManager,
  useToast,
  type ToastId,
  type ToastItem,
  type ToastManager,
} from "@nagi-labs/nagi-ui";

const props = withDefaults(
  defineProps<{
    manager?: ToastManager;
    duration?: number;
    limit?: number;
    label?: string;
    dismissLabel?: string;
  }>(),
  {
    duration: 4000,
    limit: 3,
    label: "Notifications",
    dismissLabel: "Dismiss notification",
  },
);

const ownsManager = props.manager === undefined;
const internalManager = props.manager
  ?? createToastManager({ duration: props.duration, limit: props.limit });
const notifier = useToast({ manager: internalManager, label: props.label });
const region = useTemplateRef<HTMLElement>("region");
const visibleToasts = computed(() => [...notifier.toasts.value].reverse());

onBeforeUnmount(() => {
  if (ownsManager) internalManager.dispose();
});

function toneClass(item: ToastItem) {
  if (item.tone === "neutral") return undefined;
  return item.tone === "success" ? "-positive" : `-${item.tone}`;
}

function announcement(item: ToastItem) {
  return [item.title, item.description].filter(Boolean).join(". ");
}

function runAction(item: ToastItem) {
  return item.action?.onClick(item.id);
}

watch(notifier.toasts, async (next) => {
  if (typeof document === "undefined") return;
  const regionElement = region.value;
  const active = document.activeElement;
  if (!regionElement || !(active instanceof HTMLElement) || !regionElement.contains(active)) {
    return;
  }

  const focusedItem = active.closest<HTMLElement>(".item");
  if (!focusedItem) {
    if (next.length === 0) {
      await nextTick();
      notifier.restoreFocus();
    }
    return;
  }

  const previousItems = [...regionElement.querySelectorAll<HTMLElement>(":scope > .list > .item")];
  const focusedIndex = previousItems.indexOf(focusedItem);
  await nextTick();
  if (active.isConnected && regionElement.contains(active)) return;
  const remainingItems = [...regionElement.querySelectorAll<HTMLElement>(":scope > .list > .item")];
  if (remainingItems.length === 0) {
    notifier.restoreFocus();
    return;
  }
  const nextItem = remainingItems[Math.min(Math.max(focusedIndex, 0), remainingItems.length - 1)];
  nextItem?.querySelector<HTMLElement>("button")?.focus({ preventScroll: true });
}, { flush: "pre" });

function toast(message: string, options: { duration?: number } = {}): ToastId {
  return notifier.toast(message, options);
}

defineExpose({
  manager: internalManager,
  add: internalManager.add,
  update: internalManager.update,
  close: internalManager.close,
  promise: internalManager.promise,
  toast,
  dismiss: notifier.dismiss,
});
</script>

<template>
  <div class="n-toast">
    <div class="zone -announcements">
      <p
        v-for="item in notifier.toasts.value"
        :key="`${item.id}-${item.revision}`"
        class="text"
        :role="item.priority === 'assertive' ? 'alert' : 'status'"
        aria-atomic="true"
      >
        {{ announcement(item) }}
      </p>
    </div>

    <div ref="region" class="zone" v-bind="notifier.regionProps">
      <ol class="list">
        <li
          v-for="item in visibleToasts"
          :key="item.id"
          class="item"
          :class="toneClass(item)"
        >
          <div v-if="item.title" class="title">{{ item.title }}</div>
          <p v-if="item.description" class="text">{{ item.description }}</p>
          <div class="actions">
            <button
              v-if="item.action"
              class="button -action"
              type="button"
              @click="runAction(item)"
            >
              {{ item.action.label }}
            </button>
            <button
              class="button -dismiss"
              type="button"
              :aria-label="dismissLabel"
              @click="internalManager.close(item.id)"
            >
              ×
            </button>
          </div>
        </li>
      </ol>
    </div>
  </div>
</template>

<style scoped>
.n-toast {
  display: contents;

  > .zone.-announcements {
    position: fixed;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;

    > .text {
      margin: 0;
    }
  }

  > .zone {
    position: fixed;
    inset: auto 1rem 1rem auto;
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;

    > .list {
      display: grid;
      gap: var(--nagi-space-item-gap);
      min-inline-size: min(22rem, calc(100vi - 2rem));
      margin: 0;
      padding: 0;
      list-style: none;

      > .item {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: var(--nagi-space-item-gap);
        align-items: center;
        padding: 0.65rem 0.75rem;
        border: 1px solid var(--nagi-color-border-muted);
        border-radius: var(--nagi-radius-overlay);
        background: var(--nagi-color-surface);
        color: var(--nagi-color-text);
        box-shadow: var(--nagi-shadow-overlay);

        > .title {
          grid-column: 1;
          min-inline-size: 0;
          margin: 0 0 0.2rem;
          font-weight: 750;
        }

        > .text {
          grid-column: 1;
          min-inline-size: 0;
          margin: 0;
          color: var(--nagi-color-text-muted);
          font-size: 0.875rem;
        }

        > .actions {
          grid-column: 2;
          grid-row: 1 / span 2;
          display: flex;
          gap: 0.25rem;
          align-items: center;

          > .button {
            min-block-size: 1.75rem;
            padding-inline: 0.45rem;
            border: 0;
            border-radius: var(--nagi-radius-item);
            background: transparent;
            color: inherit;
            font: inherit;
            cursor: pointer;

            &:hover {
              background: color-mix(in srgb, currentColor 8%, transparent);
            }

            &:focus-visible {
              outline: 2px solid var(--nagi-color-focus-ring);
              outline-offset: 1px;
            }

            &.-action {
              color: var(--nagi-color-accent);
              font-weight: 700;
            }

            &.-dismiss {
              inline-size: 1.75rem;
              padding: 0;
              font-size: 1.1rem;
            }
          }
        }

        &.-accent {
          border-color: var(--nagi-color-accent);
          background: var(--nagi-color-surface-accent);
        }

        &.-positive {
          border-color: var(--nagi-color-success);
          background: var(--nagi-color-surface-success);
        }

        &.-warning {
          border-color: var(--nagi-color-warning);
          background: var(--nagi-color-surface-warning);
        }

        &.-danger {
          border-color: var(--nagi-color-danger);
          background: var(--nagi-color-surface-danger);
        }
      }
    }
  }
}
</style>
