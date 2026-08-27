import { toValue, type MaybeRefOrGetter } from "vue";

interface ButtonComponentProps {
  readonly disabled: boolean;
  readonly focusableWhenDisabled: boolean;
}

interface ButtonBindingProps {
  readonly disabled: boolean;
  readonly "aria-disabled": "true" | undefined;
  readonly onClickCapture: (event: MouseEvent) => void;
}

/** Suppresses activation while keeping an aria-disabled button focusable. */
export function useFocusableDisabled(disabled: MaybeRefOrGetter<boolean>) {
  function onClick(event: MouseEvent) {
    if (!toValue(disabled)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  return { onClick };
}

/** Connects the package Button's focusable-disabled contract. */
export function useButton(props: ButtonComponentProps) {
  const focusableDisabled = () => props.disabled && props.focusableWhenDisabled;
  const activation = useFocusableDisabled(focusableDisabled);

  const buttonProps: ButtonBindingProps = {
    get disabled() {
      return props.disabled && !props.focusableWhenDisabled;
    },
    get "aria-disabled"() {
      return focusableDisabled() ? "true" as const : undefined;
    },
    onClickCapture: activation.onClick,
  };

  return { buttonProps };
}
