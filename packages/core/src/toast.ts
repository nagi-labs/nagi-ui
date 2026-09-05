import {
  computed,
  getCurrentInstance,
  nextTick,
  readonly,
  shallowRef,
  useId,
  watch,
  type ComponentPublicInstance,
  type ComputedRef,
  type Ref,
} from "vue";

import { useToastDocumentCoordinator } from "./toast-document-coordinator.ts";

export type ToastId = string;
export type ToastTone = "neutral" | "accent" | "success" | "warning" | "danger";
export type ToastPriority = "polite" | "assertive";

export interface ToastAction {
  readonly label: string;
  readonly onClick: (toastId: ToastId) => void | Promise<void>;
}

interface ToastPresentationOptions {
  tone?: ToastTone;
  priority?: ToastPriority;
  action?: ToastAction;
  duration?: number;
}

export type ToastContentOptions = ToastPresentationOptions &
  ({ title: string; description?: string } | { title?: string; description: string });

export type ToastAddOptions = ToastContentOptions & {
  /** Supplying an existing id updates that toast in place and refreshes its timer. */
  id?: ToastId;
};

export interface ToastUpdateOptions {
  /** Pass null to remove an existing title. */
  title?: string | null;
  /** Pass null to remove an existing description. */
  description?: string | null;
  tone?: ToastTone;
  priority?: ToastPriority;
  /** Pass null to remove an existing action. */
  action?: ToastAction | null;
  duration?: number;
}

export interface ToastItem {
  readonly id: ToastId;
  /** Increments on in-place updates so assistive technology sees repeated text. */
  readonly revision: number;
  readonly title: string | undefined;
  readonly description: string | undefined;
  readonly tone: ToastTone;
  readonly priority: ToastPriority;
  readonly action: ToastAction | undefined;
  readonly duration: number;
}

export type ToastPromiseState<Value = never> =
  | string
  | ToastContentOptions
  | ((value: Value) => string | ToastContentOptions);

export interface ToastPromiseOptions<Value> {
  loading: string | ToastContentOptions;
  success: ToastPromiseState<Value>;
  error: ToastPromiseState<unknown>;
}

export interface CreateToastManagerOptions {
  /** Default auto-dismiss delay in ms. Zero keeps notifications open. */
  duration?: number;
  /** Maximum number of live notifications. The oldest closes first. */
  limit?: number;
}

export interface ToastManager {
  readonly toasts: Readonly<Ref<readonly ToastItem[]>>;
  add: (options: ToastAddOptions) => ToastId;
  update: (toastId: ToastId, options: ToastUpdateOptions) => void;
  /** Close one notification, or every notification when id is omitted. */
  close: (toastId?: ToastId) => void;
  promise: <Value>(promise: Promise<Value>, options: ToastPromiseOptions<Value>) => Promise<Value>;
  /** Used by the renderer while pointer or keyboard focus is inside the region. */
  pause: () => void;
  /** Resume auto-dismiss timers with their remaining time. */
  resume: () => void;
  /** Permanently release timers owned by this manager. */
  dispose: () => void;
}

interface TimerState {
  handle: ReturnType<typeof setTimeout> | undefined;
  remaining: number;
  startedAt: number;
}

function assertDuration(duration: number) {
  if (!Number.isFinite(duration) || duration < 0) {
    throw new RangeError("Toast duration must be a finite number greater than or equal to zero");
  }
}

function assertContent(title: string | undefined, description: string | undefined) {
  if (title === undefined && description === undefined) {
    throw new TypeError("A toast requires a title or description");
  }
}

function contentFromState<Value>(
  state: ToastPromiseState<Value>,
  value: Value,
): ToastContentOptions {
  const resolved = typeof state === "function" ? state(value) : state;
  return typeof resolved === "string" ? { description: resolved } : resolved;
}

/**
 * Creates one explicit notification owner. There is intentionally no hidden
 * singleton or provider: applications pass this object to the Toast Blueprint.
 */
