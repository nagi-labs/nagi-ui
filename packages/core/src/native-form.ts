import {
  computed,
  getCurrentInstance,
  onScopeDispose,
  onUpdated,
  toValue,
  watch,
  watchEffect,
  type ComponentPublicInstance,
  type MaybeRefOrGetter,
  type Ref,
  type WatchCallback,
} from "vue";
import { modelValueAccepted } from "./model-sync.ts";

type NativeFormControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
type NativeValueControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
type NativeValidityControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
type ReadonlyControlRef<Control> = Readonly<{
  value: Control | null;
}>;
type ReadonlyControlListRef<Control> = Readonly<{
  value: readonly Control[];
}>;
type WritableModel<Value> = { value: Value };

/** Connects a template ref to native-form behavior owned by the main composable. */
export function nativeFormControlRef<Control extends NativeFormControl>(
  control: Ref<Control | null>,
): (element: Element | ComponentPublicInstance | null) => void {
  return (element) => {
    control.value = element as Control | null;
  };
}

/** Applies a reactive constraint message to the browser-owned validity channel. */
export function useNativeCustomValidity(
  control: ReadonlyControlRef<NativeValidityControl>,
  message: MaybeRefOrGetter<string>,
): void {
  function syncCustomValidity() {
    control.value?.setCustomValidity(toValue(message));
  }

  watchEffect(syncCustomValidity);
}

/**
 * Keeps a controlled Vue model aligned with the browser after form.reset().
 * The callback runs after the browser has restored the native control state.
 */
export function useNativeFormReset<Control extends NativeFormControl>(
  control: ReadonlyControlRef<Control>,
  reset: (control: Control) => void,
): void {
  let owner: HTMLFormElement | null = null;
  let task: ReturnType<typeof setTimeout> | undefined;

  // The reset event is dispatched before the user agent's reset default
  // action. A microtask can therefore run too early and be overwritten by
  // that action; a task runs after native control state has settled.
  const handleReset = (event: Event) => {
    if (task !== undefined) clearTimeout(task);
    task = setTimeout(() => {
      // reset is cancelable; defer this check until every form listener has
      // had a chance to call preventDefault().
      if (event.defaultPrevented) return;
      const current = control.value;
      if (current) reset(current);
    }, 0);
  };

  const bindOwner = () => {
    const nextOwner = control.value?.form ?? null;
    if (nextOwner === owner) return;

    owner?.removeEventListener("reset", handleReset);
    if (task !== undefined) clearTimeout(task);
    task = undefined;
    owner = nextOwner;
    owner?.addEventListener("reset", handleReset);
  };

  watch(() => control.value, bindOwner, { flush: "post", immediate: true });

  // `control.form` is a DOM property, not a reactive value. Re-read it after
  // Vue patches a changed `form` attribute so callers do not need to expose
  // that implementation detail merely to keep the listener bound.
  if (getCurrentInstance()) onUpdated(bindOwner);

  onScopeDispose(() => {
    owner?.removeEventListener("reset", handleReset);
    if (task !== undefined) clearTimeout(task);
  });
}

/** Restores a string-backed input, select, or textarea without exposing reset plumbing. */
export function useNativeValueReset<Value extends string | undefined>(
  control: ReadonlyControlRef<NativeValueControl>,
  model: WritableModel<Value>,
): void {
  const initialValue = model.value;

  useNativeFormReset(control, (element) => {
    model.value = initialValue;
    element.value = initialValue ?? "";
    void modelValueAccepted(model, initialValue).then((accepted) => {
      if (!accepted) element.value = model.value ?? "";
    });
  });
}

/** Restores a number-backed native input. */
export function useNativeNumberReset(
  control: ReadonlyControlRef<HTMLInputElement>,
  model: WritableModel<number>,
): void {
  const initialValue = model.value;

  useNativeFormReset(control, (element) => {
    model.value = initialValue;
    element.value = String(initialValue);
    void modelValueAccepted(model, initialValue).then((accepted) => {
      if (!accepted) element.value = String(model.value);
    });
  });
}

/** Restores a boolean-backed checkbox or switch. */
export function useNativeCheckedReset(
  control: ReadonlyControlRef<HTMLInputElement>,
  model: WritableModel<boolean>,
): void {
  const initialChecked = model.value;

  useNativeFormReset(control, (element) => {
    model.value = initialChecked;
    element.checked = initialChecked;
    void modelValueAccepted(model, initialChecked).then((accepted) => {
      if (!accepted) element.checked = model.value;
    });
  });
}

/** Restores a radio against its current native value. */
export function useNativeRadioReset(
  control: ReadonlyControlRef<HTMLInputElement>,
  model: WritableModel<string | null>,
): void {
  const initialValue = model.value;

  useNativeFormReset(control, (element) => {
    model.value = initialValue;
    element.checked = initialValue === element.value;
    void modelValueAccepted(model, initialValue).then((accepted) => {
      if (!accepted) element.checked = model.value === element.value;
    });
  });
}

/** Restores a string/number radio group after the browser resets its checked members. */
export function useNativeRadioGroupReset<Value extends string | number | null>(
  controls: ReadonlyControlListRef<HTMLInputElement>,
  model: WritableModel<Value>,
): void {
  const initialValue = model.value;
  const owner = computed(() => controls.value[0] ?? null);

  useNativeFormReset(owner, () => {
    model.value = initialValue;
    for (const control of controls.value) {
      control.checked = initialValue !== null && control.value === String(initialValue);
    }
    void modelValueAccepted(model, initialValue).then((accepted) => {
      if (accepted) return;
      for (const control of controls.value) {
        control.checked = model.value !== null && control.value === String(model.value);
      }
    });
  });
}

/** Keeps the checkbox-only indeterminate channel and native reset in sync. */
export function useNativeCheckbox(
  control: ReadonlyControlRef<HTMLInputElement>,
  checked: WritableModel<boolean>,
  indeterminate: WritableModel<boolean>,
): void {
  const initialChecked = checked.value;
  const initialIndeterminate = indeterminate.value;

  function syncIndeterminate() {
    if (control.value) control.value.indeterminate = indeterminate.value;
  }

  const bindIndeterminateChange: WatchCallback<HTMLInputElement | null> = (
    element,
    _previous,
    onCleanup,
  ) => {
    if (!element) return;
    const handleChange = () => {
      if (indeterminate.value) indeterminate.value = false;
    };
    element.addEventListener("change", handleChange);
    onCleanup(() => element.removeEventListener("change", handleChange));
  };

  watchEffect(syncIndeterminate);
  watch(() => control.value, bindIndeterminateChange, { flush: "post", immediate: true });

  useNativeFormReset(control, (element) => {
    checked.value = initialChecked;
    indeterminate.value = initialIndeterminate;
    element.checked = initialChecked;
    element.indeterminate = initialIndeterminate;
    void Promise.all([
      modelValueAccepted(checked, initialChecked),
      modelValueAccepted(indeterminate, initialIndeterminate),
    ]).then(([checkedAccepted, indeterminateAccepted]) => {
      if (!checkedAccepted) element.checked = checked.value;
      if (!indeterminateAccepted) element.indeterminate = indeterminate.value;
    });
  });
}
