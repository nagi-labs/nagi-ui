import { ref } from "vue";

import {
  useListbox,
  type ListboxOptionProps,
  type ListboxProps,
  type UseListboxReturn,
} from "@nagi-labs/nagi-ui";

interface Fruit {
  key: "apple" | "cherry";
  label: string;
}

declare const fruits: readonly Fruit[];
declare const fruit: Fruit;

const single = useListbox({
  items: fruits,
  getKey: (item) => item.key,
  getTextValue: (item) => item.label,
});

const singleReturn: UseListboxReturn<Fruit, "apple" | "cherry"> = single;
const listboxProps: ListboxProps = single.listboxProps;
const optionProps: ListboxOptionProps = single.optionProps(fruit);
const activeKey: "apple" | "cherry" | null = single.activeKey.value;
const selectedKeys: readonly ("apple" | "cherry")[] = single.selectedKeys.value;

const controlled = useListbox({
  items: fruits,
  getKey: (item) => item.key,
  getTextValue: (item) => item.label,
  mode: "multiple",
  selected: ref<readonly ("apple" | "cherry")[]>(["apple"]),
  onSelectionChange(keys) {
    const _keys: readonly ("apple" | "cherry")[] = keys;
    void _keys;
  },
});
void controlled;

useListbox({
  items: fruits,
  getKey: (item) => item.key,
  getTextValue: (item) => item.label,
  // @ts-expect-error mode is a closed vocabulary
  mode: "range",
});

useListbox<Fruit, "apple" | "cherry">({
  items: fruits,
  getKey: (item) => item.key,
  getTextValue: (item) => item.label,
  // @ts-expect-error selected keys must match the declared key union
  selected: ref<readonly string[]>([]),
});

// @ts-expect-error getTextValue is required for typeahead
useListbox({ items: fruits, getKey: (item: Fruit) => item.key });

void singleReturn;
void listboxProps;
void optionProps;
void activeKey;
void selectedKeys;
