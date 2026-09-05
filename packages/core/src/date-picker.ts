import { parseDate } from "@internationalized/date";
import {
  computed,
  nextTick,
  ref,
  toValue,
  watch,
  type ComputedRef,
  type MaybeRefOrGetter,
  type Ref,
} from "vue";

import {
  useCalendar,
  useRangeCalendar,
  type CalendarBinding,
  type RangeCalendarBinding,
  type RangeCalendarValue,
} from "./calendar.ts";
import { useDateField, type DateFieldBinding, type DateFieldSegmentLabels } from "./date-field.ts";
import { usePopover, type UsePopoverReturn } from "./popover.ts";
import type { AnchorArea } from "./anchor.ts";
import {
  nativeFormControlRef,
  useNativeCustomValidity,
  useNativeFormReset,
} from "./native-form.ts";

interface DatePickerBaseOptions {
  locale?: MaybeRefOrGetter<string | undefined>;
  timeZone?: MaybeRefOrGetter<string | undefined>;
  minValue?: MaybeRefOrGetter<string | undefined>;
  maxValue?: MaybeRefOrGetter<string | undefined>;
  unavailableDates?: MaybeRefOrGetter<readonly string[] | undefined>;
  disabled?: MaybeRefOrGetter<boolean | undefined>;
  readOnly?: MaybeRefOrGetter<boolean | undefined>;
  required?: MaybeRefOrGetter<boolean | undefined>;
  invalid?: MaybeRefOrGetter<boolean | undefined>;
  validationMessage?: MaybeRefOrGetter<string | undefined>;
  previousLabel?: MaybeRefOrGetter<string | undefined>;
  nextLabel?: MaybeRefOrGetter<string | undefined>;
  defaultVisibleMonth?: MaybeRefOrGetter<string | undefined>;
  area?: AnchorArea;
  offset?: number;
  open?: Ref<boolean>;
}

export interface DatePickerComponentProps {
  label: string;
  calendarLabel?: string | undefined;
  triggerLabel: string;
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
  area: AnchorArea;
  offset: number;
}

export interface DateRangePickerComponentProps extends Omit<DatePickerComponentProps, "name"> {
  startLabel: string;
  endLabel: string;
  startName?: string | undefined;
  endName?: string | undefined;
}

export interface UseDatePickerOptions extends DatePickerBaseOptions {
  value: Ref<string | null>;
  label: MaybeRefOrGetter<string>;
  calendarLabel?: MaybeRefOrGetter<string | undefined>;
  name?: MaybeRefOrGetter<string | undefined>;
  form?: MaybeRefOrGetter<string | undefined>;
  segmentLabels?: Partial<DateFieldSegmentLabels>;
  formControl?: Readonly<Ref<HTMLInputElement | null>>;
  onSelect?: (value: string) => void;
}

export interface DatePickerBinding {
  value: Ref<string | null>;
  open: Ref<boolean>;
  field: DateFieldBinding;
  calendar: CalendarBinding;
  popover: UsePopoverReturn;
  calendarLabel: ComputedRef<string>;
  error: {
    id: string;
    describedBy: ComputedRef<string | undefined>;
  };
  isInvalid: ComputedRef<boolean>;
}

export interface UseDateRangePickerOptions extends DatePickerBaseOptions {
  value: Ref<RangeCalendarValue | null>;
  label: MaybeRefOrGetter<string>;
  startLabel: MaybeRefOrGetter<string>;
  endLabel: MaybeRefOrGetter<string>;
  calendarLabel?: MaybeRefOrGetter<string | undefined>;
  startName?: MaybeRefOrGetter<string | undefined>;
  endName?: MaybeRefOrGetter<string | undefined>;
  form?: MaybeRefOrGetter<string | undefined>;
  segmentLabels?: Partial<DateFieldSegmentLabels>;
  startFormControl?: Readonly<Ref<HTMLInputElement | null>>;
  endFormControl?: Readonly<Ref<HTMLInputElement | null>>;
  onSelect?: (value: RangeCalendarValue) => void;
}

