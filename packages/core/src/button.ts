import { reactive, toValue, type MaybeRefOrGetter } from "vue";

import { mergeElementProps, withoutClassToken } from "./merge-props.ts";

export interface ButtonControlProps {
  readonly type?: "button" | "submit" | "reset";
  readonly disabled: boolean;
  readonly focusableWhenDisabled: boolean;
}

interface ButtonBehaviorProps {
  readonly disabled: boolean;
  readonly "aria-disabled": "true" | undefined;
  readonly onClickCapture: (event: MouseEvent) => void;
}

export interface ButtonBindingProps extends ButtonBehaviorProps {
  readonly [attribute: string]: unknown;
  readonly type: "button" | "submit" | "reset";
}

export interface ButtonControl {
  readonly buttonProps: ButtonBindingProps;
}

/** Suppresses activation while keeping an aria-disabled button focusable. */
function createFocusableDisabledBinding(disabled: MaybeRefOrGetter<boolean>) {
  function onClick(event: MouseEvent) {
    if (!toValue(disabled)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  return { onClick };
}

/**
 * Connects the package Button's native root, including consumer attributes and
 * Nagi's focusable-disabled policy.
 */
export function useButton(
  props: ButtonControlProps,
  attrs: Readonly<Record<string, unknown>> = {},
): ButtonControl {
  const focusableDisabled = () => props.disabled && props.focusableWhenDisabled;
  const activation = createFocusableDisabledBinding(focusableDisabled);

  const behaviorProps = reactive<ButtonBehaviorProps>({
    get disabled() {
      return props.disabled && !props.focusableWhenDisabled;
    },
    get "aria-disabled"() {
      return focusableDisabled() ? ("true" as const) : undefined;
    },
    onClickCapture: activation.onClick,
  });

  return reactive({
    get buttonProps() {
      return mergeElementProps(
        behaviorProps,
        { ...attrs, class: withoutClassToken(attrs.class, "n-button") },
        { type: props.type ?? "button" },
      );
    },
  });
}
