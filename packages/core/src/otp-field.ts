import {
  computed,
  getCurrentInstance,
  ref,
  toValue,
  useId,
  watch,
  type ComputedRef,
  type MaybeRefOrGetter,
  type Ref,
} from "vue";
import { modelValueAccepted, requestModelValue, type WritableRef } from "./model-sync.ts";

export type OTPFieldKind = "numeric" | "alphanumeric";

export interface UseOTPFieldOptions {
  value: WritableRef<string>;
  label: MaybeRefOrGetter<string>;
  /** Defaults to 6 and is normalized to an integer from 1 through 256. */
  length?: MaybeRefOrGetter<number | undefined>;
  kind?: MaybeRefOrGetter<OTPFieldKind | undefined>;
  name?: MaybeRefOrGetter<string | undefined>;
  form?: MaybeRefOrGetter<string | undefined>;
  disabled?: MaybeRefOrGetter<boolean | undefined>;
  readOnly?: MaybeRefOrGetter<boolean | undefined>;
  required?: MaybeRefOrGetter<boolean | undefined>;
  invalid?: MaybeRefOrGetter<boolean | undefined>;
  id?: string;
}

export interface OTPFieldInputProps {
  id: string;
  type: "text";
  value: string;
  name?: string | undefined;
  form?: string | undefined;
  inputmode: "numeric" | "text";
  autocomplete: "one-time-code";
  minlength: number;
  pattern: string;
  "aria-label": string;
  "aria-invalid"?: "true" | undefined;
  disabled: boolean;
  readonly: boolean;
  required: boolean;
  onInput: (event: Event) => void;
  onCompositionstart: () => void;
  onCompositionend: (event: CompositionEvent) => void;
}

export interface OTPFieldBinding {
  value: Ref<string>;
  cells: ComputedRef<readonly string[]>;
  otpInputProps: OTPFieldInputProps;
  isComplete: ComputedRef<boolean>;
}

export interface OTPFieldComponentProps {
  readonly label: string;
  /** Normalized to an integer from 1 through 256. */
  readonly length: number;
  readonly kind: OTPFieldKind;
  readonly name?: string | undefined;
  readonly form?: string | undefined;
  readonly disabled: boolean;
  readonly readOnly: boolean;
  readonly required: boolean;
  readonly invalid: boolean;
}

let otpCount = 0;
const maxOTPFieldLength = 256;

function normalizeLength(value: number | undefined): number {
  if (value === undefined) return 6;
  if (!Number.isFinite(value)) return 6;
  return Math.min(maxOTPFieldLength, Math.max(1, Math.trunc(value)));
}

function createOTPField(options: UseOTPFieldOptions): OTPFieldBinding {
  const instance = getCurrentInstance();
  const id = options.id ?? (instance ? useId() : `nagi-otp-field-${otpCount++}`);
  const composing = ref(false);
  let revision = 0;

  const length = () => normalizeLength(toValue(options.length));
  const kind = () => toValue(options.kind) ?? "numeric";
  const normalize = (value: string) => Array.from(value.normalize("NFKC"))
    .filter((character) => kind() === "numeric"
      ? /\p{Decimal_Number}/u.test(character)
      : /[\p{Letter}\p{Decimal_Number}]/u.test(character))
    .join("")
    .slice(0, length());

  function write(next: string, input: HTMLInputElement) {
    const normalized = normalize(next);
    const currentRevision = ++revision;
    options.value.value = normalized;
    input.value = normalized;
    void modelValueAccepted(options.value, normalized).then((accepted) => {
      if (currentRevision !== revision || accepted) return;
      input.value = options.value.value;
    });
  }

  const cells = computed(() => Array.from(
    { length: length() },
    (_value, index) => Array.from(options.value.value)[index] ?? "",
  ));
  const isComplete = computed(() =>
    options.value.value === normalize(options.value.value)
    && Array.from(options.value.value).length === length());

  watch(
    [() => options.value.value, length, kind],
    ([value]) => {
      const normalized = normalize(value);
      if (normalized === value) return;
      revision += 1;
      void requestModelValue(options.value, normalized);
    },
    { flush: "sync", immediate: true },
  );

  const otpInputProps: OTPFieldInputProps = {
    id,
    type: "text",
    get value() { return options.value.value; },
    get name() { return toValue(options.name); },
    get form() { return toValue(options.form); },
    get inputmode() { return kind() === "numeric" ? "numeric" : "text"; },
    autocomplete: "one-time-code",
    get minlength() { return length(); },
    get pattern() {
      return kind() === "numeric"
        ? `\\p{Decimal_Number}{${length()}}`
        : `[\\p{Letter}\\p{Decimal_Number}]{${length()}}`;
    },
    get "aria-label"() { return toValue(options.label); },
    get "aria-invalid"() { return (toValue(options.invalid) ?? false) ? "true" : undefined; },
    get disabled() { return toValue(options.disabled) ?? false; },
    get readonly() { return toValue(options.readOnly) ?? false; },
    get required() { return toValue(options.required) ?? false; },
    onInput(event) {
      if (composing.value) return;
      write((event.currentTarget as HTMLInputElement).value, event.currentTarget as HTMLInputElement);
    },
    onCompositionstart() { composing.value = true; },
    onCompositionend(event) {
      composing.value = false;
      const input = event.currentTarget as HTMLInputElement;
      write(input.value, input);
    },
  };

  return { value: options.value, cells, otpInputProps, isComplete };
}

export function useOTPField(options: UseOTPFieldOptions): OTPFieldBinding;
export function useOTPField(
  props: OTPFieldComponentProps,
  value: Ref<string>,
): OTPFieldBinding;
export function useOTPField(
  optionsOrProps: UseOTPFieldOptions | OTPFieldComponentProps,
  value?: Ref<string>,
): OTPFieldBinding {
  if (value === undefined) return createOTPField(optionsOrProps as UseOTPFieldOptions);
  const props = optionsOrProps as OTPFieldComponentProps;
  return createOTPField({
    value,
    label: () => props.label,
    length: () => props.length,
    kind: () => props.kind,
    name: () => props.name,
    form: () => props.form,
    disabled: () => props.disabled,
    readOnly: () => props.readOnly,
    required: () => props.required,
    invalid: () => props.invalid,
  });
}
