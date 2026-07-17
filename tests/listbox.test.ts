import assert from "node:assert/strict";
import test from "node:test";

import { nextTick, ref } from "vue";

import { useListbox } from "@nagi-labs/nagi-ui";

interface Fruit {
  key: string;
  label: string;
  disabled?: boolean;
}

const fruits: readonly Fruit[] = [
  { key: "apple", label: "Apple" },
  { key: "banana", label: "Banana", disabled: true },
  { key: "cherry", label: "Cherry" },
  { key: "date", label: "Date" },
];

function createListbox(overrides: Partial<Parameters<typeof useListbox<Fruit>>[0]> = {}) {
  return useListbox<Fruit>({
    items: fruits,
    getKey: (item) => item.key,
    getTextValue: (item) => item.label,
    isDisabled: (item) => item.disabled ?? false,
    ...overrides,
  });
}

function keydown(
  key: string,
  modifiers: Partial<Pick<KeyboardEvent, "shiftKey" | "ctrlKey" | "metaKey" | "altKey">> = {},
): KeyboardEvent {
  return {
    key,
    shiftKey: false,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    preventDefault() {},
    stopPropagation() {},
    ...modifiers,
  } as KeyboardEvent;
}

function focusSelf(): FocusEvent {
  const target = {};
  return { target, currentTarget: target } as FocusEvent;
}

test("single mode: focus lands on the first enabled option and arrows keep selection on focus", () => {
  const listbox = createListbox();
  listbox.listboxProps.onFocus(focusSelf());
  assert.equal(listbox.activeKey.value, "apple");
  assert.deepEqual([...listbox.selectedKeys.value], []);

  listbox.listboxProps.onKeydown(keydown("ArrowDown"));
  assert.equal(listbox.activeKey.value, "cherry");
  assert.deepEqual([...listbox.selectedKeys.value], ["cherry"]);

  listbox.listboxProps.onKeydown(keydown("ArrowDown"));
  listbox.listboxProps.onKeydown(keydown("ArrowDown"));
  assert.equal(listbox.activeKey.value, "apple");
  assert.deepEqual([...listbox.selectedKeys.value], ["apple"]);
});

test("single mode: controlled ref stays the source of truth and change events fire", () => {
  const selected = ref<readonly string[]>(["date"]);
  const changes: (readonly string[])[] = [];
  const listbox = createListbox({
    selected,
    onSelectionChange: (keys) => changes.push(keys),
  });

  listbox.listboxProps.onFocus(focusSelf());
  assert.equal(listbox.activeKey.value, "date");

  listbox.listboxProps.onKeydown(keydown("Home"));
  assert.deepEqual([...selected.value], ["apple"]);
  assert.deepEqual(changes, [["apple"]]);

  selected.value = ["cherry"];
  assert.equal(listbox.isSelected(fruits[2] as Fruit), true);
});

test("multiple mode: arrows move focus without selecting; Space and Shift+Arrow select", () => {
  const listbox = createListbox({ mode: "multiple" });
  listbox.listboxProps.onFocus(focusSelf());

  listbox.listboxProps.onKeydown(keydown("ArrowDown"));
  assert.equal(listbox.activeKey.value, "cherry");
  assert.deepEqual([...listbox.selectedKeys.value], []);

  listbox.listboxProps.onKeydown(keydown(" "));
  assert.deepEqual([...listbox.selectedKeys.value], ["cherry"]);
  listbox.listboxProps.onKeydown(keydown(" "));
  assert.deepEqual([...listbox.selectedKeys.value], []);

  listbox.listboxProps.onKeydown(keydown("ArrowDown", { shiftKey: true }));
  assert.deepEqual([...listbox.selectedKeys.value], ["date"]);
});

test("multiple mode: Ctrl+A toggles every enabled option", () => {
  const listbox = createListbox({ mode: "multiple" });
  listbox.listboxProps.onKeydown(keydown("a", { ctrlKey: true }));
  assert.deepEqual([...listbox.selectedKeys.value], ["apple", "cherry", "date"]);
  listbox.listboxProps.onKeydown(keydown("a", { ctrlKey: true }));
  assert.deepEqual([...listbox.selectedKeys.value], []);
});

