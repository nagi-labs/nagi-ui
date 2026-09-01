import {
  computed,
  getCurrentInstance,
  nextTick,
  onBeforeUnmount,
  ref,
  toValue,
  useId,
  watch,
  type ComponentPublicInstance,
  type ComputedRef,
  type CSSProperties,
  type MaybeRefOrGetter,
  type Ref,
} from "vue";

import { createAnchorPair, type AnchorPair } from "./anchor.ts";
import { createElementRegistry } from "./element-registry.ts";
import { useMenu, type MenuItemProps, type MenuProps } from "./menu.ts";
import { modelValueAccepted, requestModelValue, type WritableRef } from "./model-sync.ts";

export interface UseMenubarOptions<Menu, Action, Key extends string = string, ActionKey extends string = string> {
  menus: MaybeRefOrGetter<readonly Menu[]>;
  getKey: (menu: Menu) => Key;
  getTextValue: (menu: Menu) => string;
  isDisabled?: (menu: Menu) => boolean;
  getItems: (menu: Menu) => readonly Action[];
  getItemKey: (item: Action) => ActionKey;
  getItemTextValue: (item: Action) => string;
  isItemLink?: (item: Action) => boolean;
  isItemDisabled?: (item: Action) => boolean;
  onSelect?: (item: Action, event?: Event) => void;
  label: MaybeRefOrGetter<string>;
  dir?: MaybeRefOrGetter<"ltr" | "rtl" | undefined>;
  open?: WritableRef<boolean>;
  id?: string;
}

export interface MenubarProps {
  id: string;
  role: "menubar";
  "aria-orientation": "horizontal";
  "aria-label": string;
  dir: "ltr" | "rtl";
  onKeydown: (event: KeyboardEvent) => void;
}

export interface MenubarTriggerProps {
  ref: (element: Element | ComponentPublicInstance | null) => void;
  id: string;
  role: "menuitem";
  tabindex: 0 | -1;
  popovertarget: string;
  popovertargetaction: "show";
  "aria-haspopup": "menu";
  "aria-controls": string;
  "aria-expanded": "true" | "false";
  "aria-disabled"?: "true";
  style?: CSSProperties;
  onFocus: (event: FocusEvent) => void;
  onClick: (event: MouseEvent) => void;
  onPointermove: (event: PointerEvent) => void;
}

export type MenubarMenuProps = MenuProps;
export type MenubarActionProps = MenuItemProps;

export interface MenubarBinding<Menu, Action, Key extends string = string, ActionKey extends string = string> {
  activeMenuKey: Ref<Key | null>;
  openMenuKey: Ref<Key | null>;
  activeItemKey: Ref<ActionKey | null>;
  activeItems: () => readonly Action[];
  menubarProps: MenubarProps;
  menubarTriggerProps: (menu: Menu) => MenubarTriggerProps;
  menuProps: MenubarMenuProps;
  positionStyle: ComputedRef<CSSProperties>;
  actionProps: (item: Action) => MenubarActionProps;
  close: (restoreFocus?: boolean) => void;
}

interface MenubarComponentAction {
  readonly key: string;
  readonly label: string;
  readonly href?: string;
  readonly disabled?: boolean;
}
interface MenubarComponentMenu<Action extends MenubarComponentAction = MenubarComponentAction> {
  readonly key: string;
  readonly label: string;
  readonly disabled?: boolean;
  readonly items: readonly Action[];
}
export interface MenubarComponentProps<Menu extends MenubarComponentMenu> {
  readonly items: readonly Menu[];
  readonly label: string;
  readonly dir: "ltr" | "rtl";
}
export interface MenubarComponentModel<Action> {
  open: Ref<boolean>;
  onSelect?: (item: Action) => void;
}

interface MenuSnapshot<Key extends string> { key: Key; disabled: boolean }

let menubarCount = 0;

