import {
  getCurrentInstance,
  onMounted,
  ref,
  useId,
  watch,
  type ObjectDirective,
  type Ref,
} from "vue"

export type DialogClosedBy = "any" | "closerequest" | "none"

export interface UseDialogOptions {
  /**
   * External source of truth (controlled mode, `v-model:open`).
   * UA-initiated transitions (ESC, `closedby`, a `command="close"` button) are
   * mirrored into this ref; writes to it are applied imperatively.
   */
  open?: Ref<boolean>
  /** Initial state in uncontrolled mode. */
  defaultOpen?: boolean
  /** Override the generated id (SSR-stable ids come from Vue's useId). */
  id?: string
  /** `showModal()` (default, focus trap delegated to the UA) vs non-modal `show()`. */
  modal?: boolean
  /**
   * Native light-dismiss policy (`<dialog closedby>`), adopted via feature
   * detection. Harmlessly ignored where unsupported — the dialog then dismisses
   * on ESC only, as the platform default (CHARTER §8.1). No JS fallback is
   * synthesized: dismiss policy stays UA-owned.
   */
  closedby?: DialogClosedBy
}

export interface DialogTriggerProps {
  /** Invoker Commands wiring — declarative, works before hydration where supported. */
  commandfor: string
  command: "show-modal" | "show"
  /** Fallback opener for browsers without Invoker Commands (CHARTER §5). */
  onClick: (event: MouseEvent) => void
}

export interface DialogProps {
  id: string
  closedby?: DialogClosedBy
  onClose: (event: Event) => void
  onCancel: (event: Event) => void
  onToggle: (event: ToggleEvent) => void
}

export interface UseDialogReturn {
  id: string
  /** Reactive open state. Writable in both modes. */
  open: Ref<boolean>
  show: () => void
  close: () => void
  toggle: () => void
  /** Spread on the invoking button. */
  triggerProps: DialogTriggerProps
  /** Spread on the `<dialog>` element. */
  dialogProps: DialogProps
}

interface DialogElement extends HTMLElement {
  open: boolean
  showModal: () => void
  show: () => void
  close: () => void
}

let dialogCount = 0

/** Invoker Commands support (Chrome 135+/Firefox 138+). */
export function supportsInvokerCommands(): boolean {
  return (
    typeof HTMLButtonElement !== "undefined" &&
    "command" in HTMLButtonElement.prototype
  )
}

/** `<dialog closedby>` support (light-dismiss policy). */
export function supportsDialogClosedBy(): boolean {
  return (
    typeof HTMLDialogElement !== "undefined" &&
    "closedBy" in HTMLDialogElement.prototype
  )
}

export function useDialog(options: UseDialogOptions = {}): UseDialogReturn {
  const instance = getCurrentInstance()
  const id = options.id ?? (instance ? useId() : `nagi-dialog-${dialogCount++}`)
  const open = options.open ?? ref(options.defaultOpen ?? false)
  const modal = options.modal ?? true

  let element: DialogElement | null = null

  function resolve(): DialogElement | null {
    if (element?.isConnected) return element
    if (typeof document === "undefined") return null
    element = document.getElementById(id) as DialogElement | null
    return element
  }

  // Same idempotent-apply pattern as usePopover (CHARTER §4.4): the model is
  // the source of truth, UA transitions land via events, and writes are applied
  // imperatively without echoing (checks the native `open` property first).
  function apply(next: boolean) {
    const target = resolve()
    if (!target || target.open === next) return
    if (next) {
      if (modal) target.showModal()
      else target.show()
    } else {
      target.close()
    }
  }

  function mirror(event: Event, isOpen: boolean) {
    element = event.target as DialogElement
    if (open.value !== isOpen) open.value = isOpen
  }

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
    close: () => (open.value = false),
    toggle: () => (open.value = !open.value),
    triggerProps: {
      commandfor: id,
      command: modal ? "show-modal" : "show",
      onClick: (event: MouseEvent) => {
        // Where Invoker Commands exist the native command already opened the
        // dialog; avoid a double invocation. Otherwise open imperatively.
        if (supportsInvokerCommands()) return
        event.preventDefault()
        open.value = true
      },
    },
    dialogProps: {
      id,
      ...(options.closedby ? { closedby: options.closedby } : {}),
      onClose: (event: Event) => mirror(event, false),
      onCancel: (event: Event) => mirror(event, false),
      onToggle: (event: ToggleEvent) => mirror(event, event.newState === "open"),
    },
  }
}

/**
 * Sugar for a close button inside the dialog: `v-dialog-close`. Renders the
 * `command="close"` / `commandfor` wiring on the server so a close button works
 * before hydration where Invoker Commands are supported.
 */
export const vDialogClose: ObjectDirective<HTMLElement, string> = {
  mounted(el, binding) {
    el.setAttribute("commandfor", binding.value)
    el.setAttribute("command", "close")
  },
  updated(el, binding) {
    if (binding.value !== binding.oldValue) {
      el.setAttribute("commandfor", binding.value)
      el.setAttribute("command", "close")
    }
  },
  getSSRProps(binding) {
    return { commandfor: binding.value, command: "close" }
  },
}
