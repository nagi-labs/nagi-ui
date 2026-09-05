import {
  getCurrentInstance,
  onMounted,
  onUpdated,
  shallowRef,
  useId,
  type ComponentPublicInstance,
} from "vue";

import { mergeElementProps, withoutClassToken } from "./merge-props.ts";
import { useNativeFormReset } from "./native-form.ts";

type ReadonlySliderRef = Readonly<{
  value: HTMLInputElement | null;
}>;

type WritableNumberModel = {
  value: number;
};

export interface SliderComponentProps {
  readonly id?: string | undefined;
  readonly min: number;
  readonly max: number;
  readonly step: number | "any";
  readonly disabled: boolean;
}

export interface SliderInputProps {
  readonly [key: string]: unknown;
  readonly ref: (element: Element | ComponentPublicInstance | null) => void;
  readonly type: "range";
}

export interface SliderComponentBinding {
  readonly inputProps: SliderInputProps;
  readonly labelProps: { readonly for?: string | undefined };
  readonly outputProps: { readonly for?: string | undefined };
}

/** Keeps the Slider model aligned with the browser's range sanitization. */
export function useSlider(input: ReadonlySliderRef, model: WritableNumberModel): void;
export function useSlider(
  props: SliderComponentProps,
  model: WritableNumberModel,
  attrs?: Readonly<Record<string, unknown>>,
): SliderComponentBinding;
export function useSlider(
  inputOrProps: ReadonlySliderRef | SliderComponentProps,
  model: WritableNumberModel,
  attrs: Readonly<Record<string, unknown>> = {},
): void | SliderComponentBinding {
  if (!("value" in inputOrProps)) {
    const props = inputOrProps;
    const input = shallowRef<HTMLInputElement | null>(null);
    const generatedId = getCurrentInstance() ? useId() : undefined;
    const controlId = () => props.id ?? generatedId;
    connectSlider(input, model);

    return {
      get inputProps() {
        return mergeElementProps(
          { ...attrs, class: withoutClassToken(attrs.class, "n-slider") },
          {
            ref(element: Element | ComponentPublicInstance | null) {
              input.value = element as HTMLInputElement | null;
            },
            type: "range" as const,
            id: controlId(),
            min: props.min,
            max: props.max,
            step: props.step,
            disabled: props.disabled,
          },
        ) as SliderInputProps;
      },
      get labelProps() {
        return { for: controlId() };
      },
      get outputProps() {
        return { for: controlId() };
      },
    };
  }

  connectSlider(inputOrProps, model);
}

function connectSlider(input: ReadonlySliderRef, model: WritableNumberModel): void {
  let initialValue: number | undefined;

  function syncNativeValue(control = input.value): number | undefined {
    if (!control) return undefined;
    const value = control.valueAsNumber;
    if (Number.isNaN(value)) return undefined;
    if (model.value !== value) model.value = value;
    return value;
  }

  useNativeFormReset(input, (control) => {
    if (initialValue !== undefined) control.value = String(initialValue);
    syncNativeValue(control);
  });

  if (getCurrentInstance()) {
    // Range inputs sanitize value against min/max/step after DOM properties are
    // patched. Read the result instead of reproducing that browser algorithm.
    onMounted(() => {
      initialValue = syncNativeValue();
    });
    onUpdated(() => syncNativeValue());
  }
}
