import assert from "node:assert/strict";
import test from "node:test";

import { effectScope, nextTick, ref } from "vue";

import {
  useCalendar,
  useRangeCalendar,
  type CalendarCell,
  type RangeCalendarCell,
} from "../packages/core/src/calendar.ts";

function flatten<T>(weeks: readonly (readonly T[])[]): readonly T[] {
  return weeks.flatMap((week) => week);
}

function keyEvent(key: string, shiftKey = false) {
  let prevented = false;
  return {
    event: {
      key,
      shiftKey,
      currentTarget: { ownerDocument: { getElementById: () => null } },
      preventDefault() { prevented = true; },
    } as unknown as KeyboardEvent,
    prevented: () => prevented,
  };
}

test("Calendar emits a locale week grid and selects ISO dates", () => {
  const scope = effectScope();
  scope.run(() => {
    const value = ref<string | null>("2026-07-23");
    const calendar = useCalendar({
      value,
      label: "Arrival date",
      locale: "en-GB",
      timeZone: "UTC",
      minValue: "2026-07-01",
      maxValue: "2026-08-31",
    });

    assert.equal(calendar.monthLabel.value, "July 2026");
    assert.equal(calendar.weekdayLabels.value[0], "Mon");
    assert.equal(calendar.weeks.value.length, 6);
    assert.ok(calendar.weeks.value.every((week) => week.length === 7));
    assert.equal(calendar.gridProps.role, "grid");

    const selected = flatten(calendar.weeks.value).find((cell) => cell.value === "2026-07-23");
    assert.ok(selected);
    assert.equal(selected.selected, true);
    assert.equal(calendar.gridCellProps(selected)["aria-selected"], "true");

    const next = flatten(calendar.weeks.value).find((cell) => cell.value === "2026-07-24");
    assert.ok(next);
    assert.equal(calendar.select(next), true);
    assert.equal(value.value, "2026-07-24");
    assert.equal(calendar.formValueProps.value, "2026-07-24");
  });
  scope.stop();
});

test("Calendar keyboard movement keeps one eligible roving target and blocks constraints", () => {
  const scope = effectScope();
  scope.run(() => {
    const value = ref<string | null>("2026-07-23");
    const calendar = useCalendar({
      value,
      label: "Arrival date",
      locale: "en-US",
      timeZone: "UTC",
      minValue: "2026-07-20",
      maxValue: "2026-07-31",
      unavailableDates: ["2026-07-24"],
    });
    const cells = flatten(calendar.weeks.value);
    const current = cells.find((cell) => cell.value === "2026-07-23") as CalendarCell;
    const blocked = cells.find((cell) => cell.value === "2026-07-24") as CalendarCell;
    const afterBlocked = cells.find((cell) => cell.value === "2026-07-25") as CalendarCell;
    assert.equal(calendar.cellButtonProps(current).tabindex, 0);
    assert.equal(calendar.cellButtonProps(blocked).disabled, true);
    assert.equal(calendar.select(blocked), false);

    const arrow = keyEvent("ArrowRight");
    calendar.cellButtonProps(current).onKeydown(arrow.event);
    assert.equal(arrow.prevented(), true);
    assert.equal(calendar.cellButtonProps(afterBlocked).tabindex, 0);
  });
  scope.stop();
});

test("Calendar keeps a roving target when a controlled selected date is unavailable", () => {
  const scope = effectScope();
  scope.run(() => {
    const value = ref<string | null>("2026-07-24");
    const calendar = useCalendar({
      value,
      label: "Arrival date",
      locale: "en-US",
      timeZone: "UTC",
      unavailableDates: ["2026-07-24"],
    });
    const cells = flatten(calendar.weeks.value);
    assert.equal(calendar.isInvalid.value, true);
    assert.equal(
      cells.filter((cell) => calendar.cellButtonProps(cell).tabindex === 0).length,
      1,
    );
  });
  scope.stop();
});

test("Calendar keeps Gregorian values and accessible labels aligned in non-Gregorian locales", () => {
  const scope = effectScope();
  scope.run(() => {
    const value = ref<string | null>("2026-07-23");
    const calendar = useCalendar({ value, label: "تاریخ", locale: "fa-IR", timeZone: "UTC" });
    const selected = flatten(calendar.weeks.value)
      .find((cell) => cell.value === "2026-07-23") as CalendarCell;
    const expected = new Intl.DateTimeFormat("fa-IR", {
      calendar: "gregory",
      dateStyle: "full",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(2026, 6, 23)));
    assert.equal(selected.label, expected);
    assert.equal(calendar.cellButtonProps(selected)["aria-label"], expected);
  });
  scope.stop();
});