export function createToastManager(options: CreateToastManagerOptions = {}): ToastManager {
  const defaultDuration = options.duration ?? 4000;
  const limit = options.limit ?? 3;
  assertDuration(defaultDuration);
  if ((!Number.isInteger(limit) || limit < 1) && limit !== Number.POSITIVE_INFINITY) {
    throw new RangeError("Toast limit must be a positive integer or Infinity");
  }

  const mutableToasts = shallowRef<readonly ToastItem[]>([]);
  const timers = new Map<ToastId, TimerState>();
  const activeGenerations = new Map<ToastId, number>();
  let counter = 0;
  let generationCounter = 0;
  let paused = false;
  let disposed = false;

  function ensureActive() {
    if (disposed) throw new Error("This toast manager has been disposed");
  }

  function nextId(): ToastId {
    let id: ToastId;
    do id = `nagi-toast-${++counter}`;
    while (mutableToasts.value.some((toast) => toast.id === id));
    return id;
  }

  function clearTimer(id: ToastId) {
    const state = timers.get(id);
    if (state?.handle !== undefined) clearTimeout(state.handle);
    timers.delete(id);
  }

  function startTimer(id: ToastId, state: TimerState) {
    state.startedAt = Date.now();
    state.handle = setTimeout(() => {
      if (timers.get(id) !== state) return;
      timers.delete(id);
      close(id);
    }, state.remaining);
  }

  function schedule(id: ToastId, duration: number) {
    assertDuration(duration);
    clearTimer(id);
    if (duration === 0) return;
    const state: TimerState = { handle: undefined, remaining: duration, startedAt: 0 };
    timers.set(id, state);
    if (!paused) startTimer(id, state);
  }

  function normalize(options: ToastAddOptions, id: ToastId): ToastItem {
    assertDuration(options.duration ?? defaultDuration);
    assertContent(options.title, options.description);
    return {
      id,
      revision: 0,
      title: options.title,
      description: options.description,
      tone: options.tone ?? "neutral",
      priority: options.priority ?? "polite",
      action: options.action ? { ...options.action } : undefined,
      duration: options.duration ?? defaultDuration,
    };
  }

  function merge(item: ToastItem, updates: ToastUpdateOptions): ToastItem {
    const next: ToastItem = {
      ...item,
      revision: item.revision + 1,
      title: updates.title === null ? undefined : (updates.title ?? item.title),
      description:
        updates.description === null ? undefined : (updates.description ?? item.description),
      tone: updates.tone ?? item.tone,
      priority: updates.priority ?? item.priority,
      action:
        updates.action === null ? undefined : updates.action ? { ...updates.action } : item.action,
      duration: updates.duration ?? item.duration,
    };
    assertDuration(next.duration);
    assertContent(next.title, next.description);
    return next;
  }

  function add(addOptions: ToastAddOptions): ToastId {
    ensureActive();
    const id = addOptions.id ?? nextId();
    const index = mutableToasts.value.findIndex((toast) => toast.id === id);
    if (index >= 0) {
      const current = mutableToasts.value[index];
      if (!current) return id;
      const next = merge(current, addOptions);
      mutableToasts.value = mutableToasts.value.map((toast) => (toast.id === id ? next : toast));
      schedule(id, next.duration);
      return id;
    }

    const item = normalize(addOptions, id);
    activeGenerations.set(id, ++generationCounter);
    mutableToasts.value = [...mutableToasts.value, item];
    schedule(id, item.duration);

    while (mutableToasts.value.length > limit) {
      const oldest = mutableToasts.value[0];
      if (!oldest) break;
      close(oldest.id);
    }
    return id;
  }

  function update(id: ToastId, updates: ToastUpdateOptions) {
    ensureActive();
    const current = mutableToasts.value.find((toast) => toast.id === id);
    if (!current) return;
    const next = merge(current, updates);
    mutableToasts.value = mutableToasts.value.map((toast) => (toast.id === id ? next : toast));
    schedule(id, next.duration);
  }

  function replace(id: ToastId, content: ToastContentOptions) {
    const current = mutableToasts.value.find((toast) => toast.id === id);
    if (!current) return;
    const next = { ...normalize(content, id), revision: current.revision + 1 };
    mutableToasts.value = mutableToasts.value.map((toast) => (toast.id === id ? next : toast));
    schedule(id, next.duration);
  }

  function close(id?: ToastId) {
    if (id === undefined) {
      for (const toast of mutableToasts.value) clearTimer(toast.id);
      mutableToasts.value = [];
      activeGenerations.clear();
      return;
    }
    if (!mutableToasts.value.some((toast) => toast.id === id)) return;
    clearTimer(id);
    mutableToasts.value = mutableToasts.value.filter((toast) => toast.id !== id);
    activeGenerations.delete(id);
  }

  function promise<Value>(
    source: Promise<Value>,
    states: ToastPromiseOptions<Value>,
  ): Promise<Value> {
    ensureActive();
    const loading = contentFromState(states.loading, undefined as never);
    const id = add({ ...loading, duration: loading.duration ?? 0 });
    const generation = activeGenerations.get(id);

    return source.then(
      (value) => {
        if (!disposed && activeGenerations.get(id) === generation) {
          const content = contentFromState(states.success, value);
          if (!disposed && activeGenerations.get(id) === generation) replace(id, content);
        }
        return value;
      },
      (error: unknown) => {
        if (!disposed && activeGenerations.get(id) === generation) {
          const content = contentFromState(states.error, error);
          if (!disposed && activeGenerations.get(id) === generation) replace(id, content);
        }
        throw error;
      },
    );
  }

  function pause() {
    if (paused || disposed) return;
    paused = true;
    const now = Date.now();
    for (const state of timers.values()) {
      if (state.handle === undefined) continue;
      clearTimeout(state.handle);
      state.handle = undefined;
      state.remaining = Math.max(0, state.remaining - (now - state.startedAt));
    }
  }

  function resume() {
    if (!paused || disposed) return;
    paused = false;
    for (const [id, state] of timers) {
      if (!mutableToasts.value.some((toast) => toast.id === id)) {
        timers.delete(id);
      } else if (state.remaining <= 0) {
        timers.delete(id);
        close(id);
      } else {
        startTimer(id, state);
      }
    }
  }

  function dispose() {
    if (disposed) return;
    close();
    disposed = true;
  }

  return {
    toasts: readonly(mutableToasts),
    add,
    update,
    close,
    promise,
    pause,
    resume,
    dispose,
  };
}

