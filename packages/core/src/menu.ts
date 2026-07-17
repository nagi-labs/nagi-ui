import {
  getCurrentInstance,
  onBeforeUnmount,
  ref,
  toValue,
  watch,
  type MaybeRefOrGetter,
  type Ref,
} from "vue";

import type { AnchorOptions } from "./anchor.ts";
import {
  usePopover,
  type PopoverProps,
  type PopoverTriggerProps,
  type UsePopoverOptions,
} from "./popover.ts";

export type MenuDirection = "ltr" | "rtl";
export type MenuCheckedState = boolean | "mixed";

export interface UseMenuOptions<Item, Key extends string = string> {
  /** Items in visual order. Keys must be unique and stable across reorders. */
  items: MaybeRefOrGetter<readonly Item[]>;
  getKey: (item: Item) => Key;
  getTextValue: (item: Item) => string;
  isDisabled?: (item: Item) => boolean;
  onSelect?: (item: Item) => void;
  open?: Ref<boolean>;
  defaultOpen?: boolean;
  id?: string;
  anchor?: AnchorOptions | true;
  /** Logical reading direction. Descendant submenus inherit it. */
  dir?: MenuDirection;
  /** Wrap ArrowUp/ArrowDown at the ends. Defaults to true. */
  loop?: boolean;
  /** Typeahead buffer reset delay. Defaults to 500ms. */
  typeaheadTimeout?: number;
  /** Pointer hover delay before opening a submenu. Defaults to 120ms. */
  submenuOpenDelay?: number;
  /** Pointer grace period before closing a submenu. Defaults to 300ms. */
  submenuCloseDelay?: number;
}

export interface MenuActionItemOptions<Item> {
  onSelect?: (item: Item) => void;
  /** Defaults to true. */
  closeOnSelect?: boolean;
}

export interface MenuCheckboxItemOptions {
  checked: MaybeRefOrGetter<MenuCheckedState>;
  onCheckedChange: (checked: boolean) => void;
  /** Defaults to false so several choices can be changed in one visit. */
  closeOnSelect?: boolean;
}

export interface MenuRadioItemOptions {
  checked: MaybeRefOrGetter<boolean>;
  onSelect: () => void;
  /** Defaults to false so the current choice remains visible. */
  closeOnSelect?: boolean;
}

export interface MenuTriggerProps extends PopoverTriggerProps {
  id: string;
  "aria-controls": string;
  "aria-haspopup": "menu";
  onKeydown: (event: KeyboardEvent) => void;
}

export interface MenuProps extends PopoverProps {
  role: "menu";
  tabindex: -1;
  dir: MenuDirection;
  "aria-labelledby": string;
  readonly "aria-activedescendant": string | undefined;
  onKeydown: (event: KeyboardEvent) => void;
  onPointerenter: () => void;
  onPointerleave: (event?: PointerEvent) => void;
}

interface MenuItemBaseProps {
  id: string;
  tabindex: -1;
  "aria-disabled"?: "true";
  "data-active"?: "";
  onClick: (event: MouseEvent) => void;
  onPointermove: (event?: PointerEvent) => void;
}

export interface MenuItemProps extends MenuItemBaseProps {
  role: "menuitem";
}

export interface MenuCheckboxItemProps extends MenuItemBaseProps {
  role: "menuitemcheckbox";
  "aria-checked": "true" | "false" | "mixed";
}

export interface MenuRadioItemProps extends MenuItemBaseProps {
  role: "menuitemradio";
  "aria-checked": "true" | "false";
}

export interface MenuSubmenuTriggerProps extends MenuItemProps, PopoverTriggerProps {
  "aria-controls": string;
  "aria-haspopup": "menu";
  readonly "aria-expanded": "true" | "false";
  onPointerleave: (event?: PointerEvent) => void;
}

export interface UseMenuReturn<Item, Key extends string = string> {
  id: string;
  open: Ref<boolean>;
  activeKey: Ref<Key | null>;
  direction: MenuDirection;
  show: () => void;
  hide: () => void;
  focusFirst: () => void;
  focusLast: () => void;
  triggerProps: MenuTriggerProps;
  menuProps: MenuProps;
  itemProps: (item: Item, options?: MenuActionItemOptions<Item>) => MenuItemProps;
  checkboxItemProps: (item: Item, options: MenuCheckboxItemOptions) => MenuCheckboxItemProps;
  radioItemProps: (item: Item, options: MenuRadioItemOptions) => MenuRadioItemProps;
  submenuTriggerProps: <ChildItem, ChildKey extends string>(
    item: Item,
    submenu: UseMenuReturn<ChildItem, ChildKey>,
  ) => MenuSubmenuTriggerProps;
}

