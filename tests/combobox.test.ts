import assert from "node:assert/strict";
import test from "node:test";

import { nextTick, ref } from "vue";

import { useCombobox } from "@nagi-labs/nagi-ui";

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

function createCombobox(overrides: Partial<Parameters<typeof useCombobox<Fruit>>[0]> = {}) {
  return useCombobox<Fruit>({
    items: fruits,
    getKey: (item) => item.key,
    getTextValue: (item) => item.label,
    isDisabled: (item) => item.disabled ?? false,
    id: "fruit-combobox",
    ...overrides,
  });
}

function input(value: string): Event {
  const target = { value };
  return { target, currentTarget: target } as unknown as Event;
}

function keydown(key: string, modifiers: Partial<KeyboardEvent> = {}) {
  let prevented = false;
  let stopped = false;
  const event = {
    key,
    keyCode: 0,
    altKey: false,
    isComposing: false,
    preventDefault: () => (prevented = true),
    stopPropagation: () => (stopped = true),
    ...modifiers,
  } as KeyboardEvent;
  return { event, prevented: () => prevented, stopped: () => stopped };
}

test("emits the editable combobox/listbox relationship as standard attributes", () => {
  const combobox = createCombobox();

  assert.equal(combobox.inputProps.id, "fruit-combobox-input");
  assert.equal(combobox.inputProps.role, "combobox");
  assert.equal(combobox.inputProps["aria-autocomplete"], "list");
  assert.equal(combobox.inputProps["aria-controls"], "fruit-combobox");
  assert.equal(combobox.inputProps["aria-expanded"], "false");
  assert.equal(combobox.inputProps["aria-activedescendant"], undefined);
  assert.equal(combobox.listboxProps.id, "fruit-combobox");
  assert.equal(combobox.listboxProps.role, "listbox");

  const option = combobox.optionProps(fruits[0] as Fruit);
  assert.equal(option.id, "fruit-combobox-option-apple");
  assert.equal(option.role, "option");
  assert.equal(option["aria-selected"], "false");
  assert.equal(combobox.optionProps(fruits[1] as Fruit)["aria-disabled"], "true");
});

test("input filters and opens without automatically selecting a suggestion", async () => {
  const values: string[] = [];
  const combobox = createCombobox({ onInputValueChange: (value) => values.push(value) });

  combobox.inputProps.onInput(input("ap"));
  await nextTick();
  assert.equal(combobox.inputValue.value, "ap");
  assert.deepEqual(combobox.visibleItems.value.map((item) => item.key), ["apple"]);
  assert.equal(combobox.open.value, true);
  assert.equal(combobox.activeKey.value, null);
  assert.equal(combobox.inputProps["aria-expanded"], "true");
  assert.deepEqual(values, ["ap"]);
});

test("Arrow navigation stays on the input model, skips disabled options, and exposes active descendant", () => {
  const combobox = createCombobox();
  const down = keydown("ArrowDown");
  combobox.inputProps.onKeydown(down.event);

  assert.equal(down.prevented(), true);
  assert.equal(down.stopped(), true);
  assert.equal(combobox.activeKey.value, "apple");
  assert.equal(
    combobox.inputProps["aria-activedescendant"],
    "fruit-combobox-option-apple",
  );
  assert.equal(combobox.optionProps(fruits[0] as Fruit)["aria-selected"], "true");

  combobox.inputProps.onKeydown(keydown("ArrowDown").event);
  assert.equal(combobox.activeKey.value, "cherry");
  combobox.inputProps.onKeydown(keydown("ArrowUp").event);
  assert.equal(combobox.activeKey.value, "apple");
});

