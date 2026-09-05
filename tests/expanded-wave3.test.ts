import assert from "node:assert/strict";
import test from "node:test";

import { computed, effectScope, nextTick, ref } from "vue";

import { useContextMenu } from "../packages/core/src/context-menu.ts";
import { useMenubar } from "../packages/core/src/menubar.ts";
import { useNavigationMenu } from "../packages/core/src/navigation-menu.ts";
import { useTree } from "../packages/core/src/tree.ts";

function keyboard(key: string) {
  let prevented = false;
  return {
    event: {
      key,
      preventDefault() {
        prevented = true;
      },
      stopPropagation() {},
    } as KeyboardEvent,
    prevented: () => prevented,
  };
}

test("ContextMenu opens at pointer coordinates and delegates selection to Menu", async () => {
  const scope = effectScope();
  const selected: string[] = [];
  const items = [
    { key: "copy", label: "Copy" },
    { key: "delete", label: "Delete", disabled: true },
  ];
  const context = scope.run(() =>
    useContextMenu({
      items,
      getKey: (item) => item.key,
      getTextValue: (item) => item.label,
      isDisabled: (item) => item.disabled ?? false,
      onSelect: (item) => selected.push(item.key),
    }),
  );
  assert.ok(context);
  let prevented = false;
  context.contextTriggerProps.onContextmenu({
    clientX: 42,
    clientY: 84,
    preventDefault() {
      prevented = true;
    },
  } as unknown as MouseEvent);
  await new Promise((resolve) => setTimeout(resolve, 1));
  assert.equal(prevented, true);
  assert.equal(context.menu.open.value, true);
  assert.equal(context.anchorStyle.value.left, "42px");
  assert.equal(context.anchorStyle.value.top, "84px");
  assert.match(String(context.positionStyle.value["position-anchor"]), /^--nagi-anchor-/u);
  assert.equal(context.positionStyle.value["position-try-fallbacks"], "flip-block, flip-inline");
  context.menu.itemProps(items[0]).onClick({} as MouseEvent);
  assert.deepEqual(selected, ["copy"]);
  assert.equal(context.menu.open.value, false);
  scope.stop();
});

test("ContextMenu clears pointer sessions and derives a fresh external-open fallback", async () => {
  const scope = effectScope();
  const open = ref(false);
  const context = scope.run(() =>
    useContextMenu({
      items: [{ key: "copy", label: "Copy" }],
      getKey: (item) => item.key,
      getTextValue: (item) => item.label,
      open,
    }),
  );
  assert.ok(context);
  context.setContextElement({
    getBoundingClientRect: () => ({ left: 100, top: 200, width: 20, height: 40 }),
    ownerDocument: { activeElement: null },
    contains: () => false,
  } as unknown as HTMLElement);
  context.contextTriggerProps.onContextmenu({
    clientX: 12,
    clientY: 34,
    detail: 1,
    preventDefault() {},
  } as unknown as MouseEvent);
  await new Promise((resolve) => setTimeout(resolve, 1));
  assert.equal(context.anchorStyle.value.left, "12px");
  context.menu.hide();
  assert.equal(open.value, false);

  open.value = true;
  assert.equal(context.anchorStyle.value.left, "110px");
  assert.equal(context.anchorStyle.value.top, "216px");
  scope.stop();
});

test("ContextMenu discards a rejected open without committing its coordinates", async () => {
  const source = ref(false);
  const open = computed({ get: () => source.value, set: () => {} });
  const scope = effectScope();
  const context = scope.run(() =>
    useContextMenu({
      items: [{ key: "copy", label: "Copy" }],
      getKey: (item) => item.key,
      getTextValue: (item) => item.label,
      open,
    }),
  );
  assert.ok(context);
  context.contextTriggerProps.onContextmenu({
    clientX: 90,
    clientY: 120,
    detail: 1,
    preventDefault() {},
  } as unknown as MouseEvent);
  await new Promise((resolve) => setTimeout(resolve, 1));
  await nextTick();
  assert.equal(source.value, false);
  assert.equal(context.menu.open.value, false);
  assert.equal(context.anchorStyle.value.left, "0px");
  scope.stop();
});

