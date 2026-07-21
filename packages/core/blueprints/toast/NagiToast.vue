<script setup lang="ts">
import { useToast } from "@nagi-labs/nagi-ui";

const props = withDefaults(
  defineProps<{
    duration?: number;
    dismissLabel?: string;
  }>(),
  { duration: 4000, dismissLabel: "Dismiss notification" },
);

const notifier = useToast({ duration: props.duration });

defineExpose({ toast: notifier.toast, dismiss: notifier.dismiss });
</script>

<template>
  <div class="nagi-toast">
    <div class="zone" v-bind="notifier.regionProps">
      <ol class="list">
        <li v-for="item in notifier.toasts.value" :key="item.id" class="item">
          <span class="text">{{ item.message }}</span>
          <button
            class="button -dismiss"
            type="button"
            :aria-label="dismissLabel"
            @click="notifier.dismiss(item.id)"
          >
            ×
          </button>
        </li>
      </ol>
    </div>
  </div>
</template>

<style scoped>
.nagi-toast {
  display: contents;

  > .zone {
    position: fixed;
    inset: auto 1rem 1rem auto;
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;

    > .list {
      display: grid;
      gap: var(--nagi-space-item-gap, 0.55rem);
      min-inline-size: min(22rem, calc(100vi - 2rem));
      margin: 0;
      padding: 0;
      list-style: none;

      > .item {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: var(--nagi-space-item-gap, 0.55rem);
        align-items: center;
        padding: 0.65rem 0.75rem;
        border: 1px solid var(--nagi-color-border-muted, #c8d8dd);
        border-radius: var(--nagi-radius-overlay, 0.65rem);
        background: var(--nagi-color-text, #17323b);
        color: var(--nagi-color-surface, #fff);
        box-shadow: var(--nagi-shadow-overlay, 0 14px 36px rgb(22 48 60 / 0.2));

        > .button {
          inline-size: 1.75rem;
          block-size: 1.75rem;
          padding: 0;
          border: 0;
          border-radius: var(--nagi-radius-item, 0.4rem);
          background: transparent;
          color: inherit;
          font: inherit;
          font-size: 1.1rem;
          cursor: pointer;

          &:hover {
            background: rgb(255 255 255 / 0.12);
          }

          &:focus-visible {
            outline: 2px solid var(--nagi-color-surface, #fff);
            outline-offset: 1px;
          }
        }
      }
    }
  }
}
</style>
