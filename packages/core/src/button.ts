import { toValue, type MaybeRefOrGetter } from "vue";

interface ButtonControlProps {
  readonly disabled: boolean;
  readonly focusableWhenDisabled: boolean;
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
export function useButtonControl(props: ButtonControlProps) {
  const focusableDisabled = () => props.disabled && props.focusableWhenDisabled;
  const activation = useFocusableDisabled(focusableDisabled);

  return {
    get disabled() {
      return props.disabled && !props.focusableWhenDisabled;
    },
    get ariaDisabled() {
      return focusableDisabled() ? "true" as const : undefined;
    },
    onClick: activation.onClick,
  };
}