test("Calendar repairs roving focus after reactive constraints and bounds Home within its week", async () => {
  const scope = effectScope();
  scope.run(() => {
    const value = ref<string | null>("2026-07-23");
    const unavailableDates = ref<readonly string[]>([]);
    const calendar = useCalendar({
      value,
      label: "Arrival",
      locale: "en-US",
      unavailableDates,
    });
    unavailableDates.value = ["2026-07-23"];
    const cells = flatten(calendar.weeks.value);
    assert.equal(cells.filter((cell) => calendar.cellButtonProps(cell).tabindex === 0).length, 1);

    unavailableDates.value = ["2026-07-19", "2026-07-20"];
    const thursday = cells.find((cell) => cell.value === "2026-07-23") as CalendarCell;
    calendar.cellButtonProps(thursday).onKeydown(keyEvent("Home").event);
    const monday = cells.find((cell) => cell.value === "2026-07-21") as CalendarCell;
    assert.equal(calendar.cellButtonProps(monday).tabindex, 0);
  });
  scope.stop();
});

test("Calendar restores DOM and roving focus when an all-blocked grid becomes partially available", async () => {
  const scope = effectScope();
  const mode = ref<"open" | "blocked" | "one">("open");
  const focusedIds: string[] = [];
  const calendar = scope.run(() => useCalendar({
    value: ref<string | null>("2026-07-23"),
    label: "Arrival",
    locale: "en-US",
    isDateUnavailable: (date) => mode.value === "blocked"
      || (mode.value === "one" && date !== "2026-07-25"),
  }));
  assert.ok(calendar);
  const current = flatten(calendar.weeks.value)
    .find((cell) => cell.value === "2026-07-23") as CalendarCell;
  const currentProps = calendar.cellButtonProps(current);
  const ownerDocument = {
    activeElement: { id: currentProps.id },
    getElementById(id: string) {
      return { focus() { focusedIds.push(id); } };
    },
  } as unknown as Document;
  currentProps.onFocus({ currentTarget: { ownerDocument } } as unknown as FocusEvent);

  mode.value = "blocked";
  assert.equal(
    flatten(calendar.weeks.value)
      .filter((cell) => calendar.cellButtonProps(cell).tabindex === 0).length,
    0,
  );
  mode.value = "one";
  assert.equal(calendar.focusedDate.value, "2026-07-25");
  assert.equal(
    flatten(calendar.weeks.value)
      .filter((cell) => calendar.cellButtonProps(cell).tabindex === 0).length,
    1,
  );
  await nextTick();
  assert.match(focusedIds.at(-1) ?? "", /2026-07-25$/u);
  scope.stop();
});

test("Calendar month buttons traverse unavailable months and stop only at min/max boundaries", () => {
  const scope = effectScope();
  scope.run(() => {
    const august = Array.from({ length: 31 }, (_, index) =>
      `2026-08-${String(index + 1).padStart(2, "0")}`);
    const value = ref<string | null>("2026-07-31");
    const calendar = useCalendar({
      value,
      label: "Arrival",
      locale: "en-US",
      minValue: "2026-07-01",
      maxValue: "2026-09-15",
      unavailableDates: august,
    });
    assert.equal(calendar.nextButtonProps.disabled, false);
    calendar.nextButtonProps.onClick();
    assert.equal(calendar.visibleMonth.value, "2026-08-01");
    assert.equal(
      flatten(calendar.weeks.value)
        .filter((cell) => calendar.cellButtonProps(cell).tabindex === 0).length,
      1,
    );
    const pageDown = keyEvent("PageDown");
    const focused = flatten(calendar.weeks.value)
      .find((cell) => calendar.cellButtonProps(cell).tabindex === 0) as CalendarCell;
    calendar.cellButtonProps(focused).onKeydown(pageDown.event);
    assert.equal(pageDown.prevented(), true);
    assert.equal(calendar.visibleMonth.value, "2026-09-01");
    assert.equal(calendar.focusedDate.value.startsWith("2026-09-"), true);

    calendar.previousButtonProps.onClick();
    assert.equal(calendar.visibleMonth.value, "2026-08-01");
    assert.equal(calendar.nextButtonProps.disabled, false);
    calendar.nextButtonProps.onClick();
    assert.equal(calendar.visibleMonth.value, "2026-09-01");
    assert.equal(calendar.nextButtonProps.disabled, true);
  });
  scope.stop();
});

