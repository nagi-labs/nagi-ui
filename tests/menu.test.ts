import assert from "node:assert/strict";
import test from "node:test";

import { ref } from "vue";

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
  matches: (selector: string) => boolean;
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
    matches(selector) {
      return selector === ":popover-open" && this.openState;
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

test("emits menu-button and active-descendant wiring", () => {
  const menu = createMenu();

  assert.equal(menu.id, "actions");
  assert.equal(menu.triggerProps.id, "actions-trigger");
  assert.equal(menu.triggerProps.popovertarget, "actions");
  assert.equal(menu.triggerProps["aria-controls"], "actions");
  assert.equal(menu.triggerProps["aria-haspopup"], "menu");
  assert.equal(menu.menuProps.id, "actions");
  assert.equal(menu.menuProps.role, "menu");
  assert.equal(menu.menuProps.tabindex, -1);
  assert.equal(menu.menuProps["aria-labelledby"], "actions-trigger");
  assert.equal(menu.menuProps["aria-activedescendant"], undefined);
});

test("itemProps supplies stable ids, state, and disabled semantics", () => {
  const menu = createMenu();

  menu.activeKey.value = "duplicate";
  assert.deepEqual(
    {
      id: menu.itemProps(actions[0]).id,
      role: menu.itemProps(actions[0]).role,
      tabindex: menu.itemProps(actions[0]).tabindex,
      active: menu.itemProps(actions[0])["data-active"],
    },
    {
      id: "actions-item-duplicate",
      role: "menuitem",
      tabindex: -1,
      active: "",
    },
  );
  assert.equal(menu.menuProps["aria-activedescendant"], "actions-item-duplicate");
  assert.equal(menu.itemProps(actions[1])["aria-disabled"], "true");
});

test("ArrowDown opens on the first enabled item and focuses the menu", async () => {
  const element = fakeMenu();
  const menu = createMenu();
  const down = keyboardEvent("ArrowDown");

  menu.triggerProps.onKeydown(down.event);
  assert.equal(down.prevented(), true);
  assert.equal(menu.open.value, true);
  assert.equal(menu.activeKey.value, "duplicate");

  menu.menuProps.onToggle(toggleEvent(element, "open"));
  await Promise.resolve();
  assert.deepEqual(element.calls, ["focus"]);
  assert.equal(menu.menuProps["aria-activedescendant"], "actions-item-duplicate");
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

test("typeahead moves active descendant and repeated keys cycle", (t) => {
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

test("Enter selects the active item, closes, and restores trigger focus", async (t) => {
  const selected: string[] = [];
  const element = fakeMenu();
  element.openState = true;
  const trigger = {
    focused: false,
    getAttribute: (name: string) => (name === "popovertarget" ? "actions" : null),
    focus() {
      this.focused = true;
    },
  };
  const original = Object.getOwnPropertyDescriptor(globalThis, "document");
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      getElementById: (id: string) => (id === "actions" ? element : trigger),
    },
  });
  t.after(() => {
    if (original) Object.defineProperty(globalThis, "document", original);
    else Reflect.deleteProperty(globalThis, "document");
  });

  const menu = createMenu({ onSelect: (item) => selected.push(item.key) });
  menu.menuProps.onToggle(toggleEvent(element, "open"));
  const enter = keyboardEvent("Enter");
  menu.menuProps.onKeydown(enter.event);
  await Promise.resolve();

  assert.equal(enter.prevented(), true);
  assert.deepEqual(selected, ["duplicate"]);
  assert.equal(menu.open.value, false);
  assert.deepEqual(element.calls, ["hide"]);
  assert.equal(trigger.focused, true);
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

test("reactive item removal repairs an invalid active key", async () => {
  const items = ref<readonly Action[]>(actions);
  const menu = createMenu({ items });
  menu.activeKey.value = "rename";

  items.value = actions.slice(0, 2);
  await Promise.resolve();
  assert.equal(menu.activeKey.value, "duplicate");
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
  assert.equal(menu.menuProps["aria-activedescendant"], "falsy-item-");
  menu.menuProps.onKeydown(keyboardEvent("Enter").event);
  assert.deepEqual(selected, [0]);
});