export interface UseToastOptions extends CreateToastManagerOptions {
  /** Override the generated region id. */
  id?: string | undefined;
  /** Connect an application-owned manager instead of creating a local one. */
  manager?: ToastManager | undefined;
  /** Accessible name for the keyboard-reachable notification region. */
  label?: string | undefined;
}

export interface ToastRegionProps {
  ref: (element: Element | ComponentPublicInstance | null) => void;
  id: string;
  popover: "manual";
  role: "region";
  "aria-label": string;
  "aria-keyshortcuts": "F6";
  tabindex: -1;
  onFocusin: () => void;
  onFocusout: (event: FocusEvent) => void;
  onPointerenter: () => void;
  onPointerleave: () => void;
}

export interface ToastItemProps {
  "data-scope": "toast";
  "data-part": "item";
  "data-toast-id": string;
}

export interface ToastActionProps {
  onClick: () => void | Promise<unknown>;
}

export interface UseToastReturn {
  id: string;
  manager: ToastManager;
  regionElement: Readonly<Ref<HTMLElement | null>>;
  toasts: Readonly<Ref<readonly ToastItem[]>>;
  add: ToastManager["add"];
  update: ToastManager["update"];
  close: ToastManager["close"];
  promise: ToastManager["promise"];
  /** Compatibility alias for the original message-only API. */
  toast: (message: string, options?: { duration?: number }) => ToastId;
  /** Compatibility alias for close(id). */
  dismiss: (toastId: ToastId) => void;
  restoreFocus: () => void;
  /** Newest-first order used by the visible notification stack. */
  visibleToasts: ComputedRef<readonly ToastItem[]>;
  /** Spread on the user-owned manual-popover region. */
  regionProps: ToastRegionProps;
  /** Bind one notification identity so focus repair survives retained exit DOM. */
  toastItemProps: (item: ToastItem) => ToastItemProps;
  /** Bind the optional action to its notification identity. */
  actionProps: (item: ToastItem) => ToastActionProps;
  /** Compose the complete text announced by the live region for one notification. */
  announcementText: (item: ToastItem) => string;
}

