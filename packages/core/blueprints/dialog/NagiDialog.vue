<script setup lang="ts">
import {
  useDialog,
  vDialogClose,
  type DialogClosedBy,
} from "@nagi-labs/nagi-ui";

const props = withDefaults(
  defineProps<{
    triggerLabel: string;
    title: string;
    description?: string;
    closeLabel?: string;
    modal?: boolean;
    closedby?: DialogClosedBy;
  }>(),
  {
    closeLabel: "Close",
    modal: true,
    closedby: "any",
  },
);

const open = defineModel<boolean>("open", { default: false });
const dialog = useDialog({
  open,
  modal: props.modal,
  closedby: props.closedby,
});
const titleId = `${dialog.id}-title`;
const descriptionId = `${dialog.id}-description`;

defineExpose({ show: dialog.show, close: dialog.close, toggle: dialog.toggle });
</script>

<template>
  <div class="nagi-dialog">
    <button class="button -trigger" type="button" v-bind="dialog.triggerProps">
      {{ triggerLabel }}
    </button>
    <dialog
      class="dialog"
      :aria-labelledby="titleId"
      :aria-describedby="description ? descriptionId : undefined"
      v-bind="dialog.dialogProps"
    >
      <header class="header">
        <h2 :id="titleId" class="title">{{ title }}</h2>
        <p v-if="description" :id="descriptionId" class="text">{{ description }}</p>
      </header>
      <section class="section">
        <slot />
      </section>
      <footer class="footer">
        <slot name="actions" />
        <button
          v-dialog-close="dialog.id"
          class="button -close"
          type="button"
        >
          {{ closeLabel }}
        </button>
      </footer>
    </dialog>
  </div>
</template>

<style scoped>
.nagi-dialog {
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
    inline-size: min(30rem, calc(100vi - 2rem));
    padding: 0;
    border: 1px solid var(--nagi-color-border-muted);
    border-radius: var(--nagi-radius-overlay);
    background: var(--nagi-color-surface);
    color: var(--nagi-color-text);
    box-shadow: var(--nagi-shadow-overlay);

    &::backdrop {
      background: rgb(22 48 60 / 0.45);
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

    > .section {
      padding: 0.75rem 1rem;
    }

    > .footer {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
      padding: 0 1rem 1rem;

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
    }
  }
}
</style>
