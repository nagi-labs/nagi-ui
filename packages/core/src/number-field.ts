import {
  computed,
  getCurrentInstance,
  shallowRef,
  toValue,
  useId,
  type ComponentPublicInstance,
  type MaybeRefOrGetter,
  type StyleValue,
  type WritableComputedRef,
} from "vue";

import { mergeElementProps, withoutClassToken } from "./merge-props.ts";
import { useNativeFormReset } from "./native-form.ts";

type ReadonlyInputRef = Readonly<{
  value: HTMLInputElement | null;
}>;

type WritableNullableNumber = {
  value: number | null;
};

export interface UseNumberFieldOptions {
  min?: MaybeRefOrGetter<number | undefined>;
  max?: MaybeRefOrGetter<number | undefined>;
  disabled?: MaybeRefOrGetter<boolean | undefined>;
  readOnly?: MaybeRefOrGetter<boolean | undefined>;
  decrementLabel?: MaybeRefOrGetter<string | undefined>;
  incrementLabel?: MaybeRefOrGetter<string | undefined>;
}

export interface NumberFieldStepButtonProps {
  "aria-label": string;
  disabled: boolean;
  onClick: () => void;
}

export interface NumberFieldBinding {
  value: WritableComputedRef<number | "">;
  decrementButtonProps: NumberFieldStepButtonProps;
  incrementButtonProps: NumberFieldStepButtonProps;
  decrement: () => void;
  increment: () => void;
}

export interface NumberFieldComponentProps {
  readonly id?: string | undefined;
  readonly class?: unknown;
  readonly style?: StyleValue | undefined;
  readonly title?: string | undefined;
  readonly tabindex?: number | undefined;
  readonly name?: string | undefined;
  readonly form?: string | undefined;
  readonly autocomplete?: string | undefined;
  readonly autofocus?: boolean | undefined;
  readonly enterkeyhint?: string | undefined;
  readonly inputmode?: string | undefined;
  readonly list?: string | undefined;
  readonly maxlength?: number | undefined;
  readonly minlength?: number | undefined;
  readonly min?: number | undefined;
  readonly max?: number | undefined;
  readonly pattern?: string | undefined;
  readonly placeholder?: string | undefined;
  readonly step: number;
  readonly disabled: boolean;
  readonly readOnly: boolean;
  readonly required: boolean;
  readonly decrementLabel: string;
  readonly incrementLabel: string;
  readonly ariaLabel?: string | undefined;
  readonly ariaLabelledby?: string | undefined;
  readonly ariaDescribedby?: string | undefined;
  readonly ariaDetails?: string | undefined;
  readonly ariaErrormessage?: string | undefined;
  readonly ariaInvalid?: "true" | "false" | "grammar" | "spelling" | undefined;
}

export interface NumberFieldInputProps {
  readonly [key: string]: unknown;
  readonly ref: (element: Element | ComponentPublicInstance | null) => void;
  readonly type: "number";
}

export interface NumberFieldComponentBinding extends NumberFieldBinding {
  readonly labelProps: { readonly for?: string | undefined };
  readonly inputProps: NumberFieldInputProps;
}

