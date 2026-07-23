import {
  CalendarDate,
  parseDate,
  type DateField as InternationalizedDateField,
} from "@internationalized/date";
import {
  computed,
  getCurrentInstance,
  nextTick,
  onScopeDispose,
  reactive,
  ref,
  toValue,
  useId,
  watch,
  type ComputedRef,
  type MaybeRefOrGetter,
  type Ref,
} from "vue";

import { useNativeCustomValidity, useNativeFormReset } from "./native-form.ts";

export type DateFieldSegmentType = "year" | "month" | "day" | "literal";
export type DateFieldDirection = "ltr" | "rtl";
type EditableDateFieldSegmentType = Exclude<DateFieldSegmentType, "literal">;

export interface DateFieldSegment {
  /** Stable key in locale display order. */
  readonly key: string;
  readonly type: DateFieldSegmentType;
  readonly text: string;
  readonly placeholder?: string;
  readonly value?: number;
}

export interface DateFieldProps {
  id: string;
  role: "group";
  dir: DateFieldDirection;
  "aria-label": string;
  "aria-disabled": "true" | undefined;
  "aria-readonly": "true" | undefined;
  "aria-required": "true" | undefined;
  "aria-invalid": "true" | undefined;
  onFocusout: (event: FocusEvent) => void;
}

export interface DateFieldSegmentProps {
  id?: string;
  role?: "spinbutton";
  tabindex?: 0 | -1;
  "aria-hidden"?: "true";
  "aria-label"?: string;
  "aria-valuemin"?: number;
  "aria-valuemax"?: number;
  "aria-valuenow"?: number;
  "aria-valuetext"?: string;
  "aria-disabled"?: "true";
  "aria-readonly"?: "true";
  contenteditable?: "true" | "false";
  inputmode?: "numeric";
  spellcheck?: false;
  onClick?: (event: MouseEvent) => void;
  onFocus?: (event: FocusEvent) => void;
  onBeforeinput?: (event: InputEvent) => void;
  onInput?: (event: Event) => void;
  onPaste?: (event: ClipboardEvent) => void;
  onKeydown?: (event: KeyboardEvent) => void;
}

export interface DateFieldFormValueProps {
  type: "date";
  tabindex: -1;
  "aria-hidden": "true";
  name: string | undefined;
  form: string | undefined;
  value: string;
  min: string | undefined;
  max: string | undefined;
  disabled: boolean;
  readonly: boolean;
  required: boolean;
  onInvalid: (event: Event) => void;
}

export interface DateFieldSegmentLabels {
  year: string;
  month: string;
  day: string;
  empty: string;
}

export interface UseDateFieldOptions {
  /** Controlled ISO date model (`YYYY-MM-DD`). */
  value: Ref<string | null>;
  label: MaybeRefOrGetter<string>;
  /** Explicit locale keeps SSR and hydration markup identical. Defaults to `en-US`. */
  locale?: MaybeRefOrGetter<string | undefined>;
  dir?: MaybeRefOrGetter<DateFieldDirection | undefined>;
  id?: string | undefined;
  minValue?: MaybeRefOrGetter<string | undefined>;
  maxValue?: MaybeRefOrGetter<string | undefined>;
  disabled?: MaybeRefOrGetter<boolean | undefined>;
  readOnly?: MaybeRefOrGetter<boolean | undefined>;
  required?: MaybeRefOrGetter<boolean | undefined>;
  invalid?: MaybeRefOrGetter<boolean | undefined>;
  validationMessage?: MaybeRefOrGetter<string | undefined>;
  name?: MaybeRefOrGetter<string | undefined>;
  form?: MaybeRefOrGetter<string | undefined>;
  segmentLabels?: Partial<DateFieldSegmentLabels>;
  /** Native form-value control used for reset and constraint validation. */
  formControl?: Readonly<Ref<HTMLInputElement | null>>;
}

export interface DateFieldBinding {
  value: Ref<string | null>;
  segments: ComputedRef<readonly DateFieldSegment[]>;
  fieldProps: DateFieldProps;
  segmentProps: (segment: DateFieldSegment) => DateFieldSegmentProps;
  formValueProps: DateFieldFormValueProps;
  isInvalid: ComputedRef<boolean>;
  validationMessage: ComputedRef<string>;
  focusFirst: () => void;
  reset: (value: string | null) => void;
}