function createMenubar<Menu, Action, Key extends string, ActionKey extends string>(
  options: UseMenubarOptions<Menu, Action, Key, ActionKey>,
): MenubarBinding<Menu, Action, Key, ActionKey> {
  const instance = getCurrentInstance();
  const id = options.id ?? (instance ? useId() : `nagi-menubar-${menubarCount++}`);
  const activeMenuKey = ref<Key | null>(null) as Ref<Key | null>;
  const openMenuKey = ref<Key | null>(null) as Ref<Key | null>;
  let pendingMenuKey: Key | null = null;
  let pendingBoundary: "first" | "last" = "first";
  let restoreMenuKey: Key | null = null;
  const triggerElements = createElementRegistry<Key>();
  let popupElement: HTMLElement | null = null;
  let detachAnchor: (() => void) | null = null;
  let requestRevision = 0;
  let typeahead = "";
  let typeaheadTimer: ReturnType<typeof setTimeout> | null = null;
  const anchors = new Map<string, AnchorPair>();

  const menus = () => toValue(options.menus);
  const keyOf = (menu: Menu) => options.getKey(menu);
  const disabled = (menu: Menu) => options.isDisabled?.(menu) ?? false;
  const enabledMenus = () => menus().filter((menu) => !disabled(menu));
  const menuFor = (key: Key | null) => menus().find((menu) => keyOf(menu) === key);
  const currentMenu = () => menuFor(openMenuKey.value);
  const activeItems = () => currentMenu() ? options.getItems(currentMenu() as Menu) : [];
  const triggerIdForKey = (key: Key) => `${id}-trigger-${encodeURIComponent(key)}`;
  const triggerId = (menu: Menu) => triggerIdForKey(keyOf(menu));

  function anchorFor(menu: Menu) {
    const direction = toValue(options.dir) ?? "ltr";
    const cacheKey = `${keyOf(menu)}:${direction}`;
    let anchor = anchors.get(cacheKey);
    if (!anchor) {
      anchor = createAnchorPair(`${id}-${encodeURIComponent(keyOf(menu))}-${direction}`, {
        area: "block-end",
        direction,
      });
      anchors.set(cacheKey, anchor);
    }
    return anchor;
  }

  function focusTrigger(key: Key | null) {
    if (key === null) return;
    void nextTick(() => triggerElements.get(key)?.focus({ preventScroll: true }));
  }

  const menuBehavior = useMenu<Action, ActionKey>({
    items: activeItems,
    getKey: options.getItemKey,
    getTextValue: options.getItemTextValue,
    ...(options.isItemDisabled ? { isDisabled: options.isItemDisabled } : {}),
    ...(options.open ? { open: options.open } : {}),
    ...(options.onSelect ? { onSelect: options.onSelect } : {}),
    id: `${id}-popup`,
    dir: () => toValue(options.dir) ?? "ltr",
    restoreFocus: () => focusTrigger(openMenuKey.value ?? activeMenuKey.value),
  });

  function syncAnchor(menu: Menu | undefined, isOpen = menuBehavior.open.value) {
    detachAnchor?.();
    detachAnchor = null;
    if (!menu || !isOpen || !popupElement) return;
    const anchor = anchorFor(menu);
    if (anchor.native) return;
    const trigger = triggerElements.get(keyOf(menu));
    if (trigger) detachAnchor = anchor.attach(trigger, popupElement);
  }

  function commitOwner(menu: Menu, boundary: "first" | "last" = "first", focusPopup = true) {
    const key = keyOf(menu);
    pendingMenuKey = null;
    openMenuKey.value = key;
    activeMenuKey.value = key;
    void nextTick(() => {
      if (!menuBehavior.open.value || openMenuKey.value !== key) return;
      syncAnchor(menu);
      if (!focusPopup) return;
      if (boundary === "last") menuBehavior.focusLast();
      else menuBehavior.focusFirst();
    });
  }

  function requestOpen(menu: Menu, boundary: "first" | "last" = "first") {
    if (disabled(menu)) return;
    const revision = ++requestRevision;
    const key = keyOf(menu);
    activeMenuKey.value = key;
    pendingMenuKey = key;
    pendingBoundary = boundary;
    if (menuBehavior.open.value) {
      commitOwner(menu, boundary);
      return;
    }
    void requestModelValue(menuBehavior.open, true).then((accepted) => {
      if (revision !== requestRevision || accepted) return;
      pendingMenuKey = null;
    });
  }

  function close(restoreFocus = false) {
    const revision = ++requestRevision;
    restoreMenuKey = restoreFocus ? openMenuKey.value : null;
    menuBehavior.hide();
    void modelValueAccepted(menuBehavior.open, false).then((accepted) => {
      if (revision !== requestRevision || accepted) return;
      restoreMenuKey = null;
    });
  }

  function fallbackKey(missing: Key | null, current: readonly MenuSnapshot<Key>[], previous: readonly MenuSnapshot<Key>[]) {
    const enabled = current.filter((entry) => !entry.disabled);
    if (enabled.length === 0) return null;
    if (missing === null) return enabled[0]?.key ?? null;
    let index = current.findIndex((entry) => entry.key === missing);
    if (index === -1) index = previous.findIndex((entry) => entry.key === missing);
    if (index === -1) return enabled[0]?.key ?? null;
    return current.slice(index).find((entry) => !entry.disabled)?.key
      ?? current.slice(0, index).reverse().find((entry) => !entry.disabled)?.key
      ?? null;
  }

  function moveMenu(delta: -1 | 1, switchOpen: boolean) {
    const candidates = enabledMenus();
    if (candidates.length === 0) return;
    const current = candidates.findIndex((menu) => keyOf(menu) === activeMenuKey.value);
    const index = (current + delta + candidates.length) % candidates.length;
    const menu = candidates[index];
    if (!menu) return;
    if (switchOpen && menuBehavior.open.value) commitOwner(menu);
    else {
      activeMenuKey.value = keyOf(menu);
      focusTrigger(keyOf(menu));
    }
  }

  function search(character: string) {
    if (typeaheadTimer) clearTimeout(typeaheadTimer);
    typeahead += character.toLocaleLowerCase();
    typeaheadTimer = setTimeout(() => {
      typeahead = "";
      typeaheadTimer = null;
    }, 500);
    const candidates = enabledMenus();
    const current = candidates.findIndex((menu) => keyOf(menu) === activeMenuKey.value);
    const ordered = [...candidates.slice(current + 1), ...candidates.slice(0, current + 1)];
    const first = typeahead[0] ?? "";
    const query = Array.from(typeahead).every((value) => value === first) ? first : typeahead;
    const match = ordered.find((menu) => options.getTextValue(menu).trim().toLocaleLowerCase().startsWith(query));
    if (!match) return;
    if (menuBehavior.open.value) commitOwner(match, "first", false);
    else {
      activeMenuKey.value = keyOf(match);
      focusTrigger(keyOf(match));
    }
  }

  const menuProps = Object.defineProperties(
    {},
    Object.getOwnPropertyDescriptors(menuBehavior.menuProps),
  ) as MenubarMenuProps;
  Object.defineProperty(menuProps, "aria-labelledby", {
    configurable: true,
    enumerable: true,
    get: () => currentMenu() ? triggerId(currentMenu() as Menu) : id,
  });
  const baseToggle = menuProps.onToggle;
  menuProps.onToggle = (event) => {
    popupElement = event.target as HTMLElement;
    baseToggle(event);
    syncAnchor(currentMenu(), event.newState === "open");
  };
  const baseKeydown = menuProps.onKeydown;
  menuProps.onKeydown = (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      event.stopPropagation();
      const direction = toValue(options.dir) ?? "ltr";
      const previous = event.key === (direction === "rtl" ? "ArrowRight" : "ArrowLeft");
      moveMenu(previous ? -1 : 1, true);
      return;
    }
    baseKeydown(event);
  };

  function reconcileOpenOwner(isOpen: boolean) {
    if (isOpen) {
      const candidate = menuFor(pendingMenuKey)
        ?? menuFor(activeMenuKey.value)
        ?? enabledMenus()[0];
      if (candidate && !disabled(candidate)) commitOwner(candidate, pendingBoundary);
      else void requestModelValue(menuBehavior.open, false);
      return;
    }
    const restore = restoreMenuKey;
    openMenuKey.value = null;
    pendingMenuKey = null;
    restoreMenuKey = null;
    detachAnchor?.();
    detachAnchor = null;
    if (restore !== null) focusTrigger(restore);
  }

  function menuSnapshot(): readonly MenuSnapshot<Key>[] {
    return menus().map((menu) => ({ key: keyOf(menu), disabled: disabled(menu) }));
  }

  function reconcileMenus(
    current: readonly MenuSnapshot<Key>[],
    previous: readonly MenuSnapshot<Key>[] = [],
  ) {
    triggerElements.prune(current.map((entry) => entry.key));
    const activeValid = current.some((entry) => entry.key === activeMenuKey.value && !entry.disabled);
    const repairDomFocus = activeMenuKey.value !== null
      && triggerElements.get(activeMenuKey.value)?.matches(":focus") === true;
    if (!activeValid) {
      const next = fallbackKey(activeMenuKey.value, current, previous);
      activeMenuKey.value = next;
      if (repairDomFocus) focusTrigger(next);
    }
    if (!menuBehavior.open.value) return;
    const owner = menuFor(openMenuKey.value);
    if (owner && !disabled(owner)) return;
    const nextKey = fallbackKey(openMenuKey.value, current, previous);
    const next = menuFor(nextKey);
    if (next) commitOwner(next);
    else close();
  }

  watch(menuBehavior.open, reconcileOpenOwner, { flush: "sync", immediate: true });

  watch(
    menuSnapshot,
    reconcileMenus,
    { flush: "sync", immediate: true },
  );

  if (instance) {
    onBeforeUnmount(() => {
      if (typeaheadTimer) clearTimeout(typeaheadTimer);
      typeaheadTimer = null;
      detachAnchor?.();
      detachAnchor = null;
      triggerElements.clear();
    });
  }

  return {
    activeMenuKey,
    openMenuKey,
    activeItemKey: menuBehavior.activeKey,
    activeItems,
    menubarProps: {
      id,
      role: "menubar",
      "aria-orientation": "horizontal",
      get "aria-label"() { return toValue(options.label); },
      get dir() { return toValue(options.dir) ?? "ltr"; },
      onKeydown(event) {
        const direction = toValue(options.dir) ?? "ltr";
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          const previous = event.key === (direction === "rtl" ? "ArrowRight" : "ArrowLeft");
          moveMenu(previous ? -1 : 1, false);
        } else if (event.key === "Home" || event.key === "End") {
          event.preventDefault();
          const candidates = enabledMenus();
          const menu = event.key === "Home" ? candidates[0] : candidates.at(-1);
          if (menu) {
            activeMenuKey.value = keyOf(menu);
            focusTrigger(keyOf(menu));
          }
        } else if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
          const menu = menuFor(activeMenuKey.value);
          if (menu) {
            event.preventDefault();
            requestOpen(menu, event.key === "ArrowUp" ? "last" : "first");
          }
        } else if (event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          search(event.key);
        }
      },
    },
    menubarTriggerProps(menu) {
      const key = keyOf(menu);
      return {
        ref: triggerElements.refFor(key),
        id: triggerId(menu),
        role: "menuitem",
        get tabindex() { return activeMenuKey.value === key && !disabled(menu) ? 0 : -1; },
        popovertarget: menuBehavior.id,
        popovertargetaction: "show",
        "aria-haspopup": "menu",
        "aria-controls": menuBehavior.id,
        get "aria-expanded"() { return menuBehavior.open.value && openMenuKey.value === key ? "true" : "false"; },
        ...(disabled(menu) ? { "aria-disabled": "true" as const } : {}),
        style: anchorFor(menu).anchorStyle,
        onFocus() {
          if (!disabled(menu)) activeMenuKey.value = key;
        },
        onClick(event) {
          // The model must accept the transition before usePopover mutates the
          // native surface. Keep the invoker attributes for SSR/progressive
          // enhancement, but suppress the hydrated UA default in both paths.
          event.preventDefault();
          if (disabled(menu)) {
            return;
          }
          if (menuBehavior.open.value && openMenuKey.value === key) {
            close();
          }
          else requestOpen(menu);
        },
        onPointermove(event) {
          if (!disabled(menu) && event.pointerType !== "touch" && menuBehavior.open.value && openMenuKey.value !== key) {
            commitOwner(menu);
          }
        },
      };
    },
    menuProps,
    actionProps(item) {
      return menuBehavior.itemProps(item, options.isItemLink?.(item) ? { nativeLink: true } : {});
    },
    positionStyle: computed(() => {
      const menu = currentMenu();
      return menu ? anchorFor(menu).positionedStyle : {};
    }),
    close,
  };
}

