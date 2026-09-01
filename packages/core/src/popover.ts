import {
  getCurrentInstance,
  onBeforeUnmount,
  onMounted,
  ref,
  useId,
  watch,
  type ComponentPublicInstance,
  type CSSProperties,
  type ObjectDirective,
  type Ref,
} from "vue"

import { createAnchorPair, type AnchorArea, type AnchorOptions } from "./anchor.ts"
import { requestModelValue } from "./model-sync.ts"

export interface UsePopoverOptions {
  /**
   * External source of truth (controlled mode, `v-model:open`).
   * UA-initiated transitions (trigger click, light dismiss, ESC) are mirrored
   * into this ref; writes to it are applied to the UA imperatively.
   */
  open?: Ref<boolean>
  /** Initial state in uncontrolled mode. */
  defaultOpen?: boolean
  /** Override the generated id (SSR-stable ids come from Vue's useId). */
  id?: string
  /** Kind of popup controlled by the trigger, when the target has a specific role. */
  hasPopup?: "dialog" | "grid" | "listbox" | "menu" | "tree"
  /**
   * Position the popover against its trigger: native CSS Anchor Positioning
   * where supported, Floating UI fallback otherwise (CHARTER §5).
   */
  anchor?: AnchorOptions | true
}

interface PopoverComponentProps {
  readonly area: AnchorArea
  readonly offset: number
}

export interface PopoverTriggerProps {
  /** Complete Behavior API wiring; registers the local invoker for anchoring. */
  ref: (element: Element | ComponentPublicInstance | null) => void
  popovertarget: string
  "aria-haspopup"?: "dialog" | "grid" | "listbox" | "menu" | "tree"
  style?: CSSProperties
}

export interface PopoverProps {
  /** Complete Behavior API wiring; registers the local native surface. */
  ref: (element: Element | ComponentPublicInstance | null) => void
  id: string
  style?: CSSProperties
  onToggle: (event: ToggleEvent) => void
}

export interface UsePopoverReturn {
  id: string
  /** Reactive open state. Writable in both modes. */
  open: Ref<boolean>
  show: () => void
  hide: () => void
  toggle: () => void
  /** Focus the locally registered invoker without rediscovering it from `document`. */
  focusTrigger: () => void
  /** Root containing the locally registered invoker, for root-scoped focus lookup. */
  getTriggerRoot: () => Document | ShadowRoot | null
  /** Restore the invoker only when focus was left in the surface or nowhere useful. */
  restoreTriggerFocus: () => void
  /** Spread on the invoker: local registration, native target wiring, and optional popup type. */
  triggerProps: PopoverTriggerProps
  /** Spread on the popover element. The `popover` attribute stays in the user's template. */
  popoverProps: PopoverProps
}