export interface DateFieldComponentProps {
  readonly label: string;
  readonly id?: string | undefined;
  readonly name?: string | undefined;
  readonly form?: string | undefined;
  readonly locale: string;
  readonly dir?: DateFieldDirection | undefined;
  readonly min?: string | undefined;
  readonly max?: string | undefined;
  readonly disabled: boolean;
  readonly readOnly: boolean;
  readonly required: boolean;
  readonly invalid: boolean;
  readonly validationMessage: string;
  readonly yearLabel: string;
  readonly monthLabel: string;
  readonly dayLabel: string;
  readonly emptyLabel: string;
}

interface PartialDate {
  year: number | undefined;
  month: number | undefined;
  day: number | undefined;
}

const DEFAULT_LABELS: DateFieldSegmentLabels = {
  year: "Year",
  month: "Month",
  day: "Day",
  empty: "Empty",
};

let dateFieldCount = 0;

function parseIsoDate(value: string | null | undefined): CalendarDate | null {
  if (!value) return null;
  try {
    return parseDate(value);
  } catch {
    return null;
  }
}

function dateParts(value: CalendarDate | null): PartialDate {
  return value === null
    ? { year: undefined, month: undefined, day: undefined }
    : { year: value.year, month: value.month, day: value.day };
}

function equalParts(left: PartialDate, right: CalendarDate): boolean {
  return left.year === right.year && left.month === right.month && left.day === right.day;
}

/**
 * Accessible segmented date editing over caller-owned DOM. Date arithmetic and
 * ISO parsing are delegated to `@internationalized/date`; Intl determines the
 * locale's segment and literal order.
 */
