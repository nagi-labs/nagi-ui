import {
  getCurrentInstance,
  onBeforeUnmount,
  onMounted,
  ref,
  useId,
  type Ref,
} from "vue"

export interface ToastItem {
  id: number
  message: string
}

export interface UseToastOptions {
  /** Override the generated region id. */
  id?: string
  /** Default auto-dismiss delay in ms. */
  duration?: number
}

export interface ToastRegionProps {
  id: string
  popover: "manual"
  "aria-live": "polite"
}

export interface UseToastReturn {
  id: string
  toasts: Ref<ToastItem[]>
  toast: (message: string, options?: { duration?: number }) => number
  dismiss: (toastId: number) => void
  /** Spread on the user-owned region element. `popover="manual"` — toasts must not light-dismiss. */
  regionProps: ToastRegionProps
}

let toastRegionCount = 0

export function useToast(options: UseToastOptions = {}): UseToastReturn {
  const instance = getCurrentInstance()
  const id =
    options.id ?? (instance ? useId() : `nagi-toast-${toastRegionCount++}`)
  const defaultDuration = options.duration ?? 4000
  const toasts = ref<ToastItem[]>([])
  let counter = 0

  function resolve(): HTMLElement | null {
    if (typeof document === "undefined") return null
    return document.getElementById(id)
  }

  function dismiss(toastId: number) {
    toasts.value = toasts.value.filter((item) => item.id !== toastId)
    if (toasts.value.length === 0) {
      const region = resolve()
      if (region?.matches(":popover-open")) region.hidePopover()
    }
  }

  function toast(message: string, opts: { duration?: number } = {}): number {
    const item = { id: ++counter, message }
    toasts.value = [...toasts.value, item]
    const region = resolve()
    if (region && !region.matches(":popover-open")) region.showPopover()
    const duration = opts.duration ?? defaultDuration
    if (duration > 0) setTimeout(() => dismiss(item.id), duration)
    return item.id
  }

  // Re-promotion per CHARTER §7: the top layer stacks in open order and
  // ignores z-index, so a dialog or popover opened after the region would
  // cover it. Worse, showModal() hides every open popover outright, so by
  // the time the dialog's toggle event arrives the region is already closed.
  // The condition is therefore the model (are there live toasts?), not the
  // region's current DOM state: re-show whenever a top-layer peer opens.
  function onDocumentToggle(event: Event) {
    const target = event.target
    if (!(target instanceof HTMLElement)) return
    const region = resolve()
    if (!region || target === region) return
    if ((event as ToggleEvent).newState !== "open") return
    const isTopLayerPeer =
      target.tagName === "DIALOG" || target.hasAttribute("popover")
    if (!isTopLayerPeer || toasts.value.length === 0) return
    if (region.matches(":popover-open")) region.hidePopover()
    region.showPopover()
  }

  if (instance) {
    onMounted(() => {
      document.addEventListener("toggle", onDocumentToggle, true)
    })
    onBeforeUnmount(() => {
      document.removeEventListener("toggle", onDocumentToggle, true)
    })
  } else if (typeof document !== "undefined") {
    document.addEventListener("toggle", onDocumentToggle, true)
  }

  return {
    id,
    toasts,
    toast,
    dismiss,
    regionProps: { id, popover: "manual", "aria-live": "polite" },
  }
}
