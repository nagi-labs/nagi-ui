import { ref, toValue, watch, type Ref } from "vue";

import {
  useCombobox,
  type ComboboxInputProps,
  type UseComboboxOptions,
  type UseComboboxReturn,
} from "./combobox.ts";
import { modelValueAccepted } from "./model-sync.ts";
import type { WritableRef } from "./model-sync.ts";
import { useNativeValueReset } from "./native-form.ts";

export interface UseAutocompleteOptions<Item, Key extends string = string> extends Omit<
  UseComboboxOptions<Item, Key>,
  "inputValue" | "selected" | "defaultSelected"
> {
  value: WritableRef<string>;
}

export interface AutocompleteBinding<Item, Key extends string = string> extends Omit<
  UseComboboxReturn<Item, Key>,
  "inputProps"
> {
  inputProps: ComboboxInputProps;
}

interface AutocompleteComponentItem {
  readonly key: string;
  readonly label: string;
  readonly disabled?: boolean;
}

export interface AutocompleteComponentProps<Item extends AutocompleteComponentItem> {
  readonly items: readonly Item[];
  readonly id?: string | undefined;
  readonly disabled: boolean;
  readonly readOnly: boolean;
  readonly required: boolean;
}

function createAutocomplete<Item, Key extends string>(
  options: UseAutocompleteOptions<Item, Key>,
): AutocompleteBinding<Item, Key> {
  const selected = ref<Key | null>(null) as Ref<Key | null>;
  let inputRevision = 0;
  const callerOnSelect = options.onSelect;
  const behavior = useCombobox({
    ...options,
    inputValue: options.value,
    selected,
    onSelect(item) {
      callerOnSelect?.(item);
      const key = options.getKey(item);
      const text = options.getTextValue(item);
      void modelValueAccepted(options.value, text).then((accepted) => {
        if (!accepted && selected.value === key) selected.value = null;
      });
    },
  });
  const originalInput = behavior.inputProps.onInput;
  const originalCompositionstart = behavior.inputProps.onCompositionstart;
  const originalCompositionend = behavior.inputProps.onCompositionend;
  let composing = false;
  const inputProps = Object.defineProperties(
    {},
    Object.getOwnPropertyDescriptors(behavior.inputProps),
  ) as ComboboxInputProps;
  function settleInput(input: HTMLInputElement, requested: string) {
    const revision = ++inputRevision;
    void modelValueAccepted(options.value, requested).then((accepted) => {
      if (!accepted && revision === inputRevision) input.value = options.value.value;
    });
  }
  inputProps.onInput = (event) => {
    const input = event.currentTarget as HTMLInputElement;
    originalInput(event);
    if (composing || (event as InputEvent).isComposing) return;
    settleInput(input, input.value);
  };
  inputProps.onCompositionstart = (event) => {
    composing = true;
    originalCompositionstart(event);
  };
  inputProps.onCompositionend = (event) => {
    composing = false;
    originalCompositionend(event);
    const input = event.currentTarget as HTMLInputElement;
    settleInput(input, input.value);
  };

  function reconcileSelectionFromInput(value: string) {
    if (selected.value === null) return;
    const item = toValue(options.items).find(
      (candidate) => options.getKey(candidate) === selected.value,
    );
    if (!item || options.getTextValue(item) !== value) selected.value = null;
  }

  watch(options.value, reconcileSelectionFromInput, { flush: "sync" });

  return { ...behavior, inputProps };
}

export function useAutocomplete<Item, Key extends string = string>(
  options: UseAutocompleteOptions<Item, Key>,
): AutocompleteBinding<Item, Key>;
export function useAutocomplete<Item extends AutocompleteComponentItem>(
  props: AutocompleteComponentProps<Item>,
  value: Ref<string>,
): AutocompleteBinding<Item, string>;
export function useAutocomplete<Item, Key extends string = string>(
  optionsOrProps:
    | UseAutocompleteOptions<Item, Key>
    | AutocompleteComponentProps<Item & AutocompleteComponentItem>,
  value?: Ref<string>,
): AutocompleteBinding<Item, Key> {
  if (value === undefined)
    return createAutocomplete(optionsOrProps as UseAutocompleteOptions<Item, Key>);
  const props = optionsOrProps as AutocompleteComponentProps<Item & AutocompleteComponentItem>;
  const binding = createAutocomplete({
    value,
    ...(props.id === undefined ? {} : { id: props.id }),
    items: () => props.items,
    getKey: (item) => item.key as Key,
    getTextValue: (item) => item.label,
    isDisabled: (item) => item.disabled ?? false,
    disabled: () => props.disabled,
    readOnly: () => props.readOnly,
    required: () => props.required,
    openWhenEmpty: true,
  }) as unknown as AutocompleteBinding<Item, Key>;
  useNativeValueReset(binding.inputElement, value);
  return binding;
}
