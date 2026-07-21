import { ref, toValue, type MaybeRefOrGetter, type Ref } from "vue"

export interface UseToggleOptions {
  /** External source of truth (controlled mode, `v-model`). */
  pressed?: Ref<boolean>
  /** Initial pressed state in uncontrolled mode. */
  defaultPressed?: boolean
  /** Suppress native button activation. */
  disabled?: MaybeRefOrGetter<boolean>
}

export interface ToggleButtonProps {
  readonly type: "button"
  readonly "aria-pressed": "true" | "false"
  readonly disabled: boolean
  onClick: (event: MouseEvent) => void
}

export interface UseToggleReturn {
  /** Reactive pressed state. Writable in both modes. */
  pressed: Ref<boolean>
  /** Programmatically invert the pressed state. */
  toggle: () => void
  /** Spread on a native `<button>`. */
  buttonProps: ToggleButtonProps
}

/**
 * Adds native toggle-button semantics to a `<button>` without introducing a
 * custom state vocabulary. The browser keeps button activation and disabled
 * behavior; this composable owns only the `aria-pressed` model.
 */
export function useToggle(options: UseToggleOptions = {}): UseToggleReturn {
  const pressed = options.pressed ?? ref(options.defaultPressed ?? false)
  const disabled = () => toValue(options.disabled) ?? false

  function toggle() {
    pressed.value = !pressed.value
  }

  return {
    pressed,
    toggle,
    buttonProps: {
      type: "button",
      get "aria-pressed"() {
        return pressed.value ? "true" : "false"
      },
      get disabled() {
        return disabled()
      },
      onClick: () => {
        // Native disabled buttons do not dispatch click. Keep the guard so
        // direct handler calls and synthetic integrations preserve the same
        // contract.
        if (!disabled()) toggle()
      },
    },
  }
}
