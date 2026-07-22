<script setup lang="ts">
import { vDialogClose } from "@nagi-labs/nagi-ui";
import { useAlertDialogControl } from "@nagi-labs/nagi-ui/component-controls";

withDefaults(
  defineProps<{
    triggerLabel: string;
    title: string;
    description: string;
    actionLabel: string;
    cancelLabel?: string;
    actionTone?: "accent" | "danger";
  }>(),
  {
    cancelLabel: "Cancel",
    actionTone: "accent",
  },
);

defineEmits<{
  action: [event: MouseEvent];
  cancel: [event: MouseEvent];
}>();

const open = defineModel<boolean>("open", { default: false });
const dialog = useAlertDialogControl(open);
const titleId = `${dialog.id}-title`;
const descriptionId = `${dialog.id}-description`;

defineExpose({ show: dialog.show, close: dialog.close, toggle: dialog.toggle });
</script>

<template>
  <div class="n-alert-dialog">
    <button class="button -trigger" type="button" v-bind="dialog.triggerProps">
      {{ triggerLabel }}
    </button>
    <dialog
      class="dialog"
      role="alertdialog"
      :aria-labelledby="titleId"
      :aria-describedby="descriptionId"
      v-bind="dialog.dialogProps"
    >
      <header class="header">
        <h2 :id="titleId" class="title">
          <slot name="title" :title="title">{{ title }}</slot>
        </h2>
        <p :id="descriptionId" class="text">
          <slot name="description" :description="description">{{ description }}</slot>
        </p>
      </header>
      <footer class="footer">
        <button
          v-dialog-close="dialog.id"
          autofocus
          class="button -cancel"
          type="button"
          @click="$emit('cancel', $event)"
        >
          {{ cancelLabel }}
        </button>
        <button
          v-dialog-close="dialog.id"
          class="button -action"
          :class="`-${actionTone}`"
          type="button"
          @click="$emit('action', $event)"
        >
          {{ actionLabel }}
        </button>
      </footer>
    </dialog>
  </div>
</template>

<style scoped>
.n-alert-dialog {
  display: inline-block;
  color: var(--nagi-color-text);

  > .button {
    min-block-size: var(--nagi-size-control);
    padding: var(--nagi-space-control);
    border: 1px solid var(--nagi-color-border);
    border-radius: var(--nagi-radius-control);
    background: var(--nagi-color-surface);
    color: inherit;
    font: inherit;
    cursor: pointer;

    &:hover {
      background: var(--nagi-color-surface-active);
    }

    &:focus-visible {
      outline: none;
      border-color: var(--nagi-color-focus-ring);
      box-shadow: var(--nagi-shadow-focus);
    }
  }

  > .dialog {
    inline-size: min(28rem, calc(100vi - 2rem));
    padding: 0;
    border: 1px solid var(--nagi-color-border-muted);
    border-radius: var(--nagi-radius-overlay);
    background: var(--nagi-color-surface);
    color: var(--nagi-color-text);
    box-shadow: var(--nagi-shadow-overlay);

    &::backdrop {
      background: color-mix(in srgb, var(--nagi-color-text) 45%, transparent);
    }

    > .header {
      padding: 1rem 1rem 0;

      > .title {
        margin: 0;
        font-size: 1.05rem;
      }

      > .text {
        margin-block: 0.35rem 0;
        color: var(--nagi-color-text-muted);
        font-size: 0.9rem;
      }
    }

    > .footer {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
      padding: 1rem;

      > .button {
        min-block-size: var(--nagi-size-control);
        padding: var(--nagi-space-control);
        border: 1px solid var(--nagi-color-border);
        border-radius: var(--nagi-radius-control);
        background: var(--nagi-color-surface);
        color: inherit;
        font: inherit;
        cursor: pointer;

        &:hover {
          background: var(--nagi-color-surface-active);
        }

        &:focus-visible {
          outline: none;
          border-color: var(--nagi-color-focus-ring);
          box-shadow: var(--nagi-shadow-focus);
        }

        &.-accent {
          border-color: var(--nagi-color-accent);
          background: var(--nagi-color-surface-accent);
          color: var(--nagi-color-accent);
        }

        &.-danger {
          border-color: var(--nagi-color-danger);
          background: var(--nagi-color-surface-danger);
          color: var(--nagi-color-danger);
        }
      }
    }
  }
}
</style>
