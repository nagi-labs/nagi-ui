import {
  getCurrentInstance,
  onBeforeUnmount,
  ref,
  useId,
  watch,
  type CSSProperties,
  type Ref,
} from "vue"

import { createAnchorPair, type AnchorOptions } from "./anchor.ts"

export interface UseTooltipOptions {
  /** External source of truth (controlled mode). */
  open?: Ref<boolean>
  /** Override the generated id (SSR-stable ids come from Vue's useId). */
  id?: string
  /** Delay before a hover opens the tooltip, ms. Default 150. */
  openDelay?: number
  /** Delay before pointer-leave closes it, ms. Default 0. */
  closeDelay?: number
  /** Anchor the tooltip to its trigger (native, Floating UI fallback). Default block-start. */
  anchor?: AnchorOptions | true
}

export interface TooltipTriggerProps {
  "aria-describedby": string
  style?: CSSProperties
  onPointerenter: () => void
  onPointerleave: () => void
  onFocus: () => void
  onBlur: () => void
}

export interface TooltipProps {
  id: string
  role: "tooltip"
  style?: CSSProperties
  onToggle: (event: ToggleEvent) => void
}

export interface UseTooltipReturn {
  id: string
  /** Reactive open state. */
  open: Ref<boolean>
  show: () => void
  hide: () => void
  /** Spread on the trigger. `popover="hint"` interaction is driven from here. */
  triggerProps: TooltipTriggerProps
  /** Spread on the tooltip element. The `popover="hint"` attribute stays in the user's template. */
  tooltipProps: TooltipProps
}

interface HintElement extends HTMLElement {
  showPopover: () => void
  hidePopover: () => void
}

let tooltipCount = 0

export function useTooltip(options: UseTooltipOptions = {}): UseTooltipReturn {
  const instance = getCurrentInstance()
  const id = options.id ?? (instance ? useId() : `nagi-tooltip-${tooltipCount++}`)
  const open = options.open ?? ref(false)
  const openDelay = options.openDelay ?? 150
  const closeDelay = options.closeDelay ?? 0

  let element: HintElement | null = null
  let timer: ReturnType<typeof setTimeout> | null = null

  function resolve(): HintElement | null {
    if (element?.isConnected) return element
    if (typeof document === "undefined") return null
    element = document.getElementById(id) as HintElement | null
    return element
  }

  const anchor = options.anchor
    ? createAnchorPair(id, {
        area: "block-start",
        ...(options.anchor === true ? {} : options.anchor),
      })
    : null
  let detachAnchor: (() => void) | null = null

  function syncAnchor(target: HintElement, isOpen: boolean) {
    if (!anchor || anchor.native) return
    detachAnchor?.()
    detachAnchor = null
    if (!isOpen || typeof document === "undefined") return
    const trigger = document.querySelector<HTMLElement>(`[aria-describedby="${id}"]`)
    if (trigger) detachAnchor = anchor.attach(trigger, target)
  }

  // Idempotent apply (CHARTER §4.4): `:popover-open` is the truth check.
  function apply(next: boolean) {
    const target = resolve()
    if (!target) return
    const isOpen = target.matches(":popover-open")
    if (isOpen === next) return
    if (next) target.showPopover()
    else target.hidePopover()
    syncAnchor(target, next)
  }

  function clearTimer() {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }

  function schedule(next: boolean, delay: number) {
    clearTimer()
    if (delay <= 0) {
      open.value = next
      return
    }
    timer = setTimeout(() => {
      timer = null
      open.value = next
    }, delay)
  }

  watch(open, (next) => apply(next), { flush: "sync" })

  if (instance) {
    onBeforeUnmount(clearTimer)
  }

  return {
    id,
    open,
    show: () => {
      clearTimer()
      open.value = true
    },
    hide: () => {
      clearTimer()
      open.value = false
    },
    triggerProps: {
      "aria-describedby": id,
      ...(anchor ? { style: anchor.anchorStyle } : {}),
      onPointerenter: () => schedule(true, openDelay),
      onPointerleave: () => schedule(false, closeDelay),
      // Focus reveals the tooltip immediately — keyboard users get no hover.
      onFocus: () => schedule(true, 0),
      onBlur: () => schedule(false, 0),
    },
    tooltipProps: {
      id,
      role: "tooltip",
      ...(anchor ? { style: anchor.positionedStyle } : {}),
      onToggle: (event: ToggleEvent) => {
        element = event.target as HintElement
        const actual = event.newState === "open"
        syncAnchor(element, actual)
        if (open.value !== actual) open.value = actual
      },
    },
  }
}
