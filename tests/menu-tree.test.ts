import assert from "node:assert/strict";
import test from "node:test";

import { computed, nextTick, ref } from "vue";

import { useMenu, useSubmenu } from "@nagi-labs/nagi-ui";

interface Item {
  key: string;
  label: string;
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

const rootItems: readonly Item[] = [
  { key: "toolbar", label: "Show toolbar" },
  { key: "name", label: "Sort by name" },
  { key: "share", label: "Share" },
];
const shareItems: readonly Item[] = [
  { key: "copy", label: "Copy link" },
  { key: "email", label: "Email" },
];

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
  let stopped = false;
  const event = {
    key,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    preventDefault() {
      prevented = true;
    },
    stopPropagation() {
      stopped = true;
    },
  } as unknown as KeyboardEvent;
  return { event, prevented: () => prevented, stopped: () => stopped };
}

function createTree(dir: "ltr" | "rtl" = "ltr") {
  const root = useMenu<Item>({
    items: rootItems,
    getKey: (item) => item.key,
    getTextValue: (item) => item.label,
    id: `root-${dir}`,
    dir,
  });
  const submenu = useSubmenu(root, rootItems[2], {
    items: shareItems,
    getKey: (item) => item.key,
    getTextValue: (item) => item.label,
    id: `share-${dir}`,
    submenuOpenDelay: 120,
    submenuCloseDelay: 300,
  });
  return { root, submenu };
}

test("checkbox and radio variants expose state and stay open by default", () => {
  const toolbar = ref(false);
  const sort = ref<"name" | "modified">("modified");
  const menu = useMenu<Item>({
    items: rootItems,
    getKey: (item) => item.key,
    getTextValue: (item) => item.label,
    id: "choices",
    defaultOpen: true,
  });

  const checkbox = menu.checkboxItemProps(rootItems[0], {
    checked: toolbar,
    onCheckedChange: (checked) => (toolbar.value = checked),
  });
  assert.equal(checkbox.role, "menuitemcheckbox");
  assert.equal(checkbox["aria-checked"], "false");
  menu.activeKey.value = "toolbar";
  menu.menuProps.onKeydown(keyboardEvent("Enter").event);
  assert.equal(toolbar.value, true);
  assert.equal(menu.open.value, true);

  const radio = menu.radioItemProps(rootItems[1], {
    checked: () => sort.value === "name",
    onSelect: () => (sort.value = "name"),
  });
  assert.equal(radio.role, "menuitemradio");
  assert.equal(radio["aria-checked"], "false");
  menu.activeKey.value = "name";
  menu.menuProps.onKeydown(keyboardEvent(" ").event);
  assert.equal(sort.value, "name");
  assert.equal(menu.open.value, true);
});

test("activating an indeterminate checkbox resolves it to checked", () => {
  const checked = ref<boolean | "mixed">("mixed");
  const menu = useMenu<Item>({
    items: rootItems,
    getKey: (item) => item.key,
    getTextValue: (item) => item.label,
    id: "mixed-choice",
  });
  const props = menu.checkboxItemProps(rootItems[0], {
    checked,
    onCheckedChange: (next) => (checked.value = next),
  });

  assert.equal(props["aria-checked"], "mixed");
  props.onClick({} as MouseEvent);
  assert.equal(checked.value, true);
});

test("item variants can override their default close policy", () => {
  const selected: string[] = [];
  const menu = useMenu<Item>({
    items: rootItems,
    getKey: (item) => item.key,
    getTextValue: (item) => item.label,
    id: "close-policy",
    defaultOpen: true,
  });

  menu.itemProps(rootItems[0], {
    closeOnSelect: false,
    onSelect: (item) => selected.push(item.key),
  }).onClick({} as MouseEvent);
  assert.deepEqual(selected, ["toolbar"]);
  assert.equal(menu.open.value, true);

  menu.checkboxItemProps(rootItems[1], {
    checked: false,
    onCheckedChange() {},
    closeOnSelect: true,
  }).onClick({} as MouseEvent);
  assert.equal(menu.open.value, false);
});

test("submenu trigger exposes the linked menu relationship", () => {
  const { root, submenu } = createTree();
  const trigger = root.submenuTriggerProps(rootItems[2], submenu);

  assert.equal(trigger.id, "root-ltr-item-share");
  assert.equal(trigger.popovertarget, "share-ltr");
  assert.equal(trigger["aria-controls"], "share-ltr");
  assert.equal(trigger["aria-haspopup"], "menu");
  assert.equal(trigger["aria-expanded"], "false");
  assert.equal(submenu.menuProps["aria-labelledby"], "root-ltr-item-share");
  assert.equal(submenu.direction, "ltr");
});

test("logical arrow keys move focus into and out of an LTR submenu", async () => {
  const { root, submenu } = createTree();
  const rootElement = fakeMenu();
  const childElement = fakeMenu();
  root.submenuTriggerProps(rootItems[2], submenu);

  root.menuProps.onToggle(toggleEvent(rootElement, "open"));
  root.activeKey.value = "share";
  const open = keyboardEvent("ArrowRight");
  root.menuProps.onKeydown(open.event);
  assert.equal(open.prevented(), true);
  assert.equal(open.stopped(), true);
  assert.equal(submenu.open.value, true);
  assert.equal(submenu.activeKey.value, "copy");

  submenu.menuProps.onToggle(toggleEvent(childElement, "open"));
  await Promise.resolve();
  assert.equal(childElement.calls.includes("focus"), true);

  const close = keyboardEvent("ArrowLeft");
  submenu.menuProps.onKeydown(close.event);
  await Promise.resolve();
  assert.equal(close.stopped(), true);
  assert.equal(submenu.open.value, false);
  assert.equal(root.activeKey.value, "share");
  assert.equal(rootElement.calls.includes("focus"), true);
});

