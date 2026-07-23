import {
  CalendarDate,
  endOfMonth,
  endOfWeek,
  isSameDay,
  isSameMonth,
  parseDate,
  startOfMonth,
  startOfWeek,
  today,
} from "@internationalized/date";
import {
  computed,
  getCurrentInstance,
  nextTick,
  ref,
  shallowRef,
  toValue,
  useId,
  watch,
  watchEffect,
  type ComputedRef,
  type MaybeRefOrGetter,
  type Ref,
} from "vue";

import { useNativeCustomValidity, useNativeFormReset } from "./native-form.ts";

export interface CalendarCell {
  readonly key: string;
  readonly value: string;
  readonly day: string;
  readonly label: string;
  readonly outsideMonth: boolean;
  readonly selected: boolean;
  readonly unavailable: boolean;
  readonly disabled: boolean;
  readonly today: boolean;
}

export interface RangeCalendarValue {
  start: string;
  end: string;
}

export interface RangeCalendarCell extends CalendarCell {
  readonly inRange: boolean;
  readonly rangeStart: boolean;
  readonly rangeEnd: boolean;
  readonly preview: boolean;
}

export interface CalendarGridProps {
  id: string;
  role: "grid";
  "aria-label": string;
  "aria-disabled"?: "true" | undefined;
  "aria-readonly"?: "true" | undefined;
  "aria-required"?: "true" | undefined;
  "aria-invalid"?: "true" | undefined;
}

export interface CalendarGridCellProps {
  role: "gridcell";
  "aria-selected": "true" | "false";
  "aria-disabled"?: "true";
}

export interface CalendarCellButtonProps {
  id: string;
  type: "button";
  tabindex: 0 | -1;
  disabled: boolean;
  "aria-label": string;
  "aria-current"?: "date";
  onClick: (event: MouseEvent) => void;
  onFocus: (event: FocusEvent) => void;
  onKeydown: (event: KeyboardEvent) => void;
  onPointerenter?: (event: PointerEvent) => void;
}

export interface CalendarNavigationButtonProps {
  type: "button";
  "aria-label": string;
  disabled: boolean;
  onClick: () => void;
}

export interface CalendarFormValueProps {
  type: "date";
  tabindex: -1;
  "aria-hidden": "true";
  name?: string | undefined;
  form?: string | undefined;
  value: string;
  min?: string | undefined;
  max?: string | undefined;
  disabled: boolean;
  readonly: boolean;
  required: boolean;
  onInvalid: (event: Event) => void;
}

interface CalendarBaseOptions {
  label: MaybeRefOrGetter<string>;
  locale?: MaybeRefOrGetter<string | undefined>;
  timeZone?: MaybeRefOrGetter<string | undefined>;
  id?: string;
  minValue?: MaybeRefOrGetter<string | undefined>;
  maxValue?: MaybeRefOrGetter<string | undefined>;
  unavailableDates?: MaybeRefOrGetter<readonly string[] | undefined>;
  isDateUnavailable?: (value: string) => boolean;
  disabled?: MaybeRefOrGetter<boolean | undefined>;
  readOnly?: MaybeRefOrGetter<boolean | undefined>;
  required?: MaybeRefOrGetter<boolean | undefined>;
  invalid?: MaybeRefOrGetter<boolean | undefined>;
  validationMessage?: MaybeRefOrGetter<string | undefined>;
  previousLabel?: MaybeRefOrGetter<string | undefined>;
  nextLabel?: MaybeRefOrGetter<string | undefined>;
  defaultVisibleMonth?: MaybeRefOrGetter<string | undefined>;
}

export interface CalendarComponentProps {
  label: string;
  id?: string | undefined;
  name?: string | undefined;
  form?: string | undefined;
  locale: string;
  timeZone: string;
  min?: string | undefined;
  max?: string | undefined;
  unavailableDates: readonly string[];
  disabled: boolean;
  readOnly: boolean;
  required: boolean;
  invalid: boolean;
  validationMessage: string;
  previousLabel: string;
  nextLabel: string;
  defaultVisibleMonth?: string | undefined;
}

export interface RangeCalendarComponentProps extends Omit<CalendarComponentProps, "name"> {
  startName?: string | undefined;
  endName?: string | undefined;
}

export interface UseCalendarOptions extends CalendarBaseOptions {
  value: Ref<string | null>;
  name?: MaybeRefOrGetter<string | undefined>;
  form?: MaybeRefOrGetter<string | undefined>;
  formControl?: Readonly<Ref<HTMLInputElement | null>>;
  onSelect?: (value: string) => void;
}

