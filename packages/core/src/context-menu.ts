import {
  computed,
  getCurrentInstance,
  nextTick,
  onBeforeUnmount,
  ref,
  useId,
  watch,
  type CSSProperties,
  type ComponentPublicInstance,
  type ComputedRef,
  type Ref,
} from "vue";

import { createAnchorPair } from "./anchor.ts";
import { useMenu, type UseMenuOptions, type UseMenuReturn } from "./menu.ts";
import { requestModelValue, type WritableRef } from "./model-sync.ts";

export interface UseContextMenuOptions<Item, Key extends string = string>
  extends Omit<UseMenuOptions<Item, Key>, "anchor" | "restoreFocus" | "open"> {
  open?: WritableRef<boolean>;
  longPressDelay?: number;
}

export interface ContextMenuTriggerProps {
  /** Vue template ref callback; it does not render a DOM attribute. */
  ref: (element: Element | ComponentPublicInstance | null) => void;
  onClickCapture: (event: MouseEvent) => void;
  onContextmenu: (event: MouseEvent) => void;
  onPointerdown: (event: PointerEvent) => void;
  onPointermove: (event: PointerEvent) => void;
  onPointerup: (event: PointerEvent) => void;
  onPointercancel: (event: PointerEvent) => void;
}

export interface ContextMenuAnchorProps {
  /** Vue template ref callback; it does not render a DOM attribute. */
  ref: (element: Element | ComponentPublicInstance | null) => void;
}

export interface ContextMenuBinding<Item, Key extends string = string> {
  menu: UseMenuReturn<Item, Key>;
  anchorProps: ContextMenuAnchorProps;
  contextTriggerProps: ContextMenuTriggerProps;
  anchorStyle: ComputedRef<CSSProperties>;
  positionStyle: ComputedRef<CSSProperties>;
  setContextElement: (element: HTMLElement | null) => void;
  setAnchorElement: (element: HTMLElement | null) => void;
}

interface ContextMenuComponentItem {
  readonly key: string;
  readonly label: string;
  readonly disabled?: boolean;
}

export interface ContextMenuComponentProps<Item extends ContextMenuComponentItem> {
  readonly items: readonly Item[];
  readonly dir: "ltr" | "rtl";
  readonly loop: boolean;
  readonly longPressDelay: number;
}

export interface ContextMenuComponentModel<Item> {
  open: Ref<boolean>;
  onSelect?: (item: Item) => void;
}

interface Invocation {
  point: { x: number; y: number };
  target: HTMLElement | null;
  followsTarget: boolean;
}

type PressState =
  | { kind: "idle" }
  | { kind: "pressing"; pointerId: number; start: { x: number; y: number }; intent: Invocation }
  | { kind: "opening"; pointerId: number; intent: Invocation }
  | { kind: "opened"; pointerId: number; intent: Invocation };

let contextMenuCount = 0;

