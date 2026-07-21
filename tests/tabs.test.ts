import assert from "node:assert/strict";
import test from "node:test";

import { customRef, nextTick, ref } from "vue";

import { useTabs } from "@nagi-labs/nagi-ui";

interface TabItem {
  key: string;
  label: string;
  disabled?: boolean;
}

const tabs: readonly TabItem[] = [
  { key: "overview", label: "Overview" },
  { key: "billing", label: "Billing", disabled: true },
  { key: "security", label: "Security" },
  { key: "activity", label: "Activity" },
];

function createTabs(overrides: Partial<Parameters<typeof useTabs<TabItem>>[0]> = {}) {
  return useTabs<TabItem>({
    items: tabs,
    getKey: (item) => item.key,
    isDisabled: (item) => item.disabled ?? false,
    label: "Account sections",
    id: "account-tabs",
    ...overrides,
  });
}

function keydown(
  key: string,
  calls: string[] = [],
  modifiers: Partial<Pick<KeyboardEvent, "shiftKey" | "ctrlKey" | "metaKey" | "altKey">> = {},
): KeyboardEvent {
  return {
    key,
    shiftKey: false,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    preventDefault: () => calls.push("preventDefault"),
    stopPropagation: () => calls.push("stopPropagation"),
    ...modifiers,
  } as KeyboardEvent;
}

interface FakeTabList {
  id: string;
  members: Set<unknown>;
  contains: (node: unknown) => boolean;
}

interface FakeDocument {
  activeElement: FakeTabElement | null;
  getElementById: (id: string) => FakeTabElement | null;
}

interface FakeTabElement {
  id: string;
  ownerDocument: FakeDocument;
  focusCalls: number;
  focus: (options?: FocusOptions) => void;
  closest: (selector: string) => FakeTabList | null;
}

function fakeTabDom(id: string, keys: readonly string[]) {
  const elements = new Map<string, FakeTabElement>();
  const list: FakeTabList = {
    id,
    members: new Set(),
    contains(node) {
      return this.members.has(node);
    },
  };
  const document: FakeDocument = {
    activeElement: null,
    getElementById: (elementId) => elements.get(elementId) ?? null,
  };

  for (const key of keys) {
    const elementId = `${id}-tab-${encodeURIComponent(key)}`;
    const element: FakeTabElement = {
      id: elementId,
      ownerDocument: document,
      focusCalls: 0,
      focus() {
        this.focusCalls += 1;
        document.activeElement = this;
      },
      closest(selector) {
        return selector === '[role="tablist"]' ? list : null;
      },
    };
    elements.set(elementId, element);
    list.members.add(element);
  }

  return { document, elements, list };
}

function focusEvent(element: FakeTabElement): FocusEvent {
  element.focus();
  return { currentTarget: element } as unknown as FocusEvent;
}

function keyEvent(element: FakeTabElement, key: string, calls: string[] = []): KeyboardEvent {
  return Object.assign(keydown(key, calls), { currentTarget: element });
}

test("emits tablist, tab, and panel ARIA with encoded stable id references", () => {
  const items: readonly TabItem[] = [
    { key: "profile/settings x", label: "Profile" },
    { key: "disabled", label: "Disabled", disabled: true },
  ];
  const result = createTabs({ items, defaultSelected: "profile/settings x" });

  assert.deepEqual(
    {
      id: result.tablistProps.id,
      role: result.tablistProps.role,
      dir: result.tablistProps.dir,
      label: result.tablistProps["aria-label"],
      labelledBy: result.tablistProps["aria-labelledby"],
      orientation: result.tablistProps["aria-orientation"],
    },
    {
      id: "account-tabs",
      role: "tablist",
      dir: "ltr",
      label: "Account sections",
      labelledBy: undefined,
      orientation: undefined,
    },
  );

  const tab = result.tabProps(items[0] as TabItem);
  assert.deepEqual(
    {
      id: tab.id,
      type: tab.type,
      role: tab.role,
      disabled: tab.disabled,
      tabindex: tab.tabindex,
      selected: tab["aria-selected"],
      controls: tab["aria-controls"],
    },
    {
      id: "account-tabs-tab-profile%2Fsettings%20x",
      type: "button",
      role: "tab",
      disabled: false,
      tabindex: 0,
      selected: "true",
      controls: "account-tabs-panel-profile%2Fsettings%20x",
    },
  );

  const panel = result.panelProps(items[0] as TabItem);
  assert.deepEqual(panel, {
    id: "account-tabs-panel-profile%2Fsettings%20x",
    role: "tabpanel",
    tabindex: 0,
    hidden: false,
    "aria-labelledby": "account-tabs-tab-profile%2Fsettings%20x",
  });

  const disabled = result.tabProps(items[1] as TabItem);
  assert.equal(disabled.disabled, true);
  assert.equal(disabled.tabindex, -1);
  assert.equal(disabled["aria-selected"], "false");
  assert.equal(result.panelProps(items[1] as TabItem).hidden, true);
});