export interface UseRangeCalendarOptions extends CalendarBaseOptions {
  value: Ref<RangeCalendarValue | null>;
  startName?: MaybeRefOrGetter<string | undefined>;
  endName?: MaybeRefOrGetter<string | undefined>;
  form?: MaybeRefOrGetter<string | undefined>;
  startFormControl?: Readonly<Ref<HTMLInputElement | null>>;
  endFormControl?: Readonly<Ref<HTMLInputElement | null>>;
  onSelect?: (value: RangeCalendarValue) => void;
}

export interface CalendarBinding {
  value: Ref<string | null>;
  visibleMonth: ComputedRef<string>;
  focusedDate: ComputedRef<string>;
  monthLabel: ComputedRef<string>;
  weekdayLabels: ComputedRef<readonly string[]>;
  weeks: ComputedRef<readonly (readonly CalendarCell[])[]>;
  gridProps: CalendarGridProps;
  gridCellProps: (cell: CalendarCell) => CalendarGridCellProps;
  cellButtonProps: (cell: CalendarCell) => CalendarCellButtonProps;
  previousButtonProps: CalendarNavigationButtonProps;
  nextButtonProps: CalendarNavigationButtonProps;
  formValueProps: CalendarFormValueProps;
  isInvalid: ComputedRef<boolean>;
  validationMessage: ComputedRef<string>;
  select: (cell: CalendarCell) => boolean;
  focusDate: (value: string) => void;
  reset: (value: string | null) => void;
}

export interface RangeCalendarBinding {
  value: Ref<RangeCalendarValue | null>;
  visibleMonth: ComputedRef<string>;
  focusedDate: ComputedRef<string>;
  monthLabel: ComputedRef<string>;
  weekdayLabels: ComputedRef<readonly string[]>;
  weeks: ComputedRef<readonly (readonly RangeCalendarCell[])[]>;
  gridProps: CalendarGridProps;
  gridCellProps: (cell: RangeCalendarCell) => CalendarGridCellProps;
  cellButtonProps: (cell: RangeCalendarCell) => CalendarCellButtonProps;
  previousButtonProps: CalendarNavigationButtonProps;
  nextButtonProps: CalendarNavigationButtonProps;
  startFormValueProps: CalendarFormValueProps;
  endFormValueProps: CalendarFormValueProps;
  isInvalid: ComputedRef<boolean>;
  validationMessage: ComputedRef<string>;
  anchor: Readonly<Ref<string | null>>;
  announcement: ComputedRef<string>;
  select: (cell: RangeCalendarCell) => boolean;
  focusDate: (value: string) => void;
  reset: (value: RangeCalendarValue | null) => void;
}

interface CalendarNavigation {
  id: string;
  visible: Ref<CalendarDate>;
  focused: Ref<CalendarDate>;
  monthLabel: ComputedRef<string>;
  weekdayLabels: ComputedRef<readonly string[]>;
  dates: ComputedRef<readonly (readonly CalendarDate[])[]>;
  previousButtonProps: CalendarNavigationButtonProps;
  nextButtonProps: CalendarNavigationButtonProps;
  buttonProps: (
    date: CalendarDate,
    unavailable: boolean,
    select: (event: MouseEvent) => void,
    pointerenter?: (event: PointerEvent) => void,
  ) => CalendarCellButtonProps;
  focusDate: (value: string) => void;
}

let calendarCount = 0;

function parseIso(value: string | null | undefined): CalendarDate | null {
  if (!value) return null;
  try {
    return parseDate(value);
  } catch {
    return null;
  }
}

function localeOf(options: CalendarBaseOptions): string {
  return toValue(options.locale) ?? "en-US";
}

function timeZoneOf(options: CalendarBaseOptions): string {
  return toValue(options.timeZone) ?? "UTC";
}

function isDisabled(options: CalendarBaseOptions): boolean {
  return toValue(options.disabled) ?? false;
}

function isReadOnly(options: CalendarBaseOptions): boolean {
  return toValue(options.readOnly) ?? false;
}

function unavailable(options: CalendarBaseOptions, date: CalendarDate): boolean {
  const value = date.toString();
  const minimum = parseIso(toValue(options.minValue));
  const maximum = parseIso(toValue(options.maxValue));
  if (minimum && date.compare(minimum) < 0) return true;
  if (maximum && date.compare(maximum) > 0) return true;
  if (toValue(options.unavailableDates)?.includes(value)) return true;
  return options.isDateUnavailable?.(value) ?? false;
}