test("ContextMenu terminates rejected and externally closed long-press sessions", async () => {
  const rejectedSource = ref(false);
  const rejectedWrites: boolean[] = [];
  const rejectedOpen = computed({
    get: () => rejectedSource.value,
    set: (next) => rejectedWrites.push(next),
  });
  const scope = effectScope();
  const rejected = scope.run(() =>
    useContextMenu({
      items: [{ key: "copy", label: "Copy" }],
      getKey: (item) => item.key,
      getTextValue: (item) => item.label,
      open: rejectedOpen,
      longPressDelay: 1,
    }),
  );
  assert.ok(rejected);
  const touch = {
    pointerType: "touch",
    pointerId: 7,
    button: 0,
    clientX: 10,
    clientY: 20,
    target: null,
  } as unknown as PointerEvent;
  rejected.contextTriggerProps.onPointerdown(touch);
  await new Promise((resolve) => setTimeout(resolve, 5));
  await nextTick();
  assert.deepEqual(rejectedWrites, [true]);
  rejected.contextTriggerProps.onPointerup(touch);
  await new Promise((resolve) => setTimeout(resolve, 1));
  assert.deepEqual(rejectedWrites, [true]);
  let clickPrevented = false;
  rejected.contextTriggerProps.onClickCapture({
    preventDefault() {
      clickPrevented = true;
    },
    stopPropagation() {},
  } as unknown as MouseEvent);
  assert.equal(clickPrevented, false);

  const acceptedOpen = ref(false);
  const accepted = scope.run(() =>
    useContextMenu({
      items: [{ key: "copy", label: "Copy" }],
      getKey: (item) => item.key,
      getTextValue: (item) => item.label,
      open: acceptedOpen,
      longPressDelay: 1,
    }),
  );
  assert.ok(accepted);
  accepted.contextTriggerProps.onPointerdown(touch);
  await new Promise((resolve) => setTimeout(resolve, 5));
  assert.equal(acceptedOpen.value, true);
  acceptedOpen.value = false;
  accepted.contextTriggerProps.onPointerup(touch);
  await new Promise((resolve) => setTimeout(resolve, 1));
  assert.equal(acceptedOpen.value, false);
  scope.stop();
});

test("ContextMenu native close before touch release cannot reauthorize the long press", async () => {
  const scope = effectScope();
  const open = ref(false);
  const context = scope.run(() =>
    useContextMenu({
      items: [{ key: "copy", label: "Copy" }],
      getKey: (item) => item.key,
      getTextValue: (item) => item.label,
      open,
      longPressDelay: 1,
    }),
  );
  assert.ok(context);
  const touch = {
    pointerType: "touch",
    pointerId: 17,
    button: 0,
    clientX: 10,
    clientY: 20,
    target: null,
  } as unknown as PointerEvent;
  context.contextTriggerProps.onPointerdown(touch);
  await new Promise((resolve) => setTimeout(resolve, 5));
  assert.equal(open.value, true);

  const popup = {
    isConnected: false,
    matches: () => false,
    hidePopover() {},
    showPopover() {},
  } as unknown as HTMLElement;
  context.menu.menuProps.onToggle({ target: popup, newState: "closed" } as unknown as ToggleEvent);
  await nextTick();
  assert.equal(open.value, false);
  context.contextTriggerProps.onPointerup(touch);
  await new Promise((resolve) => setTimeout(resolve, 1));
  assert.equal(open.value, false);
  scope.stop();
});

test("Menubar roves top-level menus, opens with ArrowDown, and switches menus", async () => {
  const scope = effectScope();
  const chosen: string[] = [];
  const menus = [
    { key: "file", label: "File", items: [{ key: "new", label: "New" }] },
    { key: "edit", label: "Edit", items: [{ key: "copy", label: "Copy" }] },
  ];
  const binding = scope.run(() =>
    useMenubar({
      menus,
      getKey: (menu) => menu.key,
      getTextValue: (menu) => menu.label,
      getItems: (menu) => menu.items,
      getItemKey: (item) => item.key,
      getItemTextValue: (item) => item.label,
      label: "Application",
      onSelect: (item) => chosen.push(item.key),
    }),
  );
  assert.ok(binding);
  binding.menubarTriggerProps(menus[0]).onFocus({
    currentTarget: { ownerDocument: { getElementById: () => null } },
  } as unknown as FocusEvent);
  const down = keyboard("ArrowDown");
  binding.menubarProps.onKeydown(down.event);
  assert.equal(down.prevented(), true);
  assert.equal(binding.openMenuKey.value, "file");
  await nextTick();
  assert.equal(binding.activeItemKey.value, "new");
  binding.menuProps.onKeydown(keyboard("ArrowRight").event);
  assert.equal(binding.openMenuKey.value, "edit");
  await nextTick();
  assert.equal(binding.activeItemKey.value, "copy");
  binding.actionProps(menus[1].items[0]).onClick({} as MouseEvent);
  assert.deepEqual(chosen, ["copy"]);
  assert.equal(binding.openMenuKey.value, null);
  scope.stop();
});

