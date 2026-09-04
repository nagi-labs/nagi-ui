import { nextTick, watch } from "vue";

import { useToast, type ToastItem, type UseToastOptions, type UseToastReturn } from "./toast.ts";

export interface ToastRendererItemProps {
  "data-scope": "toast";
  "data-part": "item";
  "data-toast-id": string;
}

export interface UseToastRendererReturn extends UseToastReturn {
  /** Bind one notification identity so focus repair survives retained exit DOM. */
  toastItemProps: (item: ToastItem) => ToastRendererItemProps;
}

/** Adds the fixed focus-repair contract used by the package Toast renderer. */
export function useToastRenderer(options: UseToastOptions = {}): UseToastRendererReturn {
  const notifier = useToast(options);

  async function reconcileFocusedToast(next: readonly ToastItem[]) {
    const region = notifier.regionElement.value;
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
        notifier.restoreFocus();
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
      notifier.restoreFocus();
      return;
    }

    const nextItem = remainingItems[Math.min(Math.max(focusedIndex, 0), remainingItems.length - 1)];
    nextItem?.querySelector<HTMLElement>("button")?.focus({ preventScroll: true });
  }

  watch(notifier.toasts, reconcileFocusedToast, { flush: "pre" });

  return {
    ...notifier,
    toastItemProps(item) {
      return {
        "data-scope": "toast",
        "data-part": "item",
        "data-toast-id": item.id,
      };
    },
  };
}
