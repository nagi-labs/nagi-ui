<script setup lang="ts">
import { useId } from "vue";

import { useDialog, vDialogClose } from "@nagi-labs/nagi-ui";

const props = defineProps<{
  triggerLabel: string;
  title: string;
  description: string;
  acceptedCloseLabel: string;
}>();
const emit = defineEmits<{
  acceptClose: [];
}>();
const open = defineModel<boolean>("open", { default: false });
const dialog = useDialog({ open, modal: true, closedby: "any" });
const titleId = useId();
const descriptionId = useId();
</script>

<template>
  <div
    data-scope="dialog"
    data-part="root"
  >
    <button
      data-scope="dialog"
      data-part="trigger"
      type="button"
      v-bind="dialog.triggerProps"
    >
      {{ triggerLabel }}
    </button>
    <dialog
      data-scope="dialog"
      data-part="surface"
      :aria-labelledby="titleId"
      :aria-describedby="descriptionId"
      v-bind="dialog.dialogProps"
    >
      <h2
        :id="titleId"
        data-scope="dialog"
        data-part="title"
      >
        {{ title }}
      </h2>
      <p
        :id="descriptionId"
        data-scope="dialog"
        data-part="description"
      >
        {{ description }}
      </p>
      <button
        v-dialog-close="dialog.id"
        data-scope="dialog"
        data-part="close"
        type="button"
      >
        Request owned controlled close
      </button>
      <button
        type="button"
        @click="emit('acceptClose')"
      >
        {{ props.acceptedCloseLabel }}
      </button>
    </dialog>
  </div>
</template>
