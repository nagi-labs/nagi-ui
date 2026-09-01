import {
  getCurrentInstance,
  onMounted,
  ref,
  toValue,
  useId,
  watch,
  type ComponentPublicInstance,
  type MaybeRefOrGetter,
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
  name?: string | undefined
  /** Suppress user toggling while retaining a focusable native `<summary>`. */
  disabled?: MaybeRefOrGetter<boolean>
}

interface DisclosureComponentProps {
  readonly id?: string | undefined
  readonly name?: string | undefined
  readonly disabled?: boolean | undefined
}

export interface DisclosureProps {
  /** Complete Behavior API wiring; registers the local native disclosure. */
  ref: (element: Element | ComponentPublicInstance | null) => void
  id: string
  /** Present only when open at render time, so SSR emits `<details open>`. */
  open?: boolean
  name?: string
  onToggle: (event: ToggleEvent) => void
}

export interface DisclosureSummaryProps {
  readonly "aria-disabled": "true" | undefined
  onClick: (event: MouseEvent) => void
  onKeydown: (event: KeyboardEvent) => void
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
  /** Spread on the native `<summary>` to enforce the optional disabled contract. */
  summaryProps: DisclosureSummaryProps
}

interface DetailsElement extends HTMLElement {
  open: boolean
}

let disclosureCount = 0

function disclosureComponentOptions(
  props: DisclosureComponentProps,
  open: Ref<boolean>,
): UseDisclosureOptions {
  const options: UseDisclosureOptions = {
    disabled: () => props.disabled ?? false,
    open,
  }
  if (props.id !== undefined) options.id = props.id
  if (props.name !== undefined) options.name = props.name
  return options
}

export function useDisclosure(options?: UseDisclosureOptions): UseDisclosureReturn
export function useDisclosure(
  props: DisclosureComponentProps,
  open: Ref<boolean>,
): UseDisclosureReturn
export function useDisclosure(
  optionsOrProps: UseDisclosureOptions | DisclosureComponentProps = {},
  componentOpen?: Ref<boolean>,
): UseDisclosureReturn {
  const options: UseDisclosureOptions = componentOpen
    ? disclosureComponentOptions(optionsOrProps as DisclosureComponentProps, componentOpen)
    : optionsOrProps as UseDisclosureOptions
  const instance = getCurrentInstance()
  const id = options.id ?? (instance ? useId() : `nagi-disclosure-${disclosureCount++}`)
  const open = options.open ?? ref(options.defaultOpen ?? false)
  const disabled = () => toValue(options.disabled) ?? false

  let element: DetailsElement | null = null

  function resolve(): DetailsElement | null {
    return element?.isConnected ? element : null
  }

  function setDetails(elementOrComponent: Element | ComponentPublicInstance | null) {
    element = elementOrComponent as DetailsElement | null
    if (element) apply(open.value)
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
      apply(open.value)
    })
  }

  return {
    id,
    open,
    show: () => (open.value = true),
    hide: () => (open.value = false),
    toggle: () => (open.value = !open.value),
    detailsProps: {
      ref: setDetails,
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
    summaryProps: {
      get "aria-disabled"() {
        return disabled() ? "true" : undefined
      },
      onClick: (event: MouseEvent) => {
        if (!disabled()) return
        event.preventDefault()
        event.stopPropagation()
      },
      onKeydown: (event: KeyboardEvent) => {
        if (!disabled() || (event.key !== "Enter" && event.key !== " ")) return
        event.preventDefault()
        event.stopPropagation()
      },
    },
  }
}
