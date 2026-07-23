import {
  getCurrentInstance,
  nextTick,
  ref,
  toValue,
  useId,
  watchEffect,
  type MaybeRefOrGetter,
  type Ref,
} from "vue";

import { useNativeFormReset } from "./native-form.ts";
import { modelValueAccepted, type WritableRef } from "./model-sync.ts";

export interface UseTagsInputOptions {
  value: WritableRef<readonly string[]>;
  label: MaybeRefOrGetter<string>;
  name?: MaybeRefOrGetter<string | undefined>;
  form?: MaybeRefOrGetter<string | undefined>;
  placeholder?: MaybeRefOrGetter<string | undefined>;
  disabled?: MaybeRefOrGetter<boolean | undefined>;
  readOnly?: MaybeRefOrGetter<boolean | undefined>;
  required?: MaybeRefOrGetter<boolean | undefined>;
  allowDuplicates?: MaybeRefOrGetter<boolean | undefined>;
  max?: MaybeRefOrGetter<number | undefined>;
  addOnBlur?: MaybeRefOrGetter<boolean | undefined>;
  formControl?: Readonly<Ref<HTMLSelectElement | null>>;
  inputControl?: Readonly<Ref<HTMLInputElement | null>>;
  normalize?: (value: string) => string;
  id?: string;
}

export interface TagsInputProps {
  id: string;
  type: "text";
  value: string;
  "aria-label": string;
  readonly "aria-required": "true" | undefined;
  readonly "aria-invalid": "true" | undefined;
  placeholder?: string | undefined;
  disabled: boolean;
  readonly: boolean;
  onInput: (event: Event) => void;
  onKeydown: (event: KeyboardEvent) => void;
  onPaste: (event: ClipboardEvent) => void;
  onBlur: (event: FocusEvent) => void;
  onCompositionstart: () => void;
  onCompositionend: () => void;
}

export interface TagsInputFormProps {
  multiple: true;
  name?: string | undefined;
  form?: string | undefined;
  disabled: boolean;
  required: boolean;
  tabindex: -1;
  "aria-hidden": "true";
  onInvalid: (event: Event) => void;
}

export interface TagsInputBinding {
  value: Ref<readonly string[]>;
  inputValue: Ref<string>;
  inputProps: TagsInputProps;
  formProps: TagsInputFormProps;
  add: (value?: string) => boolean;
  remove: (index: number) => void;
  reset: (value: readonly string[]) => void;
}

export interface TagsInputComponentProps {
  readonly label: string;
  readonly name?: string;
  readonly form?: string;
  readonly placeholder?: string;
  readonly disabled: boolean;
  readonly readOnly: boolean;
  readonly required: boolean;
  readonly allowDuplicates: boolean;
  readonly max?: number;
  readonly addOnBlur: boolean;
}

export interface TagsInputComponentModel {
  value: Ref<readonly string[]>;
  formControl: Readonly<Ref<HTMLSelectElement | null>>;
  inputControl: Readonly<Ref<HTMLInputElement | null>>;
}

let tagsInputCount = 0;