export interface DateRangePickerBinding {
  value: Ref<RangeCalendarValue | null>;
  open: Ref<boolean>;
  startValue: Ref<string | null>;
  endValue: Ref<string | null>;
  startField: DateFieldBinding;
  endField: DateFieldBinding;
  calendar: RangeCalendarBinding;
  popover: UsePopoverReturn;
  calendarLabel: ComputedRef<string>;
  error: {
    id: string;
    describedBy: ComputedRef<string | undefined>;
  };
  isInvalid: ComputedRef<boolean>;
}

export interface DatePickerComponentModel {
  value: Ref<string | null>;
  open: Ref<boolean>;
}

export interface DateRangePickerComponentModel {
  value: Ref<RangeCalendarValue | null>;
  open: Ref<boolean>;
}

function popoverOptions(options: DatePickerBaseOptions, open: Ref<boolean>) {
  return {
    open,
    hasPopup: "dialog" as const,
    anchor: {
      area: options.area ?? "block-end",
      offset: options.offset ?? 4,
    },
  };
}

function validIso(value: string | null): boolean {
  if (!value) return false;
  try {
    parseDate(value);
    return true;
  } catch {
    return false;
  }
}

function dateUnavailable(options: DatePickerBaseOptions, value: string): boolean {
  const date = validIso(value) ? parseDate(value) : null;
  if (!date) return true;
  const minimumValue = toValue(options.minValue);
  const maximumValue = toValue(options.maxValue);
  const minimum = minimumValue && validIso(minimumValue) ? parseDate(minimumValue) : null;
  const maximum = maximumValue && validIso(maximumValue) ? parseDate(maximumValue) : null;
  return (
    (minimum !== null && date.compare(minimum) < 0) ||
    (maximum !== null && date.compare(maximum) > 0) ||
    (toValue(options.unavailableDates)?.includes(value) ?? false)
  );
}

function invalidRange(
  options: DatePickerBaseOptions,
  start: string | null,
  end: string | null,
): boolean {
  if (start === null || end === null || !validIso(start) || !validIso(end)) return false;
  const first = parseDate(start);
  const last = parseDate(end);
  if (first.compare(last) > 0) return true;
  for (let date = first; date.compare(last) <= 0; date = date.add({ days: 1 })) {
    if (dateUnavailable(options, date.toString())) return true;
  }
  return false;
}

function repairFocusAfterClose(popover: UsePopoverReturn) {
  void nextTick(() => {
    popover.restoreTriggerFocus();
  });
}

function createDatePicker(options: UseDatePickerOptions): DatePickerBinding {
  const open = options.open ?? ref(false);
  const popover = usePopover(popoverOptions(options, open));
  const calendarLabel = computed(() => toValue(options.calendarLabel) ?? toValue(options.label));
  const forcedInvalid = computed(
    () =>
      (toValue(options.invalid) ?? false) ||
      (options.value.value !== null && dateUnavailable(options, options.value.value)),
  );
  const field = useDateField({
    value: options.value,
    label: options.label,
    locale: options.locale,
    minValue: options.minValue,
    maxValue: options.maxValue,
    disabled: options.disabled,
    readOnly: options.readOnly,
    required: options.required,
    invalid: forcedInvalid,
    validationMessage: () => toValue(options.validationMessage) ?? "Choose an available date.",
    name: options.name,
    form: options.form,
    ...(options.segmentLabels ? { segmentLabels: options.segmentLabels } : {}),
  });
  const calendar = useCalendar({
    value: options.value,
    label: calendarLabel,
    locale: options.locale,
    timeZone: options.timeZone,
    minValue: options.minValue,
    maxValue: options.maxValue,
    unavailableDates: options.unavailableDates,
    disabled: options.disabled,
    readOnly: options.readOnly,
    required: options.required,
    invalid: forcedInvalid,
    validationMessage: () => toValue(options.validationMessage) ?? "Choose an available date.",
    previousLabel: options.previousLabel,
    nextLabel: options.nextLabel,
    defaultVisibleMonth: options.defaultVisibleMonth,
    onSelect(value) {
      open.value = false;
      options.onSelect?.(value);
    },
  });

  function reconcileOpenState(next: boolean, previous: boolean | undefined) {
    if (next)
      calendar.focusDate(
        options.value.value ?? calendar.focusedDate.value,
        popover.getTriggerRoot() ?? undefined,
      );
    else if (previous) repairFocusAfterClose(popover);
  }

  watch(open, reconcileOpenState, { flush: "post", immediate: true });

  if (options.formControl) {
    const initial = options.value.value;
    useNativeFormReset(options.formControl, (control) => {
      field.reset(initial);
      calendar.reset(initial);
      open.value = false;
      control.value = initial ?? "";
    });
    useNativeCustomValidity(options.formControl, field.validationMessage);
  }

  const isInvalid = computed(() => field.isInvalid.value || calendar.isInvalid.value);
  const errorId = `${field.fieldProps.id}-error`;

  return {
    value: options.value,
    open,
    field,
    calendar,
    popover,
    calendarLabel,
    error: {
      id: errorId,
      describedBy: computed(() => (isInvalid.value ? errorId : undefined)),
    },
    isInvalid,
  };
}