test("manual activation moves roving focus without selecting until Space or Enter", () => {
  const changes: (string | null)[] = [];
  const result = createTabs({ onSelectionChange: (key) => changes.push(key) });

  assert.equal(result.selectedKey.value, "overview");
  result.tabProps(tabs[0] as TabItem).onKeydown(keydown("ArrowRight"));
  assert.equal(result.focusedKey.value, "security");
  assert.equal(result.selectedKey.value, "overview");
  assert.equal(result.tabProps(tabs[2] as TabItem).tabindex, 0);
  assert.equal(result.tabProps(tabs[0] as TabItem).tabindex, -1);

  result.tabProps(tabs[2] as TabItem).onKeydown(keydown(" "));
  assert.equal(result.selectedKey.value, "security");
  result.tabProps(tabs[2] as TabItem).onKeydown(keydown("ArrowRight"));
  result.tabProps(tabs[3] as TabItem).onKeydown(keydown("Enter"));
  assert.equal(result.selectedKey.value, "activity");
  assert.deepEqual(changes, ["security", "activity"]);
});

test("automatic activation selects both keyboard and directly focused tabs", () => {
  const result = createTabs({ activationMode: "automatic" });
  const dom = fakeTabDom(result.id, tabs.map((item) => item.key));
  const overview = dom.elements.get("account-tabs-tab-overview") as FakeTabElement;
  const security = dom.elements.get("account-tabs-tab-security") as FakeTabElement;

  result.tabProps(tabs[0] as TabItem).onKeydown(keyEvent(overview, "ArrowRight"));
  assert.equal(result.focusedKey.value, "security");
  assert.equal(result.selectedKey.value, "security");
  assert.equal(dom.document.activeElement, security);

  result.tabProps(tabs[3] as TabItem).onFocus(focusEvent(
    dom.elements.get("account-tabs-tab-activity") as FakeTabElement,
  ));
  assert.equal(result.focusedKey.value, "activity");
  assert.equal(result.selectedKey.value, "activity");
});

test("horizontal arrows follow LTR and RTL reading direction", () => {
  const ltr = createTabs();
  ltr.tabProps(tabs[0] as TabItem).onKeydown(keydown("ArrowRight"));
  assert.equal(ltr.focusedKey.value, "security");
  ltr.tabProps(tabs[2] as TabItem).onKeydown(keydown("ArrowLeft"));
  assert.equal(ltr.focusedKey.value, "overview");

  const rtl = createTabs({ dir: "rtl" });
  rtl.tabProps(tabs[0] as TabItem).onKeydown(keydown("ArrowLeft"));
  assert.equal(rtl.focusedKey.value, "security");
  rtl.tabProps(tabs[2] as TabItem).onKeydown(keydown("ArrowRight"));
  assert.equal(rtl.focusedKey.value, "overview");
  assert.equal(rtl.tablistProps.dir, "rtl");
});

