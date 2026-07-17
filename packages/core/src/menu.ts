import {
  getCurrentInstance,
  onBeforeUnmount,
  ref,
  toValue,
  watch,
  type MaybeRefOrGetter,
  type Ref,
} from "vue";

import {
  usePopover,
  type PopoverProps,
  type PopoverTriggerProps,
  type UsePopoverOptions,
} from "./popover.ts";
import type { AnchorOptions } from "./anchor.ts";

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
  /** Wrap ArrowUp/ArrowDown at the ends. Defaults to true. */
  loop?: boolean;
  /** Typeahead buffer reset delay. Defaults to 500ms. */
  typeaheadTimeout?: number;
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
  "aria-labelledby": string;
  readonly "aria-activedescendant": string | undefined;
  onKeydown: (event: KeyboardEvent) => void;
}

export interface MenuItemProps {
  id: string;
  role: "menuitem";
  tabindex: -1;
  "aria-disabled"?: "true";
  "data-active"?: "";
  onClick: (event: MouseEvent) => void;
  onPointermove: () => void;
}

export interface UseMenuReturn<Item, Key extends string = string> {
  id: string;
  open: Ref<boolean>;
  activeKey: Ref<Key | null>;
  show: () => void;
  hide: () => void;
  focusFirst: () => void;
  focusLast: () => void;
  triggerProps: MenuTriggerProps;
  menuProps: MenuProps;
  itemProps: (item: Item) => MenuItemProps;
}

/**
 * Attribute-injection menu button using the APG aria-activedescendant focus
 * strategy. DOM focus stays on the menu container; itemProps(item) supplies
 * stable ids, roles, disabled state, active styling state, and interaction.
 */
export function useMenu<Item, Key extends string = string>(
  options: UseMenuOptions<Item, Key>,
): UseMenuReturn<Item, Key> {
  const popoverOptions: UsePopoverOptions = {
    ...(options.open ? { open: options.open } : {}),
    ...(options.defaultOpen === undefined ? {} : { defaultOpen: options.defaultOpen }),
    ...(options.id === undefined ? {} : { id: options.id }),
    ...(options.anchor === undefined ? {} : { anchor: options.anchor }),
  };
  const popover = usePopover(popoverOptions);
  const triggerId = `${popover.id}-trigger`;
  const activeKey = ref<Key | null>(null) as Ref<Key | null>;

  let menuElement: HTMLElement | null = null;
  let initialDirection: "first" | "last" = "first";
  let typeahead = "";
  let typeaheadTimer: ReturnType<typeof setTimeout> | null = null;

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

  function itemId(key: Key): string {
    return `${popover.id}-item-${encodeURIComponent(key)}`;
  }

  function setActive(item: Item | undefined) {
    activeKey.value = item === undefined ? null : keyOf(item);
  }

  function focusMenu() {
    queueMicrotask(() => {
      if (!popover.open.value || !menuElement?.isConnected) return;
      menuElement.focus({ preventScroll: true });
    });
  }

  function focusBoundary(direction: "first" | "last") {
    const enabled = enabledItems();
    setActive(direction === "first" ? enabled[0] : enabled.at(-1));
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
      activeKey.value = null;
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

  function focusTrigger() {
    if (typeof document === "undefined") return;
    const trigger = document.getElementById(triggerId);
    trigger?.focus({ preventScroll: true });
  }

  function closeAndFocusTrigger() {
    popover.hide();
    queueMicrotask(focusTrigger);
  }

  function activeItem(): Item | undefined {
    return items().find((item) => keyOf(item) === activeKey.value);
  }

  function select(item: Item, event?: Event) {
    if (isDisabled(item)) {
      event?.preventDefault();
      event?.stopPropagation();
      return;
    }
    options.onSelect?.(item);
    closeAndFocusTrigger();
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

  function onTriggerKeydown(event: KeyboardEvent) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    initialDirection = event.key === "ArrowUp" ? "last" : "first";
    focusBoundary(initialDirection);
    popover.show();
  }

  function onMenuKeydown(event: KeyboardEvent) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        move(1);
        return;
      case "ArrowUp":
        event.preventDefault();
        move(-1);
        return;
      case "Home":
        event.preventDefault();
        focusBoundary("first");
        return;
      case "End":
        event.preventDefault();
        focusBoundary("last");
        return;
      case "Enter":
      case " ": {
        event.preventDefault();
        const item = activeItem();
        if (item !== undefined) select(item, event);
        return;
      }
      case "Escape":
        event.preventDefault();
        closeAndFocusTrigger();
        return;
      case "Tab":
        popover.hide();
        return;
    }

    if (event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      search(event.key);
    }
  }

  const originalOnToggle = popover.popoverProps.onToggle;
  const menuProps: MenuProps = {
    ...popover.popoverProps,
    role: "menu",
    tabindex: -1,
    "aria-labelledby": triggerId,
    get "aria-activedescendant"() {
      return activeKey.value === null ? undefined : itemId(activeKey.value);
    },
    onToggle(event) {
      menuElement = event.target as HTMLElement;
      originalOnToggle(event);
      if (event.newState === "open") {
        focusBoundary(initialDirection);
        initialDirection = "first";
        focusMenu();
      } else {
        clearTypeahead();
      }
    },
    onKeydown: onMenuKeydown,
  };

  const triggerProps: MenuTriggerProps = {
    ...popover.triggerProps,
    id: triggerId,
    "aria-controls": popover.id,
    "aria-haspopup": "menu",
    onKeydown: onTriggerKeydown,
  };

  watch(
    () => enabledItems().map(keyOf),
    (keys) => {
      if (activeKey.value !== null && !keys.includes(activeKey.value)) {
        focusBoundary("first");
      }
    },
  );

  if (getCurrentInstance()) {
    onBeforeUnmount(clearTypeahead);
  }

  return {
    id: popover.id,
    open: popover.open,
    activeKey,
    show: popover.show,
    hide: popover.hide,
    focusFirst,
    focusLast,
    triggerProps,
    menuProps,
    itemProps(item) {
      const key = keyOf(item);
      const disabled = isDisabled(item);
      return {
        id: itemId(key),
        role: "menuitem",
        tabindex: -1,
        ...(disabled ? { "aria-disabled": "true" as const } : {}),
        ...(activeKey.value === key ? { "data-active": "" as const } : {}),
        onClick: (event) => select(item, event),
        onPointermove: () => {
          if (!disabled) activeKey.value = key;
        },
      };
    },
  };
}
