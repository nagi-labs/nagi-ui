import {
  toValue,
  watchEffect,
  type MaybeRefOrGetter,
} from "vue";

type NativeFormControl = HTMLInputElement | HTMLSelectElement;

/**
 * Keeps a controlled Vue model aligned with the browser after form.reset().
 * The callback runs after the browser has restored the native control state.
 */
export function useNativeFormReset<Control extends NativeFormControl>(
  control: Readonly<{ value: Control | null }>,
  reset: (control: Control) => void,
  form?: MaybeRefOrGetter<string | undefined>,
): void {
  watchEffect(
    (onCleanup) => {
      // Reading the external form id makes a changed `form` prop rebind after
      // Vue has patched the element's form owner.
      toValue(form);
      const owner = control.value?.form ?? null;
      if (!owner) return;

      // The reset event is dispatched before the user agent's reset default
      // action. A microtask can therefore run too early and be overwritten by
      // that action; a task runs after native control state has settled.
      let task: ReturnType<typeof setTimeout> | undefined;
      const handleReset = (event: Event) => {
        if (task !== undefined) clearTimeout(task);
        task = setTimeout(() => {
          // reset is cancelable; defer this check until every form listener
          // has had a chance to call preventDefault().
          if (event.defaultPrevented) return;
          const current = control.value;
          if (current) reset(current);
        }, 0);
      };
      owner.addEventListener("reset", handleReset);
      onCleanup(() => {
        owner.removeEventListener("reset", handleReset);
        if (task !== undefined) clearTimeout(task);
      });
    },
    { flush: "post" },
  );
}
