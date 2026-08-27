import assert from "node:assert/strict";
import test from "node:test";

import { computed, effectScope, nextTick, ref, watch } from "vue";

import {
  useDatePicker,
  useDateRangePicker,
  type CalendarCell,
  type RangeCalendarCell,
} from "../packages/core/src/index.ts";

function flatten<T>(weeks: readonly (readonly T[])[]): readonly T[] {
  return weeks.flatMap((week) => week);
}

test("DatePicker shares one ISO model between field and calendar and closes after selection", () => {
  const scope = effectScope();
  scope.run(() => {
    const value = ref<string | null>("2026-07-23");
    const open = ref(true);
    const picker = useDatePicker({
      value,
      open,
      label: "Arrival",
      calendarLabel: "Arrival calendar",
      locale: "en-US",
      timeZone: "UTC",
      minValue: "2026-07-01",
      maxValue: "2026-07-31",
      name: "arrival",
    });
    const next = flatten(picker.calendar.weeks.value)
      .find((cell) => cell.value === "2026-07-24") as CalendarCell;
    assert.equal(picker.calendar.select(next), true);
    assert.equal(value.value, "2026-07-24");
    assert.equal(picker.field.formValueProps.value, "2026-07-24");
    assert.equal(open.value, false);
  });
  scope.stop();
});

test("DateRangePicker retains partial field drafts and commits a complete ordered model", () => {
  const scope = effectScope();
  scope.run(() => {
    const value = ref<{ start: string; end: string } | null>(null);
    const picker = useDateRangePicker({
      value,
      label: "Stay",
      startLabel: "Arrival",
      endLabel: "Departure",
      locale: "en-US",
      timeZone: "UTC",
      defaultVisibleMonth: "2026-07-01",
      startName: "arrival",
      endName: "departure",
    });

    picker.startValue.value = "2026-07-10";
    assert.equal(value.value, null);
    assert.equal(picker.endValue.value, null);
    picker.endValue.value = "2026-07-14";
    assert.deepEqual(value.value, { start: "2026-07-10", end: "2026-07-14" });

    picker.startValue.value = "2026-07-20";
    assert.equal(value.value, null);
    assert.equal(picker.isInvalid.value, true);
    assert.equal(picker.endValue.value, "2026-07-14");
  });
  scope.stop();
});

test("DateRangePicker closes only after the second valid calendar endpoint", () => {
  const scope = effectScope();
  scope.run(() => {
    const value = ref<{ start: string; end: string } | null>(null);
    const open = ref(true);
    const picker = useDateRangePicker({
      value,
      open,
      label: "Stay",
      startLabel: "Arrival",
      endLabel: "Departure",
      locale: "en-US",
      timeZone: "UTC",
      defaultVisibleMonth: "2026-07-01",
    });
    const cell = (date: string) => flatten(picker.calendar.weeks.value)
      .find((candidate) => candidate.value === date) as RangeCalendarCell;
    assert.equal(picker.calendar.select(cell("2026-07-10")), false);
    assert.equal(open.value, true);
    assert.equal(picker.calendar.select(cell("2026-07-14")), true);
    assert.equal(open.value, false);
    assert.deepEqual(value.value, { start: "2026-07-10", end: "2026-07-14" });
  });
  scope.stop();
});

test("pickers reject controlled unavailable dates and manually entered unavailable spans", () => {
  const scope = effectScope();
  scope.run(() => {
    const dateValue = ref<string | null>("2026-07-15");
    const datePicker = useDatePicker({
      value: dateValue,
      label: "Arrival",
      locale: "en-US",
      unavailableDates: ["2026-07-15"],
    });
    assert.equal(datePicker.isInvalid.value, true);
    assert.equal(datePicker.field.fieldProps["aria-invalid"], "true");

    const rangeValue = ref<{ start: string; end: string } | null>(null);
    const rangePicker = useDateRangePicker({
      value: rangeValue,
      label: "Stay",
      startLabel: "Arrival",
      endLabel: "Departure",
      locale: "en-US",
      unavailableDates: ["2026-07-15"],
    });
    rangePicker.startValue.value = "2026-07-14";
    assert.equal(rangePicker.isInvalid.value, true);
    rangePicker.endValue.value = "2026-07-16";
    assert.equal(rangeValue.value, null);
    assert.equal(rangePicker.isInvalid.value, true);
    assert.equal(rangePicker.startField.validationMessage.value, "Choose an available date range.");
  });
  scope.stop();
});