test("Calendar paging does not display a month outside min/max boundaries", () => {
  const scope = effectScope();
  scope.run(() => {
    const maximum = useCalendar({
      value: ref<string | null>("2026-09-30"),
      label: "Maximum",
      locale: "en-US",
      maxValue: "2026-09-30",
    });
    const maxCell = flatten(maximum.weeks.value)
      .find((cell) => cell.value === "2026-09-30") as CalendarCell;
    const pageDown = keyEvent("PageDown");
    maximum.cellButtonProps(maxCell).onKeydown(pageDown.event);
    assert.equal(pageDown.prevented(), true);
    assert.equal(maximum.visibleMonth.value, "2026-09-01");
    const shiftPageDown = keyEvent("PageDown", true);
    maximum.cellButtonProps(maxCell).onKeydown(shiftPageDown.event);
    assert.equal(maximum.visibleMonth.value, "2026-09-01");

    const minimum = useCalendar({
      value: ref<string | null>("2026-07-01"),
      label: "Minimum",
      locale: "en-US",
      minValue: "2026-07-01",
    });
    const minCell = flatten(minimum.weeks.value)
      .find((cell) => cell.value === "2026-07-01") as CalendarCell;
    const pageUp = keyEvent("PageUp");
    minimum.cellButtonProps(minCell).onKeydown(pageUp.event);
    assert.equal(pageUp.prevented(), true);
    assert.equal(minimum.visibleMonth.value, "2026-07-01");
  });
  scope.stop();
});

test("Calendar and RangeCalendar clear dynamic invalidity and expose read-only native controls", () => {
  const scope = effectScope();
  scope.run(() => {
    const unavailableDates = ref<readonly string[]>(["2026-07-23"]);
    const calendar = useCalendar({
      value: ref<string | null>("2026-07-23"),
      label: "Arrival",
      unavailableDates,
      readOnly: true,
      required: true,
    });
    assert.equal(calendar.isInvalid.value, true);
    calendar.formValueProps.onInvalid(new Event("invalid", { cancelable: true }));
    unavailableDates.value = [];
    assert.equal(calendar.isInvalid.value, false);
    assert.equal(calendar.validationMessage.value, "");
    assert.equal(calendar.formValueProps.readonly, true);
    assert.equal(calendar.formValueProps.required, true);

    unavailableDates.value = ["2026-07-21"];
    const range = useRangeCalendar({
      value: ref({ start: "2026-07-20", end: "2026-07-22" }),
      label: "Stay",
      unavailableDates,
      readOnly: true,
      required: true,
    });
    assert.equal(range.isInvalid.value, true);
    range.startFormValueProps.onInvalid(new Event("invalid", { cancelable: true }));
    unavailableDates.value = [];
    assert.equal(range.isInvalid.value, false);
    assert.equal(range.validationMessage.value, "");
    assert.equal(range.startFormValueProps.readonly, true);
    assert.equal(range.endFormValueProps.readonly, true);
  });
  scope.stop();
});