function createTagsInput(options: UseTagsInputOptions): TagsInputBinding {
  const instance = getCurrentInstance();
  const id = options.id ?? (instance ? useId() : `nagi-tags-input-${tagsInputCount++}`);
  const inputValue = ref("");
  const composing = ref(false);
  const invalid = ref(false);
  let inputElement: HTMLInputElement | null = null;
  const disabled = () => toValue(options.disabled) ?? false;
  const readOnly = () => toValue(options.readOnly) ?? false;
  const normalize = (value: string) => (options.normalize?.(value) ?? value.trim());

  function write(next: readonly string[]) {
    options.value.value = next;
  }

  function equals(left: readonly string[], right: readonly string[]) {
    return left.length === right.length && left.every((value, index) => value === right[index]);
  }

  function clearDraft() {
    inputValue.value = "";
    if (inputElement) inputElement.value = "";
  }

  function commit(next: readonly string[], clearOnAccept = true): boolean {
    write(next);
    const accepted = equals(options.value.value, next);
    if (accepted && clearOnAccept) clearDraft();
    else if (clearOnAccept) {
      void modelValueAccepted(options.value, next, equals).then((eventuallyAccepted) => {
        if (eventuallyAccepted) clearDraft();
        else if (inputElement) inputElement.value = inputValue.value;
      });
    }
    return accepted;
  }

  function add(raw = inputValue.value): boolean {
    if (disabled() || readOnly()) return false;
    const next = normalize(raw);
    if (!next) return false;
    const limit = toValue(options.max);
    if (limit !== undefined && options.value.value.length >= limit) return false;
    if (!(toValue(options.allowDuplicates) ?? false) && options.value.value.includes(next)) {
      return false;
    }
    return commit([...options.value.value, next]);
  }

  function remove(index: number) {
    if (disabled() || readOnly() || index < 0 || index >= options.value.value.length) return;
    write(options.value.value.filter((_tag, tagIndex) => tagIndex !== index));
    void nextTick(() => (options.inputControl?.value ?? inputElement)?.focus());
  }

  function reset(value: readonly string[]) {
    commit([...value]);
    invalid.value = false;
  }

  const inputProps: TagsInputProps = {
    id,
    type: "text",
    get value() { return inputValue.value; },
    get "aria-label"() { return toValue(options.label); },
    get "aria-required"() { return toValue(options.required) ? "true" : undefined; },
    get "aria-invalid"() { return invalid.value ? "true" : undefined; },
    get placeholder() { return toValue(options.placeholder); },
    get disabled() { return disabled(); },
    get readonly() { return readOnly(); },
    onInput(event) {
      inputElement = event.currentTarget as HTMLInputElement;
      if (!composing.value) inputValue.value = inputElement.value;
    },
    onKeydown(event) {
      inputElement = event.currentTarget as HTMLInputElement;
      if (event.isComposing || event.keyCode === 229 || composing.value) return;
      if (event.key === "Enter" || event.key === ",") {
        if (normalize(inputValue.value)) {
          event.preventDefault();
          add();
        }
      } else if (event.key === "Backspace" && inputValue.value === "") {
        if (options.value.value.length > 0) {
          event.preventDefault();
          remove(options.value.value.length - 1);
        }
      }
    },
    onPaste(event) {
      if (disabled() || readOnly()) return;
      const text = event.clipboardData?.getData("text") ?? "";
      const values = text.split(/[\n,;]+/u).map(normalize).filter(Boolean);
      if (values.length < 2) return;
      event.preventDefault();
      const next = [...options.value.value];
      const limit = toValue(options.max);
      const allowDuplicates = toValue(options.allowDuplicates) ?? false;
      for (const value of values) {
        if (limit !== undefined && next.length >= limit) break;
        if (!allowDuplicates && next.includes(value)) continue;
        next.push(value);
      }
      commit(next);
    },
    onBlur(event) {
      inputElement = event.currentTarget as HTMLInputElement;
      if (toValue(options.addOnBlur) ?? false) add();
    },
    onCompositionstart() { composing.value = true; },
    onCompositionend() {
      composing.value = false;
      if (inputElement) inputValue.value = inputElement.value;
    },
  };

  const formProps: TagsInputFormProps = {
    multiple: true,
    get name() { return toValue(options.name); },
    get form() { return toValue(options.form); },
    get disabled() { return disabled(); },
    get required() { return (toValue(options.required) ?? false) && !readOnly(); },
    tabindex: -1,
    "aria-hidden": "true",
    onInvalid(event) {
      event.preventDefault();
      invalid.value = true;
      (options.inputControl?.value ?? inputElement)?.focus();
    },
  };

  if (options.formControl) {
    const initial = [...options.value.value];
    useNativeFormReset(options.formControl, () => reset(initial));
  }

  watchEffect(() => {
    if (!(toValue(options.required) ?? false) || disabled() || readOnly() || options.value.value.length > 0) {
      invalid.value = false;
    }
  }, { flush: "sync" });

  return { value: options.value, inputValue, inputProps, formProps, add, remove, reset };
}

export function useTagsInput(options: UseTagsInputOptions): TagsInputBinding;
export function useTagsInput(
  props: TagsInputComponentProps,
  model: TagsInputComponentModel,
): TagsInputBinding;
export function useTagsInput(
  optionsOrProps: UseTagsInputOptions | TagsInputComponentProps,
  model?: TagsInputComponentModel,
): TagsInputBinding {
  if (!model) return createTagsInput(optionsOrProps as UseTagsInputOptions);
  const props = optionsOrProps as TagsInputComponentProps;
  return createTagsInput({
    value: model.value,
    label: () => props.label,
    name: () => props.name,
    form: () => props.form,
    placeholder: () => props.placeholder,
    disabled: () => props.disabled,
    readOnly: () => props.readOnly,
    required: () => props.required,
    allowDuplicates: () => props.allowDuplicates,
    max: () => props.max,
    addOnBlur: () => props.addOnBlur,
    formControl: model.formControl,
    inputControl: model.inputControl,
  });
}