type Activation = (event?: Event) => void;

interface MenuParentLink {
  menu: MenuController;
  itemKey: string;
}

interface MenuController {
  id: string;
  direction: MenuDirection;
  parent: MenuParentLink | null;
  open: Ref<boolean>;
  keyOf: (item: unknown) => string;
  itemId: (key: string) => string;
  setActiveKey: (key: string) => void;
  focusMenu: () => void;
  focusBoundary: (direction: "first" | "last") => void;
  showFromParent: (direction?: "first" | "last") => void;
  closeBranch: () => void;
  closeTree: (restoreFocus: boolean) => void;
  closeToParent: () => void;
  registerChild: (key: string, child: MenuController) => void;
  unregisterChild: (key: string, child: MenuController) => void;
  childFor: (key: string | null) => MenuController | undefined;
  closeChildrenExcept: (key?: string) => void;
  scheduleOpen: () => void;
  scheduleClose: () => void;
  cancelOpen: () => void;
  cancelClose: () => void;
}

const menuController = Symbol("nagi-menu-controller");

type InternalMenuReturn<Item, Key extends string> = UseMenuReturn<Item, Key> & {
  [menuController]: MenuController;
};

/**
 * Attribute-injection menu button using the APG aria-activedescendant focus
 * strategy. DOM focus stays on the current menu container. Item variants only
 * inject behavior and ARIA; groups, labels, separators, and shortcuts remain
 * ordinary visible markup in the caller's SFC.
 */
export function useMenu<Item, Key extends string = string>(
  options: UseMenuOptions<Item, Key>,
): UseMenuReturn<Item, Key> {
  return createMenu(options, null);
}

/**
 * Creates a child menu linked to one explicit item in its parent. The returned
 * menu can itself be passed to useSubmenu, so the same contract supports an
 * arbitrary menu tree without a hidden component hierarchy.
 */
export function useSubmenu<ParentItem, ParentKey extends string, Item, Key extends string = string>(
  parent: UseMenuReturn<ParentItem, ParentKey>,
  triggerItem: ParentItem,
  options: UseMenuOptions<Item, Key>,
): UseMenuReturn<Item, Key> {
  const parentController = getMenuController(parent);
  const direction = options.dir ?? parentController.direction;
  const anchor =
    options.anchor === undefined || options.anchor === true
      ? ({ area: "inline-end", offset: 4, direction } satisfies AnchorOptions)
      : options.anchor;
  return createMenu(
    { ...options, dir: direction, anchor },
    { menu: parentController, itemKey: parentController.keyOf(triggerItem) },
  );
}

function getMenuController<Item, Key extends string>(
  menu: UseMenuReturn<Item, Key>,
): MenuController {
  const controller = (menu as InternalMenuReturn<Item, Key>)[menuController];
  if (!controller) {
    throw new Error("useSubmenu() requires a menu returned by useMenu() or useSubmenu().");
  }
  return controller;
}

