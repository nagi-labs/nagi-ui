import { toValue, type MaybeRefOrGetter } from "vue";

/** Suppresses activation while keeping an aria-disabled button focusable. */
export function useFocusableDisabled(disabled: MaybeRefOrGetter<boolean>) {
  function onClick(event: MouseEvent) {
    if (!toValue(disabled)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  return { onClick };
}
