import {
  getCurrentInstance,
  onMounted,
  ref,
  useId,
  watch,
  type Ref,
} from "vue"

export interface UseDisclosureOptions {
  /** External source of truth (controlled mode, `v-model:open`). */
  open?: Ref<boolean>
  /** Initial state in uncontrolled mode (server-rendered as `<details open>`). */
  defaultOpen?: boolean
  /** Override the generated id. */
  id?: string
  /** Exclusive-accordion group name (`<details name>`, native). */
  name?: string
}

export interface DisclosureProps {
  id: string
  /** Present only when open at render time, so SSR emits `<details open>`. */
  open?: boolean
  name?: string
  onToggle: (event: ToggleEvent) => void
}

export interface UseDisclosureReturn {
  id: string
  /** Reactive open state. Writable in both modes. */
  open: Ref<boolean>
  show: () => void
  hide: () => void
  toggle: () => void
  /**
   * Spread on the `<details>` element. The `<summary>` needs no wiring — the
   * native disclosure triangle and toggle behavior are the UA's.
   */
  detailsProps: DisclosureProps
}

interface DetailsElement extends HTMLElement {
  open: boolean
}

let disclosureCount = 0

export function useDisclosure(options: UseDisclosureOptions = {}): UseDisclosureReturn {
  const instance = getCurrentInstance()
  const id = options.id ?? (instance ? useId() : `nagi-disclosure-${disclosureCount++}`)
  const open = options.open ?? ref(options.defaultOpen ?? false)

  let element: DetailsElement | null = null

  function resolve(): DetailsElement | null {
    if (element?.isConnected) return element
    if (typeof document === "undefined") return null
    element = document.getElementById(id) as DetailsElement | null
    return element
  }

  // <details> owns its open state natively; the model is mirrored from the
  // toggle event and applied back through the `open` property (idempotent).
  function apply(next: boolean) {
    const target = resolve()
    if (!target || target.open === next) return
    target.open = next
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
    hide: () => (open.value = false),
    toggle: () => (open.value = !open.value),
    detailsProps: {
      id,
      // Rendered once at setup so the server emits `<details open>` for the
      // initial state; subsequent changes flow through the toggle event and the
      // imperative `open` property, not this attribute.
      ...(open.value ? { open: true } : {}),
      ...(options.name ? { name: options.name } : {}),
      onToggle: (event: ToggleEvent) => {
        element = event.target as DetailsElement
        const actual = event.newState === "open"
        if (open.value !== actual) open.value = actual
      },
    },
  }
}