function initialDate(options: CalendarBaseOptions, selected?: string | null): CalendarDate {
  const initial = parseIso(selected)
    ?? parseIso(toValue(options.defaultVisibleMonth))
    ?? today(timeZoneOf(options));
  const minimum = parseIso(toValue(options.minValue));
  const maximum = parseIso(toValue(options.maxValue));
  if (minimum && initial.compare(minimum) < 0) return minimum;
  if (maximum && initial.compare(maximum) > 0) return maximum;
  return initial;
}

function focusableDateInGrid(
  options: CalendarBaseOptions,
  visible: CalendarDate,
  preferred: CalendarDate,
): CalendarDate {
  if (!unavailable(options, preferred)) return preferred;
  const first = startOfWeek(startOfMonth(visible), localeOf(options));
  for (let index = 0; index < 42; index += 1) {
    const candidate = first.add({ days: index });
    if (!unavailable(options, candidate)) return candidate;
  }
  return preferred;
}

function focusableDateInMonth(
  options: CalendarBaseOptions,
  visible: CalendarDate,
  preferred: CalendarDate,
): CalendarDate {
  const month = startOfMonth(visible);
  if (isSameMonth(preferred, month) && !unavailable(options, preferred)) return preferred;
  const last = endOfMonth(month);
  for (let candidate = month; candidate.compare(last) <= 0; candidate = candidate.add({ days: 1 })) {
    if (!unavailable(options, candidate)) return candidate;
  }
  return isSameMonth(preferred, month) ? preferred : month;
}