test("Menubar commits only accepted opens and keeps an operable owner after a rejected close", async () => {
  const source = ref(false);
  let acceptsWrites = false;
  const writes: boolean[] = [];
  const open = computed({
    get: () => source.value,
    set: (next) => {
      writes.push(next);
      if (acceptsWrites) source.value = next;
    },
  });
  const menus = [{ key: "file", label: "File", items: [{ key: "new", label: "New" }] }];
  const scope = effectScope();
  const binding = scope.run(() =>
    useMenubar({
      menus,
      getKey: (menu) => menu.key,
      getTextValue: (menu) => menu.label,
      getItems: (menu) => menu.items,
      getItemKey: (item) => item.key,
      getItemTextValue: (item) => item.label,
      label: "Application",
      open,
    }),
  );
  assert.ok(binding);
  const trigger = binding.menubarTriggerProps(menus[0]);
  trigger.onClick({
    currentTarget: { ownerDocument: { getElementById: () => null } },
    preventDefault() {},
  } as unknown as MouseEvent);
  await nextTick();
  assert.equal(binding.openMenuKey.value, null);
  assert.deepEqual(writes, [true]);

  acceptsWrites = true;
  trigger.onClick({
    currentTarget: { ownerDocument: { getElementById: () => null } },
    preventDefault() {},
  } as unknown as MouseEvent);
  assert.equal(binding.openMenuKey.value, "file");
  acceptsWrites = false;
  binding.close(true);
  await nextTick();
  assert.deepEqual(writes, [true, true, false]);
  assert.equal(source.value, true);
  assert.equal(binding.openMenuKey.value, "file");
  assert.equal(binding.activeItemKey.value, "new");
  scope.stop();
});

test("NavigationMenu stays native navigation while coordinating optional panels", async () => {
  const scope = effectScope();
  const items = ref([{ key: "docs", children: [{ href: "/guide" }] }, { key: "about" }]);
  const open = ref(false);
  const navigation = scope.run(() =>
    useNavigationMenu({
      items,
      getKey: (item) => item.key,
      hasPanel: (item) => (item.children?.length ?? 0) > 0,
      label: "Primary",
      open,
      closeDelay: 1,
    }),
  );
  assert.ok(navigation);
  navigation.navigationTriggerProps(items.value[0]).onFocus({
    currentTarget: { ownerDocument: { getElementById: () => null } },
  } as unknown as FocusEvent);
  assert.equal(open.value, true);
  assert.equal(navigation.activeKey.value, "docs");
  navigation.navProps.onPointerleave();
  await new Promise((resolve) => setTimeout(resolve, 5));
  assert.equal(open.value, true);
  navigation.navProps.onFocusout({
    relatedTarget: null,
    currentTarget: { contains: () => false },
  } as unknown as FocusEvent);
  await new Promise((resolve) => setTimeout(resolve, 5));
  assert.equal(open.value, false);
  scope.stop();
});

test("NavigationMenu promotes previews to activation before toggling closed", () => {
  const scope = effectScope();
  const items = [{ key: "products", children: [{}] }];
  const open = ref(false);
  const navigation = scope.run(() =>
    useNavigationMenu({
      items,
      getKey: (item) => item.key,
      hasPanel: (item) => item.children.length > 0,
      label: "Primary",
      open,
    }),
  );
  assert.ok(navigation);
  const ownerDocument = { getElementById: () => null } as unknown as Document;
  const trigger = navigation.navigationTriggerProps(items[0]);
  trigger.onPointerenter({
    pointerType: "mouse",
    currentTarget: { ownerDocument },
  } as unknown as PointerEvent);
  assert.equal(open.value, true);
  assert.equal(navigation.activeKey.value, "products");
  trigger.onClick({
    currentTarget: { ownerDocument },
    preventDefault() {},
  } as unknown as MouseEvent);
  assert.equal(open.value, true);
  navigation.navProps.onPointerleave();
  assert.equal(open.value, true);
  trigger.onClick({
    currentTarget: { ownerDocument },
    preventDefault() {},
  } as unknown as MouseEvent);
  assert.equal(open.value, false);
  assert.equal(navigation.activeKey.value, null);
  scope.stop();
});