test("click selects in single mode, toggles in multiple mode, and ignores disabled options", () => {
  const single = createListbox();
  single.optionProps(fruits[2] as Fruit).onClick(new Object() as MouseEvent);
  assert.deepEqual([...single.selectedKeys.value], ["cherry"]);
  assert.equal(single.activeKey.value, "cherry");

  let prevented = false;
  single
    .optionProps(fruits[1] as Fruit)
    .onClick({ preventDefault: () => (prevented = true) } as unknown as MouseEvent);
  assert.equal(prevented, true);
  assert.deepEqual([...single.selectedKeys.value], ["cherry"]);

  const multiple = createListbox({ mode: "multiple" });
  multiple.optionProps(fruits[0] as Fruit).onClick(new Object() as MouseEvent);
  multiple.optionProps(fruits[2] as Fruit).onClick(new Object() as MouseEvent);
  assert.deepEqual([...multiple.selectedKeys.value], ["apple", "cherry"]);
  multiple.optionProps(fruits[0] as Fruit).onClick(new Object() as MouseEvent);
  assert.deepEqual([...multiple.selectedKeys.value], ["cherry"]);
});

test("typeahead moves the active option and follows focus in single mode", () => {
  const listbox = createListbox();
  listbox.listboxProps.onKeydown(keydown("d"));
  assert.equal(listbox.activeKey.value, "date");
  assert.deepEqual([...listbox.selectedKeys.value], ["date"]);
});

test("filtering out the active option parks focus without touching the selection", async () => {
  const visible = ref<readonly Fruit[]>(fruits);
  const listbox = createListbox({ items: () => visible.value, mode: "multiple" });
  listbox.listboxProps.onFocus(focusSelf());
  listbox.listboxProps.onKeydown(keydown("ArrowDown"));
  listbox.listboxProps.onKeydown(keydown(" "));
  assert.deepEqual([...listbox.selectedKeys.value], ["cherry"]);

  visible.value = fruits.filter((fruit) => fruit.key !== "cherry");
  await nextTick();
  assert.equal(listbox.activeKey.value, "apple");
  assert.deepEqual([...listbox.selectedKeys.value], ["cherry"]);

  visible.value = fruits;
  await nextTick();
  assert.deepEqual([...listbox.selectedKeys.value], ["cherry"]);
  assert.equal(listbox.optionProps(fruits[2] as Fruit)["aria-selected"], "true");
});

test("emits only standard attributes with stable ids", () => {
  const single = createListbox({ id: "fruits" });
  assert.equal(single.listboxProps.role, "listbox");
  assert.equal(single.listboxProps.tabindex, 0);
  assert.equal(single.listboxProps["aria-multiselectable"], undefined);
  assert.equal(single.listboxProps["aria-activedescendant"], undefined);

  single.listboxProps.onFocus(focusSelf());
  assert.equal(single.listboxProps["aria-activedescendant"], "fruits-option-apple");

  const option = single.optionProps(fruits[0] as Fruit);
  assert.equal(option.id, "fruits-option-apple");
  assert.equal(option.role, "option");
  assert.equal(option["aria-selected"], "false");
  assert.equal(option["data-active"], "");

  const disabled = single.optionProps(fruits[1] as Fruit);
  assert.equal(disabled["aria-disabled"], "true");

  const multiple = createListbox({ mode: "multiple" });
  assert.equal(multiple.listboxProps["aria-multiselectable"], "true");
});

test("horizontal orientation follows reading direction", () => {
  const rtl = createListbox({ orientation: "horizontal", dir: "rtl" });
  rtl.listboxProps.onFocus(focusSelf());
  rtl.listboxProps.onKeydown(keydown("ArrowLeft"));
  assert.equal(rtl.activeKey.value, "cherry");
  rtl.listboxProps.onKeydown(keydown("ArrowRight"));
  assert.equal(rtl.activeKey.value, "apple");
  assert.equal(rtl.listboxProps["aria-orientation"], "horizontal");
});