function createNavigation(
  options: CalendarBaseOptions,
  selected?: string | null,
): CalendarNavigation {
  const instance = getCurrentInstance();
  const id = options.id ?? (instance ? useId() : `nagi-calendar-${calendarCount++}`);
  const initial = initialDate(options, selected);
  // Vue's deep Ref unwrapping cannot preserve classes with private fields.
  const visible = shallowRef<CalendarDate>(startOfMonth(initial));
  const focused = shallowRef<CalendarDate>(focusableDateInGrid(options, initial, initial));
  let ownerDocument: Document | null = null;

  function formatter(date: CalendarDate, format: Intl.DateTimeFormatOptions): string {
    return new Intl.DateTimeFormat(localeOf(options), {
      ...format,
      calendar: "gregory",
      timeZone: timeZoneOf(options),
    }).format(date.toDate(timeZoneOf(options)));
  }

  const monthLabel = computed(() => formatter(visible.value, {
    month: "long",
    year: "numeric",
  }));

  const firstGridDate = computed(() => startOfWeek(visible.value, localeOf(options)));
  const weekdayLabels = computed(() => Array.from({ length: 7 }, (_, index) =>
    formatter(firstGridDate.value.add({ days: index }), { weekday: "short" })));
  const dates = computed(() => Array.from({ length: 6 }, (_, week) =>
    Array.from({ length: 7 }, (_value, day) =>
      firstGridDate.value.add({ days: week * 7 + day }))));

  function cellId(date: CalendarDate): string {
    return `${id}-cell-${date.toString()}`;
  }

  function focusElement(date: CalendarDate) {
    void nextTick(() => {
      const documentTarget = ownerDocument
        ?? (typeof document === "undefined" ? null : document);
      documentTarget?.getElementById(cellId(date))?.focus({ preventScroll: true });
    });
  }

  function setFocused(date: CalendarDate, moveDom = true) {
    let candidate = date;
    const direction = candidate.compare(focused.value) < 0 ? -1 : 1;
    for (let attempts = 0; attempts < 370 && unavailable(options, candidate); attempts += 1) {
      candidate = candidate.add({ days: direction });
    }
    if (unavailable(options, candidate)) return;
    focused.value = candidate;
    if (!isSameMonth(candidate, visible.value)) visible.value = startOfMonth(candidate);
    if (moveDom) focusElement(candidate);
  }

  function focusDate(value: string) {
    const parsed = parseIso(value);
    if (parsed) setFocused(parsed);
  }

  function onKeydown(date: CalendarDate, event: KeyboardEvent) {
    if (isDisabled(options)) return;
    const locale = new Intl.Locale(localeOf(options)) as Intl.Locale & {
      textInfo?: { direction?: "ltr" | "rtl" };
    };
    const rtl = locale.textInfo?.direction === "rtl";
    let next: CalendarDate | null = null;
    let pageVisible: CalendarDate | null = null;
    switch (event.key) {
      case "ArrowRight":
        next = date.add({ days: rtl ? -1 : 1 });
        break;
      case "ArrowLeft":
        next = date.add({ days: rtl ? 1 : -1 });
        break;
      case "ArrowDown":
        next = date.add({ days: 7 });
        break;
      case "ArrowUp":
        next = date.subtract({ days: 7 });
        break;
      case "Home":
        next = startOfWeek(date, localeOf(options));
        while (unavailable(options, next) && next.compare(endOfWeek(date, localeOf(options))) < 0) {
          next = next.add({ days: 1 });
        }
        break;
      case "End":
        next = endOfWeek(date, localeOf(options));
        while (unavailable(options, next) && next.compare(startOfWeek(date, localeOf(options))) > 0) {
          next = next.subtract({ days: 1 });
        }
        break;
      case "PageUp":
        pageVisible = startOfMonth(visible.value.subtract(
          event.shiftKey ? { years: 1 } : { months: 1 },
        ));
        if (!canDisplayMonth(pageVisible)) {
          event.preventDefault();
          return;
        }
        next = date.subtract(event.shiftKey ? { years: 1 } : { months: 1 });
        next = focusableDateInMonth(options, pageVisible, next);
        if (unavailable(options, next)) {
          next = focusableDateInGrid(options, pageVisible, next);
        }
        break;
      case "PageDown":
        pageVisible = startOfMonth(visible.value.add(
          event.shiftKey ? { years: 1 } : { months: 1 },
        ));
        if (!canDisplayMonth(pageVisible)) {
          event.preventDefault();
          return;
        }
        next = date.add(event.shiftKey ? { years: 1 } : { months: 1 });
        next = focusableDateInMonth(options, pageVisible, next);
        if (unavailable(options, next)) {
          next = focusableDateInGrid(options, pageVisible, next);
        }
        break;
    }
    if (!next) return;
    event.preventDefault();
    if (pageVisible && !unavailable(options, next)) {
      visible.value = pageVisible;
      focused.value = next;
      focusElement(next);
      return;
    }
    setFocused(next);
  }

  function canDisplayMonth(target: CalendarDate): boolean {
    const minimum = parseIso(toValue(options.minValue));
    const maximum = parseIso(toValue(options.maxValue));
    if (minimum && endOfMonth(target).compare(minimum) < 0) return false;
    if (maximum && target.compare(maximum) > 0) return false;
    return true;
  }

  function canMoveMonth(amount: -1 | 1): boolean {
    return canDisplayMonth(startOfMonth(visible.value.add({ months: amount })));
  }

  function moveMonth(amount: -1 | 1) {
    if (!canMoveMonth(amount)) return;
    const next = startOfMonth(visible.value.add({ months: amount }));
    visible.value = next;
    const preferred = focusableDateInMonth(options, next, focused.value.add({ months: amount }));
    focused.value = unavailable(options, preferred)
      ? focusableDateInGrid(options, next, preferred)
      : preferred;
  }

  function navProps(amount: -1 | 1): CalendarNavigationButtonProps {
    return {
      type: "button",
      get "aria-label"() {
        return toValue(amount < 0 ? options.previousLabel : options.nextLabel)
          ?? (amount < 0 ? "Previous month" : "Next month");
      },
      get disabled() {
        return isDisabled(options) || !canMoveMonth(amount);
      },
      onClick: () => moveMonth(amount),
    };
  }

  function buttonProps(
    date: CalendarDate,
    dateUnavailable: boolean,
    select: (event: MouseEvent) => void,
    pointerenter?: (event: PointerEvent) => void,
  ): CalendarCellButtonProps {
    return {
      id: cellId(date),
      type: "button",
      get tabindex() {
        return isSameDay(date, focused.value) && !dateUnavailable && !isDisabled(options) ? 0 : -1;
      },
      get disabled() {
        return isDisabled(options) || dateUnavailable;
      },
      "aria-label": formatter(date, { dateStyle: "full" }),
      ...(isSameDay(date, today(timeZoneOf(options))) ? { "aria-current": "date" as const } : {}),
      onClick(event) {
        ownerDocument = (event.currentTarget as HTMLElement).ownerDocument;
        focused.value = date;
        select(event);
      },
      onFocus(event) {
        ownerDocument = (event.currentTarget as HTMLElement).ownerDocument;
        focused.value = date;
      },
      onKeydown: (event) => onKeydown(date, event),
      ...(pointerenter ? { onPointerenter: pointerenter } : {}),
    };
  }

  watchEffect(
    () => {
      const previous = focused.value;
      if (!unavailable(options, previous)) return;
      const next = focusableDateInGrid(options, visible.value, previous);
      const moveDom = ownerDocument?.activeElement?.id === cellId(previous);
      focused.value = next;
      if (moveDom && !unavailable(options, next)) focusElement(next);
    },
    { flush: "sync" },
  );

  return {
    id,
    visible,
    focused,
    monthLabel,
    weekdayLabels,
    dates,
    previousButtonProps: navProps(-1),
    nextButtonProps: navProps(1),
    buttonProps,
    focusDate,
  };
}

