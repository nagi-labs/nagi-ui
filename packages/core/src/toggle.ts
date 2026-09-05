import { ref, toValue, type MaybeRefOrGetter, type Ref } from "vue";

import { mergeElementProps, withoutClassToken } from "./merge-props.ts";

export interface UseToggleOptions {
  /** External source of truth (controlled mode, `v-model`). */
  pressed?: Ref<boolean>;
  /** Initial pressed state in uncontrolled mode. */
  defaultPressed?: boolean;
  /** Suppress native button activation. */
  disabled?: MaybeRefOrGetter<boolean>;
}

interface ToggleComponentProps {
  readonly disabled: boolean;
}

export interface ToggleButtonProps {
  readonly [key: string]: unknown;
  readonly type: "button";
  readonly "aria-pressed": "true" | "false";
  readonly disabled: boolean;
  onClick: (event: MouseEvent) => void;
}

export interface UseToggleReturn {
  /** Reactive pressed state. Writable in both modes. */
  pressed: Ref<boolean>;
  /** Programmatically invert the pressed state. */
  toggle: () => void;
  /** Spread on a native `<button>`. */
  buttonProps: ToggleButtonProps;
}

/**
 * Adds native toggle-button semantics to a `<button>` without introducing a
 * custom state vocabulary. The browser keeps button activation and disabled
 * behavior; this composable owns only the `aria-pressed` model.
 */
export function useToggle(options?: UseToggleOptions): UseToggleReturn;
export function useToggle(
  props: ToggleComponentProps,
  pressed: Ref<boolean>,
  attrs?: Readonly<Record<string, unknown>>,
): UseToggleReturn;
export function useToggle(
  optionsOrProps: UseToggleOptions | ToggleComponentProps = {},
  componentPressed?: Ref<boolean>,
  attrs: Readonly<Record<string, unknown>> = {},
): UseToggleReturn {
  const options: UseToggleOptions = componentPressed
    ? {
        disabled: () => (optionsOrProps as ToggleComponentProps).disabled,
        pressed: componentPressed,
      }
    : (optionsOrProps as UseToggleOptions);
  const pressed = options.pressed ?? ref(options.defaultPressed ?? false);
  const disabled = () => toValue(options.disabled) ?? false;

  function toggle() {
    pressed.value = !pressed.value;
  }

  const behaviorProps = {
    type: "button" as const,
    get "aria-pressed"() {
      return pressed.value ? ("true" as const) : ("false" as const);
    },
    get disabled() {
      return disabled();
    },
    onClick: () => {
      // Native disabled buttons do not dispatch click. Keep the guard so
      // direct handler calls and synthetic integrations preserve the same
      // contract.
      if (!disabled()) toggle();
    },
  };

  return {
    pressed,
    toggle,
    get buttonProps() {
      return mergeElementProps(behaviorProps, {
        ...attrs,
        class: withoutClassToken(attrs.class, "n-toggle"),
      }) as ToggleButtonProps;
    },
  };
}