test("orientation handles only its own axis and vertical emits its explicit ARIA value", () => {
  const horizontal = createTabs();
  const horizontalCalls: string[] = [];
  horizontal.tabProps(tabs[0] as TabItem).onKeydown(keydown("ArrowDown", horizontalCalls));
  assert.equal(horizontal.focusedKey.value, "overview");
  assert.deepEqual(horizontalCalls, []);

  const vertical = createTabs({ orientation: "vertical" });
  const verticalCalls: string[] = [];
  vertical.tabProps(tabs[0] as TabItem).onKeydown(keydown("ArrowRight", verticalCalls));
  assert.equal(vertical.focusedKey.value, "overview");
  assert.deepEqual(verticalCalls, []);

  vertical.tabProps(tabs[0] as TabItem).onKeydown(keydown("ArrowDown", verticalCalls));
  assert.equal(vertical.focusedKey.value, "security");
  assert.deepEqual(verticalCalls, ["preventDefault", "stopPropagation"]);
  assert.equal(vertical.tablistProps["aria-orientation"], "vertical");
});

test("disabled tabs are skipped and loop=false clamps focus at both ends", () => {
  const result = createTabs({ loop: false });
  const calls: string[] = [];

  result.tabProps(tabs[0] as TabItem).onKeydown(keydown("ArrowRight", calls));
  assert.equal(result.focusedKey.value, "security");
  result.tabProps(tabs[2] as TabItem).onKeydown(keydown("End", calls));
  assert.equal(result.focusedKey.value, "activity");
  result.tabProps(tabs[3] as TabItem).onKeydown(keydown("ArrowRight", calls));
  assert.equal(result.focusedKey.value, "activity");
  result.tabProps(tabs[3] as TabItem).onKeydown(keydown("Home", calls));
  assert.equal(result.focusedKey.value, "overview");
  result.tabProps(tabs[0] as TabItem).onKeydown(keydown("ArrowLeft", calls));
  assert.equal(result.focusedKey.value, "overview");

  let prevented = false;
  result.tabProps(tabs[1] as TabItem).onClick({
    preventDefault: () => { prevented = true; },
  } as unknown as MouseEvent);
  assert.equal(prevented, true);
  assert.equal(result.selectedKey.value, "overview");
});

test("modified arrow keys remain available to the browser", () => {
  const result = createTabs();
  const calls: string[] = [];

  result.tabProps(tabs[0] as TabItem).onKeydown(
    keydown("ArrowRight", calls, { ctrlKey: true }),
  );
  assert.equal(result.focusedKey.value, "overview");
  assert.deepEqual(calls, []);
});

test("controlled selection is canonicalized and remains the source of truth", () => {
  const selected = ref<string | null>("missing");
  const changes: (string | null)[] = [];
  const result = createTabs({
    selected,
    onSelectionChange: (key) => changes.push(key),
  });

  assert.equal(result.selectedKey, selected);
  assert.equal(selected.value, "overview");
  assert.deepEqual(changes, ["overview"]);

  selected.value = "billing";
  assert.equal(selected.value, "security");
  assert.equal(result.focusedKey.value, "security");

  selected.value = null;
  assert.equal(selected.value, "overview");
  assert.equal(result.focusedKey.value, "overview");
  assert.deepEqual(changes, ["overview", "security", "overview"]);
});

test("external selection does not steal manual roving focus while the tablist has focus", () => {
  const selected = ref<string | null>("overview");
  const result = createTabs({ selected });
  const dom = fakeTabDom(result.id, tabs.map((item) => item.key));
  const security = dom.elements.get("account-tabs-tab-security") as FakeTabElement;

  result.tabProps(tabs[2] as TabItem).onFocus(focusEvent(security));
  assert.equal(result.focusedKey.value, "security");
  selected.value = "activity";
  assert.equal(result.selectedKey.value, "activity");
  assert.equal(result.focusedKey.value, "security");

  dom.document.activeElement = null;
  selected.value = "overview";
  assert.equal(result.focusedKey.value, "overview");
});