function gridProps(
  navigation: CalendarNavigation,
  options: CalendarBaseOptions,
  invalid: ComputedRef<boolean>,
): CalendarGridProps {
  return {
    id: navigation.id,
    role: "grid",
    get "aria-label"() {
      return toValue(options.label);
    },
    get "aria-disabled"() {
      return isDisabled(options) ? "true" : undefined;
    },
    get "aria-readonly"() {
      return isReadOnly(options) ? "true" : undefined;
    },
    get "aria-required"() {
      return (toValue(options.required) ?? false) ? "true" : undefined;
    },
    get "aria-invalid"() {
      return invalid.value ? "true" : undefined;
    },
  };
}

function formValueProps(
  options: CalendarBaseOptions,
  value: () => string,
  name: MaybeRefOrGetter<string | undefined> | undefined,
  form: MaybeRefOrGetter<string | undefined> | undefined,
  onInvalid: (event: Event) => void,
): CalendarFormValueProps {
  return {
    type: "date",
    tabindex: -1,
    "aria-hidden": "true",
    get name() { return name === undefined ? undefined : toValue(name); },
    get form() { return form === undefined ? undefined : toValue(form); },
    get value() { return value(); },
    get min() { return toValue(options.minValue); },
    get max() { return toValue(options.maxValue); },
    get disabled() { return isDisabled(options); },
    get readonly() { return isReadOnly(options); },
    get required() { return toValue(options.required) ?? false; },
    onInvalid,
  };
}

function createCalendar(options: UseCalendarOptions): CalendarBinding {
  const navigation = createNavigation(options, options.value.value);
  const forcedInvalid = ref(false);
  const parsedValue = computed(() => parseIso(options.value.value));
  const isInvalid = computed(() => {
    if (toValue(options.invalid) ?? false) return true;
    if (forcedInvalid.value
      && parsedValue.value === null
      && (toValue(options.required) ?? false)
      && !isDisabled(options)
      && !isReadOnly(options)) return true;
    if (options.value.value !== null && parsedValue.value === null) return true;
    return parsedValue.value ? unavailable(options, parsedValue.value) : false;
  });
  const validationMessage = computed(() => isInvalid.value
    ? toValue(options.validationMessage) ?? "Choose an available date."
    : "");

  watch(options.value, (value) => {
    const date = parseIso(value);
    if (!date) return;
    navigation.visible.value = startOfMonth(date);
    navigation.focused.value = focusableDateInGrid(options, date, date);
    forcedInvalid.value = false;
  }, { flush: "sync" });

  function cell(date: CalendarDate): CalendarCell {
    const selected = parsedValue.value !== null && isSameDay(date, parsedValue.value);
    const dateUnavailable = unavailable(options, date);
    return {
      key: date.toString(),
      value: date.toString(),
      day: new Intl.NumberFormat(localeOf(options), { useGrouping: false }).format(date.day),
      label: new Intl.DateTimeFormat(localeOf(options), {
        calendar: "gregory",
        dateStyle: "full",
        timeZone: timeZoneOf(options),
      }).format(date.toDate(timeZoneOf(options))),
      outsideMonth: !isSameMonth(date, navigation.visible.value),
      selected,
      unavailable: dateUnavailable,
      disabled: isDisabled(options) || dateUnavailable,
      today: isSameDay(date, today(timeZoneOf(options))),
    };
  }

  const weeks = computed(() => navigation.dates.value.map((week) => week.map(cell)));

  function select(target: CalendarCell): boolean {
    const date = parseIso(target.value);
    if (!date || isDisabled(options) || isReadOnly(options) || unavailable(options, date)) return false;
    options.value.value = target.value;
    options.onSelect?.(target.value);
    forcedInvalid.value = false;
    return true;
  }

  const hidden = formValueProps(options, () => options.value.value ?? "", options.name, options.form,
    (event) => {
      forcedInvalid.value = true;
      event.preventDefault();
      navigation.focusDate(options.value.value ?? navigation.focused.value.toString());
    });

  if (options.formControl) {
    const initial = options.value.value;
    useNativeFormReset(options.formControl, (control) => {
      reset(initial);
      control.value = initial ?? "";
    });
    useNativeCustomValidity(options.formControl, validationMessage);
  }

  function reset(value: string | null) {
    options.value.value = value;
    const date = parseIso(value);
    if (date) {
      navigation.visible.value = startOfMonth(date);
      navigation.focused.value = focusableDateInGrid(options, date, date);
    }
    forcedInvalid.value = false;
  }

  return {
    value: options.value,
    visibleMonth: computed(() => navigation.visible.value.toString()),
    focusedDate: computed(() => navigation.focused.value.toString()),
    monthLabel: navigation.monthLabel,
    weekdayLabels: navigation.weekdayLabels,
    weeks,
    gridProps: gridProps(navigation, options, isInvalid),
    gridCellProps: (target) => ({
      role: "gridcell",
      "aria-selected": target.selected ? "true" : "false",
      ...(target.unavailable ? { "aria-disabled": "true" as const } : {}),
    }),
    cellButtonProps: (target) => {
      const date = parseIso(target.value) as CalendarDate;
      return navigation.buttonProps(date, target.unavailable, () => { select(target); });
    },
    previousButtonProps: navigation.previousButtonProps,
    nextButtonProps: navigation.nextButtonProps,
    formValueProps: hidden,
    isInvalid,
    validationMessage,
    select,
    focusDate: navigation.focusDate,
    reset,
  };
}