function createDateRangePicker(options: UseDateRangePickerOptions): DateRangePickerBinding {
  const open = options.open ?? ref(false);
  const popover = usePopover(popoverOptions(options, open));
  const calendarLabel = computed(() => toValue(options.calendarLabel) ?? toValue(options.label));
  const startValue = ref<string | null>(options.value.value?.start ?? null);
  const endValue = ref<string | null>(options.value.value?.end ?? null);
  let modelWrite = false;
  let pendingModelWrite = false;
  let pendingModelValue: RangeCalendarValue | null = null;
  let syncingExternal = false;
  let writeRevision = 0;

  function sameRange(left: RangeCalendarValue | null, right: RangeCalendarValue | null): boolean {
    return left?.start === right?.start && left?.end === right?.end;
  }

  const invalidSelection = computed(() => invalidRange(options, startValue.value, endValue.value));
  const incompleteSelection = computed(
    () => (startValue.value === null) !== (endValue.value === null),
  );

  function syncDraft(value: RangeCalendarValue | null) {
    syncingExternal = true;
    startValue.value = value?.start ?? null;
    endValue.value = value?.end ?? null;
    syncingExternal = false;
  }

  function reconcileExternalRange() {
    const value = options.value.value;
    if (modelWrite) {
      pendingModelWrite = false;
      return;
    }
    if (pendingModelWrite && sameRange(value, pendingModelValue)) {
      pendingModelWrite = false;
      return;
    }
    pendingModelWrite = false;
    writeRevision += 1;
    syncDraft(value);
  }

  function reconcileDraftRange([start, end]: readonly [string | null, string | null]) {
    if (syncingExternal) return;
    const next =
      start !== null &&
      end !== null &&
      validIso(start) &&
      validIso(end) &&
      !invalidRange(options, start, end)
        ? { start, end }
        : null;
    if (sameRange(options.value.value, next)) return;
    const revision = ++writeRevision;
    pendingModelWrite = true;
    pendingModelValue = next;
    modelWrite = true;
    options.value.value = next;
    modelWrite = false;
    void nextTick(() => {
      if (revision !== writeRevision || sameRange(options.value.value, next)) return;
      pendingModelWrite = false;
      syncDraft(options.value.value);
    });
  }

  watch(
    () => [options.value.value?.start, options.value.value?.end] as const,
    reconcileExternalRange,
    { flush: "sync" },
  );
  watch([startValue, endValue], reconcileDraftRange, { flush: "sync" });

  const forcedInvalid = computed(
    () =>
      (toValue(options.invalid) ?? false) || incompleteSelection.value || invalidSelection.value,
  );
  const sharedField = {
    locale: options.locale,
    minValue: options.minValue,
    maxValue: options.maxValue,
    disabled: options.disabled,
    readOnly: options.readOnly,
    required: options.required,
    invalid: forcedInvalid,
    validationMessage: () =>
      toValue(options.validationMessage) ?? "Choose an available date range.",
    form: options.form,
    ...(options.segmentLabels ? { segmentLabels: options.segmentLabels } : {}),
  };
  const startField = useDateField({
    ...sharedField,
    value: startValue,
    label: options.startLabel,
    name: options.startName,
  });
  const endField = useDateField({
    ...sharedField,
    value: endValue,
    label: options.endLabel,
    name: options.endName,
  });
  const calendar = useRangeCalendar({
    value: options.value,
    label: calendarLabel,
    locale: options.locale,
    timeZone: options.timeZone,
    minValue: options.minValue,
    maxValue: options.maxValue,
    unavailableDates: options.unavailableDates,
    disabled: options.disabled,
    readOnly: options.readOnly,
    required: options.required,
    invalid: forcedInvalid,
    validationMessage: () =>
      toValue(options.validationMessage) ?? "Choose an available date range.",
    previousLabel: options.previousLabel,
    nextLabel: options.nextLabel,
    defaultVisibleMonth: options.defaultVisibleMonth,
    onSelect(value) {
      startValue.value = value.start;
      endValue.value = value.end;
      open.value = false;
      options.onSelect?.(value);
    },
  });

  function reconcileOpenState(next: boolean, previous: boolean | undefined) {
    if (next)
      calendar.focusDate(
        startValue.value ?? calendar.focusedDate.value,
        popover.getTriggerRoot() ?? undefined,
      );
    else if (previous) repairFocusAfterClose(popover);
  }

  watch(open, reconcileOpenState, { flush: "post", immediate: true });

  if (options.startFormControl) {
    const initial = options.value.value ? { ...options.value.value } : null;
    useNativeFormReset(options.startFormControl, (control) => {
      calendar.reset(initial);
      startField.reset(initial?.start ?? null);
      endField.reset(initial?.end ?? null);
      open.value = false;
      control.value = initial?.start ?? "";
      if (options.endFormControl?.value) {
        options.endFormControl.value.value = initial?.end ?? "";
      }
    });
    useNativeCustomValidity(options.startFormControl, startField.validationMessage);
  }
  if (options.endFormControl) {
    useNativeCustomValidity(options.endFormControl, endField.validationMessage);
  }

  const isInvalid = computed(
    () =>
      forcedInvalid.value ||
      startField.isInvalid.value ||
      endField.isInvalid.value ||
      calendar.isInvalid.value,
  );
  const errorId = `${startField.fieldProps.id}-error`;

  return {
    value: options.value,
    open,
    startValue,
    endValue,
    startField,
    endField,
    calendar,
    popover,
    calendarLabel,
    error: {
      id: errorId,
      describedBy: computed(() => (isInvalid.value ? errorId : undefined)),
    },
    isInvalid,
  };
}

