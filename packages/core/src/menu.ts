import {
  getCurrentInstance,
  nextTick,
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
import { modelValueAccepted } from "./model-sync.ts";

export type MenuDirection = "ltr" | "rtl";
export type MenuCheckedState = boolean | "mixed";

export interface UseMenuOptions<Item, Key extends string = string> {
  /** Items in visual order. Keys must be unique and stable across reorders. */
  items: MaybeRefOrGetter<readonly Item[]>;
  getKey: (item: Item) => Key;
  getTextValue: (item: Item) => string;
  isDisabled?: (item: Item) => boolean;
  onSelect?: (item: Item, event?: Event) => void;
  open?: Ref<boolean>;
  defaultOpen?: boolean;
  id?: string;
  anchor?: AnchorOptions | true;
  /** Logical reading direction. Descendant submenus inherit it. */
  dir?: MaybeRefOrGetter<MenuDirection | undefined>;
  /** Wrap ArrowUp/ArrowDown at the ends. Defaults to true. */
  loop?: boolean;
  /** Typeahead buffer reset delay. Defaults to 500ms. */
  typeaheadTimeout?: number;
  /** Pointer hover delay before opening a submenu. Defaults to 120ms. */
  submenuOpenDelay?: number;
  /** Pointer grace period before closing a submenu. Defaults to 300ms. */
  submenuCloseDelay?: number;
  /** Overrides root-trigger focus restoration for virtual/context triggers. */
  restoreFocus?: () => void;
}

export interface MenuActionItemOptions<Item> {
  onSelect?: (item: Item, event?: Event) => void;
  /** The rendered item is a real anchor; keyboard activation invokes that anchor. */
  nativeLink?: boolean;
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
  onKeydown: (event: KeyboardEvent) => void;
  onPointerenter: () => void;
  onPointerleave: (event?: PointerEvent) => void;
}

interface MenuItemBaseProps {
  id: string;
  tabindex: -1;
  "aria-disabled"?: "true";
  onFocus: () => void;
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
  setActiveKey: (key: string, focus?: boolean) => void;
  focusMenu: () => void;
  focusBoundary: (direction: "first" | "last") => void;
  showFromParent: (direction?: "first" | "last") => void;
  closeBranch: () => void;
  closeTree: (restoreFocus: boolean, afterNativeFocusMove?: boolean) => void;
  restoreFocus: () => void;
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
 * Attribute-injection menu button using managed focus on the rendered native
 * item. Keeping DOM focus on the actual button or anchor preserves its trusted
 * activation behavior; the menu container is only a fallback when no enabled
 * item exists. Groups, labels, separators, and shortcuts remain ordinary
 * visible markup in the caller's SFC.
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
  const direction = toValue(options.dir) ?? parentController.direction;
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
  const direction = () => toValue(options.dir) ?? parent?.menu.direction ?? "ltr";
  const anchor =
    options.anchor === true
      ? ({ direction: direction() } satisfies AnchorOptions)
      : options.anchor
        ? { ...options.anchor, direction: options.anchor.direction ?? direction() }
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
  const nativeLinks = new Set<string>();

  let menuElement: HTMLElement | null = null;
  let focusRevision = 0;
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

  function setActiveKey(key: string, focus = true) {
    activeKey.value = key as Key;
    closeChildrenExcept(key);
    if (focus && popover.open.value) focusMenu();
  }

  function setActive(item: Item | undefined, focus = true) {
    if (item === undefined) {
      activeKey.value = null;
      closeChildrenExcept();
      if (focus && popover.open.value) focusMenu();
      return;
    }
    setActiveKey(keyOf(item), focus);
  }

  function focusMenu() {
    const revision = ++focusRevision;
    void nextTick(() => {
      if (revision !== focusRevision) return;
      if (!popover.open.value || !menuElement?.isConnected) return;
      const active = activeKey.value === null
        ? null
        : menuElement.ownerDocument?.getElementById(itemId(activeKey.value));
      (active ?? menuElement).focus({ preventScroll: true });
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
    ++focusRevision;
    for (const child of children.values()) child.closeBranch();
    popover.hide();
    // A controlled owner may reject the close request. Keep the active item in
    // that case so the still-open menu remains keyboard-operable.
    if (!popover.open.value) activeKey.value = null;
  }

  function closeTree(restoreFocus: boolean, afterNativeFocusMove = false) {
    const root = rootController();
    root.closeBranch();
    void modelValueAccepted(root.open, false).then((accepted) => {
      if (accepted) {
        if (restoreFocus) root.restoreFocus();
        return;
      }
      // Tab may have already followed its native traversal before a
      // controlled owner rejects the close. Restore the deepest menu that
      // remained open so the visible surface never loses its focus owner.
      const repair = () => {
        const owner = controller.open.value ? controller : root;
        if (owner.open.value) owner.focusMenu();
      };
      if (afterNativeFocusMove) setTimeout(repair, 0);
      else repair();
    });
  }

  function closeToParent() {
    if (!parent) {
      closeTree(true);
      return;
    }
    closeBranch();
    void modelValueAccepted(popover.open, false).then((accepted) => {
      if (!accepted) {
        focusMenu();
        return;
      }
      if (!parent.menu.open.value) return;
      parent.menu.setActiveKey(parent.itemKey, false);
      parent.menu.focusMenu();
    });
  }

  function closeChildrenExcept(key?: string) {
    for (const [childKey, child] of children) {
      if (childKey !== key) child.closeBranch();
    }
  }

  function activate(item: Item, action: (event?: Event) => void, closeOnSelect: boolean, event?: Event) {
    if (isDisabled(item)) {
      event?.preventDefault();
      event?.stopPropagation();
      return;
    }
    action(event);
    if (closeOnSelect) closeTree(true);
  }

  function registerAction(item: Item, itemOptions: MenuActionItemOptions<Item> = {}) {
    const key = keyOf(item);
    if (itemOptions.nativeLink) nativeLinks.add(key);
    else nativeLinks.delete(key);
    activations.set(key, (event) => {
      if (itemOptions.nativeLink && event?.type === "keydown" && !isDisabled(item)) {
        const owner = (event.currentTarget as HTMLElement | null)?.ownerDocument
          ?? menuElement?.ownerDocument;
        const anchor = owner?.getElementById(itemId(key)) as HTMLAnchorElement | null;
        if (anchor && typeof anchor.click === "function") {
          // Enter on the focused real anchor never reaches this branch; the UA
          // owns that trusted activation. This fallback covers plain Space and
          // non-browser callers that invoke the menu container directly.
          anchor.click();
          return;
        }
      }
      activate(
        item,
        (event) => {
          (itemOptions.onSelect ?? options.onSelect)?.(item, event);
        },
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
      parent.menu.setActiveKey(parent.itemKey, false);
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
    const openKey = direction() === "rtl" ? "ArrowLeft" : "ArrowRight";
    const closeKey = direction() === "rtl" ? "ArrowRight" : "ArrowLeft";
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
        const target = event.target as HTMLElement | null;
        const targetItem = target
          ? items().find((candidate) => target.id === itemId(keyOf(candidate)))
          : undefined;
        if (targetItem !== undefined && isDisabled(targetItem)) {
          handled(event);
          focusMenu();
          return;
        }
        if (
          targetItem !== undefined
          && keyOf(targetItem) !== activeKey.value
        ) {
          // Direct focus normally synchronizes activeKey in onFocus. Refuse a
          // stale/mismatched target instead of activating a different item.
          handled(event);
          setActiveKey(keyOf(targetItem));
          return;
        }
        const activationChild = controller.childFor(activeKey.value);
        if (activationChild) {
          handled(event);
          activationChild.showFromParent("first");
          return;
        }
        const item = activeItem();
        if (item !== undefined) {
          const key = keyOf(item);
          if (
            nativeLinks.has(key)
            && event.key === "Enter"
            && target?.id === itemId(key)
          ) {
            // The real focused anchor receives the trusted keyboard event.
            // Stop only nested-menu delegation; preserving the default keeps
            // this exact anchor's browser activation intact.
            event.stopPropagation();
            return;
          }
          if (
            nativeLinks.has(key)
            && event.key === " "
            && (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
          ) {
            return;
          }
          handled(event);
          const action = activations.get(keyOf(item));
          if (action) action(event);
          else activate(item, (event) => options.onSelect?.(item, event), true, event);
        } else {
          handled(event);
        }
        return;
      }
      case "Escape":
        handled(event);
        if (parent) closeToParent();
        else closeTree(true);
        return;
      case "Tab":
        if (event.shiftKey) {
          handled(event);
          closeTree(true);
        } else {
          handled(event, false);
          // Preserve native forward traversal when close succeeds. If a
          // controlled owner rejects it, repair focus in the next task, after
          // the keydown default action has completed.
          closeTree(false, true);
        }
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
      onFocus: () => {
        if (disabled) {
          focusMenu();
          return;
        }
        setActiveKey(key, false);
      },
      onClick: (event) => {
        if (!disabled) setActiveKey(key, false);
        onClick(event);
      },
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
    get dir() { return direction(); },
    "aria-labelledby": parent ? parent.menu.itemId(parent.itemKey) : rootTriggerId,
    onToggle(event) {
      menuElement = event.target as HTMLElement;
      originalOnToggle(event);
      if (event.newState === "open") {
        if (parent) parent.menu.setActiveKey(parent.itemKey);
        // Keyboard opening chooses the boundary before show(). Do not let a
        // later native toggle event overwrite navigation that already ran.
        if (activeKey.value === null) focusBoundary(initialDirection);
        else focusMenu();
        initialDirection = "first";
      } else {
        ++focusRevision;
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
    get direction() { return direction(); },
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
    restoreFocus() {
      if (options.restoreFocus) options.restoreFocus();
      else rootTrigger()?.focus({ preventScroll: true });
    },
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
      const owner = menuElement?.ownerDocument.activeElement ?? null;
      const ownedFocus = owner === menuElement
        || (owner !== null && (menuElement?.contains(owner) ?? false));
      if (activeKey.value === null) {
        if (keys.length > 0 && popover.open.value && owner === menuElement) {
          setActive(enabledItems()[0], true);
        }
        return;
      }
      if (activeKey.value !== null && !keys.includes(activeKey.value)) {
        const next = enabledItems()[0];
        setActive(next, ownedFocus);
      }
    },
  );

  function dispose() {
    clearTypeahead();
    cancelTimers();
    ++focusRevision;
    if (parent) parent.menu.unregisterChild(parent.itemKey, controller);
  }

  if (getCurrentInstance()) onBeforeUnmount(dispose);

  const result: InternalMenuReturn<Item, Key> = {
    id: popover.id,
    open: popover.open,
    activeKey,
    get direction() { return direction(); },
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