test("RangeCalendar previews, orders, and rejects unavailable spans", () => {
  const scope = effectScope();
  scope.run(() => {
    const value = ref<{ start: string; end: string } | null>(null);
    const range = useRangeCalendar({
      value,
      label: "Stay dates",
      locale: "en-US",
      timeZone: "UTC",
      defaultVisibleMonth: "2026-07-01",
      unavailableDates: ["2026-07-15"],
      startName: "arrival",
      endName: "departure",
    });

    const cell = (date: string) => flatten(range.weeks.value)
      .find((candidate) => candidate.value === date) as RangeCalendarCell;
    assert.equal(range.select(cell("2026-07-14")), false);
    assert.match(range.announcement.value, /Tuesday, July 14, 2026/u);
    range.cellButtonProps(cell("2026-07-14")).onKeydown(keyEvent("ArrowRight").event);
    assert.equal(cell("2026-07-16").preview, true);
    assert.match(range.announcement.value, /Thursday, July 16, 2026/u);
    range.cellButtonProps(cell("2026-07-16")).onPointerenter?.({} as PointerEvent);
    assert.equal(cell("2026-07-14").preview, true);
    assert.equal(cell("2026-07-16").preview, true);
    assert.equal(range.select(cell("2026-07-16")), false);
    assert.equal(value.value, null);
    assert.equal(range.isInvalid.value, true);

    assert.equal(range.select(cell("2026-07-18")), true);
    assert.deepEqual(value.value, { start: "2026-07-16", end: "2026-07-18" });
    assert.equal(range.startFormValueProps.value, "2026-07-16");
    assert.equal(range.endFormValueProps.value, "2026-07-18");
  });
  scope.stop();
});

test("RangeCalendar blocks form submission during a provisional anchor and cancels it on external writes", () => {
  const scope = effectScope();
  scope.run(() => {
    const value = ref<{ start: string; end: string } | null>(null);
    const range = useRangeCalendar({
      value,
      label: "Stay",
      locale: "en-US",
      defaultVisibleMonth: "2026-07-01",
    });
    const cell = (date: string) => flatten(range.weeks.value)
      .find((candidate) => candidate.value === date) as RangeCalendarCell;

    assert.equal(range.select(cell("2026-07-20")), false);
    assert.equal(range.anchor.value, "2026-07-20");
    assert.equal(range.isInvalid.value, true);
    assert.equal(range.startFormValueProps.value, "");
    assert.match(range.validationMessage.value, /range/u);

    value.value = { start: "2026-07-10", end: "2026-07-12" };
    assert.equal(range.anchor.value, null);
    range.select(cell("2026-07-21"));
    assert.equal(range.anchor.value, "2026-07-21");
    value.value = null;
    assert.equal(range.anchor.value, null);
    assert.equal(range.announcement.value, "");
    assert.equal(range.select(cell("2026-07-22")), false);
    assert.equal(value.value, null);

    value.value = { start: "2026-07-25", end: "2026-07-20" };
    assert.equal(range.anchor.value, null);
    assert.equal(range.isInvalid.value, true);

    value.value = { start: "2026-07-25", end: "2026-07-27" };
    range.select(cell("2026-07-28"));
    assert.equal(range.anchor.value, "2026-07-28");
    value.value.start = "2026-08-02";
    value.value.end = "2026-08-04";
    assert.equal(range.anchor.value, null);
    assert.equal(range.visibleMonth.value, "2026-08-01");
    assert.equal(range.focusedDate.value, "2026-08-02");
  });
  scope.stop();
});

test("empty required calendars clear forced invalidity when the constraint is relaxed", async () => {
  const scope = effectScope();
  const required = ref(true);
  let singleValidity = "";
  let rangeValidity = "";
  const singleControl = ref({
    form: null,
    value: "",
    setCustomValidity(message: string) { singleValidity = message; },
  } as unknown as HTMLInputElement);
  const rangeControl = ref({
    form: null,
    value: "",
    setCustomValidity(message: string) { rangeValidity = message; },
  } as unknown as HTMLInputElement);
  const calendar = scope.run(() => useCalendar({
    value: ref<string | null>(null),
    label: "Arrival",
    required,
    formControl: singleControl,
  }));
  const range = scope.run(() => useRangeCalendar({
    value: ref<{ start: string; end: string } | null>(null),
    label: "Stay",
    required,
    startFormControl: rangeControl,
  }));
  assert.ok(calendar);
  assert.ok(range);

  calendar.formValueProps.onInvalid(new Event("invalid", { cancelable: true }));
  range.startFormValueProps.onInvalid(new Event("invalid", { cancelable: true }));
  assert.equal(calendar.isInvalid.value, true);
  assert.equal(range.isInvalid.value, true);
  await nextTick();
  assert.notEqual(singleValidity, "");
  assert.notEqual(rangeValidity, "");

  required.value = false;
  assert.equal(calendar.isInvalid.value, false);
  assert.equal(range.isInvalid.value, false);
  await nextTick();
  assert.equal(singleValidity, "");
  assert.equal(rangeValidity, "");
  scope.stop();
});