function createDateField(options: UseDateFieldOptions): DateFieldBinding {
  const instance = getCurrentInstance();
  const id = options.id ?? (instance ? useId() : `nagi-date-field-${dateFieldCount++}`);
  const parts = reactive(dateParts(parseIsoDate(options.value.value)));
  const forcedInvalid = ref(false);
  const incompleteInvalid = ref(false);
  let modelWrite = false;
  let pendingModelWrite = false;
  let pendingModelValue: string | null = null;
  let writeRevision = 0;
  let ownerDocument: Document | null = null;
  let buffer = "";
  let bufferedType: EditableDateFieldSegmentType | null = null;
  let bufferTask: ReturnType<typeof setTimeout> | undefined;

  function locale(): string {
    return toValue(options.locale) ?? "en-US";
  }

  function disabled(): boolean {
    return toValue(options.disabled) ?? false;
  }

  function direction(): DateFieldDirection {
    const localeInfo = new Intl.Locale(locale()) as Intl.Locale & {
      textInfo?: { direction?: "ltr" | "rtl" };
    };
    return toValue(options.dir)
      ?? (localeInfo.textInfo?.direction === "rtl" ? "rtl" : "ltr");
  }

  function readOnly(): boolean {
    return toValue(options.readOnly) ?? false;
  }

  function clearBuffer() {
    buffer = "";
    bufferedType = null;
    if (bufferTask !== undefined) clearTimeout(bufferTask);
    bufferTask = undefined;
  }

  function resetBufferLater() {
    if (bufferTask !== undefined) clearTimeout(bufferTask);
    bufferTask = setTimeout(clearBuffer, 1000);
  }

  function syncFromModel(value: string | null) {
    const parsed = parseIsoDate(value);
    const next = dateParts(parsed);
    parts.year = next.year;
    parts.month = next.month;
    parts.day = next.day;
    incompleteInvalid.value = value !== null && parsed === null;
    forcedInvalid.value = false;
    clearBuffer();
  }

  function writeModel(next: string | null) {
    if (options.value.value === next) return;
    const revision = ++writeRevision;
    pendingModelWrite = true;
    pendingModelValue = next;
    modelWrite = true;
    options.value.value = next;
    modelWrite = false;
    void nextTick(() => {
      if (revision !== writeRevision || options.value.value === next) return;
      pendingModelWrite = false;
      syncFromModel(options.value.value);
    });
  }

  function candidate(): CalendarDate | null {
    if (parts.year === undefined || parts.month === undefined || parts.day === undefined) {
      return null;
    }
    const next = new CalendarDate(parts.year, parts.month, parts.day);
    return equalParts(parts, next) ? next : null;
  }

  function outOfRange(value: CalendarDate): boolean {
    const minimum = parseIsoDate(toValue(options.minValue));
    const maximum = parseIsoDate(toValue(options.maxValue));
    return (minimum !== null && value.compare(minimum) < 0)
      || (maximum !== null && value.compare(maximum) > 0);
  }

  function commitParts() {
    incompleteInvalid.value = false;
    const next = candidate();
    if (next === null) {
      incompleteInvalid.value = parts.year !== undefined
        && parts.month !== undefined
        && parts.day !== undefined;
      writeModel(null);
      return;
    }
    writeModel(next.toString());
    forcedInvalid.value = outOfRange(next);
  }

  watch(options.value, (value) => {
    if (modelWrite) {
      pendingModelWrite = false;
      return;
    }
    if (pendingModelWrite && value === pendingModelValue) {
      pendingModelWrite = false;
      return;
    }
    pendingModelWrite = false;
    syncFromModel(value);
  }, { flush: "sync" });

  function maximumFor(type: EditableDateFieldSegmentType): number {
    if (type === "year") return 9999;
    if (type === "month") return 12;
    if (parts.year !== undefined && parts.month !== undefined) {
      return new CalendarDate(parts.year, parts.month, 1).calendar.getDaysInMonth(
        new CalendarDate(parts.year, parts.month, 1),
      );
    }
    return 31;
  }

  function minimumFor(_type: EditableDateFieldSegmentType): number {
    return 1;
  }

  function placeholder(type: EditableDateFieldSegmentType): string {
    if (type === "year") return "yyyy";
    if (type === "month") return "mm";
    return "dd";
  }

  function formatNumber(type: EditableDateFieldSegmentType, value: number): string {
    return new Intl.NumberFormat(locale(), {
      useGrouping: false,
      minimumIntegerDigits: type === "year" ? 4 : 2,
    }).format(value);
  }

  function editableSegments(): readonly EditableDateFieldSegmentType[] {
    return segments.value
      .filter((segment): segment is DateFieldSegment & { type: EditableDateFieldSegmentType } =>
        segment.type !== "literal")
      .map((segment) => segment.type);
  }

  function segmentId(type: EditableDateFieldSegmentType): string {
    return `${id}-${type}`;
  }

  function focus(type: EditableDateFieldSegmentType) {
    ownerDocument?.getElementById(segmentId(type))?.focus({ preventScroll: true });
  }

  function focusAdjacent(type: EditableDateFieldSegmentType, delta: -1 | 1) {
    const editable = editableSegments();
    const index = editable.indexOf(type);
    const next = editable[index + delta];
    if (next) focus(next);
  }

  function localeDigit(key: string): string | null {
    if (/^[0-9]$/u.test(key)) return key;
    const formatter = new Intl.NumberFormat(locale(), { useGrouping: false });
    for (let digit = 0; digit <= 9; digit += 1) {
      if (formatter.format(digit) === key) return String(digit);
    }
    return null;
  }

  function setSegment(type: EditableDateFieldSegmentType, value: number | undefined) {
    parts[type] = value;
    if ((type === "year" || type === "month") && parts.day !== undefined) {
      parts.day = Math.min(parts.day, maximumFor("day"));
    }
    commitParts();
  }

  function typeDigit(type: EditableDateFieldSegmentType, digit: string) {
    if (bufferedType !== type) buffer = "";
    bufferedType = type;
    let nextBuffer = `${buffer}${digit}`;
    const maximum = maximumFor(type);
    const width = type === "year" ? 4 : 2;
    if (Number(nextBuffer) > maximum || nextBuffer.length > width) nextBuffer = digit;
    const next = Number(nextBuffer);
    if (next < minimumFor(type) || next > maximum) return;
    buffer = nextBuffer;
    setSegment(type, next);
    resetBufferLater();

    if (buffer.length >= width || Number(`${buffer}0`) > maximum) {
      clearBuffer();
      focusAdjacent(type, 1);
    }
  }

  function cycle(type: EditableDateFieldSegmentType, amount: -1 | 1) {
    const current = candidate();
    if (current !== null) {
      const next = current.cycle(type as InternationalizedDateField, amount);
      parts.year = next.year;
      parts.month = next.month;
      parts.day = next.day;
      commitParts();
      return;
    }
    const currentPart = parts[type];
    const minimum = minimumFor(type);
    const maximum = maximumFor(type);
    const initial = type === "year" ? 2000 : minimum;
    const next = currentPart === undefined
      ? initial
      : currentPart + amount > maximum
        ? minimum
        : currentPart + amount < minimum
          ? maximum
          : currentPart + amount;
    setSegment(type, next);
  }

  function onKeydown(type: EditableDateFieldSegmentType, event: KeyboardEvent) {
    if (disabled() || readOnly()) return;
    const digit = localeDigit(event.key);
    if (digit !== null && !event.altKey && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      typeDigit(type, digit);
      return;
    }
    switch (event.key) {
      case "ArrowUp":
        event.preventDefault();
        clearBuffer();
        cycle(type, 1);
        break;
      case "ArrowDown":
        event.preventDefault();
        clearBuffer();
        cycle(type, -1);
        break;
      case "ArrowLeft":
        event.preventDefault();
        clearBuffer();
        focusAdjacent(type, direction() === "rtl" ? 1 : -1);
        break;
      case "ArrowRight":
        event.preventDefault();
        clearBuffer();
        focusAdjacent(type, direction() === "rtl" ? -1 : 1);
        break;
      case "Home":
        event.preventDefault();
        clearBuffer();
        setSegment(type, minimumFor(type));
        break;
      case "End":
        event.preventDefault();
        clearBuffer();
        setSegment(type, maximumFor(type));
        break;
      case "Backspace":
      case "Delete":
        event.preventDefault();
        clearBuffer();
        setSegment(type, undefined);
        break;
    }
  }

  const segments = computed<readonly DateFieldSegment[]>(() => {
    const order = new Intl.DateTimeFormat(locale(), {
      calendar: "gregory",
      timeZone: "UTC",
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }).formatToParts(new Date(Date.UTC(2000, 10, 22)));
    const counts = new Map<string, number>();
    return order.flatMap((part): DateFieldSegment[] => {
      if (part.type !== "year" && part.type !== "month" && part.type !== "day") {
        if (part.type !== "literal") return [];
        const count = counts.get("literal") ?? 0;
        counts.set("literal", count + 1);
        return [{ key: `literal-${count}`, type: "literal", text: part.value }];
      }
      const value = parts[part.type];
      return [{
        key: part.type,
        type: part.type,
        text: value === undefined ? placeholder(part.type) : formatNumber(part.type, value),
        placeholder: placeholder(part.type),
        ...(value === undefined ? {} : { value }),
      }];
    });
  });

  const isInvalid = computed(() => {
    if (toValue(options.invalid) ?? false) return true;
    const current = candidate();
    if (incompleteInvalid.value) return true;
    if (forcedInvalid.value
      && current === null
      && (toValue(options.required) ?? false)
      && !disabled()
      && !readOnly()) return true;
    return current !== null && outOfRange(current);
  });
  const validationMessage = computed(() => isInvalid.value
    ? toValue(options.validationMessage) ?? "Enter a valid date."
    : "");

  const fieldProps: DateFieldProps = {
    id,
    role: "group",
    get dir() {
      return direction();
    },
    get "aria-label"() {
      return toValue(options.label);
    },
    get "aria-disabled"() {
      return disabled() ? "true" : undefined;
    },
    get "aria-readonly"() {
      return readOnly() ? "true" : undefined;
    },
    get "aria-required"() {
      return (toValue(options.required) ?? false) ? "true" : undefined;
    },
    get "aria-invalid"() {
      return isInvalid.value ? "true" : undefined;
    },
    onFocusout(event) {
      const next = event.relatedTarget as Node | null;
      if (next && (event.currentTarget as HTMLElement).contains(next)) return;
      const hasAny = parts.year !== undefined || parts.month !== undefined || parts.day !== undefined;
      incompleteInvalid.value = hasAny && candidate() === null;
      clearBuffer();
    },
  };

  function segmentProps(segment: DateFieldSegment): DateFieldSegmentProps {
    if (segment.type === "literal") return { "aria-hidden": "true" };
    const type = segment.type;
    const value = parts[type];
    return {
      id: segmentId(type),
      role: "spinbutton",
      tabindex: disabled() ? -1 : 0,
      "aria-label": options.segmentLabels?.[type] ?? DEFAULT_LABELS[type],
      "aria-valuemin": minimumFor(type),
      "aria-valuemax": maximumFor(type),
      ...(value === undefined
        ? { "aria-valuetext": options.segmentLabels?.empty ?? DEFAULT_LABELS.empty }
        : { "aria-valuenow": value, "aria-valuetext": formatNumber(type, value) }),
      ...(disabled() ? { "aria-disabled": "true" as const } : {}),
      ...(readOnly() ? { "aria-readonly": "true" as const } : {}),
      contenteditable: disabled() || readOnly() ? "false" : "true",
      inputmode: "numeric",
      spellcheck: false,
      onClick(event) {
        ownerDocument = (event.currentTarget as HTMLElement).ownerDocument;
        (event.currentTarget as HTMLElement).focus();
      },
      onFocus(event) {
        ownerDocument = (event.currentTarget as HTMLElement).ownerDocument;
      },
      onBeforeinput(event) {
        event.preventDefault();
        if (disabled() || readOnly()) return;
        if (event.inputType.startsWith("delete")) {
          setSegment(type, undefined);
          return;
        }
        if (event.inputType !== "insertText" || !event.data) return;
        for (const character of event.data) {
          const digit = localeDigit(character);
          if (digit !== null) typeDigit(type, digit);
        }
      },
      onInput(event) {
        const current = segments.value.find((candidate) => candidate.type === type);
        if (current) (event.currentTarget as HTMLElement).textContent = current.text;
      },
      onPaste(event) {
        const pasted = event.clipboardData?.getData("text").trim();
        if (!pasted) return;
        const next = parseIsoDate(pasted);
        if (next === null) return;
        event.preventDefault();
        parts.year = next.year;
        parts.month = next.month;
        parts.day = next.day;
        incompleteInvalid.value = false;
        forcedInvalid.value = outOfRange(next);
        writeModel(next.toString());
      },
      onKeydown: (event) => onKeydown(type, event),
    };
  }

  function focusFirst() {
    const first = editableSegments()[0];
    if (first) focus(first);
  }

  function reset(value: string | null) {
    writeRevision += 1;
    pendingModelWrite = false;
    pendingModelValue = null;
    options.value.value = value;
    syncFromModel(value);
  }

  const formValueProps: DateFieldFormValueProps = {
    type: "date",
    tabindex: -1,
    "aria-hidden": "true",
    get name() {
      return toValue(options.name);
    },
    get form() {
      return toValue(options.form);
    },
    get value() {
      return options.value.value ?? "";
    },
    get min() {
      return toValue(options.minValue);
    },
    get max() {
      return toValue(options.maxValue);
    },
    get disabled() {
      return disabled();
    },
    get readonly() {
      return readOnly();
    },
    get required() {
      return toValue(options.required) ?? false;
    },
    onInvalid(event) {
      forcedInvalid.value = true;
      event.preventDefault();
      ownerDocument = (event.currentTarget as HTMLInputElement | null)?.ownerDocument ?? ownerDocument;
      focusFirst();
    },
  };

  if (options.formControl) {
    const initialValue = options.value.value;
    useNativeFormReset(options.formControl, (control) => {
      reset(initialValue);
      control.value = initialValue ?? "";
    });
    useNativeCustomValidity(options.formControl, validationMessage);
  }

  onScopeDispose(clearBuffer);

  return {
    value: options.value,
    segments,
    fieldProps,
    segmentProps,
    formValueProps,
    isInvalid,
    validationMessage,
    focusFirst,
    reset,
  };
}