test("removing or disabling the active selection repairs model and DOM focus", async () => {
  const items = ref<readonly TabItem[]>([
    { key: "a", label: "A" },
    { key: "b", label: "B" },
    { key: "c", label: "C" },
  ]);
  const changes: (string | null)[] = [];
  const result = createTabs({
    id: "dynamic-tabs",
    items,
    defaultSelected: "b",
    onSelectionChange: (key) => changes.push(key),
  });
  const dom = fakeTabDom(result.id, ["a", "b", "c"]);
  const b = dom.elements.get("dynamic-tabs-tab-b") as FakeTabElement;
  const c = dom.elements.get("dynamic-tabs-tab-c") as FakeTabElement;
  const a = dom.elements.get("dynamic-tabs-tab-a") as FakeTabElement;

  result.tabProps(items.value[1] as TabItem).onFocus(focusEvent(b));
  items.value = [items.value[0] as TabItem, items.value[2] as TabItem];
  assert.equal(result.selectedKey.value, "c");
  assert.equal(result.focusedKey.value, "c");
  await nextTick();
  assert.equal(dom.document.activeElement, c);

  items.value = [
    items.value[0] as TabItem,
    { ...(items.value[1] as TabItem), disabled: true },
  ];
  assert.equal(result.selectedKey.value, "a");
  assert.equal(result.focusedKey.value, "a");
  await nextTick();
  assert.equal(dom.document.activeElement, a);
  assert.deepEqual(changes, ["c", "a"]);

  items.value = items.value.map((item) => ({ ...item, disabled: true }));
  assert.equal(result.selectedKey.value, null);
  assert.equal(result.focusedKey.value, null);
});

test("focus repair uses the calculated fallback while a model proxy still exposes its old prop", async () => {
  const items = ref<readonly TabItem[]>([
    { key: "a", label: "A" },
    { key: "b", label: "B" },
    { key: "c", label: "C" },
  ]);
  let emitted: string | null = "b";
  const selected = customRef<string | null>((track) => ({
    get() {
      track();
      return "b";
    },
    set(next) {
      emitted = next;
    },
  }));
  const result = createTabs({ id: "proxy-tabs", items, selected });
  const dom = fakeTabDom(result.id, ["a", "b", "c"]);
  const b = dom.elements.get("proxy-tabs-tab-b") as FakeTabElement;
  const c = dom.elements.get("proxy-tabs-tab-c") as FakeTabElement;

  result.tabProps(items.value[1] as TabItem).onFocus(focusEvent(b));
  items.value = [items.value[0] as TabItem, items.value[2] as TabItem];
  await nextTick();

  assert.equal(emitted, "c");
  assert.equal(result.focusedKey.value, "c");
  assert.equal(dom.document.activeElement, c);
});

test("focusout keeps in-list focus and resets roving target after leaving", () => {
  const result = createTabs();
  const dom = fakeTabDom(result.id, tabs.map((item) => item.key));
  const overview = dom.elements.get("account-tabs-tab-overview") as FakeTabElement;
  const security = dom.elements.get("account-tabs-tab-security") as FakeTabElement;

  result.tabProps(tabs[2] as TabItem).onFocus(focusEvent(security));
  assert.equal(result.focusedKey.value, "security");
  result.tablistProps.onFocusout({
    currentTarget: dom.list,
    relatedTarget: overview,
  } as unknown as FocusEvent);
  assert.equal(result.focusedKey.value, "security");

  result.tablistProps.onFocusout({
    currentTarget: dom.list,
    relatedTarget: {},
  } as unknown as FocusEvent);
  assert.equal(result.focusedKey.value, "overview");
  assert.equal(result.tabProps(tabs[0] as TabItem).tabindex, 0);
});

test("labelledBy is emitted instead of aria-label", () => {
  const result = useTabs<TabItem>({
    items: tabs,
    getKey: (item) => item.key,
    labelledBy: "account-heading",
    id: "labelled-tabs",
  });

  assert.equal(result.tablistProps["aria-label"], undefined);
  assert.equal(result.tablistProps["aria-labelledby"], "account-heading");
});
