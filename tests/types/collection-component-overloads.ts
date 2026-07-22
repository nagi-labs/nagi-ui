import { ref } from "vue";

import { useCombobox, useListbox, useTabs } from "@nagi-labs/nagi-ui";

const items = [
  { key: "a", label: "Alpha" },
  { key: "b", label: "Beta", disabled: true },
] as const;
const selectedKeys = ref<readonly string[]>([]);
const selectedKey = ref<string | null>(null);
const inputValue = ref("");
const input = ref<HTMLInputElement | null>(null);

useListbox({
  items,
  mode: "single",
  orientation: "horizontal",
  dir: "rtl",
  loop: false,
}, selectedKeys);
useListbox({ items, getKey: (item) => item.key, getTextValue: (item) => item.label });
// @ts-expect-error Listbox package behavior is configured by named props
useListbox({ items, mode: "single", orientation: "vertical", dir: "ltr", loop: true }, selectedKeys, { loop: false });

const tabsProps = {
  label: "Sections",
  items,
  activationMode: "automatic" as const,
  orientation: "horizontal" as const,
  dir: "ltr" as const,
  loop: true,
};
useTabs(tabsProps, selectedKey);
useTabs({ items, getKey: (item) => item.key, label: "Sections" });
// @ts-expect-error component overloads have no third options path
useTabs(tabsProps, selectedKey, { loop: false });

const comboboxProps = {
  items,
  loading: false,
  disabled: false,
  readOnly: false,
  required: false,
  validationMessage: "Choose an option.",
};
useCombobox(comboboxProps, input, inputValue, selectedKey);
useCombobox({ items, getKey: (item) => item.key, getTextValue: (item) => item.label });
// @ts-expect-error component overloads have no fifth options path
useCombobox(comboboxProps, input, inputValue, selectedKey, { loop: true });