test("a rejected controlled child close keeps focus in the visible child", async () => {
  const writes: boolean[] = [];
  const childSource = ref(true);
  const childOpen = computed({
    get: () => childSource.value,
    set: (next) => writes.push(next),
  });
  const root = useMenu<Item>({
    items: rootItems,
    getKey: (item) => item.key,
    getTextValue: (item) => item.label,
    id: "controlled-child-root",
    defaultOpen: true,
  });
  const submenu = useSubmenu(root, rootItems[2], {
    items: shareItems,
    getKey: (item) => item.key,
    getTextValue: (item) => item.label,
    id: "controlled-child",
    open: childOpen,
  });
  root.submenuTriggerProps(rootItems[2], submenu);
  const parentElement = fakeMenu();
  parentElement.openState = true;
  const childElement = fakeMenu();
  childElement.openState = true;
  const focused: string[] = [];
  parentElement.items.push({
    id: "controlled-child-root-item-share",
    focus() { focused.push(`parent:${this.id}`); },
  } as unknown as HTMLElement);
  childElement.items.push({
    id: "controlled-child-item-copy",
    focus() { focused.push(`child:${this.id}`); },
  } as unknown as HTMLElement);
  root.menuProps.onToggle(toggleEvent(parentElement, "open"));
  submenu.menuProps.onToggle(toggleEvent(childElement, "open"));
  submenu.itemProps(shareItems[0]).onFocus();
  await nextTick();
  writes.length = 0;
  focused.length = 0;

  const escape = keyboardEvent("Escape");
  submenu.menuProps.onKeydown(escape.event);
  await nextTick();
  await nextTick();
  await nextTick();
  assert.deepEqual(writes, [false]);
  assert.equal(childSource.value, true);
  assert.equal(submenu.activeKey.value, "copy");
  assert.equal(focused.at(-1), "child:controlled-child-item-copy");
  assert.equal(focused.some((entry) => entry.startsWith("parent:")), false);
});

test("RTL reverses submenu open and close arrow keys", () => {
  const { root, submenu } = createTree("rtl");
  root.submenuTriggerProps(rootItems[2], submenu);
  root.activeKey.value = "share";

  root.menuProps.onKeydown(keyboardEvent("ArrowLeft").event);
  assert.equal(submenu.open.value, true);
  assert.equal(submenu.direction, "rtl");

  submenu.menuProps.onKeydown(keyboardEvent("ArrowRight").event);
  assert.equal(submenu.open.value, false);
});

test("logical anchor areas inherit the menu direction", () => {
  const root = useMenu<Item>({
    items: rootItems,
    getKey: (item) => item.key,
    getTextValue: (item) => item.label,
    id: "rtl-anchor-root",
    dir: "rtl",
    anchor: { area: "inline-end", supportsAnchor: true },
  });
  const submenu = useSubmenu(root, rootItems[2], {
    items: shareItems,
    getKey: (item) => item.key,
    getTextValue: (item) => item.label,
    id: "rtl-anchor-child",
  });

  assert.equal(
    (root.menuProps.style as Record<string, unknown> | undefined)?.["position-area"],
    "left",
  );
  assert.equal(
    (submenu.menuProps.style as Record<string, unknown> | undefined)?.["position-area"],
    "left",
  );
});

test("an action in a submenu closes the whole tree", () => {
  const selected: string[] = [];
  const root = useMenu<Item>({
    items: rootItems,
    getKey: (item) => item.key,
    getTextValue: (item) => item.label,
    id: "action-root",
    defaultOpen: true,
  });
  const submenu = useSubmenu(root, rootItems[2], {
    items: shareItems,
    getKey: (item) => item.key,
    getTextValue: (item) => item.label,
    onSelect: (item) => selected.push(item.key),
    id: "action-child",
    defaultOpen: true,
  });
  root.submenuTriggerProps(rootItems[2], submenu);
  submenu.itemProps(shareItems[0]);
  submenu.activeKey.value = "copy";

  submenu.menuProps.onKeydown(keyboardEvent("Enter").event);
  assert.deepEqual(selected, ["copy"]);
  assert.equal(submenu.open.value, false);
  assert.equal(root.open.value, false);
});

test("pointer grace keeps a submenu open while crossing into it", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const { root, submenu } = createTree();
  const trigger = root.submenuTriggerProps(rootItems[2], submenu);

  trigger.onPointermove({ pointerType: "mouse" } as PointerEvent);
  t.mock.timers.tick(119);
  assert.equal(submenu.open.value, false);
  t.mock.timers.tick(1);
  assert.equal(submenu.open.value, true);

  trigger.onPointerleave({ pointerType: "mouse" } as PointerEvent);
  submenu.menuProps.onPointerenter();
  t.mock.timers.tick(300);
  assert.equal(submenu.open.value, true);

  submenu.menuProps.onPointerleave({ pointerType: "mouse" } as PointerEvent);
  t.mock.timers.tick(300);
  assert.equal(submenu.open.value, false);
});
