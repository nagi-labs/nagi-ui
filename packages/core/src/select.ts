import {
  getCurrentInstance,
  onMounted,
  onUpdated,
  shallowRef,
  toValue,
  useId,
  type ComponentPublicInstance,
  type MaybeRefOrGetter,
} from "vue";

import { mergeElementProps, withoutClassToken } from "./merge-props.ts";
import { useNativeFormReset } from "./native-form.ts";

type ReadonlySelectRef = Readonly<{
  value: HTMLSelectElement | null;
}>;

type WritableSelectModel = {
  value: string | undefined;
};

export interface SelectBinding {
  selectedProps: (value: string) => { selected?: boolean };
  onChange: (event: Event) => void;
}

export interface SelectControlProps {
  readonly [key: string]: unknown;
  ref: (element: Element | ComponentPublicInstance | null) => void;
  onChange: (event: Event) => void;
}

export interface SelectLabelProps {
  readonly for?: string | undefined;
}

export interface SelectComponentBinding {
  selectProps: SelectControlProps;
  labelProps: SelectLabelProps;
  selectedProps: SelectBinding["selectedProps"];
}

export interface UseSelectComponentOptions {
  attrs?: Readonly<Record<string, unknown>>;
  id?: MaybeRefOrGetter<string | undefined>;
  disabled?: MaybeRefOrGetter<boolean | undefined>;
  required?: MaybeRefOrGetter<boolean | undefined>;
  onChange?: (event: Event) => void;
}

/** Keeps the Select model aligned with native default-option and reset rules. */
function createSelectBinding(select: ReadonlySelectRef, model: WritableSelectModel): SelectBinding {
  let initialValue = model.value;
  let initialCaptured = model.value !== undefined;

  function nativeValue(control: HTMLSelectElement): string | undefined {
    return control.selectedIndex < 0 ? undefined : control.value;
  }

  function syncNativeValue(control = select.value): string | undefined {
    if (!control) return undefined;
    const value = nativeValue(control);
    if (model.value !== value) model.value = value;
    return value;
  }

  function hasOption(control: HTMLSelectElement, value: string): boolean {
    return Array.from(control.options).some((option) => option.value === value);
  }

  useNativeFormReset(select, (control) => {
    if (!initialCaptured) {
      syncNativeValue(control);
      return;
    }

    if (initialValue === undefined) control.selectedIndex = -1;
    else if (hasOption(control, initialValue)) control.value = initialValue;
    syncNativeValue(control);
  });

  if (getCurrentInstance()) {
    onMounted(() => {
      initialValue = syncNativeValue();
      initialCaptured = true;
    });
    // Option/model updates can cause the browser to select a fallback. Keep
    // the controlled model aligned with the selected option after DOM patching.
    onUpdated(() => syncNativeValue());
  }

  return {
    selectedProps(value) {
      return model.value === undefined ? {} : { selected: model.value === value };
    },
    onChange(event) {
      syncNativeValue(event.currentTarget as HTMLSelectElement);
    },
  };
}

export function useSelect(select: ReadonlySelectRef, model: WritableSelectModel): SelectBinding;
export function useSelect(
  model: WritableSelectModel,
  options?: UseSelectComponentOptions,
): SelectComponentBinding;
/**
 * Keeps a native select synchronized. The component overload owns its element
 * ref so a shipped or owned template needs only this one composable.
 */
export function useSelect(
  selectOrModel: ReadonlySelectRef | WritableSelectModel,
  modelOrOptions: WritableSelectModel | UseSelectComponentOptions = {},
): SelectBinding | SelectComponentBinding {
  if ("value" in modelOrOptions) {
    return createSelectBinding(selectOrModel as ReadonlySelectRef, modelOrOptions);
  }

  const model = selectOrModel as WritableSelectModel;
  const options = modelOrOptions;
  const select = shallowRef<HTMLSelectElement | null>(null);
  const binding = createSelectBinding(select, model);
  const generatedId = getCurrentInstance() ? useId() : undefined;
  const controlId = () => toValue(options.id) ?? generatedId;
  const controlProps = {
    ref(element: Element | ComponentPublicInstance | null) {
      select.value = element as HTMLSelectElement | null;
    },
    onChange(event: Event) {
      binding.onChange(event);
      options.onChange?.(event);
    },
  };

  return {
    selectedProps: binding.selectedProps,
    get labelProps() {
      return { for: controlId() };
    },
    get selectProps() {
      const attrs = options.attrs ?? {};
      return mergeElementProps(
        { ...attrs, class: withoutClassToken(attrs.class, "n-select") },
        controlProps,
        {
          id: controlId(),
          disabled: toValue(options.disabled) ?? false,
          required: toValue(options.required) ?? false,
        },
      ) as SelectControlProps;
    },
  };
}