/** Keeps the nullable model aligned with native number stepping and reset. */
export function useNumberField(
  input: ReadonlyInputRef,
  model: WritableNullableNumber,
  options?: UseNumberFieldOptions,
): NumberFieldBinding;
export function useNumberField(
  props: NumberFieldComponentProps,
  model: WritableNullableNumber,
  attrs?: Readonly<Record<string, unknown>>,
): NumberFieldComponentBinding;
export function useNumberField(
  inputOrProps: ReadonlyInputRef | NumberFieldComponentProps,
  model: WritableNullableNumber,
  optionsOrAttrs: UseNumberFieldOptions | Readonly<Record<string, unknown>> = {},
): NumberFieldBinding | NumberFieldComponentBinding {
  if (!("value" in inputOrProps)) {
    const props = inputOrProps;
    const attrs = optionsOrAttrs as Readonly<Record<string, unknown>>;
    const input = shallowRef<HTMLInputElement | null>(null);
    const generatedId = getCurrentInstance() ? useId() : undefined;
    const controlId = () => props.id ?? generatedId;
    const binding = createNumberFieldBinding(input, model, {
      min: () => props.min,
      max: () => props.max,
      disabled: () => props.disabled,
      readOnly: () => props.readOnly,
      decrementLabel: () => props.decrementLabel,
      incrementLabel: () => props.incrementLabel,
    });
    const controlProps = {
      ref(element: Element | ComponentPublicInstance | null) {
        input.value = element as HTMLInputElement | null;
      },
      type: "number" as const,
    };

    return {
      ...binding,
      get labelProps() {
        return { for: controlId() };
      },
      get inputProps() {
        return mergeElementProps(
          { ...attrs, class: withoutClassToken(attrs.class, "n-number-field") },
          controlProps,
          {
            class: props.class,
            style: props.style,
            id: controlId(),
            title: props.title,
            tabindex: props.tabindex,
            name: props.name,
            form: props.form,
            autocomplete: props.autocomplete,
            autofocus: props.autofocus,
            enterkeyhint: props.enterkeyhint,
            inputmode: props.inputmode,
            list: props.list,
            maxlength: props.maxlength,
            minlength: props.minlength,
            min: props.min,
            max: props.max,
            pattern: props.pattern,
            placeholder: props.placeholder,
            step: props.step,
            disabled: props.disabled,
            readonly: props.readOnly,
            required: props.required,
            "aria-label": props.ariaLabel,
            "aria-labelledby": props.ariaLabelledby,
            "aria-describedby": props.ariaDescribedby,
            "aria-details": props.ariaDetails,
            "aria-errormessage": props.ariaErrormessage,
            "aria-invalid": props.ariaInvalid,
          },
        ) as NumberFieldInputProps;
      },
    };
  }

  return createNumberFieldBinding(inputOrProps, model, optionsOrAttrs as UseNumberFieldOptions);
}

function createNumberFieldBinding(
  input: ReadonlyInputRef,
  model: WritableNullableNumber,
  options: UseNumberFieldOptions,
): NumberFieldBinding {
  const initialValue = model.value;

  const value = computed<number | "">({
    get: () => model.value ?? "",
    set: (next) => {
      model.value = next === "" ? null : Number(next);
    },
  });

  const syncNativeValue = (control: HTMLInputElement) => {
    model.value = Number.isNaN(control.valueAsNumber) ? null : control.valueAsNumber;
  };

  function decrementDisabled() {
    const min = toValue(options.min);
    return (
      (toValue(options.disabled) ?? false) ||
      (toValue(options.readOnly) ?? false) ||
      (model.value !== null && min !== undefined && model.value <= min)
    );
  }

  function incrementDisabled() {
    const max = toValue(options.max);
    return (
      (toValue(options.disabled) ?? false) ||
      (toValue(options.readOnly) ?? false) ||
      (model.value !== null && max !== undefined && model.value >= max)
    );
  }

  const decrement = () => {
    if (decrementDisabled()) return;
    const control = input.value;
    if (!control) return;
    control.stepDown();
    syncNativeValue(control);
  };

  const increment = () => {
    if (incrementDisabled()) return;
    const control = input.value;
    if (!control) return;
    control.stepUp();
    syncNativeValue(control);
  };

  useNativeFormReset(input, (control) => {
    model.value = initialValue;
    control.value = initialValue === null ? "" : String(initialValue);
  });

  return {
    value,
    decrementButtonProps: {
      get "aria-label"() {
        return toValue(options.decrementLabel) ?? "Decrease value";
      },
      get disabled() {
        return decrementDisabled();
      },
      onClick: decrement,
    },
    incrementButtonProps: {
      get "aria-label"() {
        return toValue(options.incrementLabel) ?? "Increase value";
      },
      get disabled() {
        return incrementDisabled();
      },
      onClick: increment,
    },
    decrement,
    increment,
  };
}
