import {
  getCurrentInstance,
  onMounted,
  ref,
  useId,
  watch,
  type CSSProperties,
  type ObjectDirective,
  type Ref,
} from "vue"

import { createAnchorPair, type AnchorOptions } from "./anchor.ts"

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
  /**
   * Position the popover against its trigger: native CSS Anchor Positioning
   * where supported, Floating UI fallback otherwise (CHARTER §5).
   */
  anchor?: AnchorOptions | true
}

export interface PopoverTriggerProps {
  popovertarget: string
  style?: CSSProperties
}

export interface PopoverProps {
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
  /** Spread on the invoking button: `popovertarget` only — the UA exposes aria-expanded itself. */
  triggerProps: PopoverTriggerProps
  /** Spread on the popover element. The `popover` attribute stays in the user's template. */
  popoverProps: PopoverProps
}

export function usePopover(options: UsePopoverOptions = {}): UsePopoverReturn {
  const instance = getCurrentInstance()
  const id = options.id ?? (instance ? useId() : `nagi-popover-${popoverCount++}`)
  const open = options.open ?? ref(options.defaultOpen ?? false)

  let element: HTMLElement | null = null

  function resolve(): HTMLElement | null {
    if (element?.isConnected) return element
    if (typeof document === "undefined") return null
    element = document.getElementById(id)
    return element
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
    if (!isOpen || typeof document === "undefined") return
    const trigger = document.querySelector<HTMLElement>(`[popovertarget="${id}"]`)
    if (trigger) detachAnchor = anchor.attach(trigger, target)
  }

  function onToggle(event: ToggleEvent) {
    element = event.target as HTMLElement
    const actual = event.newState === "open"
    syncAnchor(element, actual)
    if (open.value !== actual) open.value = actual
  }

  // Sync flush per CHARTER §4.4: a post-flush watcher coalesces a same-tick
  // true→false round trip into "no change" and leaves the UA desynced from
  // the model. apply() is idempotent, so eager application is safe.
  watch(open, (next) => apply(next), { flush: "sync" })

  if (instance) {
    onMounted(() => {
      if (open.value) apply(true)
    })
  }

  return {
    id,
    open,
    show: () => (open.value = true),
    hide: () => (open.value = false),
    toggle: () => (open.value = !open.value),
    triggerProps: anchor
      ? { popovertarget: id, style: anchor.anchorStyle }
      : { popovertarget: id },
    popoverProps: anchor
      ? { id, style: anchor.positionedStyle, onToggle }
      : { id, onToggle },
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