function orderedRange(value: RangeCalendarValue | null): [CalendarDate, CalendarDate] | null {
  const start = parseIso(value?.start);
  const end = parseIso(value?.end);
  if (!start || !end || start.compare(end) > 0) return null;
  return [start, end];
}

function between(date: CalendarDate, start: CalendarDate, end: CalendarDate): boolean {
  return date.compare(start) >= 0 && date.compare(end) <= 0;
}

function createRangeCalendar(options: UseRangeCalendarOptions): RangeCalendarBinding {
  const initialSelection = orderedRange(options.value.value);
  const navigation = createNavigation(options, initialSelection?.[0].toString());
  const anchorDate = shallowRef<CalendarDate | null>(null);
  const previewDate = shallowRef<CalendarDate | null>(null);
  const forcedInvalid = ref(false);
  const parsedRange = computed(() => orderedRange(options.value.value));

  function spanUnavailable(start: CalendarDate, end: CalendarDate): boolean {
    for (let date = start; date.compare(end) <= 0; date = date.add({ days: 1 })) {
      if (unavailable(options, date)) return true;
    }
    return false;
  }

  const isInvalid = computed(() => {
    if (toValue(options.invalid) ?? false) return true;
    if (anchorDate.value !== null) return true;
    if (forcedInvalid.value
      && parsedRange.value === null
      && (toValue(options.required) ?? false)
      && !isDisabled(options)
      && !isReadOnly(options)) return true;
    if (options.value.value !== null && parsedRange.value === null) return true;
    return parsedRange.value ? spanUnavailable(...parsedRange.value) : false;
  });
  const validationMessage = computed(() => isInvalid.value
    ? toValue(options.validationMessage) ?? "Choose an available date range."
    : "");

  watch(
    () => [options.value.value?.start, options.value.value?.end] as const,
    () => {
      const value = options.value.value;
      const range = orderedRange(value);
      anchorDate.value = null;
      previewDate.value = null;
      forcedInvalid.value = false;
      if (!range) return;
      navigation.visible.value = startOfMonth(range[0]);
      navigation.focused.value = focusableDateInGrid(options, range[0], range[0]);
    },
    { flush: "sync" },
  );

  function previewRange(): [CalendarDate, CalendarDate] | null {
    if (!anchorDate.value || !previewDate.value) return null;
    return anchorDate.value.compare(previewDate.value) <= 0
      ? [anchorDate.value, previewDate.value]
      : [previewDate.value, anchorDate.value];
  }

  function cell(date: CalendarDate): RangeCalendarCell {
    const committed = parsedRange.value;
    const provisional = previewRange();
    const dateUnavailable = unavailable(options, date);
    return {
      key: date.toString(),
      value: date.toString(),
      day: new Intl.NumberFormat(localeOf(options), { useGrouping: false }).format(date.day),
      label: new Intl.DateTimeFormat(localeOf(options), {
        calendar: "gregory",
        dateStyle: "full",
        timeZone: timeZoneOf(options),
      }).format(date.toDate(timeZoneOf(options))),
      outsideMonth: !isSameMonth(date, navigation.visible.value),
      selected: committed ? between(date, committed[0], committed[1]) : false,
      unavailable: dateUnavailable,
      disabled: isDisabled(options) || dateUnavailable,
      today: isSameDay(date, today(timeZoneOf(options))),
      inRange: committed ? between(date, committed[0], committed[1]) : false,
      rangeStart: committed ? isSameDay(date, committed[0]) : false,
      rangeEnd: committed ? isSameDay(date, committed[1]) : false,
      preview: provisional ? between(date, provisional[0], provisional[1]) : false,
    };
  }

  const weeks = computed(() => navigation.dates.value.map((week) => week.map(cell)));

  watch(navigation.focused, (date) => {
    if (anchorDate.value) previewDate.value = date;
  }, { flush: "sync" });

  const announcement = computed(() => {
    if (!anchorDate.value) return "";
    const start = cell(anchorDate.value).label;
    if (!previewDate.value || isSameDay(anchorDate.value, previewDate.value)) return start;
    const end = cell(previewDate.value).label;
    return anchorDate.value.compare(previewDate.value) <= 0
      ? `${start} – ${end}`
      : `${end} – ${start}`;
  });

  function select(target: RangeCalendarCell): boolean {
    const date = parseIso(target.value);
    if (!date || isDisabled(options) || isReadOnly(options) || unavailable(options, date)) return false;
    if (!anchorDate.value) {
      anchorDate.value = date;
      previewDate.value = date;
      return false;
    }
    const [start, end] = anchorDate.value.compare(date) <= 0
      ? [anchorDate.value, date]
      : [date, anchorDate.value];
    if (spanUnavailable(start, end)) {
      forcedInvalid.value = true;
      // Keep range construction recoverable: the rejected endpoint becomes a
      // fresh anchor instead of trapping every later click behind the same
      // unavailable span.
      anchorDate.value = date;
      previewDate.value = date;
      return false;
    }
    const next = { start: start.toString(), end: end.toString() };
    options.value.value = next;
    options.onSelect?.(next);
    anchorDate.value = null;
    previewDate.value = null;
    forcedInvalid.value = false;
    return true;
  }

  function hiddenValue(which: "start" | "end") {
    return options.value.value?.[which] ?? "";
  }

  function onInvalid(event: Event) {
    forcedInvalid.value = true;
    event.preventDefault();
    navigation.focusDate(options.value.value?.start ?? navigation.focused.value.toString());
  }

  if (options.startFormControl) {
    const initial = options.value.value ? { ...options.value.value } : null;
    useNativeFormReset(options.startFormControl, (control) => {
      reset(initial);
      control.value = initial?.start ?? "";
    });
    useNativeCustomValidity(options.startFormControl, validationMessage);
  }
  if (options.endFormControl) {
    useNativeCustomValidity(options.endFormControl, validationMessage);
  }

  function reset(value: RangeCalendarValue | null) {
    options.value.value = value ? { ...value } : null;
    const range = orderedRange(value);
    if (range) {
      navigation.visible.value = startOfMonth(range[0]);
      navigation.focused.value = focusableDateInGrid(options, range[0], range[0]);
    }
    forcedInvalid.value = false;
    anchorDate.value = null;
    previewDate.value = null;
  }

  return {
    value: options.value,
    visibleMonth: computed(() => navigation.visible.value.toString()),
    focusedDate: computed(() => navigation.focused.value.toString()),
    monthLabel: navigation.monthLabel,
    weekdayLabels: navigation.weekdayLabels,
    weeks,
    gridProps: gridProps(navigation, options, isInvalid),
    gridCellProps: (target) => ({
      role: "gridcell",
      "aria-selected": target.selected ? "true" : "false",
      ...(target.unavailable ? { "aria-disabled": "true" as const } : {}),
    }),
    cellButtonProps: (target) => {
      const date = parseIso(target.value) as CalendarDate;
      return navigation.buttonProps(
        date,
        target.unavailable,
        () => { select(target); },
        () => {
          if (anchorDate.value) previewDate.value = date;
        },
      );
    },
    previousButtonProps: navigation.previousButtonProps,
    nextButtonProps: navigation.nextButtonProps,
    startFormValueProps: formValueProps(
      options,
      () => hiddenValue("start"),
      options.startName,
      options.form,
      onInvalid,
    ),
    endFormValueProps: formValueProps(
      options,
      () => hiddenValue("end"),
      options.endName,
      options.form,
      onInvalid,
    ),
    isInvalid,
    validationMessage,
    anchor: computed(() => anchorDate.value?.toString() ?? null),
    announcement,
    select,
    focusDate: navigation.focusDate,
    reset,
  };
}

