import assert from "node:assert/strict";
import test from "node:test";

import { nextTick, ref } from "vue";

import { useMenu } from "@nagi-labs/nagi-ui";

interface Action {
  key: string;
  label: string;
  disabled?: boolean;
}

interface FakeMenu {
  isConnected: boolean;
  openState: boolean;
  calls: string[];
  items: HTMLElement[];
  matches: (selector: string) => boolean;
  querySelectorAll: <ElementType extends Element = Element>(selector: string) => ElementType[];
  showPopover: () => void;
  hidePopover: () => void;
  focus: () => void;
}

const actions: readonly Action[] = [
  { key: "duplicate", label: "Duplicate" },
  { key: "archive", label: "Archive", disabled: true },
  { key: "rename", label: "Rename" },
];

function createMenu(overrides: Partial<Parameters<typeof useMenu<Action>>[0]> = {}) {
  return useMenu<Action>({
    items: actions,
    getKey: (item) => item.key,
    getTextValue: (item) => item.label,
    isDisabled: (item) => item.disabled ?? false,
    id: "actions",
    ...overrides,
  });
}

function fakeMenu(): FakeMenu {
  return {
    isConnected: true,
    openState: false,
    calls: [],
    items: [],
    matches(selector) {
      return selector === ":popover-open" && this.openState;
    },
    querySelectorAll() {
      return this.items;
    },
    showPopover() {
      this.openState = true;
      this.calls.push("show");
    },
    hidePopover() {
      this.openState = false;
      this.calls.push("hide");
    },
    focus() {
      this.calls.push("focus");
    },
  };
}

function toggleEvent(target: FakeMenu, newState: "open" | "closed") {
  target.openState = newState === "open";
  return { target, newState } as unknown as ToggleEvent;
}

function keyboardEvent(key: string) {
  let prevented = false;
  const event = {
    type: "keydown",
    key,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    preventDefault() {
      prevented = true;
    },
    stopPropagation() {},
  } as unknown as KeyboardEvent;
  return { event, prevented: () => prevented };
}

test("[MNU-MENU-SEM-01] emits menu-button wiring with the container as an empty-menu focus fallback", () => {
  const menu = createMenu();

  assert.equal(menu.id, "actions");
  assert.equal(menu.triggerProps.id, "actions-trigger");
  assert.equal(menu.triggerProps.popovertarget, "actions");
  assert.equal(menu.triggerProps["aria-controls"], "actions");
  assert.equal(menu.triggerProps["aria-haspopup"], "menu");
  assert.equal(menu.triggerProps["aria-expanded"], "false");
  assert.equal(menu.menuProps.id, "actions");
  assert.equal(menu.menuProps.role, "menu");
  assert.equal(menu.menuProps.tabindex, -1);
  assert.equal(menu.menuProps["aria-labelledby"], "actions-trigger");
  assert.equal("aria-activedescendant" in menu.menuProps, false);
});

test("itemProps supplies stable ids, managed-focus wiring, and disabled semantics", () => {
  const menu = createMenu();

  menu.itemProps(actions[0]).onFocus();
  assert.deepEqual(
    {
      id: menu.itemProps(actions[0]).id,
      role: menu.itemProps(actions[0]).role,
      tabindex: menu.itemProps(actions[0]).tabindex,
    },
    {
      id: "actions-item-duplicate",
      role: "menuitem",
      tabindex: -1,
    },
  );
  assert.equal(menu.activeKey.value, "duplicate");
  assert.equal("data-active" in menu.itemProps(actions[0]), false);
  assert.equal(menu.itemProps(actions[1])["aria-disabled"], "true");
});