test("navigation is provisional; Enter commits and Escape preserves the previous selection", () => {
  const selections: (string | null)[] = [];
  const combobox = createCombobox({
    defaultSelected: "date",
    defaultInputValue: "",
    onSelectionChange: (key) => selections.push(key),
  });

  combobox.inputProps.onKeydown(keydown("ArrowDown").event);
  assert.equal(combobox.activeKey.value, "apple");
  assert.equal(combobox.selectedKey.value, "date");
  combobox.inputProps.onKeydown(keydown("Escape").event);
  assert.equal(combobox.open.value, false);
  assert.equal(combobox.selectedKey.value, "date");
  assert.equal(combobox.inputValue.value, "");

  combobox.inputProps.onKeydown(keydown("ArrowDown").event);
  combobox.inputProps.onKeydown(keydown("ArrowDown").event);
  combobox.inputProps.onKeydown(keydown("Enter").event);
  assert.equal(combobox.selectedKey.value, "cherry");
  assert.equal(combobox.inputValue.value, "Cherry");
  assert.equal(combobox.open.value, false);
  assert.deepEqual(selections, ["cherry"]);
});

test("filtering never prunes the committed selection", async () => {
  const combobox = createCombobox({
    defaultSelected: "cherry",
    defaultInputValue: "Cherry",
  });

  combobox.inputProps.onInput(input("app"));
  await nextTick();
  assert.deepEqual(combobox.visibleItems.value.map((item) => item.key), ["apple"]);
  assert.equal(combobox.selectedKey.value, "cherry");

  combobox.inputProps.onInput(input(""));
  await nextTick();
  assert.equal(combobox.selectedKey.value, "cherry");
});

test("click commits enabled options and pointerdown keeps DOM focus on the input", () => {
  const combobox = createCombobox();
  let pointerPrevented = false;
  const cherry = combobox.optionProps(fruits[2] as Fruit);
  cherry.onPointerdown({ preventDefault: () => (pointerPrevented = true) } as PointerEvent);
  cherry.onClick({ preventDefault() {} } as MouseEvent);

  assert.equal(pointerPrevented, true);
  assert.equal(combobox.selectedKey.value, "cherry");
  assert.equal(combobox.inputValue.value, "Cherry");

  let clickPrevented = false;
  combobox
    .optionProps(fruits[1] as Fruit)
    .onClick({ preventDefault: () => (clickPrevented = true) } as MouseEvent);
  assert.equal(clickPrevented, true);
  assert.equal(combobox.selectedKey.value, "cherry");
});

test("controlled refs remain sources of truth and external selection updates the input", async () => {
  const selected = ref<string | null>(null);
  const value = ref("");
  const combobox = createCombobox({ selected, inputValue: value });

  combobox.select(fruits[0] as Fruit);
  assert.equal(selected.value, "apple");
  assert.equal(value.value, "Apple");

  selected.value = "date";
  await nextTick();
  assert.equal(combobox.inputValue.value, "Date");

  combobox.clear();
  assert.equal(selected.value, null);
  assert.equal(value.value, "");
});

test("text-editing keys and IME composition remain browser-owned", () => {
  const combobox = createCombobox();
  for (const key of ["ArrowLeft", "ArrowRight", "Home", "End", "Backspace", "Delete"]) {
    const pressed = keydown(key);
    combobox.inputProps.onKeydown(pressed.event);
    assert.equal(pressed.prevented(), false, `${key} must not be prevented`);
  }

  const composing = keydown("ArrowDown", { isComposing: true });
  combobox.inputProps.onKeydown(composing.event);
  assert.equal(composing.prevented(), false);
  assert.equal(combobox.open.value, false);
});

test("visible item changes clear only an invalid active key", async () => {
  const items = ref<readonly Fruit[]>(fruits);
  const combobox = createCombobox({ items, defaultSelected: "date", defaultInputValue: "" });
  combobox.inputProps.onKeydown(keydown("ArrowUp").event);
  assert.equal(combobox.activeKey.value, "date");

  items.value = fruits.filter((fruit) => fruit.key !== "date");
  await nextTick();
  assert.equal(combobox.activeKey.value, null);
  assert.equal(combobox.selectedKey.value, "date");
});