function createMenu<Item, Key extends string>(
  options: UseMenuOptions<Item, Key>,
  parent: MenuParentLink | null,
): InternalMenuReturn<Item, Key> {
  const direction = options.dir ?? parent?.menu.direction ?? "ltr";
  const anchor =
    options.anchor === true
      ? ({ direction } satisfies AnchorOptions)
      : options.anchor
        ? { ...options.anchor, direction: options.anchor.direction ?? direction }
        : undefined;
  const popoverOptions: UsePopoverOptions = {
    ...(options.open ? { open: options.open } : {}),
    ...(options.defaultOpen === undefined ? {} : { defaultOpen: options.defaultOpen }),
    ...(options.id === undefined ? {} : { id: options.id }),
    ...(anchor === undefined ? {} : { anchor }),
  };
  const popover = usePopover(popoverOptions);
  const rootTriggerId = `${popover.id}-trigger`;
  const activeKey = ref<Key | null>(null) as Ref<Key | null>;
  const children = new Map<string, MenuController>();
  const activations = new Map<string, Activation>();

  let menuElement: HTMLElement | null = null;
  let initialDirection: "first" | "last" = "first";
  let typeahead = "";
  let typeaheadTimer: ReturnType<typeof setTimeout> | null = null;
  let openTimer: ReturnType<typeof setTimeout> | null = null;
  let closeTimer: ReturnType<typeof setTimeout> | null = null;

  function items(): readonly Item[] {
    return toValue(options.items);
  }

  function keyOf(item: Item): Key {
    return options.getKey(item);
  }

  function isDisabled(item: Item): boolean {
    return options.isDisabled?.(item) ?? false;
  }

  function enabledItems(): readonly Item[] {
    return items().filter((item) => !isDisabled(item));
  }

  function itemId(key: string): string {
    return `${popover.id}-item-${encodeURIComponent(key)}`;
  }

  function setActiveKey(key: string) {
    activeKey.value = key as Key;
    closeChildrenExcept(key);
  }

  function setActive(item: Item | undefined) {
    if (item === undefined) {
      activeKey.value = null;
      closeChildrenExcept();
      return;
    }
    setActiveKey(keyOf(item));
  }

  function focusMenu() {
    queueMicrotask(() => {
      if (!popover.open.value || !menuElement?.isConnected) return;
      menuElement.focus({ preventScroll: true });
    });
  }

  function focusBoundary(next: "first" | "last") {
    const enabled = enabledItems();
    setActive(next === "first" ? enabled[0] : enabled.at(-1));
  }

  function focusFirst() {
    initialDirection = "first";
    focusBoundary("first");
    if (popover.open.value) focusMenu();
  }

  function focusLast() {
    initialDirection = "last";
    focusBoundary("last");
    if (popover.open.value) focusMenu();
  }

  function move(delta: -1 | 1) {
    const enabled = enabledItems();
    if (enabled.length === 0) {
      setActive(undefined);
      return;
    }

    const current = enabled.findIndex((item) => keyOf(item) === activeKey.value);
    const fallback = delta === 1 ? -1 : 0;
    const next = current === -1 ? fallback + delta : current + delta;
    const index =
      options.loop === false
        ? Math.max(0, Math.min(next, enabled.length - 1))
        : (next + enabled.length) % enabled.length;
    setActive(enabled[index]);
  }

  function activeItem(): Item | undefined {
    return items().find((item) => keyOf(item) === activeKey.value);
  }

  function rootController(): MenuController {
    let root = controller;
    while (root.parent) root = root.parent.menu;
    return root;
  }

  function rootTrigger(): HTMLElement | null {
    if (typeof document === "undefined") return null;
    return document.getElementById(`${rootController().id}-trigger`);
  }

  function closeBranch() {
    cancelTimers();
    for (const child of children.values()) child.closeBranch();
    activeKey.value = null;
    popover.hide();
  }

  function closeTree(restoreFocus: boolean) {
    rootController().closeBranch();
    if (restoreFocus) queueMicrotask(() => rootTrigger()?.focus({ preventScroll: true }));
  }

  function closeToParent() {
    if (!parent) {
      closeTree(true);
      return;
    }
    closeBranch();
    parent.menu.setActiveKey(parent.itemKey);
    parent.menu.focusMenu();
  }

  function closeChildrenExcept(key?: string) {
    for (const [childKey, child] of children) {
      if (childKey !== key) child.closeBranch();
    }
  }

  function activate(item: Item, action: () => void, closeOnSelect: boolean, event?: Event) {
    if (isDisabled(item)) {
      event?.preventDefault();
      event?.stopPropagation();
      return;
    }
    action();
    if (closeOnSelect) closeTree(true);
  }

  function registerAction(item: Item, itemOptions: MenuActionItemOptions<Item> = {}) {
    const key = keyOf(item);
    activations.set(key, (event) => {
      activate(
        item,
        () => (itemOptions.onSelect ?? options.onSelect)?.(item),
        itemOptions.closeOnSelect ?? true,
        event,
      );
    });
  }

  function clearTypeahead() {
    typeahead = "";
    if (typeaheadTimer) clearTimeout(typeaheadTimer);
    typeaheadTimer = null;
  }

  function search(key: string) {
    if (typeaheadTimer) clearTimeout(typeaheadTimer);
    typeahead += key.toLocaleLowerCase();
    typeaheadTimer = setTimeout(clearTypeahead, options.typeaheadTimeout ?? 500);

    const enabled = enabledItems();
    if (enabled.length === 0) return;
    const current = enabled.findIndex((item) => keyOf(item) === activeKey.value);
    const ordered = [...enabled.slice(current + 1), ...enabled.slice(0, current + 1)];
    const first = typeahead[0] ?? "";
    const repeated = Array.from(typeahead).every((character) => character === first);
    const query = repeated ? first : typeahead;
    const match = ordered.find((item) =>
      options.getTextValue(item).trim().toLocaleLowerCase().startsWith(query),
    );
    if (match) setActive(match);
  }

  function cancelOpen() {
    if (openTimer) clearTimeout(openTimer);
    openTimer = null;
  }

  function cancelClose() {
    if (closeTimer) clearTimeout(closeTimer);
    closeTimer = null;
  }

  function cancelTimers() {
    cancelOpen();
    cancelClose();
  }

  function showFromParent(next: "first" | "last" = "first") {
    cancelTimers();
    if (parent) {
      parent.menu.setActiveKey(parent.itemKey);
      parent.menu.closeChildrenExcept(parent.itemKey);
    }
    initialDirection = next;
    focusBoundary(next);
    popover.show();
    if (popover.open.value) focusMenu();
  }

  function scheduleOpen() {
    cancelClose();
    if (popover.open.value) return;
    const delay = options.submenuOpenDelay ?? 120;
    if (delay <= 0) {
      showFromParent();
      return;
    }
    cancelOpen();
    openTimer = setTimeout(showFromParent, delay);
  }

  function scheduleClose() {
    cancelOpen();
    const delay = options.submenuCloseDelay ?? 300;
    if (delay <= 0) {
      closeBranch();
      return;
    }
    cancelClose();
    closeTimer = setTimeout(closeBranch, delay);
  }

  function handled(event: KeyboardEvent, preventDefault = true) {
    if (preventDefault) event.preventDefault();
    event.stopPropagation();
  }

  function onTriggerKeydown(event: KeyboardEvent) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    handled(event);
    initialDirection = event.key === "ArrowUp" ? "last" : "first";
    focusBoundary(initialDirection);
    popover.show();
  }

  function onMenuKeydown(event: KeyboardEvent) {
    const openKey = direction === "rtl" ? "ArrowLeft" : "ArrowRight";
    const closeKey = direction === "rtl" ? "ArrowRight" : "ArrowLeft";
    const child = controller.childFor(activeKey.value);

    if (event.key === openKey && child) {
      handled(event);
      child.showFromParent("first");
      return;
    }
    if (event.key === closeKey && parent) {
      handled(event);
      closeToParent();
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        handled(event);
        move(1);
        return;
      case "ArrowUp":
        handled(event);
        move(-1);
        return;
      case "Home":
        handled(event);
        focusBoundary("first");
        return;
      case "End":
        handled(event);
        focusBoundary("last");
        return;
      case "Enter":
      case " ": {
        handled(event);
        if (child) {
          child.showFromParent("first");
          return;
        }
        const item = activeItem();
        if (item !== undefined) {
          const action = activations.get(keyOf(item));
          if (action) action(event);
          else activate(item, () => options.onSelect?.(item), true, event);
        }
        return;
      }
      case "Escape":
        handled(event);
        if (parent) closeToParent();
        else closeTree(true);
        return;
      case "Tab":
        handled(event, false);
        closeTree(false);
        return;
    }

    if (event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) {
      handled(event);
      search(event.key);
    }
  }

  function baseItemProps(item: Item, onClick: Activation): MenuItemBaseProps {
    const key = keyOf(item);
    const disabled = isDisabled(item);
    return {
      id: itemId(key),
      tabindex: -1,
      ...(disabled ? { "aria-disabled": "true" as const } : {}),
      ...(activeKey.value === key ? { "data-active": "" as const } : {}),
      onClick: (event) => onClick(event),
      onPointermove: () => {
        if (!disabled) setActiveKey(key);
      },
    };
  }

  const originalOnToggle = popover.popoverProps.onToggle;
  const menuProps: MenuProps = {
    ...popover.popoverProps,
    role: "menu",
    tabindex: -1,
    dir: direction,
    "aria-labelledby": parent ? parent.menu.itemId(parent.itemKey) : rootTriggerId,
    get "aria-activedescendant"() {
      return activeKey.value === null ? undefined : itemId(activeKey.value);
    },
    onToggle(event) {
      menuElement = event.target as HTMLElement;
      originalOnToggle(event);
      if (event.newState === "open") {
        if (parent) parent.menu.setActiveKey(parent.itemKey);
        // Keyboard opening chooses the boundary before show(). Do not let a
        // later native toggle event overwrite navigation that already ran.
        if (activeKey.value === null) focusBoundary(initialDirection);
        initialDirection = "first";
        focusMenu();
      } else {
        clearTypeahead();
        closeChildrenExcept();
        activeKey.value = null;
      }
    },
    onKeydown: onMenuKeydown,
    onPointerenter() {
      cancelClose();
      parent?.menu.cancelClose();
    },
    onPointerleave(event) {
      if (event?.pointerType === "touch" || !parent) return;
      scheduleClose();
    },
  };

  const triggerProps: MenuTriggerProps = {
    ...popover.triggerProps,
    id: rootTriggerId,
    "aria-controls": popover.id,
    "aria-haspopup": "menu",
    onKeydown: onTriggerKeydown,
  };

  const controller: MenuController = {
    id: popover.id,
    direction,
    parent,
    open: popover.open,
    keyOf: (item) => keyOf(item as Item),
    itemId,
    setActiveKey,
    focusMenu,
    focusBoundary,
    showFromParent,
    closeBranch,
    closeTree,
    closeToParent,
    registerChild(key, child) {
      children.set(key, child);
    },
    unregisterChild(key, child) {
      if (children.get(key) === child) children.delete(key);
    },
    childFor(key) {
      return key === null ? undefined : children.get(key);
    },
    closeChildrenExcept,
    scheduleOpen,
    scheduleClose,
    cancelOpen,
    cancelClose,
  };

  parent?.menu.registerChild(parent.itemKey, controller);

  watch(
    () => enabledItems().map(keyOf),
    (keys) => {
      if (activeKey.value !== null && !keys.includes(activeKey.value)) {
        focusBoundary("first");
      }
    },
  );

  function dispose() {
    clearTypeahead();
    cancelTimers();
    if (parent) parent.menu.unregisterChild(parent.itemKey, controller);
  }

  if (getCurrentInstance()) onBeforeUnmount(dispose);

  const result: InternalMenuReturn<Item, Key> = {
    id: popover.id,
    open: popover.open,
    activeKey,
    direction,
    show: popover.show,
    hide: closeBranch,
    focusFirst,
    focusLast,
    triggerProps,
    menuProps,
    itemProps(item, itemOptions = {}) {
      registerAction(item, itemOptions);
      return {
        ...baseItemProps(item, activations.get(keyOf(item)) as Activation),
        role: "menuitem",
      };
    },
    checkboxItemProps(item, itemOptions) {
      const key = keyOf(item);
      const checked = toValue(itemOptions.checked);
      activations.set(key, (event) => {
        activate(
          item,
          () => itemOptions.onCheckedChange(toValue(itemOptions.checked) !== true),
          itemOptions.closeOnSelect ?? false,
          event,
        );
      });
      return {
        ...baseItemProps(item, activations.get(key) as Activation),
        role: "menuitemcheckbox",
        "aria-checked": checked === "mixed" ? "mixed" : checked ? "true" : "false",
      };
    },
    radioItemProps(item, itemOptions) {
      const key = keyOf(item);
      activations.set(key, (event) => {
        activate(
          item,
          () => {
            if (!toValue(itemOptions.checked)) itemOptions.onSelect();
          },
          itemOptions.closeOnSelect ?? false,
          event,
        );
      });
      return {
        ...baseItemProps(item, activations.get(key) as Activation),
        role: "menuitemradio",
        "aria-checked": toValue(itemOptions.checked) ? "true" : "false",
      };
    },
    submenuTriggerProps(item, submenu) {
      const key = keyOf(item);
      const disabled = isDisabled(item);
      const child = getMenuController(submenu);
      if (child.parent?.menu !== controller || child.parent.itemKey !== key) {
        throw new Error("submenuTriggerProps() received a submenu linked to a different item.");
      }
      const base = baseItemProps(item, (event) => {
        event?.preventDefault();
        event?.stopPropagation();
        if (!disabled) child.showFromParent("first");
      });
      return {
        ...base,
        popovertarget: submenu.triggerProps.popovertarget,
        ...(submenu.triggerProps.style ? { style: submenu.triggerProps.style } : {}),
        id: itemId(key),
        role: "menuitem",
        tabindex: -1,
        "aria-controls": submenu.id,
        "aria-haspopup": "menu",
        get "aria-expanded"() {
          return submenu.open.value ? "true" : "false";
        },
        onPointermove(event) {
          if (disabled) return;
          setActiveKey(key);
          if (event?.pointerType !== "touch") child.scheduleOpen();
        },
        onPointerleave(event) {
          if (event?.pointerType !== "touch") child.scheduleClose();
        },
      };
    },
    [menuController]: controller,
  };

  return result;
}
