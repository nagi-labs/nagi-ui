import { ref } from "vue";

import {
  useCombobox,
  type ComboboxInputProps,
  type ComboboxListboxProps,
  type ComboboxOptionProps,
  type UseComboboxReturn,
} from "@nagi-labs/nagi-ui";

interface Fruit {
  key: "apple" | "cherry";
  label: string;
}

declare const fruits: readonly Fruit[];
declare const fruit: Fruit;

const selected = ref<"apple" | "cherry" | null>(null);
const value = ref("");
const combobox = useCombobox({
  items: fruits,
  getKey: (item) => item.key,
  getTextValue: (item) => item.label,
  selected,
  inputValue: value,
  onSelectionChange(key) {
    const _key: "apple" | "cherry" | null = key;
    void _key;
  },
});

const result: UseComboboxReturn<Fruit, "apple" | "cherry"> = combobox;
const inputProps: ComboboxInputProps = combobox.inputProps;
const listboxProps: ComboboxListboxProps = combobox.listboxProps;
const optionProps: ComboboxOptionProps = combobox.optionProps(fruit);
const active: "apple" | "cherry" | null = combobox.activeKey.value;
const committed: "apple" | "cherry" | null = combobox.selectedKey.value;
const visible: readonly Fruit[] = combobox.visibleItems.value;

useCombobox<Fruit, "apple" | "cherry">({
  items: fruits,
  getKey: (item) => item.key,
  getTextValue: (item) => item.label,
  // @ts-expect-error selected keys must match the declared key union
  selected: ref<string | null>(null),
});

// @ts-expect-error getTextValue is required for filtering and committed labels
useCombobox({ items: fruits, getKey: (item: Fruit) => item.key });

void result;
void inputProps;
void listboxProps;
void optionProps;
void active;
void committed;
void visible;
