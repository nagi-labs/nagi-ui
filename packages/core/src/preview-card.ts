import {
  getCurrentInstance,
  onBeforeUnmount,
  onMounted,
  ref,
  toValue,
  useId,
  watch,
  type CSSProperties,
  type ComponentPublicInstance,
  type MaybeRefOrGetter,
  type Ref,
} from "vue"

import { createAnchorPair, type AnchorArea, type AnchorOptions } from "./anchor.ts"

export interface UsePreviewCardOptions {
  /** External source of truth (controlled mode). */
  open?: Ref<boolean>
  /** Initial state in uncontrolled mode. */
  defaultOpen?: boolean
  /** Override the generated popup id. */
  id?: string
  /** Delay before pointer or focus intent opens the preview, ms. Default 600. */
  openDelay?: number
  /** Delay before pointer and focus both leaving closes the preview, ms. Default 300. */
  closeDelay?: number
  /** Position the preview against its real link trigger. Default block-end. */
  anchor?: AnchorOptions | true
  /** Suppress preview behavior without disabling or replacing link navigation. */
  disabled?: MaybeRefOrGetter<boolean>
}

interface PreviewCardComponentProps {
  readonly openDelay: number
  readonly closeDelay: number
  readonly disabled: boolean
  readonly area: AnchorArea
  readonly offset: number
}

export interface PreviewCardTriggerProps {
  /** Vue template ref callback; it does not render a DOM attribute. */
  ref: (element: Element | ComponentPublicInstance | null) => void
  style?: CSSProperties
  onPointerenter: (event: PointerEvent) => void
  onPointerleave: (event: PointerEvent) => void
  onFocus: (event: FocusEvent) => void
  onBlur: (event: FocusEvent) => void
}

export interface PreviewCardProps {
  id: string
  /** Vue template ref callback; it does not render a DOM attribute. */
  ref: (element: Element | ComponentPublicInstance | null) => void
  style?: CSSProperties
  onPointerenter: (event: PointerEvent) => void
  onPointerleave: (event: PointerEvent) => void
  onFocusin: (event: FocusEvent) => void
  onFocusout: (event: FocusEvent) => void
  onToggle: (event: ToggleEvent) => void
}

export interface UsePreviewCardReturn {
  id: string
  open: Ref<boolean>
  show: () => void
  hide: () => void
  /** Spread on a real caller-owned `<a href>`. Contains no click handler. */
  triggerProps: PreviewCardTriggerProps
  /** Spread on the element that carries the native `popover` attribute. */
  previewProps: PreviewCardProps
}

interface NativePopoverElement extends HTMLElement {
  showPopover: () => void
  hidePopover: () => void
}

let previewCardCount = 0