test("[MNU-MENU-SEM-01][MNU-POP-STATE-01] ArrowDown opens on and focuses the first enabled native item", async () => {
  const element = fakeMenu();
  const focused: string[] = [];
  element.items.push({
    id: "actions-item-duplicate",
    focus() { focused.push(this.id); },
  } as unknown as HTMLElement);
  const menu = createMenu();
  const down = keyboardEvent("ArrowDown");

  menu.triggerProps.onKeydown(down.event);
  assert.equal(down.prevented(), true);
  assert.equal(menu.open.value, true);
  assert.equal(menu.triggerProps["aria-expanded"], "true");
  assert.equal(menu.activeKey.value, "duplicate");

  menu.menuProps.onToggle(toggleEvent(element, "open"));
  await nextTick();
  assert.deepEqual(focused, ["actions-item-duplicate"]);
  assert.deepEqual(element.calls, []);
});

test("ArrowUp opens on the last enabled item", () => {
  const menu = createMenu();
  const up = keyboardEvent("ArrowUp");

  menu.triggerProps.onKeydown(up.event);
  assert.equal(up.prevented(), true);
  assert.equal(menu.activeKey.value, "rename");
});

test("keyboard navigation wraps and skips disabled items", () => {
  const element = fakeMenu();
  const menu = createMenu();
  menu.menuProps.onToggle(toggleEvent(element, "open"));

  menu.menuProps.onKeydown(keyboardEvent("ArrowDown").event);
  assert.equal(menu.activeKey.value, "rename");
  menu.menuProps.onKeydown(keyboardEvent("ArrowDown").event);
  assert.equal(menu.activeKey.value, "duplicate");
  menu.menuProps.onKeydown(keyboardEvent("End").event);
  assert.equal(menu.activeKey.value, "rename");
  menu.menuProps.onKeydown(keyboardEvent("Home").event);
  assert.equal(menu.activeKey.value, "duplicate");
});

test("typeahead moves managed item focus and repeated keys cycle", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const items = [
    { key: "add", label: "Add" },
    { key: "archive", label: "Archive" },
    { key: "duplicate", label: "Duplicate" },
  ];
  const menu = createMenu({ items });
  const element = fakeMenu();
  menu.menuProps.onToggle(toggleEvent(element, "open"));

  menu.menuProps.onKeydown(keyboardEvent("a").event);
  assert.equal(menu.activeKey.value, "archive");
  menu.menuProps.onKeydown(keyboardEvent("a").event);
  assert.equal(menu.activeKey.value, "add");
  t.mock.timers.tick(500);
  menu.menuProps.onKeydown(keyboardEvent("d").event);
  assert.equal(menu.activeKey.value, "duplicate");
});

test("Enter selects the active item, closes, and restores trigger focus", async () => {
  const selected: string[] = [];
  const element = fakeMenu();
  element.openState = true;
  const trigger = {
    isConnected: true,
    focused: false,
    focus() {
      this.focused = true;
    },
  };

  const menu = createMenu({ onSelect: (item) => selected.push(item.key) });
  menu.triggerProps.ref(trigger as unknown as HTMLElement);
  menu.menuProps.onToggle(toggleEvent(element, "open"));
  const enter = keyboardEvent("Enter");
  menu.menuProps.onKeydown(enter.event);
  await nextTick();
  await nextTick();

  assert.equal(enter.prevented(), true);
  assert.deepEqual(selected, ["duplicate"]);
  assert.equal(menu.open.value, false);
  assert.deepEqual(element.calls, ["hide"]);
  assert.equal(trigger.focused, true);
});

test("container fallback dispatches one plain anchor click for native menu links", async () => {
  const selected: string[] = [];
  const menu = createMenu({ onSelect: (item) => selected.push(item.key) });
  const element = fakeMenu();
  element.openState = true;
  let clicks = 0;
  let linkProps: ReturnType<typeof menu.itemProps>;
  const anchor = {
    id: "actions-item-duplicate",
    click() {
      clicks += 1;
      linkProps.onClick({ type: "click" } as unknown as MouseEvent);
    },
  };
  element.items.push(anchor as unknown as HTMLElement);
  linkProps = menu.itemProps(actions[0], { nativeLink: true });
  menu.menuProps.onToggle(toggleEvent(element, "open"));
  menu.menuProps.onKeydown(keyboardEvent("Enter").event);
  await nextTick();
  assert.equal(clicks, 1);
  assert.deepEqual(selected, ["duplicate"]);
  assert.equal(menu.open.value, false);
});