export function useCalendar(options: UseCalendarOptions): CalendarBinding;
export function useCalendar(
  props: CalendarComponentProps,
  value: Ref<string | null>,
): CalendarBinding;
export function useCalendar(
  optionsOrProps: UseCalendarOptions | CalendarComponentProps,
  value?: Ref<string | null>,
): CalendarBinding {
  if (value === undefined) return createCalendar(optionsOrProps as UseCalendarOptions);
  const props = optionsOrProps as CalendarComponentProps;
  return createCalendar({
    value,
    label: () => props.label,
    ...(props.id ? { id: props.id } : {}),
    locale: () => props.locale,
    timeZone: () => props.timeZone,
    minValue: () => props.min,
    maxValue: () => props.max,
    unavailableDates: () => props.unavailableDates,
    disabled: () => props.disabled,
    readOnly: () => props.readOnly,
    required: () => props.required,
    invalid: () => props.invalid,
    validationMessage: () => props.validationMessage,
    previousLabel: () => props.previousLabel,
    nextLabel: () => props.nextLabel,
    defaultVisibleMonth: () => props.defaultVisibleMonth,
    name: () => props.name,
    form: () => props.form,
  });
}

export function useRangeCalendar(options: UseRangeCalendarOptions): RangeCalendarBinding;
export function useRangeCalendar(
  props: RangeCalendarComponentProps,
  value: Ref<RangeCalendarValue | null>,
): RangeCalendarBinding;
export function useRangeCalendar(
  optionsOrProps: UseRangeCalendarOptions | RangeCalendarComponentProps,
  value?: Ref<RangeCalendarValue | null>,
): RangeCalendarBinding {
  if (value === undefined) return createRangeCalendar(optionsOrProps as UseRangeCalendarOptions);
  const props = optionsOrProps as RangeCalendarComponentProps;
  return createRangeCalendar({
    value,
    label: () => props.label,
    ...(props.id ? { id: props.id } : {}),
    locale: () => props.locale,
    timeZone: () => props.timeZone,
    minValue: () => props.min,
    maxValue: () => props.max,
    unavailableDates: () => props.unavailableDates,
    disabled: () => props.disabled,
    readOnly: () => props.readOnly,
    required: () => props.required,
    invalid: () => props.invalid,
    validationMessage: () => props.validationMessage,
    previousLabel: () => props.previousLabel,
    nextLabel: () => props.nextLabel,
    defaultVisibleMonth: () => props.defaultVisibleMonth,
    startName: () => props.startName,
    endName: () => props.endName,
    form: () => props.form,
  });
}

export function useCalendarNativeForm(
  control: Readonly<Ref<HTMLInputElement | null>>,
  binding: CalendarBinding,
): void {
  const initial = binding.value.value;
  useNativeFormReset(control, (input) => {
    binding.reset(initial);
    input.value = initial ?? "";
  });
  useNativeCustomValidity(control, binding.validationMessage);
}

export function useRangeCalendarNativeForm(
  controls: Readonly<{
    start: Readonly<Ref<HTMLInputElement | null>>;
    end: Readonly<Ref<HTMLInputElement | null>>;
  }>,
  binding: RangeCalendarBinding,
): void {
  const initial = binding.value.value ? { ...binding.value.value } : null;
  useNativeFormReset(controls.start, (input) => {
    binding.reset(initial);
    input.value = initial?.start ?? "";
    if (controls.end.value) controls.end.value.value = initial?.end ?? "";
  });
  useNativeCustomValidity(controls.start, binding.validationMessage);
  useNativeCustomValidity(controls.end, binding.validationMessage);
}