export function usePreviewCard(options?: UsePreviewCardOptions): UsePreviewCardReturn
export function usePreviewCard(
  props: PreviewCardComponentProps,
  open: Ref<boolean>,
): UsePreviewCardReturn
export function usePreviewCard(
  optionsOrProps: UsePreviewCardOptions | PreviewCardComponentProps = {},
  componentOpen?: Ref<boolean>,
): UsePreviewCardReturn {
  const options: UsePreviewCardOptions = componentOpen
    ? {
        openDelay: (optionsOrProps as PreviewCardComponentProps).openDelay,
        closeDelay: (optionsOrProps as PreviewCardComponentProps).closeDelay,
        disabled: () => (optionsOrProps as PreviewCardComponentProps).disabled,
        anchor: {
          area: (optionsOrProps as PreviewCardComponentProps).area,
          offset: (optionsOrProps as PreviewCardComponentProps).offset,
        },
        open: componentOpen,
      }
    : optionsOrProps as UsePreviewCardOptions

  const instance = getCurrentInstance()
  const id = options.id ?? (instance ? useId() : `nagi-preview-card-${previewCardCount++}`)
  const open = options.open ?? ref(options.defaultOpen ?? false)
  const openDelay = options.openDelay ?? 600
  const closeDelay = options.closeDelay ?? 300
  const disabled = () => toValue(options.disabled) ?? false
  const anchor = options.anchor
    ? createAnchorPair(id, {
        area: "block-end",
        ...(options.anchor === true ? {} : options.anchor),
      })
    : null

  let triggerElement: HTMLElement | null = null
  let previewElement: NativePopoverElement | null = null
  let timer: ReturnType<typeof setTimeout> | null = null
  let detachAnchor: (() => void) | null = null
  let triggerHovered = false
  let previewHovered = false
  let triggerFocused = false
  let previewFocused = false

  function resolvePreview(): NativePopoverElement | null {
    if (previewElement?.isConnected) return previewElement
    if (typeof document === "undefined") return null
    previewElement = document.getElementById(id) as NativePopoverElement | null
    return previewElement
  }

  function syncAnchor(target: NativePopoverElement, isOpen: boolean) {
    if (!anchor || anchor.native) return
    detachAnchor?.()
    detachAnchor = null
    if (isOpen && triggerElement?.isConnected) {
      detachAnchor = anchor.attach(triggerElement, target)
    }
  }

  function apply(next: boolean) {
    const target = resolvePreview()
    if (!target) return
    const actual = target.matches(":popover-open")
    if (actual !== next) {
      if (next) target.showPopover()
      else target.hidePopover()
    }
    syncAnchor(target, next)
  }

  function clearTimer() {
    if (timer === null) return
    clearTimeout(timer)
    timer = null
  }

  function hasIntent(): boolean {
    return triggerHovered || previewHovered || triggerFocused || previewFocused
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
    if (hasIntent()) return
    // Always use a task so focusin/pointerenter on the preview can cancel the
    // trigger's leave without a close/reopen flicker.
    timer = setTimeout(() => {
      timer = null
      if (!hasIntent()) open.value = false
    }, Math.max(0, closeDelay))
  }

  function setTrigger(element: Element | ComponentPublicInstance | null) {
    triggerElement = element as HTMLElement | null
    const target = resolvePreview()
    if (target && open.value) syncAnchor(target, true)
  }

  function setPreview(element: Element | ComponentPublicInstance | null) {
    previewElement = element as NativePopoverElement | null
    if (!previewElement) {
      detachAnchor?.()
      detachAnchor = null
      return
    }
    if (open.value && !disabled()) apply(true)
  }

  watch(open, (next) => {
    if (next && disabled()) {
      open.value = false
      return
    }
    apply(next)
  }, { flush: "sync" })

  watch(disabled, (next) => {
    if (!next) return
    clearTimer()
    triggerHovered = false
    previewHovered = false
    triggerFocused = false
    previewFocused = false
    open.value = false
  }, { flush: "sync", immediate: true })

  if (instance) {
    onMounted(() => {
      if (!disabled()) apply(open.value)
    })
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
      ...(anchor ? { style: anchor.anchorStyle } : {}),
      onPointerenter: (event: PointerEvent) => {
        if (disabled() || event.pointerType === "touch") return
        triggerElement = event.currentTarget as HTMLElement
        triggerHovered = true
        scheduleOpen()
      },
      onPointerleave: (event: PointerEvent) => {
        if (event.pointerType === "touch") return
        triggerHovered = false
        scheduleClose()
      },
      onFocus: (event: FocusEvent) => {
        if (disabled()) return
        triggerElement = event.currentTarget as HTMLElement
        triggerFocused = true
        scheduleOpen()
      },
      onBlur: () => {
        triggerFocused = false
        scheduleClose()
      },
    },
    previewProps: {
      id,
      ref: setPreview,
      ...(anchor ? { style: anchor.positionedStyle } : {}),
      onPointerenter: (event: PointerEvent) => {
        if (disabled() || event.pointerType === "touch") return
        previewHovered = true
        clearTimer()
      },
      onPointerleave: (event: PointerEvent) => {
        if (event.pointerType === "touch") return
        previewHovered = false
        scheduleClose()
      },
      onFocusin: () => {
        if (disabled()) return
        previewFocused = true
        clearTimer()
      },
      onFocusout: (event: FocusEvent) => {
        const current = event.currentTarget as HTMLElement
        if (event.relatedTarget && current.contains(event.relatedTarget as Node)) return
        previewFocused = false
        scheduleClose()
      },
      onToggle: (event: ToggleEvent) => {
        previewElement = event.target as NativePopoverElement
        const actual = event.newState === "open"
        if (actual && disabled()) {
          previewElement.hidePopover()
          open.value = false
          return
        }
        if (!actual) clearTimer()
        syncAnchor(previewElement, actual)
        if (open.value !== actual) open.value = actual
      },
    },
  }
}
