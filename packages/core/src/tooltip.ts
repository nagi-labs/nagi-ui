import {
  getCurrentInstance,
  onBeforeUnmount,
  onMounted,
  ref,
  toValue,
  useId,
  watch,
  type ComponentPublicInstance,
  type CSSProperties,
  type MaybeRefOrGetter,
  type Ref,
} from "vue"

import { createAnchorPair, type AnchorArea, type AnchorOptions } from "./anchor.ts"

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
  /** Suppress hover/focus/programmatic opening. */
  disabled?: MaybeRefOrGetter<boolean>
}

interface TooltipComponentProps {
  readonly openDelay: number
  readonly closeDelay: number
  readonly disabled: boolean
  readonly area: AnchorArea
  readonly offset: number
}

export interface TooltipTriggerProps {
  /** Complete Behavior API wiring; registers the local trigger. */
  ref: (element: Element | ComponentPublicInstance | null) => void
  readonly "aria-describedby": string | undefined
  style?: CSSProperties
  onPointerenter: (event: PointerEvent) => void
  onPointerleave: (event: PointerEvent) => void
  onFocus: (event: FocusEvent) => void
  onBlur: (event: FocusEvent) => void
}

export interface TooltipProps {
  /** Complete Behavior API wiring; registers the local hint surface. */
  ref: (element: Element | ComponentPublicInstance | null) => void
  id: string
  role: "tooltip"
  style?: CSSProperties
  onPointerenter: () => void
  onPointerleave: () => void
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

export function useTooltip(options?: UseTooltipOptions): UseTooltipReturn
export function useTooltip(
  props: TooltipComponentProps,
  open: Ref<boolean>,
): UseTooltipReturn
export function useTooltip(
  optionsOrProps: UseTooltipOptions | TooltipComponentProps = {},
  componentOpen?: Ref<boolean>,
): UseTooltipReturn {
  const options: UseTooltipOptions = componentOpen
    ? {
        openDelay: (optionsOrProps as TooltipComponentProps).openDelay,
        closeDelay: (optionsOrProps as TooltipComponentProps).closeDelay,
        disabled: () => (optionsOrProps as TooltipComponentProps).disabled,
        anchor: {
          area: (optionsOrProps as TooltipComponentProps).area,
          offset: (optionsOrProps as TooltipComponentProps).offset,
        },
        open: componentOpen,
      }
    : optionsOrProps as UseTooltipOptions
  const instance = getCurrentInstance()
  const id = options.id ?? (instance ? useId() : `nagi-tooltip-${tooltipCount++}`)
  const open = options.open ?? ref(false)
  const openDelay = options.openDelay ?? 150
  const closeDelay = options.closeDelay ?? 0
  const disabled = () => toValue(options.disabled) ?? false

  let element: HintElement | null = null
  let triggerElement: HTMLElement | null = null
  let timer: ReturnType<typeof setTimeout> | null = null
  let triggerHovered = false
  let tooltipHovered = false
  let triggerFocused = false

  function resolve(): HintElement | null {
    return element?.isConnected ? element : null
  }

  function setTrigger(elementOrComponent: Element | ComponentPublicInstance | null) {
    triggerElement = elementOrComponent as HTMLElement | null
    const target = resolve()
    if (target && open.value) syncAnchor(target, true)
  }

  function setTooltip(elementOrComponent: Element | ComponentPublicInstance | null) {
    element = elementOrComponent as HintElement | null
    if (element) apply(open.value)
  }

  const anchor = options.anchor
    ? createAnchorPair(id, {
        area: "block-start",
        ...(options.anchor === true ? {} : options.anchor),
      })
    : null
  let detachAnchor: (() => void) | null = null

  function resolveTrigger(): HTMLElement | null {
    return triggerElement?.isConnected ? triggerElement : null
  }

  function syncAnchor(target: HintElement, isOpen: boolean) {
    if (!anchor || anchor.native) return
    detachAnchor?.()
    detachAnchor = null
    if (!isOpen) return
    const trigger = resolveTrigger()
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

  function scheduleOpen() {
    clearTimer()
    if (disabled() || open.value) return
    if (openDelay <= 0) {
      open.value = true
      return
    }
    timer = setTimeout(() => {
      timer = null
      if (!disabled() && (triggerHovered || triggerFocused)) open.value = true
    }, openDelay)
  }

  function scheduleClose() {
    clearTimer()
    if (triggerHovered || tooltipHovered || triggerFocused) return
    // Even a zero delay uses a task so pointerenter on the tooltip can cancel
    // a trigger pointerleave without a close/reopen flicker.
    timer = setTimeout(() => {
      timer = null
      if (!triggerHovered && !tooltipHovered && !triggerFocused) {
        open.value = false
      }
    }, Math.max(0, closeDelay))
  }

  watch(open, (next) => apply(next), { flush: "sync" })
  function reconcileDisabledState(next: boolean) {
    if (!next) return
    clearTimer()
    triggerHovered = false
    tooltipHovered = false
    triggerFocused = false
    open.value = false
  }

  watch(disabled, reconcileDisabledState, { flush: "sync", immediate: true })

  if (instance) {
    onMounted(() => apply(open.value))
    onBeforeUnmount(() => {
      clearTimer()
      detachAnchor?.()
      detachAnchor = null
    })
  }

  return {
    id,
    open,
    show: () => {
      clearTimer()
      if (!disabled()) open.value = true
    },
    hide: () => {
      clearTimer()
      open.value = false
    },
    triggerProps: {
      ref: setTrigger,
      get "aria-describedby"() {
        return disabled() ? undefined : id
      },
      ...(anchor ? { style: anchor.anchorStyle } : {}),
      onPointerenter: (event: PointerEvent) => {
        if (disabled()) return
        triggerElement = event.currentTarget as HTMLElement
        triggerHovered = true
        scheduleOpen()
      },
      onPointerleave: () => {
        triggerHovered = false
        scheduleClose()
      },
      // Focus reveals the tooltip immediately — keyboard users get no hover.
      onFocus: (event: FocusEvent) => {
        if (disabled()) return
        triggerElement = event.currentTarget as HTMLElement
        triggerFocused = true
        clearTimer()
        open.value = true
      },
      onBlur: () => {
        triggerFocused = false
        scheduleClose()
      },
    },
    tooltipProps: {
      ref: setTooltip,
      id,
      role: "tooltip",
      ...(anchor ? { style: anchor.positionedStyle } : {}),
      onPointerenter: () => {
        tooltipHovered = true
        clearTimer()
      },
      onPointerleave: () => {
        tooltipHovered = false
        scheduleClose()
      },
      onToggle: (event: ToggleEvent) => {
        element = event.target as HintElement
        const actual = event.newState === "open"
        if (!actual) clearTimer()
        syncAnchor(element, actual)
        if (open.value !== actual) open.value = actual
      },
    },
  }
}
