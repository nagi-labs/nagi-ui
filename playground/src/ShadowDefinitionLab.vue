<script setup lang="ts">
import {
  NCombobox,
  NDatePicker,
  NDialog,
  NDropdownMenu,
  type ComboboxOption,
  type DropdownMenuNode,
} from "@nagi-labs/nagi-ui/components";
import { computed, ref } from "vue";

const props = defineProps<{ prefix: string }>();

const frameworks: readonly ComboboxOption[] = [
  { key: "vue", label: `${props.prefix} Vue` },
  { key: "react", label: `${props.prefix} React`, disabled: true },
  { key: "svelte", label: `${props.prefix} Svelte` },
];
const inputValue = ref("");
const selected = ref<string | null>(null);
const dialogOpen = ref(false);
const date = ref<string | null>("2026-07-24");
const action = ref("none");
const menuItems = computed<readonly DropdownMenuNode[]>(() => [
  {
    type: "action",
    key: "rename",
    label: `${props.prefix} Rename`,
    onSelect: () => (action.value = "rename"),
  },
  {
    type: "submenu",
    key: "share",
    label: `${props.prefix} Share`,
    items: [
      {
        type: "action",
        key: "copy",
        label: `${props.prefix} Copy link`,
        onSelect: () => (action.value = "copy"),
      },
    ],
  },
]);
</script>

<template>
  <section :aria-label="`${prefix} ShadowRoot fixture`">
    <n-combobox
      v-model="inputValue"
      v-model:selected="selected"
      :label="`${prefix} framework`"
      :items="frameworks"
    />
    <output role="status" :aria-label="`${prefix} combobox selection`">
      {{ selected ?? "none" }}
    </output>

    <n-dialog
      v-model:open="dialogOpen"
      :trigger-label="`Open ${prefix} dialog`"
      :title="`${prefix} dialog`"
      :description="`${prefix} native dialog inside one ShadowRoot.`"
    >
      <button type="button">{{ prefix }} dialog action</button>
    </n-dialog>

    <n-dropdown-menu :label="`${prefix} menu`" :items="menuItems" />
    <output role="status" :aria-label="`${prefix} menu action`">{{ action }}</output>

    <n-date-picker
      v-model="date"
      :label="`${prefix} date`"
      :calendar-label="`${prefix} date calendar`"
      :trigger-label="`Choose ${prefix} date`"
      locale="en-US"
      time-zone="UTC"
      default-visible-month="2026-07-24"
    />
    <output role="status" :aria-label="`${prefix} date model`">{{ date }}</output>
    <button type="button">Outside {{ prefix }}</button>
  </section>
</template>