test("NavigationMenu emits one model write per rejected open or close intent", async () => {
  const source = ref(false);
  let acceptsWrites = false;
  const writes: boolean[] = [];
  const open = computed({
    get: () => source.value,
    set: (next) => {
      writes.push(next);
      if (acceptsWrites) source.value = next;
    },
  });
  const items = [{ key: "products", children: [{}] }];
  const scope = effectScope();
  const navigation = scope.run(() =>
    useNavigationMenu({
      items,
      getKey: (item) => item.key,
      hasPanel: (item) => item.children.length > 0,
      label: "Locked primary",
      open,
    }),
  );
  assert.ok(navigation);
  const ownerDocument = { getElementById: () => null } as unknown as Document;
  const trigger = navigation.navigationTriggerProps(items[0]);
  trigger.onClick({
    currentTarget: { ownerDocument },
    preventDefault() {},
  } as unknown as MouseEvent);
  await nextTick();
  assert.deepEqual(writes, [true]);
  assert.equal(source.value, false);

  acceptsWrites = true;
  trigger.onClick({
    currentTarget: { ownerDocument },
    preventDefault() {},
  } as unknown as MouseEvent);
  assert.equal(source.value, true);
  acceptsWrites = false;
  navigation.close();
  await nextTick();
  assert.deepEqual(writes, [true, true, false]);
  assert.equal(source.value, true);
  scope.stop();
});

test("NavigationMenu clears a rejected focus guard before a later accepted focus-open", async () => {
  const source = ref(true);
  let acceptsWrites = false;
  const writes: boolean[] = [];
  const open = computed({
    get: () => source.value,
    set: (next) => {
      writes.push(next);
      if (acceptsWrites) source.value = next;
    },
  });
  const items = [{ key: "products", children: [{}] }];
  const scope = effectScope();
  const navigation = scope.run(() =>
    useNavigationMenu({
      items,
      getKey: (item) => item.key,
      hasPanel: (item) => item.children.length > 0,
      label: "Primary",
      open,
    }),
  );
  assert.ok(navigation);
  const ownerDocument = { getElementById: () => null } as unknown as Document;
  navigation.close(true);
  await nextTick();
  assert.deepEqual(writes, [false]);
  assert.equal(source.value, true);

  source.value = false;
  await nextTick();
  acceptsWrites = true;
  navigation.navigationTriggerProps(items[0]).onFocus({
    currentTarget: { ownerDocument },
  } as unknown as FocusEvent);
  assert.deepEqual(writes, [false, true]);
  assert.equal(source.value, true);
  scope.stop();
});

test("NavigationMenu ends hover preview when the pointer enters a direct link", async () => {
  const items = [
    { key: "products", children: [{}] },
    { key: "about", children: [] },
  ];
  const open = ref(false);
  const scope = effectScope();
  const navigation = scope.run(() =>
    useNavigationMenu({
      items,
      getKey: (item) => item.key,
      hasPanel: (item) => item.children.length > 0,
      label: "Primary",
      open,
      closeDelay: 1,
    }),
  );
  assert.ok(navigation);
  const triggerElement = {
    contains: (target: Node) => target === triggerElement,
  } as unknown as HTMLElement;
  const ownerDocument = {
    getElementById: () => triggerElement,
  } as unknown as Document;
  navigation.navigationTriggerProps(items[0]).onPointerenter({
    pointerType: "mouse",
    currentTarget: { ownerDocument },
  } as unknown as PointerEvent);
  assert.equal(open.value, true);

  navigation.navProps.onPointerover({
    pointerType: "mouse",
    target: {} as Node,
  } as unknown as PointerEvent);
  await new Promise((resolve) => setTimeout(resolve, 5));
  assert.equal(open.value, false);
  scope.stop();
});