function createContextMenu<Item, Key extends string>(
  options: UseContextMenuOptions<Item, Key>,
): ContextMenuBinding<Item, Key> {
  const instance = getCurrentInstance();
  const id = options.id ?? (instance ? useId() : `nagi-context-menu-${contextMenuCount++}`);
  const point = ref({ x: 0, y: 0 });
  const anchor = createAnchorPair(`${id}-point`, { area: "block-end", offset: 0 });

  let contextElement: HTMLElement | null = null;
  let anchorElement: HTMLElement | null = null;
  let popupElement: HTMLElement | null = null;
  let pending: Invocation | null = null;
  let session: Invocation | null = null;
  let lastRestoreTarget: HTMLElement | null = null;
  let press: PressState = { kind: "idle" };
  let pressTimer: ReturnType<typeof setTimeout> | null = null;
  let openTask: ReturnType<typeof setTimeout> | null = null;
  let detachAnchor: (() => void) | null = null;
  let followFrame: number | null = null;
  let followView: Window | null = null;
  let requestRevision = 0;
  let suppressClick = false;
  let releaseIntent: Invocation | null = null;
  let settlingNativeToggle = false;

  const menu = useMenu({
    ...options,
    id,
    restoreFocus() {
      lastRestoreTarget?.focus({ preventScroll: true });
    },
  });

  const anchorProps: ContextMenuAnchorProps = {
    ref: (element) => setAnchorElement(element as HTMLElement | null),
  };

  function syncAnchor(isOpen = menu.open.value) {
    detachAnchor?.();
    detachAnchor = null;
    if (!isOpen || anchor.native || !anchorElement || !popupElement) return;
    detachAnchor = anchor.attach(anchorElement, popupElement);
  }

  const baseToggle = menu.menuProps.onToggle;
  menu.menuProps.onToggle = (event) => {
    popupElement = event.target as HTMLElement;
    const previous = settlingNativeToggle;
    settlingNativeToggle = true;
    try {
      baseToggle(event);
    } finally {
      settlingNativeToggle = previous;
    }
    syncAnchor(event.newState === "open");
  };

  function pointFor(element: HTMLElement | null): { x: number; y: number } {
    const rect = element?.getBoundingClientRect();
    if (!rect) return { x: 8, y: 8 };
    return {
      x: rect.left + Math.min(16, rect.width / 2),
      y: rect.top + Math.min(16, rect.height / 2),
    };
  }

  function focusTarget(event: Event): HTMLElement | null {
    const target = event.target as HTMLElement | null;
    const focusable = target?.closest<HTMLElement>(
      "button, a[href], input, select, textarea, [contenteditable], [tabindex]:not([tabindex='-1'])",
    );
    const active = target?.ownerDocument.activeElement as HTMLElement | null;
    return focusable
      ?? (active && active !== target?.ownerDocument.body ? active : null)
      ?? contextElement;
  }

  function fallbackInvocation(): Invocation {
    const active = contextElement?.ownerDocument.activeElement as HTMLElement | null;
    const target = active && contextElement?.contains(active) ? active : contextElement;
    return { point: pointFor(target), target, followsTarget: true };
  }

  function stopFollowingTarget() {
    if (followFrame !== null) followView?.cancelAnimationFrame(followFrame);
    followFrame = null;
    followView = null;
  }

  function followTarget(intent: Invocation) {
    stopFollowingTarget();
    const view = intent.followsTarget ? intent.target?.ownerDocument.defaultView : null;
    if (!view) return;
    followView = view;
    const update = () => {
      followFrame = null;
      if (!menu.open.value || session !== intent) return;
      const next = pointFor(intent.target);
      if (next.x !== point.value.x || next.y !== point.value.y) point.value = next;
      followFrame = view.requestAnimationFrame(update);
    };
    followFrame = view.requestAnimationFrame(update);
  }

  function commit(intent: Invocation) {
    session = intent;
    pending = null;
    lastRestoreTarget = intent.target;
    point.value = intent.point;
    followTarget(intent);
    void nextTick(() => {
      if (!menu.open.value) return;
      syncAnchor();
      menu.focusFirst();
    });
  }

  function requestOpen(intent: Invocation): Promise<boolean> {
    const revision = ++requestRevision;
    pending = intent;
    if (menu.open.value) {
      commit(intent);
      menu.focusFirst();
      return Promise.resolve(true);
    }
    return requestModelValue(menu.open, true).then((accepted) => {
      if (revision !== requestRevision) return false;
      if (!accepted) pending = null;
      return accepted;
    });
  }

  function cancelPress() {
    if (pressTimer) clearTimeout(pressTimer);
    pressTimer = null;
    press = { kind: "idle" };
  }

  function dispose() {
    cancelPress();
    if (openTask) clearTimeout(openTask);
    openTask = null;
    releaseIntent = null;
    stopFollowingTarget();
    detachAnchor?.();
    detachAnchor = null;
  }

  if (instance) onBeforeUnmount(dispose);

  function reconcileOpenSession(isOpen: boolean) {
    if (isOpen) {
      commit(pending ?? fallbackInvocation());
      if (press.kind === "opening") {
        press = { kind: "opened", pointerId: press.pointerId, intent: press.intent };
      }
      return;
    }
    // Only a pointerup handler can authorize reasserting a popover that the
    // same release light-dismissed. Any earlier native close (outside click,
    // Escape, or an external controller) terminates the long-press session.
    const preserveRecognizedRelease = settlingNativeToggle && releaseIntent !== null;
    if (!preserveRecognizedRelease) {
      cancelPress();
      if (openTask) clearTimeout(openTask);
      openTask = null;
      releaseIntent = null;
      suppressClick = false;
    }
    ++requestRevision;
    pending = null;
    session = null;
    stopFollowingTarget();
    detachAnchor?.();
    detachAnchor = null;
  }

  watch(menu.open, reconcileOpenSession, { flush: "sync", immediate: true });

  function setContextElement(element: HTMLElement | null) {
    contextElement = element;
    if (element && menu.open.value && (!session || session.target === null)) commit(fallbackInvocation());
  }

  function setAnchorElement(element: HTMLElement | null) {
    anchorElement = element;
    syncAnchor();
  }

  return {
    menu,
    anchorProps,
    setContextElement,
    setAnchorElement,
    anchorStyle: computed(() => ({
      ...anchor.anchorStyle,
      position: "fixed",
      inset: "auto",
      left: `${point.value.x}px`,
      top: `${point.value.y}px`,
      inlineSize: "0",
      blockSize: "0",
      pointerEvents: "none",
    })),
    positionStyle: computed(() => anchor.positionedStyle),
    contextTriggerProps: {
      ref: (element) => setContextElement(element as HTMLElement | null),
      onClickCapture(event) {
        if (!suppressClick) return;
        suppressClick = false;
        event.preventDefault();
        event.stopPropagation();
      },
      onContextmenu(event) {
        event.preventDefault();
        cancelPress();
        releaseIntent = null;
        suppressClick = false;
        if (openTask) clearTimeout(openTask);
        const target = focusTarget(event);
        const followsTarget = event.detail === 0 && event.clientX === 0 && event.clientY === 0;
        const intent = {
          point: followsTarget ? pointFor(target) : { x: event.clientX, y: event.clientY },
          target,
          followsTarget,
        };
        // The right-button pointerup follows contextmenu in Chromium. Opening
        // in the next task prevents that pointerup from dismissing the new
        // native auto popover in the same gesture.
        openTask = setTimeout(() => {
          openTask = null;
          void requestOpen(intent);
        }, 0);
      },
      onPointerdown(event) {
        suppressClick = false;
        if (event.pointerType !== "touch" || event.button !== 0) return;
        cancelPress();
        const intent = {
          point: { x: event.clientX, y: event.clientY },
          target: focusTarget(event),
          followsTarget: false,
        };
        press = {
          kind: "pressing",
          pointerId: event.pointerId,
          start: intent.point,
          intent,
        };
        pressTimer = setTimeout(() => {
          if (press.kind !== "pressing" || press.pointerId !== event.pointerId) return;
          const opening = { kind: "opening", pointerId: event.pointerId, intent: press.intent } as const;
          press = opening;
          pressTimer = null;
          void requestOpen(opening.intent).then((accepted) => {
            if (press.kind !== "opening" || press.pointerId !== opening.pointerId) return;
            if (accepted) press = { kind: "opened", pointerId: opening.pointerId, intent: opening.intent };
            else cancelPress();
          });
        }, options.longPressDelay ?? 600);
      },
      onPointermove(event) {
        if (press.kind !== "pressing" || press.pointerId !== event.pointerId) return;
        if (Math.hypot(event.clientX - press.start.x, event.clientY - press.start.y) > 10) cancelPress();
      },
      onPointerup(event) {
        if (event.pointerType !== "touch" || press.kind === "idle" || press.pointerId !== event.pointerId) return;
        const recognized = press.kind === "opened" ? press.intent : null;
        cancelPress();
        if (!recognized) return;
        suppressClick = true;
        releaseIntent = recognized;
        // A pointerup that began before an auto popover opened may light-dismiss
        // it. Reassert only this recognized session after that native event.
        openTask = setTimeout(() => {
          openTask = null;
          if (releaseIntent !== recognized) return;
          releaseIntent = null;
          if (!menu.open.value) void requestOpen(recognized);
        }, 0);
      },
      onPointercancel(event) {
        if (event.pointerType !== "touch" || press.kind === "idle" || press.pointerId !== event.pointerId) return;
        const opened = press.kind === "opened" || (press.kind === "opening" && menu.open.value);
        cancelPress();
        if (opened) menu.hide();
      },
    },
  };
}