export function useDateField(options: UseDateFieldOptions): DateFieldBinding;
export function useDateField(
  props: DateFieldComponentProps,
  value: Ref<string | null>,
): DateFieldBinding;
/** Uses either complete headless options, or the shipped segmented-field contract. */
export function useDateField(
  optionsOrProps: UseDateFieldOptions | DateFieldComponentProps,
  value?: Ref<string | null>,
): DateFieldBinding {
  if (value === undefined) return createDateField(optionsOrProps as UseDateFieldOptions);
  const props = optionsOrProps as DateFieldComponentProps;
  return createDateField({
    value,
    label: () => props.label,
    locale: () => props.locale,
    dir: () => props.dir,
    id: props.id,
    minValue: () => props.min,
    maxValue: () => props.max,
    disabled: () => props.disabled,
    readOnly: () => props.readOnly,
    required: () => props.required,
    invalid: () => props.invalid,
    validationMessage: () => props.validationMessage,
    name: () => props.name,
    form: () => props.form,
    segmentLabels: {
      get year() { return props.yearLabel; },
      get month() { return props.monthLabel; },
      get day() { return props.dayLabel; },
      get empty() { return props.emptyLabel; },
    },
  });
}

/** Keeps package DateField reset and native constraint validation synchronized. */
export function useDateFieldNativeForm(
  control: Readonly<Ref<HTMLInputElement | null>>,
  binding: DateFieldBinding,
): void {
  const initialValue = binding.value.value;
  useNativeFormReset(control, (input) => {
    binding.reset(initialValue);
    input.value = initialValue ?? "";
  });
  useNativeCustomValidity(control, binding.validationMessage);
}
