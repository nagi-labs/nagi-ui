import { Time, parseTime, type TimeField as InternationalizedTimeField } from "@internationalized/date";
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

export type TimeFieldGranularity = "minute" | "second";
export type TimeFieldDirection = "ltr" | "rtl";
export type TimeFieldSegmentType = "hour" | "minute" | "second" | "dayPeriod" | "literal";
type NumericTimeFieldSegmentType = "hour" | "minute" | "second";
type EditableTimeFieldSegmentType = Exclude<TimeFieldSegmentType, "literal">;

export interface TimeFieldSegment {
  readonly key: string;
  readonly type: TimeFieldSegmentType;
  readonly text: string;
  readonly placeholder?: string;
  readonly value?: number;
}

export interface TimeFieldProps {
  id: string;
  role: "group";
  dir: TimeFieldDirection;
  "aria-label": string;
  "aria-disabled": "true" | undefined;
  "aria-readonly": "true" | undefined;
  "aria-required": "true" | undefined;
  "aria-invalid": "true" | undefined;
  onFocusout: (event: FocusEvent) => void;
}

export interface TimeFieldSegmentProps {
  id?: string | undefined;
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
  inputmode?: "numeric" | "text";
  spellcheck?: false;
  onClick?: (event: MouseEvent) => void;
  onFocus?: (event: FocusEvent) => void;
  onBeforeinput?: (event: InputEvent) => void;
  onInput?: (event: Event) => void;
  onPaste?: (event: ClipboardEvent) => void;
  onKeydown?: (event: KeyboardEvent) => void;
}

export interface TimeFieldFormValueProps {
  type: "time";
  tabindex: -1;
  "aria-hidden": "true";
  name: string | undefined;
  form: string | undefined;
  value: string;
  min: string | undefined;
  max: string | undefined;
  step: 1 | 60;
  disabled: boolean;
  readonly: boolean;
  required: boolean;
  onInvalid: (event: Event) => void;
}

export interface TimeFieldSegmentLabels {
  hour: string;
  minute: string;
  second: string;
  dayPeriod: string;
  empty: string;
}

export interface UseTimeFieldOptions {
  /** Controlled ISO local-time model (`HH:mm` or `HH:mm:ss`). */
  value: Ref<string | null>;
  label: MaybeRefOrGetter<string>;
  locale?: MaybeRefOrGetter<string | undefined>;
  dir?: MaybeRefOrGetter<TimeFieldDirection | undefined>;
  id?: string | undefined;
  granularity?: MaybeRefOrGetter<TimeFieldGranularity | undefined>;
  /** Uses the locale preference when omitted. */
  hourCycle?: MaybeRefOrGetter<12 | 24 | undefined>;
  minValue?: MaybeRefOrGetter<string | undefined>;
  maxValue?: MaybeRefOrGetter<string | undefined>;
  disabled?: MaybeRefOrGetter<boolean | undefined>;
  readOnly?: MaybeRefOrGetter<boolean | undefined>;
  required?: MaybeRefOrGetter<boolean | undefined>;
  invalid?: MaybeRefOrGetter<boolean | undefined>;
  validationMessage?: MaybeRefOrGetter<string | undefined>;
  name?: MaybeRefOrGetter<string | undefined>;
  form?: MaybeRefOrGetter<string | undefined>;
  segmentLabels?: Partial<TimeFieldSegmentLabels>;
  formControl?: Readonly<Ref<HTMLInputElement | null>>;
}

export interface TimeFieldBinding {
  value: Ref<string | null>;
  segments: ComputedRef<readonly TimeFieldSegment[]>;
  fieldProps: TimeFieldProps;
  segmentProps: (segment: TimeFieldSegment) => TimeFieldSegmentProps;
  formValueProps: TimeFieldFormValueProps;
  isInvalid: ComputedRef<boolean>;
  validationMessage: ComputedRef<string>;
  focusFirst: () => void;
  reset: (value: string | null) => void;
}

export interface TimeFieldComponentProps {
  readonly label: string;
  readonly id?: string | undefined;
  readonly name?: string | undefined;
  readonly form?: string | undefined;
  readonly locale: string;
  readonly dir?: TimeFieldDirection | undefined;
  readonly granularity: TimeFieldGranularity;
  readonly hourCycle?: 12 | 24 | undefined;
  readonly min?: string | undefined;
  readonly max?: string | undefined;
  readonly disabled: boolean;
  readonly readOnly: boolean;
  readonly required: boolean;
  readonly invalid: boolean;
  readonly validationMessage: string;
  readonly hourLabel: string;
  readonly minuteLabel: string;
  readonly secondLabel: string;
  readonly dayPeriodLabel: string;
  readonly emptyLabel: string;
}

