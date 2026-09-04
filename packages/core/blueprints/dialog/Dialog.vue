<script setup lang="ts">
import type { StyleValue } from "vue";
import { useDialog, vDialogClose } from "@nagi-labs/nagi-ui";

const props = withDefaults(
  defineProps<{
    triggerLabel: string;
    title: string;
    id?: string;
    class?: string;
    style?: StyleValue;
    description?: string;
    closeLabel?: string;
  }>(),
  {
    closeLabel: "Close",
  },
);
defineOptions({ inheritAttrs: false });

const open = defineModel<boolean>("open", { default: false });
const dialog = useDialog({ open, modal: true, closedby: "any" });
const titleId = `${dialog.id}-title`;
const descriptionId = `${dialog.id}-description`;

defineExpose({ show: dialog.show, close: dialog.close, toggle: dialog.toggle });
</script>

<template>
  <div
    data-scope="dialog"
    data-part="root"
    class="n-dialog"
    :id="id"
    :class="props.class"
    :style="props.style"
  >
    <button
      data-scope="dialog"
      data-part="trigger"
      class="button -trigger"
      type="button"
      v-bind="dialog.triggerProps"
    >
      {{ triggerLabel }}
    </button>
    <dialog
      class="dialog"
      data-scope="dialog"
      data-part="surface"
      :aria-labelledby="titleId"
      :aria-describedby="description || $slots.description ? descriptionId : undefined"
      v-bind="dialog.dialogProps"
    >
      <header class="header">
        <h2
          data-scope="dialog"
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
          v-if="description || $slots.description"
          data-scope="dialog"
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
      <section class="section">
        <slot />
      </section>
      <footer class="footer">
        <slot
          name="actions"
          :close="dialog.close"
        />
        <button
          v-dialog-close="dialog.id"
          data-scope="dialog"
          data-part="close"
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
.n-dialog {
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
    inline-size: min(30rem, calc(100vi - 2rem));
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

    > .section {
      padding: var(--n-space-7) var(--n-space-8);
    }

    > .footer {
      display: flex;
      gap: var(--n-space-5);
      justify-content: flex-end;
      padding: 0 var(--n-space-8) var(--n-space-8);

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
    }
  }
}

@media (forced-colors: active) {
  .n-dialog {
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