export function useContextMenu<Item, Key extends string = string>(
  options: UseContextMenuOptions<Item, Key>,
): ContextMenuBinding<Item, Key>;
export function useContextMenu<Item extends ContextMenuComponentItem>(
  props: ContextMenuComponentProps<Item>,
  model: ContextMenuComponentModel<Item>,
): ContextMenuBinding<Item, string>;
export function useContextMenu<Item, Key extends string = string>(
  optionsOrProps: UseContextMenuOptions<Item, Key> | ContextMenuComponentProps<Item & ContextMenuComponentItem>,
  model?: ContextMenuComponentModel<Item>,
): ContextMenuBinding<Item, Key> {
  if (!model) return createContextMenu(optionsOrProps as UseContextMenuOptions<Item, Key>);
  const props = optionsOrProps as ContextMenuComponentProps<Item & ContextMenuComponentItem>;
  return createContextMenu<Item & ContextMenuComponentItem, Key>({
    items: () => props.items,
    getKey: (item) => item.key as Key,
    getTextValue: (item) => item.label,
    isDisabled: (item) => item.disabled ?? false,
    open: model.open,
    ...(model.onSelect ? { onSelect: (item) => model.onSelect?.(item as Item) } : {}),
    dir: props.dir,
    loop: props.loop,
    longPressDelay: props.longPressDelay,
  }) as unknown as ContextMenuBinding<Item, Key>;
}