interface PartialTime {
  hour: number | undefined;
  minute: number | undefined;
  second: number | undefined;
  dayPeriod: 0 | 1 | undefined;
}

const DEFAULT_LABELS: TimeFieldSegmentLabels = {
  hour: "Hour",
  minute: "Minute",
  second: "Second",
  dayPeriod: "AM/PM",
  empty: "Empty",
};

let timeFieldCount = 0;

function parseIsoTime(
  value: string | null | undefined,
  granularity: TimeFieldGranularity,
): Time | null {
  if (!value) return null;
  const pattern = granularity === "second"
    ? /^\d{2}:\d{2}:\d{2}$/u
    : /^\d{2}:\d{2}$/u;
  if (!pattern.test(value)) return null;
  try {
    return parseTime(value);
  } catch {
    return null;
  }
}

function timeParts(value: Time | null): PartialTime {
  return value === null
    ? { hour: undefined, minute: undefined, second: undefined, dayPeriod: undefined }
    : {
        hour: value.hour,
        minute: value.minute,
        second: value.second,
        dayPeriod: value.hour >= 12 ? 1 : 0,
      };
}

/**
 * Accessible segmented time editing over caller-owned DOM. Time arithmetic and
 * ISO parsing are delegated to `@internationalized/date`; Intl determines the
 * locale's segment, literal, and day-period order.
 */