export function usePopover(options?: UsePopoverOptions): UsePopoverReturn
export function usePopover(
  props: PopoverComponentProps,
  open: Ref<boolean>,
): UsePopoverReturn
export function usePopover(
  optionsOrProps: UsePopoverOptions | PopoverComponentProps = {},
  componentOpen?: Ref<boolean>,
): UsePopoverReturn {
  const options: UsePopoverOptions = componentOpen
    ? {
        anchor: {
          area: (optionsOrProps as PopoverComponentProps).area,
          offset: (optionsOrProps as PopoverComponentProps).offset,
        },
        open: componentOpen,
      }
    : optionsOrProps as UsePopoverOptions
  const instance = getCurrentInstance()
  const id = options.id ?? (instance ? useId() : `nagi-popover-${popoverCount++}`)
  const open = options.open ?? ref(options.defaultOpen ?? false)

  let element: HTMLElement | null = null
  let triggerElement: HTMLElement | null = null

  function resolve(): HTMLElement | null {
    return element?.isConnected ? element : null
  }

  function setTrigger(elementOrComponent: Element | ComponentPublicInstance | null) {
    triggerElement = elementOrComponent as HTMLElement | null
    const target = resolve()
    if (target && open.value) syncAnchor(target, true)
  }

  function setPopover(elementOrComponent: Element | ComponentPublicInstance | null) {
    element = elementOrComponent as HTMLElement | null
    if (element) apply(open.value)
  }

  function focusTrigger() {
    if (triggerElement?.isConnected) triggerElement.focus({ preventScroll: true })
  }

  function getTriggerRoot(): Document | ShadowRoot | null {
    const root = triggerElement?.getRootNode()
    return root && "querySelectorAll" in root
      ? root as Document | ShadowRoot
      : null
  }

  function restoreTriggerFocus() {
    const target = resolve()
    const trigger = triggerElement?.isConnected ? triggerElement : null
    if (!target || !trigger) return
    const root = target.getRootNode()
    const rootActive = "activeElement" in root
      ? (root as Document | ShadowRoot).activeElement
      : null
    const documentActive = target.ownerDocument.activeElement
    const focusRemainedInSurface = rootActive !== null && target.contains(rootActive)
    const focusHasNoOwner = documentActive === null || documentActive === target.ownerDocument.body
    if (!focusRemainedInSurface && !focusHasNoOwner) return
    focusTrigger()
  }

  // Hide transitions are not cancelable per the Popover API, so controlled
  // mode cannot literally veto UA transitions. Both modes therefore sync the
  // same way: UA-initiated transitions land in `open` via the toggle event,
  // and writes to `open` are applied imperatively. `apply` is idempotent
  // (checks :popover-open first), which breaks the echo loop.
  function apply(next: boolean) {
    const target = resolve()
    if (!target) return
    if (target.matches(":popover-open") === next) return
    if (next) target.showPopover()
    else target.hidePopover()
  }

  const anchor = options.anchor
    ? createAnchorPair(id, options.anchor === true ? {} : options.anchor)
    : null
  let detachAnchor: (() => void) | null = null

  function syncAnchor(target: HTMLElement, isOpen: boolean) {
    if (!anchor || anchor.native) return
    detachAnchor?.()
    detachAnchor = null
    if (!isOpen || !triggerElement) return
    detachAnchor = anchor.attach(triggerElement, target)
  }

  function onToggle(event: ToggleEvent) {
    element = event.target as HTMLElement
    const actual = event.newState === "open"
    syncAnchor(element, actual)
    if (open.value !== actual) {
      void requestModelValue(open, actual).then((accepted) => {
        if (!accepted) apply(open.value)
      })
    }
  }

  // Sync flush per CHARTER §4.4: a post-flush watcher coalesces a same-tick
  // true→false round trip into "no change" and leaves the UA desynced from
  // the model. apply() is idempotent, so eager application is safe.
  watch(open, (next) => apply(next), { flush: "sync" })

  if (instance) {
    onMounted(() => {
      if (open.value) apply(true)
    })
    onBeforeUnmount(() => {
      detachAnchor?.()
      detachAnchor = null
    })
  }

  return {
    id,
    open,
    show: () => (open.value = true),
    hide: () => (open.value = false),
    toggle: () => (open.value = !open.value),
    focusTrigger,
    getTriggerRoot,
    restoreTriggerFocus,
    triggerProps: {
      ref: setTrigger,
      popovertarget: id,
      ...(options.hasPopup ? { "aria-haspopup": options.hasPopup } : {}),
      ...(anchor ? { style: anchor.anchorStyle } : {}),
    },
    popoverProps: anchor
      ? { ref: setPopover, id, style: anchor.positionedStyle, onToggle }
      : { ref: setPopover, id, onToggle },
  }
}

let popoverCount = 0

/**
 * Sugar for `v-bind="triggerProps"`: `v-popover-trigger="id"`.
 * The attribute is rendered on the server via getSSRProps, so the trigger
 * works before hydration.
 */
export const vPopoverTrigger: ObjectDirective<HTMLElement, string> = {
  mounted(el, binding) {
    el.setAttribute("popovertarget", binding.value)
  },
  updated(el, binding) {
    if (binding.value !== binding.oldValue) {
      el.setAttribute("popovertarget", binding.value)
    }
  },
  getSSRProps(binding) {
    return { popovertarget: binding.value }
  },
}