test("Tree expands, enters children, selects, collapses, and repairs removed active entries", () => {
  interface Node {
    key: string;
    label: string;
    children?: readonly Node[];
  }
  const scope = effectScope();
  const items = ref<readonly Node[]>([
    {
      key: "fruit",
      label: "Fruit",
      children: [{ key: "apple", label: "Apple" }],
    },
    { key: "vegetable", label: "Vegetable" },
  ]);
  const selected = ref<string | null>(null);
  const expanded = ref<readonly string[]>([]);
  const tree = scope.run(() =>
    useTree({
      items,
      getKey: (item) => item.key,
      getChildren: (item) => item.children,
      getTextValue: (item) => item.label,
      selected,
      expanded,
      label: "Foods",
      expandLabel: "Open",
      collapseLabel: "Close",
    }),
  );
  assert.ok(tree);
  assert.equal(tree.toggleControlProps(items.value[0]!)["aria-label"], "Open Fruit");
  assert.equal(tree.toggleControlProps(items.value[0]!).disabled, false);
  tree.treeProps.onFocus({} as FocusEvent);
  assert.equal(tree.activeKey.value, "fruit");
  tree.treeProps.onKeydown(keyboard("v").event);
  assert.equal(tree.activeKey.value, "vegetable");
  tree.treeProps.onKeydown(keyboard("Home").event);
  assert.equal(tree.activeKey.value, "fruit");
  tree.treeProps.onKeydown(keyboard("ArrowRight").event);
  assert.deepEqual(expanded.value, ["fruit"]);
  assert.equal(tree.isExpanded(items.value[0]!), true);
  assert.equal(tree.toggleControlProps(items.value[0]!)["aria-label"], "Close Fruit");
  tree.treeProps.onKeydown(keyboard("ArrowRight").event);
  assert.equal(tree.activeKey.value, "apple");
  assert.equal(tree.treeItemProps(items.value[0]!.children![0]!)["aria-level"], 2);
  assert.equal(tree.treeItemProps(items.value[0]!.children![0]!)["aria-posinset"], 1);
  assert.equal(tree.treeItemProps(items.value[0]!.children![0]!)["aria-setsize"], 1);
  tree.treeProps.onKeydown(keyboard("Enter").event);
  assert.equal(selected.value, "apple");
  let clickStopped = false;
  let pointerStopped = false;
  const appleProps = tree.treeItemProps(items.value[0]!.children![0]!);
  appleProps.onClick({
    stopPropagation() {
      clickStopped = true;
    },
    currentTarget: { closest: () => ({ focus() {} }) },
  } as unknown as MouseEvent);
  appleProps.onPointermove({
    stopPropagation() {
      pointerStopped = true;
    },
  } as unknown as PointerEvent);
  assert.equal(clickStopped, true);
  assert.equal(pointerStopped, true);
  assert.equal(selected.value, "apple");
  tree.treeProps.onKeydown(keyboard("ArrowLeft").event);
  assert.equal(tree.activeKey.value, "fruit");
  let toggleStopped = false;
  tree.toggleControlProps(items.value[0]!).onClick({
    stopPropagation() {
      toggleStopped = true;
    },
    currentTarget: { closest: () => ({ focus() {} }) },
  } as unknown as MouseEvent);
  assert.equal(toggleStopped, true);
  assert.deepEqual(expanded.value, []);
  items.value = [{ key: "vegetable", label: "Vegetable" }];
  assert.equal(tree.activeKey.value, "vegetable");
  scope.stop();
});

test("Tree represents unloaded branches without fabricating child DOM entries", () => {
  const scope = effectScope();
  scope.run(() => {
    const items = [{ key: "remote", label: "Remote", loading: true, hasChildren: true }];
    const expanded = ref<readonly string[]>([]);
    const tree = useTree({
      items,
      getKey: (item) => item.key,
      getChildren: () => [],
      hasChildren: (item) => item.hasChildren,
      getTextValue: (item) => item.label,
      isLoading: (item) => item.loading,
      selected: ref<string | null>(null),
      expanded,
      label: "Remote files",
    });
    const props = tree.treeItemProps(items[0]);
    assert.equal(props["aria-expanded"], "false");
    assert.equal(props["aria-busy"], "true");
    assert.equal(tree.toggleControlProps(items[0]).disabled, true);
    tree.toggle(items[0]);
    assert.deepEqual(expanded.value, []);
  });
  scope.stop();
});

test("Tree never moves active ownership from an enabled child to a disabled parent", () => {
  const scope = effectScope();
  scope.run(() => {
    const items = [
      {
        key: "disabled-parent",
        label: "Disabled parent",
        disabled: true,
        children: [{ key: "child", label: "Child" }],
      },
    ];
    const tree = useTree({
      items,
      getKey: (item) => item.key,
      getChildren: (item) => item.children,
      getTextValue: (item) => item.label,
      isDisabled: (item) => item.disabled ?? false,
      selected: ref<string | null>(null),
      expanded: ref<readonly string[]>(["disabled-parent"]),
      label: "Files",
    });

    tree.treeProps.onFocus({} as FocusEvent);
    assert.equal(tree.activeKey.value, "child");
    tree.treeProps.onKeydown(keyboard("ArrowLeft").event);
    assert.equal(tree.activeKey.value, "child");
    assert.equal(tree.treeProps["aria-activedescendant"], `${tree.treeProps.id}-item-child`);
  });
  scope.stop();
});