function createTimeField(options: UseTimeFieldOptions): TimeFieldBinding {
  const instance = getCurrentInstance();
  const id = options.id ?? (instance ? useId() : `nagi-time-field-${timeFieldCount++}`);

  function locale(): string {
    return toValue(options.locale) ?? "en-US";
  }

  function granularity(): TimeFieldGranularity {
    return toValue(options.granularity) ?? "minute";
  }

  function hourCycle(): 12 | 24 {
    const explicit = toValue(options.hourCycle);
    if (explicit !== undefined) return explicit;
    const resolved = new Intl.DateTimeFormat(locale(), { hour: "numeric" })
      .resolvedOptions().hourCycle;
    return resolved === "h11" || resolved === "h12" ? 12 : 24;
  }

  function parsed(value: string | null | undefined): Time | null {
    return parseIsoTime(value, granularity());
  }

  const parts = reactive(timeParts(parsed(options.value.value)));
  const forcedInvalid = ref(false);
  const incompleteInvalid = ref(false);
  let modelWrite = false;
  let pendingModelWrite = false;
  let pendingModelValue: string | null = null;
  let writeRevision = 0;
  let ownerDocument: Document | null = null;
  let buffer = "";
  let bufferedType: NumericTimeFieldSegmentType | null = null;
  let bufferTask: ReturnType<typeof setTimeout> | undefined;

  function disabled(): boolean {
    return toValue(options.disabled) ?? false;
  }

  function direction(): TimeFieldDirection {
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
    const valueTime = parsed(value);
    const next = timeParts(valueTime);
    parts.hour = next.hour;
    parts.minute = next.minute;
    parts.second = next.second;
    parts.dayPeriod = next.dayPeriod;
    incompleteInvalid.value = value !== null && valueTime === null;
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

  function candidate(): Time | null {
    if (parts.hour === undefined || parts.minute === undefined) return null;
    if (hourCycle() === 12 && parts.dayPeriod === undefined) return null;
    if (granularity() === "second" && parts.second === undefined) return null;
    const second = granularity() === "second" ? parts.second : 0;
    if (second === undefined) return null;
    const next = new Time(parts.hour, parts.minute, second);
    return next.hour === parts.hour && next.minute === parts.minute && next.second === second
      ? next
      : null;
  }

  function isoValue(value: Time): string {
    return value.toString().slice(0, granularity() === "second" ? 8 : 5);
  }

  function comparable(value: string | undefined): Time | null {
    if (!value) return null;
    try {
      return parseTime(value);
    } catch {
      return null;
    }
  }

  function outOfRange(value: Time): boolean {
    const minimum = comparable(toValue(options.minValue));
    const maximum = comparable(toValue(options.maxValue));
    return (minimum !== null && value.compare(minimum) < 0)
      || (maximum !== null && value.compare(maximum) > 0);
  }

  function commitParts() {
    incompleteInvalid.value = false;
    const next = candidate();
    if (next === null) {
      writeModel(null);
      return;
    }
    writeModel(isoValue(next));
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

  watch(granularity, () => {
    const current = parts.hour === undefined || parts.minute === undefined
      ? null
      : new Time(parts.hour, parts.minute, parts.second ?? 0);
    if (current !== null && options.value.value !== null) writeModel(isoValue(current));
  }, { flush: "sync" });

  function periodNames(): readonly [string, string] {
    const formatter = new Intl.DateTimeFormat(locale(), {
      timeZone: "UTC",
      hour: "numeric",
      hourCycle: "h12",
    });
    function name(hour: number): string {
      return formatter.formatToParts(new Date(Date.UTC(2000, 0, 1, hour)))
        .find((part) => part.type === "dayPeriod")?.value ?? (hour < 12 ? "AM" : "PM");
    }
    return [name(1), name(13)];
  }

  function displayHour(): number | undefined {
    if (parts.hour === undefined) return undefined;
    if (hourCycle() === 24) return parts.hour;
    return parts.hour % 12 || 12;
  }

  function placeholder(type: NumericTimeFieldSegmentType): string {
    return type === "hour" ? "hh" : type === "minute" ? "mm" : "ss";
  }

  function formatNumber(value: number): string {
    return new Intl.NumberFormat(locale(), {
      useGrouping: false,
      minimumIntegerDigits: 2,
    }).format(value);
  }

  const segments = computed<readonly TimeFieldSegment[]>(() => {
    const formatter = new Intl.DateTimeFormat(locale(), {
      timeZone: "UTC",
      hour: "numeric",
      minute: "2-digit",
      ...(granularity() === "second" ? { second: "2-digit" as const } : {}),
      hourCycle: hourCycle() === 12 ? "h12" : "h23",
    });
    const order = formatter.formatToParts(new Date(Date.UTC(2000, 0, 1, 13, 45, 30)));
    const counts = new Map<string, number>();
    return order.flatMap((part): TimeFieldSegment[] => {
      if (part.type === "literal") {
        const count = counts.get("literal") ?? 0;
        counts.set("literal", count + 1);
        return [{ key: `literal-${count}`, type: "literal", text: part.value }];
      }
      if (part.type === "dayPeriod") {
        const value = parts.dayPeriod;
        return [{
          key: "dayPeriod",
          type: "dayPeriod",
          text: value === undefined ? "--" : periodNames()[value],
          placeholder: "--",
          ...(value === undefined ? {} : { value }),
        }];
      }
      if (part.type !== "hour" && part.type !== "minute" && part.type !== "second") return [];
      const value = part.type === "hour" ? displayHour() : parts[part.type];
      return [{
        key: part.type,
        type: part.type,
        text: value === undefined ? placeholder(part.type) : formatNumber(value),
        placeholder: placeholder(part.type),
        ...(value === undefined ? {} : { value }),
      }];
    });
  });

  function editableSegments(): readonly EditableTimeFieldSegmentType[] {
    return segments.value
      .filter((segment): segment is TimeFieldSegment & { type: EditableTimeFieldSegmentType } =>
        segment.type !== "literal")
      .map((segment) => segment.type);
  }

  function segmentId(type: EditableTimeFieldSegmentType): string {
    return `${id}-${type}`;
  }

  function focus(type: EditableTimeFieldSegmentType) {
    ownerDocument?.getElementById(segmentId(type))?.focus({ preventScroll: true });
  }

  function focusAdjacent(type: EditableTimeFieldSegmentType, delta: -1 | 1) {
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

  function numericMaximum(type: NumericTimeFieldSegmentType): number {
    if (type === "hour") return hourCycle() === 12 ? 12 : 23;
    return 59;
  }

  function numericMinimum(type: NumericTimeFieldSegmentType): number {
    return type === "hour" && hourCycle() === 12 ? 1 : 0;
  }

  function setNumeric(type: NumericTimeFieldSegmentType, value: number | undefined) {
    if (type === "hour" && value !== undefined && hourCycle() === 12) {
      const period = parts.dayPeriod ?? 0;
      parts.hour = value % 12 + period * 12;
      parts.dayPeriod = period;
    } else {
      parts[type] = value;
      if (type === "hour") parts.dayPeriod = value === undefined ? undefined : value >= 12 ? 1 : 0;
    }
    commitParts();
  }

  function typeDigit(type: NumericTimeFieldSegmentType, digit: string) {
    if (bufferedType !== type) buffer = "";
    bufferedType = type;
    let nextBuffer = `${buffer}${digit}`;
    const maximum = numericMaximum(type);
    if (Number(nextBuffer) > maximum || nextBuffer.length > 2) nextBuffer = digit;
    const next = Number(nextBuffer);
    if (next < numericMinimum(type) || next > maximum) return;
    buffer = nextBuffer;
    setNumeric(type, next);
    resetBufferLater();
    if (buffer.length >= 2 || Number(`${buffer}0`) > maximum) {
      clearBuffer();
      focusAdjacent(type, 1);
    }
  }

  function setDayPeriod(period: 0 | 1) {
    parts.dayPeriod = period;
    if (parts.hour !== undefined) parts.hour = parts.hour % 12 + period * 12;
    commitParts();
  }

  function periodFromText(text: string): 0 | 1 | null {
    const normalized = text.toLocaleLowerCase(locale());
    const matches = periodNames()
      .map((name, index) => ({
        index: index as 0 | 1,
        name: name.toLocaleLowerCase(locale()),
      }))
      .filter((candidate) => candidate.name.startsWith(normalized));
    return matches.length === 1 ? matches[0]?.index ?? null : null;
  }

  function cycleNumeric(type: NumericTimeFieldSegmentType, amount: -1 | 1) {
    const current = candidate();
    if (current !== null) {
      const next = current.cycle(type as InternationalizedTimeField, amount, {
        hourCycle: hourCycle(),
      });
      parts.hour = next.hour;
      parts.minute = next.minute;
      parts.second = next.second;
      parts.dayPeriod = next.hour >= 12 ? 1 : 0;
      commitParts();
      return;
    }
    const shown = type === "hour" ? displayHour() : parts[type];
    const minimum = numericMinimum(type);
    const maximum = numericMaximum(type);
    const next = shown === undefined
      ? minimum
      : shown + amount > maximum
        ? minimum
        : shown + amount < minimum
          ? maximum
          : shown + amount;
    setNumeric(type, next);
  }

  function onKeydown(type: EditableTimeFieldSegmentType, event: KeyboardEvent) {
    if (disabled() || readOnly()) return;
    if (type === "dayPeriod") {
      const period = periodFromText(event.key);
      if (period !== null) {
        event.preventDefault();
        setDayPeriod(period);
        return;
      }
    } else {
      const digit = localeDigit(event.key);
      if (digit !== null && !event.altKey && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        typeDigit(type, digit);
        return;
      }
    }

    switch (event.key) {
      case "ArrowUp":
      case "ArrowDown": {
        event.preventDefault();
        clearBuffer();
        const amount = event.key === "ArrowUp" ? 1 : -1;
        if (type === "dayPeriod") setDayPeriod(parts.dayPeriod === 1 ? 0 : 1);
        else cycleNumeric(type, amount);
        break;
      }
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
      case "End":
        event.preventDefault();
        clearBuffer();
        if (type === "dayPeriod") setDayPeriod(event.key === "Home" ? 0 : 1);
        else setNumeric(type, event.key === "Home" ? numericMinimum(type) : numericMaximum(type));
        break;
      case "Backspace":
      case "Delete":
        event.preventDefault();
        clearBuffer();
        if (type === "dayPeriod") {
          parts.dayPeriod = undefined;
          commitParts();
        } else setNumeric(type, undefined);
        break;
    }
  }

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
    ? toValue(options.validationMessage) ?? "Enter a valid time."
    : "");

  const fieldProps: TimeFieldProps = {
    id,
    role: "group",
    get dir() { return direction(); },
    get "aria-label"() { return toValue(options.label); },
    get "aria-disabled"() { return disabled() ? "true" : undefined; },
    get "aria-readonly"() { return readOnly() ? "true" : undefined; },
    get "aria-required"() { return (toValue(options.required) ?? false) ? "true" : undefined; },
    get "aria-invalid"() { return isInvalid.value ? "true" : undefined; },
    onFocusout(event) {
      const next = event.relatedTarget as Node | null;
      if (next && (event.currentTarget as HTMLElement).contains(next)) return;
      const hasAny = parts.hour !== undefined || parts.minute !== undefined || parts.second !== undefined;
      incompleteInvalid.value = hasAny && candidate() === null;
      clearBuffer();
    },
  };

  function segmentProps(segment: TimeFieldSegment): TimeFieldSegmentProps {
    if (segment.type === "literal") return { "aria-hidden": "true" };
    const type = segment.type;
    const value = type === "dayPeriod"
      ? parts.dayPeriod
      : type === "hour"
        ? displayHour()
        : parts[type];
    const minimum = type === "dayPeriod" ? 0 : numericMinimum(type);
    const maximum = type === "dayPeriod" ? 1 : numericMaximum(type);
    const valueText = type === "dayPeriod" && value !== undefined
      ? periodNames()[value as 0 | 1] ?? DEFAULT_LABELS.empty
      : value === undefined
        ? options.segmentLabels?.empty ?? DEFAULT_LABELS.empty
        : formatNumber(value);
    return {
      id: segmentId(type),
      role: "spinbutton",
      tabindex: disabled() ? -1 : 0,
      "aria-label": options.segmentLabels?.[type] ?? DEFAULT_LABELS[type],
      "aria-valuemin": minimum,
      "aria-valuemax": maximum,
      ...(value === undefined ? {} : { "aria-valuenow": value }),
      "aria-valuetext": valueText,
      ...(disabled() ? { "aria-disabled": "true" as const } : {}),
      ...(readOnly() ? { "aria-readonly": "true" as const } : {}),
      contenteditable: disabled() || readOnly() ? "false" : "true",
      inputmode: type === "dayPeriod" ? "text" : "numeric",
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
          if (type === "dayPeriod") {
            parts.dayPeriod = undefined;
            commitParts();
          } else setNumeric(type, undefined);
          return;
        }
        if (event.inputType !== "insertText" || !event.data) return;
        if (type === "dayPeriod") {
          const period = periodFromText(event.data);
          if (period !== null) setDayPeriod(period);
          return;
        }
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
        const next = parseIsoTime(pasted, granularity());
        if (next === null) return;
        event.preventDefault();
        parts.hour = next.hour;
        parts.minute = next.minute;
        parts.second = next.second;
        parts.dayPeriod = next.hour >= 12 ? 1 : 0;
        incompleteInvalid.value = false;
        forcedInvalid.value = outOfRange(next);
        writeModel(isoValue(next));
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

  const formValueProps: TimeFieldFormValueProps = {
    type: "time",
    tabindex: -1,
    "aria-hidden": "true",
    get name() { return toValue(options.name); },
    get form() { return toValue(options.form); },
    get value() { return options.value.value ?? ""; },
    get min() { return toValue(options.minValue); },
    get max() { return toValue(options.maxValue); },
    get step() { return granularity() === "second" ? 1 : 60; },
    get disabled() { return disabled(); },
    get readonly() { return readOnly(); },
    get required() { return toValue(options.required) ?? false; },
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

export function useTimeField(options: UseTimeFieldOptions): TimeFieldBinding;
export function useTimeField(
  props: TimeFieldComponentProps,
  value: Ref<string | null>,
): TimeFieldBinding;
/** Uses either complete headless options, or the shipped segmented-field contract. */
export function useTimeField(
  optionsOrProps: UseTimeFieldOptions | TimeFieldComponentProps,
  value?: Ref<string | null>,
): TimeFieldBinding {
  if (value === undefined) return createTimeField(optionsOrProps as UseTimeFieldOptions);
  const props = optionsOrProps as TimeFieldComponentProps;
  return createTimeField({
    value,
    label: () => props.label,
    locale: () => props.locale,
    dir: () => props.dir,
    id: props.id,
    granularity: () => props.granularity,
    hourCycle: () => props.hourCycle,
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
      get hour() { return props.hourLabel; },
      get minute() { return props.minuteLabel; },
      get second() { return props.secondLabel; },
      get dayPeriod() { return props.dayPeriodLabel; },
      get empty() { return props.emptyLabel; },
    },
  });
}

/** Keeps package TimeField reset and native constraint validation synchronized. */
export function useTimeFieldNativeForm(
  control: Readonly<Ref<HTMLInputElement | null>>,
  binding: TimeFieldBinding,
): void {
  const initialValue = binding.value.value;
  useNativeFormReset(control, (input) => {
    binding.reset(initialValue);
    input.value = initialValue ?? "";
  });
  useNativeCustomValidity(control, binding.validationMessage);
}