export function useToast(options: UseToastOptions = {}): UseToastReturn {
  const instance = getCurrentInstance();
  if (!instance) {
    throw new Error(
      "useToast must run during Vue setup; use createToastManager outside components",
    );
  }
  const id = options.id ?? useId();
  const ownsManager = options.manager === undefined;
  const manager =
    options.manager ??
    createToastManager({
      ...(options.duration === undefined ? {} : { duration: options.duration }),
      ...(options.limit === undefined ? {} : { limit: options.limit }),
    });
  const coordinator = useToastDocumentCoordinator({
    id,
    label: options.label ?? "Notifications",
    manager,
    ownsManager,
  });
  const visibleToasts = computed(() => [...manager.toasts.value].reverse());

  async function reconcileFocusedToast(next: readonly ToastItem[]) {
    const region = coordinator.regionElement.value;
    const document = region?.ownerDocument;
    const active = document?.activeElement;
    const HTMLElementConstructor = document?.defaultView?.HTMLElement;
    if (
      !region ||
      !HTMLElementConstructor ||
      !(active instanceof HTMLElementConstructor) ||
      !region.contains(active)
    ) {
      return;
    }

    const focusedItem = active.closest<HTMLElement>('[data-scope="toast"][data-part="item"]');
    if (!focusedItem) {
      if (next.length === 0) {
        await nextTick();
        coordinator.restoreFocus();
      }
      return;
    }

    const previousItems = [
      ...region.querySelectorAll<HTMLElement>('[data-scope="toast"][data-part="item"]'),
    ];
    const focusedIndex = previousItems.indexOf(focusedItem);
    const focusedItemRemains = next.some((item) => item.id === focusedItem.dataset.toastId);
    await nextTick();
    if (focusedItemRemains && active.isConnected && region.contains(active)) return;

    const remainingItems = [
      ...region.querySelectorAll<HTMLElement>('[data-scope="toast"][data-part="item"]'),
    ].filter((item) => next.some((toast) => toast.id === item.dataset.toastId));
    if (remainingItems.length === 0) {
      coordinator.restoreFocus();
      return;
    }

    const nextItem = remainingItems[Math.min(Math.max(focusedIndex, 0), remainingItems.length - 1)];
    nextItem?.querySelector<HTMLElement>("button")?.focus({ preventScroll: true });
  }

  watch(manager.toasts, reconcileFocusedToast, { flush: "pre" });

  return {
    id,
    manager,
    regionElement: coordinator.regionElement,
    toasts: manager.toasts,
    add: manager.add,
    update: manager.update,
    close: manager.close,
    promise: manager.promise,
    toast(message, toastOptions = {}) {
      return manager.add({
        description: message,
        ...(toastOptions.duration === undefined ? {} : { duration: toastOptions.duration }),
      });
    },
    dismiss(toastId) {
      manager.close(toastId);
    },
    restoreFocus: coordinator.restoreFocus,
    visibleToasts,
    regionProps: coordinator.regionProps,
    toastItemProps(item) {
      return {
        "data-scope": "toast",
        "data-part": "item",
        "data-toast-id": item.id,
      };
    },
    actionProps(item) {
      return {
        onClick() {
          return item.action?.onClick(item.id);
        },
      };
    },
    announcementText(item) {
      return [item.title, item.description].filter(Boolean).join(". ");
    },
  };
}