test("disabled item click is ignored", () => {
  const selected: string[] = [];
  const menu = createMenu({ onSelect: (item) => selected.push(item.key) });
  let prevented = false;
  let stopped = false;

  menu.itemProps(actions[1]).onClick({
    preventDefault: () => {
      prevented = true;
    },
    stopPropagation: () => {
      stopped = true;
    },
  } as unknown as MouseEvent);

  assert.deepEqual(selected, []);
  assert.equal(prevented, true);
  assert.equal(stopped, true);
});

test("pointer movement updates the active item", () => {
  const menu = createMenu();

  menu.itemProps(actions[2]).onPointermove();
  assert.equal(menu.activeKey.value, "rename");
  menu.itemProps(actions[1]).onPointermove();
  assert.equal(menu.activeKey.value, "rename");
});

test("reactive item removal repairs the active key and owned DOM focus", async () => {
  const items = ref<readonly Action[]>(actions);
  const menu = createMenu({ items });
  const focused: string[] = [];
  const activeElement = {} as Element;
  const element = fakeMenu();
  element.openState = true;
  Object.assign(element, {
    contains: (candidate: Element) => candidate === activeElement,
    ownerDocument: {
      activeElement,
    },
  });
  element.items.push({
    id: "actions-item-duplicate",
    focus() { focused.push(this.id); },
  } as unknown as HTMLElement);
  menu.menuProps.onToggle(toggleEvent(element, "open"));
  menu.activeKey.value = "rename";

  items.value = actions.slice(0, 2);
  await nextTick();
  await nextTick();
  assert.equal(menu.activeKey.value, "duplicate");
  assert.equal(focused.at(-1), "actions-item-duplicate");
});

test("reactive disabled state repairs an invalid active key", async () => {
  const items = ref<readonly Action[]>(actions);
  const menu = createMenu({ items });
  menu.activeKey.value = "rename";

  items.value = actions.map((item) =>
    item.key === "rename" ? { ...item, disabled: true } : item,
  );
  await Promise.resolve();
  assert.equal(menu.activeKey.value, "duplicate");
});

test("an open empty fallback promotes focus when an enabled item appears", async () => {
  const items = ref<readonly Action[]>([]);
  const menu = createMenu({ items });
  const focused: string[] = [];
  const element = fakeMenu();
  element.openState = true;
  Object.assign(element, {
    ownerDocument: {
      activeElement: element,
    },
  });
  menu.menuProps.onToggle(toggleEvent(element, "open"));
  await nextTick();
  assert.equal(menu.activeKey.value, null);
  assert.equal(element.calls.includes("focus"), true);

  element.items.push({
    id: "actions-item-available",
    focus() { focused.push(this.id); },
  } as unknown as HTMLElement);
  items.value = [{ key: "available", label: "Available" }];
  await nextTick();
  await nextTick();
  assert.equal(menu.activeKey.value, "available");
  assert.equal(focused.at(-1), "actions-item-available");
});

test("supports falsy item values and empty string keys", () => {
  const selected: number[] = [];
  const menu = useMenu<number, "">({
    items: [0],
    getKey: () => "",
    getTextValue: String,
    onSelect: (item) => selected.push(item),
    id: "falsy",
  });

  menu.focusFirst();
  assert.equal(menu.activeKey.value, "");
  assert.equal(menu.itemProps(0).id, "falsy-item-");
  menu.menuProps.onKeydown(keyboardEvent("Enter").event);
  assert.deepEqual(selected, [0]);
});