test("DateRangePicker applies external ranges atomically and preserves invalid controlled input", () => {
  const scope = effectScope();
  scope.run(() => {
    const value = ref<{ start: string; end: string } | null>({
      start: "2026-07-01",
      end: "2026-07-03",
    });
    const log: Array<{ start: string; end: string } | null> = [];
    watch(value, (next) => log.push(next ? { ...next } : null), { flush: "sync" });
    const picker = useDateRangePicker({
      value,
      label: "Stay",
      startLabel: "Arrival",
      endLabel: "Departure",
      locale: "en-US",
      unavailableDates: ["2026-07-12"],
    });

    value.value = { start: "2026-07-10", end: "2026-07-14" };
    assert.deepEqual(log, [{ start: "2026-07-10", end: "2026-07-14" }]);
    assert.deepEqual(value.value, { start: "2026-07-10", end: "2026-07-14" });
    assert.equal(picker.startValue.value, "2026-07-10");
    assert.equal(picker.endValue.value, "2026-07-14");
    assert.equal(picker.isInvalid.value, true);
  });
  scope.stop();
});

test("DateRangePicker synchronizes endpoint mutations made in place", () => {
  const scope = effectScope();
  scope.run(() => {
    const value = ref<{ start: string; end: string } | null>({
      start: "2026-07-10",
      end: "2026-07-14",
    });
    const picker = useDateRangePicker({
      value,
      label: "Stay",
      startLabel: "Arrival",
      endLabel: "Departure",
      locale: "en-US",
    });
    assert.ok(value.value);
    value.value.start = "2026-08-02";
    value.value.end = "2026-08-04";
    assert.equal(picker.startValue.value, "2026-08-02");
    assert.equal(picker.endValue.value, "2026-08-04");
    assert.equal(picker.startField.formValueProps.value, "2026-08-02");
    assert.equal(picker.endField.formValueProps.value, "2026-08-04");
    assert.equal(picker.calendar.visibleMonth.value, "2026-08-01");
  });
  scope.stop();
});

test("DateRangePicker rolls drafts back when a controlled parent rejects model writes", async () => {
  const source = ref<{ start: string; end: string } | null>({
    start: "2026-07-10",
    end: "2026-07-14",
  });
  const controlled = computed({
    get: () => source.value,
    set: () => {},
  });
  const scope = effectScope();
  const picker = scope.run(() => useDateRangePicker({
    value: controlled,
    label: "Stay",
    startLabel: "Arrival",
    endLabel: "Departure",
    locale: "en-US",
  }));
  assert.ok(picker);
  picker.startValue.value = "2026-07-20";
  assert.equal(picker.isInvalid.value, true);
  await nextTick();
  assert.deepEqual(source.value, { start: "2026-07-10", end: "2026-07-14" });
  assert.equal(picker.startValue.value, "2026-07-10");
  assert.equal(picker.endValue.value, "2026-07-14");
  scope.stop();
});

test("opening an empty picker preserves its existing default-visible roving date", async () => {
  const scope = effectScope();
  const open = ref(false);
  const picker = scope.run(() => useDatePicker({
    value: ref<string | null>(null),
    open,
    label: "Arrival",
    locale: "en-US",
    defaultVisibleMonth: "2026-07-23",
  }));
  assert.ok(picker);
  assert.equal(picker.calendar.focusedDate.value, "2026-07-23");
  open.value = true;
  await nextTick();
  assert.equal(picker.calendar.focusedDate.value, "2026-07-23");
  scope.stop();
});