export function useMenubar<Menu, Action, Key extends string = string, ActionKey extends string = string>(
  options: UseMenubarOptions<Menu, Action, Key, ActionKey>,
): MenubarBinding<Menu, Action, Key, ActionKey>;
export function useMenubar<
  Action extends MenubarComponentAction,
  Menu extends MenubarComponentMenu<Action>,
>(
  props: MenubarComponentProps<Menu>,
  model: MenubarComponentModel<Action>,
): MenubarBinding<Menu, Action>;
export function useMenubar(
  optionsOrProps: unknown,
  model?: MenubarComponentModel<MenubarComponentAction>,
): unknown {
  if (!model) return createMenubar(optionsOrProps as UseMenubarOptions<unknown, unknown>);
  const props = optionsOrProps as MenubarComponentProps<MenubarComponentMenu>;
  return createMenubar({
    menus: () => props.items,
    getKey: (menu) => menu.key,
    getTextValue: (menu) => menu.label,
    isDisabled: (menu) => menu.disabled ?? false,
    getItems: (menu) => menu.items,
    getItemKey: (item) => item.key,
    getItemTextValue: (item) => item.label,
    isItemDisabled: (item) => item.disabled ?? false,
    isItemLink: (item) => "href" in item,
    label: () => props.label,
    dir: () => props.dir,
    open: model.open,
    ...(model.onSelect ? { onSelect: model.onSelect } : {}),
  }) as unknown as MenubarBinding<unknown, unknown>;
}
