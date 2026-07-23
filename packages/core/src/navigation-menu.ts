import {
  computed,
  getCurrentInstance,
  nextTick,
  onBeforeUnmount,
  ref,
  toValue,
  useId,
  watch,
  type ComputedRef,
  type CSSProperties,
  type MaybeRefOrGetter,
  type Ref,
} from "vue";

import { createAnchorPair, type AnchorPair } from "./anchor.ts";
import { modelValueAccepted, requestModelValue, type WritableRef } from "./model-sync.ts";
import { usePopover, type PopoverProps } from "./popover.ts";

export interface UseNavigationMenuOptions<Item, Key extends string = string> {
  items: MaybeRefOrGetter<readonly Item[]>;
  getKey: (item: Item) => Key;
  hasPanel: (item: Item) => boolean;
  label: MaybeRefOrGetter<string>;
  open?: WritableRef<boolean>;
  closeDelay?: number;
  id?: string;
}

export interface NavigationMenuTriggerProps {
  id: string;
  type: "button";
  popovertarget: string;
  popovertargetaction: "show";
  "aria-controls": string;
  "aria-expanded": "true" | "false";
  style?: CSSProperties;
  onClick: (event: MouseEvent) => void;
  onPointerenter: (event: PointerEvent) => void;
  onFocus: (event: FocusEvent) => void;
  onKeydown: (event: KeyboardEvent) => void;
}

export interface NavigationMenuBinding<Item, Key extends string = string> {
  activeKey: Ref<Key | null>;
  activeItem: ComputedRef<Item | null>;
  navProps: {
    id: string;
    "aria-label": string;
    onPointerleave: () => void;
    onPointerover: (event: PointerEvent) => void;
    onFocusout: (event: FocusEvent) => void;
  };
  navigationTriggerProps: (item: Item) => NavigationMenuTriggerProps;
  popupProps: PopoverProps & {
    "aria-labelledby": string;
    onKeydownCapture: (event: KeyboardEvent) => void;
  };
  positionStyle: ComputedRef<CSSProperties>;
  close: (restoreFocus?: boolean) => void;
}

interface NavigationMenuComponentItem { readonly key: string; readonly children?: readonly unknown[] }
export interface NavigationMenuComponentProps<Item extends NavigationMenuComponentItem> {
  readonly items: readonly Item[];
  readonly label: string;
  readonly closeDelay: number;
}

type OpenCause = "hover" | "focus" | "activation" | "external";

let navigationMenuCount = 0;

