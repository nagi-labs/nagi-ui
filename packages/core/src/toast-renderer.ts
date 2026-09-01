import { nextTick, watch } from "vue"

import {
  useToast,
  type ToastItem,
  type UseToastOptions,
  type UseToastReturn,
} from "./toast.ts"

export interface ToastRendererItemProps {
  "data-scope": "toast"
  "data-part": "item"
}

export interface UseToastRendererReturn extends UseToastReturn {
  /** Spread on each direct notification item; used only for focus repair. */
  toastItemProps: ToastRendererItemProps
}

/** Adds the fixed focus-repair contract used by the package Toast renderer. */
export function useToastRenderer(options: UseToastOptions = {}): UseToastRendererReturn {
  const notifier = useToast(options)

  async function reconcileFocusedToast(next: readonly ToastItem[]) {
    const region = notifier.regionElement.value
    const document = region?.ownerDocument
    const active = document?.activeElement
    const HTMLElementConstructor = document?.defaultView?.HTMLElement
    if (
      !region
      || !HTMLElementConstructor
      || !(active instanceof HTMLElementConstructor)
      || !region.contains(active)
    ) {
      return
    }

    const focusedItem = active.closest<HTMLElement>('[data-scope="toast"][data-part="item"]')
    if (!focusedItem) {
      if (next.length === 0) {
        await nextTick()
        notifier.restoreFocus()
      }
      return
    }

    const previousItems = [
      ...region.querySelectorAll<HTMLElement>('[data-scope="toast"][data-part="item"]'),
    ]
    const focusedIndex = previousItems.indexOf(focusedItem)
    await nextTick()
    if (active.isConnected && region.contains(active)) return

    const remainingItems = [
      ...region.querySelectorAll<HTMLElement>('[data-scope="toast"][data-part="item"]'),
    ]
    if (remainingItems.length === 0) {
      notifier.restoreFocus()
      return
    }

    const nextItem = remainingItems[
      Math.min(Math.max(focusedIndex, 0), remainingItems.length - 1)
    ]
    nextItem?.querySelector<HTMLElement>("button")?.focus({ preventScroll: true })
  }

  watch(notifier.toasts, reconcileFocusedToast, { flush: "pre" })

  return {
    ...notifier,
    toastItemProps: { "data-scope": "toast", "data-part": "item" },
  }
}
