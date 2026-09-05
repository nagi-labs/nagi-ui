<script lang="ts">
export interface AccordionItem {
  key: string;
  /** Required plain-text summary and fallback for the rich summary slot. */
  summary: string;
  /** Plain-text fallback used when the panel slot is omitted. */
  content?: string;
  /** Suppress summary activation while retaining a focusable summary. */
  disabled?: boolean;
}
</script>

<script setup lang="ts">
import { useAccordion } from "@nagi-labs/nagi-ui/component-controls";
import NDisclosure from "../disclosure/Disclosure.vue";
import type { StyleValue } from "vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    items: readonly AccordionItem[];
    /** Omit the shared name so the browser allows multiple open items. */
    multiple?: boolean;
    /** Initial keys used only when `v-model:open-keys` is absent. */
    defaultOpenKeys?: readonly string[];
    id?: string;
    class?: string;
    style?: StyleValue;
    title?: string;
    ariaLabel?: string;
    ariaDescribedby?: string;
  }>(),
  {
    multiple: false,
    defaultOpenKeys: () => [],
  },
);

const openKeys = defineModel<readonly string[]>("openKeys");
const accordion = useAccordion(props, openKeys);
</script>

<template>
  <div
    class="n-accordion"
    :id="id"
    :class="props.class"
    v-bind="props.style ? { style: props.style } : undefined"
    :title="title"
    :aria-label="ariaLabel"
    :aria-describedby="ariaDescribedby"
  >
    <NDisclosure
      v-for="item in items"
      :key="item.key"
      :summary="item.summary"
      :name="multiple ? undefined : accordion.groupName"
      :disabled="item.disabled"
      :open="accordion.isOpen(item.key)"
      @update:open="accordion.setOpen(item.key, $event)"
    >
      <template #summary>
        <slot
          name="summary"
          :item="item"
          :summary="item.summary"
          >{{ item.summary }}</slot
        >
      </template>
      <slot
        name="panel"
        :item="item"
      >
        <span
          v-if="item.content"
          class="text"
        >
          {{ item.content }}
        </span>
      </slot>
    </NDisclosure>
  </div>
</template>

<style scoped>
.n-accordion {
  display: grid;
  gap: var(--nagi-space-item-gap);
  color: var(--nagi-color-text);
}
</style>