export function useDatePicker(options: UseDatePickerOptions): DatePickerBinding;
export function useDatePicker(
  props: DatePickerComponentProps,
  model: DatePickerComponentModel,
): DatePickerBinding;
export function useDatePicker(
  optionsOrProps: UseDatePickerOptions | DatePickerComponentProps,
  model?: DatePickerComponentModel,
): DatePickerBinding {
  if (model === undefined) {
    return createDatePicker(optionsOrProps as UseDatePickerOptions);
  }
  const props = optionsOrProps as DatePickerComponentProps;
  const formControl = ref<HTMLInputElement | null>(null);
  const binding = createDatePicker({
    value: model.value,
    open: model.open,
    label: () => props.label,
    calendarLabel: () => props.calendarLabel,
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
    formControl,
    area: props.area,
    offset: props.offset,
  });
  binding.field.formValueProps.ref = nativeFormControlRef(formControl);
  return binding;
}

export function useDateRangePicker(options: UseDateRangePickerOptions): DateRangePickerBinding;
export function useDateRangePicker(
  props: DateRangePickerComponentProps,
  model: DateRangePickerComponentModel,
): DateRangePickerBinding;
export function useDateRangePicker(
  optionsOrProps: UseDateRangePickerOptions | DateRangePickerComponentProps,
  model?: DateRangePickerComponentModel,
): DateRangePickerBinding {
  if (model === undefined) {
    return createDateRangePicker(optionsOrProps as UseDateRangePickerOptions);
  }
  const props = optionsOrProps as DateRangePickerComponentProps;
  const startFormControl = ref<HTMLInputElement | null>(null);
  const endFormControl = ref<HTMLInputElement | null>(null);
  const binding = createDateRangePicker({
    value: model.value,
    open: model.open,
    label: () => props.label,
    startLabel: () => props.startLabel,
    endLabel: () => props.endLabel,
    calendarLabel: () => props.calendarLabel,
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
    startFormControl,
    endFormControl,
    area: props.area,
    offset: props.offset,
  });
  binding.startField.formValueProps.ref = nativeFormControlRef(startFormControl);
  binding.endField.formValueProps.ref = nativeFormControlRef(endFormControl);
  return binding;
}
