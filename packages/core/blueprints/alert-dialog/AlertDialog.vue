<script setup lang="ts">
import type { StyleValue } from "vue";
import { vDialogClose } from "@nagi-labs/nagi-ui";
import { useAlertDialog } from "@nagi-labs/nagi-ui/component-controls";

const props = withDefaults(
  defineProps<{
    triggerLabel: string;
    title: string;
    description: string;
    actionLabel: string;
    id?: string;
    class?: string;
    style?: StyleValue;
    cancelLabel?: string;
    actionTone?: "accent" | "danger";
  }>(),
  {
    cancelLabel: "Cancel",
    actionTone: "accent",
  },
);
defineOptions({ inheritAttrs: false });

defineEmits<{
  action: [event: MouseEvent];
  cancel: [event: MouseEvent];
}>();

const open = defineModel<boolean>("open", { default: false });
const dialog = useAlertDialog(open);
const titleId = `${dialog.id}-title`;
const descriptionId = `${dialog.id}-description`;

defineExpose({ show: dialog.show, close: dialog.close, toggle: dialog.toggle });
</script>

<template>
  <div
    class="n-alert-dialog"
    data-scope="alert-dialog"
    data-part="root"
    :id="id"
    :class="props.class"
    :style="props.style"
  >
    <button
      class="button -trigger"
      type="button"
      data-scope="alert-dialog"
      data-part="trigger"
      v-bind="dialog.triggerProps"
    >
      {{ triggerLabel }}
    </button>
    <dialog
      class="dialog"
      data-scope="alert-dialog"
      data-part="surface"
      role="alertdialog"
      :aria-labelledby="titleId"
      :aria-describedby="descriptionId"
      v-bind="dialog.dialogProps"
    >
      <header class="header">
        <h2
          data-scope="alert-dialog"
          data-part="title"
          :id="titleId"
          class="title"
        >
          <slot
            name="title"
            :title="title"
            >{{ title }}</slot
          >
        </h2>
        <p
          data-scope="alert-dialog"
          data-part="description"
          :id="descriptionId"
          class="p"
        >
          <slot
            name="description"
            :description="description"
            >{{ description }}</slot
          >
        </p>
      </header>
      <footer class="footer">
        <button
          v-dialog-close="dialog.id"
          data-scope="alert-dialog"
          data-part="cancel"
          autofocus
          class="button -cancel"
          type="button"
          @click="$emit('cancel', $event)"
        >
          {{ cancelLabel }}
        </button>
        <button
          v-dialog-close="dialog.id"
          data-scope="alert-dialog"
          data-part="action"
          class="button -action"
          :data-tone="actionTone"
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
    border: var(--n-border-width-1) solid var(--nagi-color-border);
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
    border: var(--n-border-width-1) solid var(--nagi-color-border-muted);
    border-radius: var(--nagi-radius-overlay);
    background: var(--nagi-color-surface);
    color: var(--nagi-color-text);
    box-shadow: var(--nagi-shadow-overlay);

    &::backdrop {
      background: color-mix(in srgb, var(--nagi-color-text) 45%, transparent);
    }

    > .header {
      padding: var(--n-space-8) var(--n-space-8) 0;

      > .title {
        margin: 0;
        font-size: var(--n-font-size-5);
      }

      > .p {
        margin-block: var(--n-space-3) 0;
        color: var(--nagi-color-text-muted);
        font-size: var(--n-font-size-3);
      }
    }

    > .footer {
      display: flex;
      gap: var(--n-space-5);
      justify-content: flex-end;
      padding: var(--n-space-8);

      > .button {
        min-block-size: var(--nagi-size-control);
        padding: var(--nagi-space-control);
        border: var(--n-border-width-1) solid var(--nagi-color-border);
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

        &[data-tone="accent"] {
          border-color: var(--nagi-color-accent);
          background: var(--nagi-color-surface-accent);
          color: var(--nagi-color-accent);
        }

        &[data-tone="danger"] {
          border-color: var(--nagi-color-danger);
          background: var(--nagi-color-surface-danger);
          color: var(--nagi-color-danger);
        }
      }
    }
  }
}

@media (forced-colors: active) {
  .n-alert-dialog {
    > .button:focus-visible {
      outline: 2px solid Highlight;
      outline-offset: var(--n-border-width-2);
    }

    > .dialog {
      > .footer {
        > .button:focus-visible {
          outline: 2px solid Highlight;
          outline-offset: var(--n-border-width-2);
        }
      }
    }
  }
}
</style>