function createNavigationMenu<Item, Key extends string>(
  options: UseNavigationMenuOptions<Item, Key>,
): NavigationMenuBinding<Item, Key> {
  const instance = getCurrentInstance();
  const id = options.id ?? (instance ? useId() : `nagi-navigation-menu-${navigationMenuCount++}`);
  const popover = usePopover({ ...(options.open ? { open: options.open } : {}), id: `${id}-popup` });
  const activeKey = ref<Key | null>(null) as Ref<Key | null>;
  let pendingKey: Key | null = null;
  let pendingCause: OpenCause = "external";
  const openCause = ref<OpenCause | null>(null);
  let restoreKey: Key | null = null;
  let ownerDocument: Document | null = typeof document === "undefined" ? null : document;
  let popupElement: HTMLElement | null = null;
  let detachAnchor: (() => void) | null = null;
  let closeTimer: ReturnType<typeof setTimeout> | null = null;
  let requestRevision = 0;
  let pointerPreviewKey: Key | null = null;
  let focusPreviewKey: Key | null = null;
  let closingFocusKey: Key | null = null;
  let suppressedFocusOpenKey: Key | null = null;
  const anchors = new Map<Key, AnchorPair>();

  const items = () => toValue(options.items);
  const keyOf = (item: Item) => options.getKey(item);
  const itemFor = (key: Key | null) => items().find((item) => keyOf(item) === key);
  const panelItems = () => items().filter(options.hasPanel);
  const triggerIdForKey = (key: Key) => `${id}-trigger-${encodeURIComponent(key)}`;
  const triggerId = (item: Item) => triggerIdForKey(keyOf(item));
  const activeItem = computed(() => itemFor(activeKey.value) ?? null);

  function anchorFor(item: Item) {
    const key = keyOf(item);
    let anchor = anchors.get(key);
    if (!anchor) {
      anchor = createAnchorPair(`${id}-${encodeURIComponent(key)}`, { area: "block-end" });
      anchors.set(key, anchor);
    }
    return anchor;
  }

  function clearClose() {
    if (closeTimer) clearTimeout(closeTimer);
    closeTimer = null;
  }

  function syncAnchor(item: Item | null, isOpen = popover.open.value) {
    detachAnchor?.();
    detachAnchor = null;
    if (!item || !isOpen || !popupElement) return;
    const anchor = anchorFor(item);
    if (anchor.native) return;
    const trigger = ownerDocument?.getElementById(triggerId(item));
    if (trigger) detachAnchor = anchor.attach(trigger, popupElement);
  }

  function commit(item: Item, cause: OpenCause) {
    clearClose();
    pendingKey = null;
    activeKey.value = keyOf(item);
    openCause.value = cause;
    void nextTick(() => {
      if (popover.open.value && activeKey.value === keyOf(item)) syncAnchor(item);
    });
  }

  function requestOpen(item: Item, cause: OpenCause) {
    if (!options.hasPanel(item)) return;
    clearClose();
    if (popover.open.value) {
      if (activeKey.value === keyOf(item) && openCause.value === "activation" && cause !== "activation") return;
      commit(item, cause);
      return;
    }
    const revision = ++requestRevision;
    pendingKey = keyOf(item);
    pendingCause = cause;
    void requestModelValue(popover.open, true).then((accepted) => {
      if (revision !== requestRevision || accepted) return;
      pendingKey = null;
    });
  }

  function close(restoreFocus = false) {
    clearClose();
    const revision = ++requestRevision;
    restoreKey = restoreFocus ? activeKey.value : null;
    const requestedRestoreKey = restoreKey;
    if (restoreKey !== null) {
      // hidePopover() may synchronously restore the invoker before the model
      // watcher runs. Keep this transaction guard separate from the one-shot
      // guard used by our accepted-close focus repair.
      closingFocusKey = restoreKey;
      focusPreviewKey = null;
    }
    popover.hide();
    void modelValueAccepted(popover.open, false).then((accepted) => {
      if (revision !== requestRevision || accepted) return;
      restoreKey = null;
      if (closingFocusKey === requestedRestoreKey) closingFocusKey = null;
    });
  }

  function reconcilePreviewExit() {
    clearClose();
    if (!popover.open.value) return;
    if (openCause.value === "activation" || openCause.value === "external") return;

    const focused = itemFor(focusPreviewKey);
    if (focused && options.hasPanel(focused)) {
      requestOpen(focused, "focus");
      return;
    }
    const pointed = itemFor(pointerPreviewKey);
    if (pointed && options.hasPanel(pointed)) {
      requestOpen(pointed, "hover");
      return;
    }
    closeTimer = setTimeout(() => close(), options.closeDelay ?? 150);
  }

  const popupProps = Object.defineProperties(
    {},
    Object.getOwnPropertyDescriptors(popover.popoverProps),
  ) as PopoverProps & {
    "aria-labelledby": string;
    onKeydownCapture: (event: KeyboardEvent) => void;
  };
  Object.defineProperty(popupProps, "aria-labelledby", {
    enumerable: true,
    get: () => activeItem.value ? triggerId(activeItem.value) : id,
  });
  popupProps.onKeydownCapture = (event) => {
    if (event.key !== "Escape" || !popover.open.value) return;
    event.preventDefault();
    event.stopPropagation();
    close(true);
  };
  const baseToggle = popupProps.onToggle;
  popupProps.onToggle = (event) => {
    ownerDocument = (event.target as HTMLElement).ownerDocument;
    popupElement = event.target as HTMLElement;
    baseToggle(event);
    syncAnchor(activeItem.value, event.newState === "open");
  };

  watch(popover.open, (isOpen) => {
    if (isOpen) {
      const candidate = itemFor(pendingKey) ?? activeItem.value ?? panelItems()[0];
      if (candidate && options.hasPanel(candidate)) commit(candidate, pendingKey !== null ? pendingCause : "external");
      else void requestModelValue(popover.open, false);
      return;
    }
    const focusKey = restoreKey;
    activeKey.value = null;
    pendingKey = null;
    openCause.value = null;
    restoreKey = null;
    closingFocusKey = null;
    suppressedFocusOpenKey = null;
    detachAnchor?.();
    detachAnchor = null;
    if (focusKey !== null) {
      suppressedFocusOpenKey = focusKey;
      void nextTick(() => {
        ownerDocument?.getElementById(triggerIdForKey(focusKey))?.focus({ preventScroll: true });
        if (suppressedFocusOpenKey === focusKey) suppressedFocusOpenKey = null;
      });
    }
  }, { flush: "sync", immediate: true });

  watch(
    () => items().map((item) => ({ key: keyOf(item), panel: options.hasPanel(item) })),
    (snapshot) => {
      const livePanelKeys = snapshot.filter((entry) => entry.panel).map((entry) => entry.key);
      if (pointerPreviewKey !== null && !livePanelKeys.includes(pointerPreviewKey)) pointerPreviewKey = null;
      if (focusPreviewKey !== null && !livePanelKeys.includes(focusPreviewKey)) focusPreviewKey = null;
      if (!popover.open.value) return;
      const owner = snapshot.find((entry) => entry.key === activeKey.value);
      if (owner?.panel) return;
      const next = panelItems()[0];
      if (next) commit(next, "external");
      else close();
    },
    { flush: "sync" },
  );

  if (instance) {
    onBeforeUnmount(() => {
      clearClose();
      detachAnchor?.();
      detachAnchor = null;
    });
  }

  return {
    activeKey,
    activeItem,
    navProps: {
      id,
      get "aria-label"() { return toValue(options.label); },
      onPointerleave() {
        pointerPreviewKey = null;
        reconcilePreviewExit();
      },
      onPointerover(event) {
        if (event.pointerType === "touch") return;
        const target = event.target as Node | null;
        if (!target || popupElement?.contains(target)) return;
        const pointedTrigger = panelItems().find((item) =>
          ownerDocument?.getElementById(triggerId(item))?.contains(target));
        if (pointedTrigger) {
          pointerPreviewKey = keyOf(pointedTrigger);
          return;
        }
        if (pointerPreviewKey !== null) {
          pointerPreviewKey = null;
          reconcilePreviewExit();
        }
      },
      onFocusout(event) {
        const next = event.relatedTarget as Node | null;
        const owner = event.currentTarget as HTMLElement;
        if (!next || !owner.contains(next)) {
          focusPreviewKey = null;
          reconcilePreviewExit();
          return;
        }
        const focusedTrigger = panelItems().find((item) =>
          ownerDocument?.getElementById(triggerId(item)) === next);
        if (focusedTrigger) focusPreviewKey = keyOf(focusedTrigger);
        else if (popupElement?.contains(next)) focusPreviewKey = activeKey.value;
        else focusPreviewKey = null;
        reconcilePreviewExit();
      },
    },
    navigationTriggerProps(item) {
      const key = keyOf(item);
      return {
        id: triggerId(item),
        type: "button",
        popovertarget: popover.id,
        popovertargetaction: "show",
        "aria-controls": popover.id,
        get "aria-expanded"() { return popover.open.value && activeKey.value === key ? "true" : "false"; },
        style: anchorFor(item).anchorStyle,
        onClick(event) {
          ownerDocument = (event.currentTarget as HTMLElement).ownerDocument;
          // Avoid a rejected controlled write flashing the native popover.
          // usePopover applies the accepted model transition imperatively.
          event.preventDefault();
          if (popover.open.value && activeKey.value === key && openCause.value === "activation") {
            close();
          } else requestOpen(item, "activation");
        },
        onPointerenter(event) {
          if (event.pointerType === "touch") return;
          ownerDocument = (event.currentTarget as HTMLElement).ownerDocument;
          pointerPreviewKey = key;
          requestOpen(item, "hover");
        },
        onFocus(event) {
          ownerDocument = (event.currentTarget as HTMLElement).ownerDocument;
          if (closingFocusKey === key) {
            focusPreviewKey = null;
            return;
          }
          if (suppressedFocusOpenKey === key) {
            suppressedFocusOpenKey = null;
            focusPreviewKey = null;
            return;
          }
          focusPreviewKey = key;
          requestOpen(item, "focus");
        },
        onKeydown(event) {
          if (event.key === "Escape" && popover.open.value) {
            event.preventDefault();
            close(true);
          } else if (event.key === "ArrowDown") {
            event.preventDefault();
            requestOpen(item, "activation");
          }
        },
      };
    },
    popupProps,
    positionStyle: computed(() => activeItem.value ? anchorFor(activeItem.value).positionedStyle : {}),
    close,
  };
}

export function useNavigationMenu<Item, Key extends string = string>(
  options: UseNavigationMenuOptions<Item, Key>,
): NavigationMenuBinding<Item, Key>;
export function useNavigationMenu<Item extends NavigationMenuComponentItem>(
  props: NavigationMenuComponentProps<Item>,
  open: Ref<boolean>,
): NavigationMenuBinding<Item, string>;
export function useNavigationMenu<Item, Key extends string = string>(
  optionsOrProps: UseNavigationMenuOptions<Item, Key> | NavigationMenuComponentProps<Item & NavigationMenuComponentItem>,
  open?: Ref<boolean>,
): NavigationMenuBinding<Item, Key> {
  if (!open) return createNavigationMenu(optionsOrProps as UseNavigationMenuOptions<Item, Key>);
  const props = optionsOrProps as NavigationMenuComponentProps<Item & NavigationMenuComponentItem>;
  return createNavigationMenu({
    items: () => props.items,
    getKey: (item) => item.key as Key,
    hasPanel: (item) => (item.children?.length ?? 0) > 0,
    label: () => props.label,
    open,
    closeDelay: props.closeDelay,
  }) as unknown as NavigationMenuBinding<Item, Key>;
}
