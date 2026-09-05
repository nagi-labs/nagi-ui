import assert from "node:assert/strict";
import test from "node:test";

import { computed, effectScope, nextTick, ref } from "vue";

import {
  useDateField,
  type DateFieldSegment,
} from "../packages/core/src/date-field.ts";

function keyEvent(key: string) {
  let prevented = false;
  const event = {
    key,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    preventDefault() { prevented = true; },
  } as unknown as KeyboardEvent;
  return { event, prevented: () => prevented };
}

function editable(
  segments: readonly DateFieldSegment[],
  type: "year" | "month" | "day",
) {
  const segment = segments.find((candidate) => candidate.type === type);
  assert.ok(segment);
  return segment;
}

test("DateField derives locale order and localized segment text without changing ISO value", () => {
  const scope = effectScope();
  scope.run(() => {
    const value = ref<string | null>("2026-07-23");
    const us = useDateField({ value, label: "Arrival", locale: "en-US" });
    assert.deepEqual(us.segments.value.map((segment) => segment.type), [
      "month", "literal", "day", "literal", "year",
    ]);
    assert.deepEqual(
      us.segments.value.filter((segment) => segment.type !== "literal").map((segment) => segment.text),
      ["07", "23", "2,026"].map((text) => text.replace(",", "")),
    );
    assert.equal(us.formValueProps.value, "2026-07-23");

    const japanese = useDateField({ value, label: "到着日", locale: "ja-JP" });
    assert.deepEqual(japanese.segments.value.map((segment) => segment.type), [
      "year", "literal", "month", "literal", "day",
    ]);
  });
  scope.stop();
});

test("DateField edits empty segments with digits and delegates date validity to CalendarDate", () => {
  const scope = effectScope();
  scope.run(() => {
    const value = ref<string | null>(null);
    const field = useDateField({ value, label: "Arrival", locale: "en-US" });

    for (const digit of "2024") {
      field.segmentProps(editable(field.segments.value, "year")).onKeydown?.(keyEvent(digit).event);
    }
    for (const digit of "02") {
      field.segmentProps(editable(field.segments.value, "month")).onKeydown?.(keyEvent(digit).event);
    }
    for (const digit of "29") {
      field.segmentProps(editable(field.segments.value, "day")).onKeydown?.(keyEvent(digit).event);
    }

    assert.equal(value.value, "2024-02-29");
    assert.equal(field.isInvalid.value, false);

    const deleteDay = keyEvent("Delete");
    field.segmentProps(editable(field.segments.value, "day")).onKeydown?.(deleteDay.event);
    assert.equal(deleteDay.prevented(), true);
    assert.equal(value.value, null);
    assert.equal(
      field.segmentProps(editable(field.segments.value, "day"))["aria-valuetext"],
      "Empty",
    );
  });
  scope.stop();
});

test("DateField exposes ARIA spinbuttons, min/max validity, and native form/reset props", async () => {
  const form = new EventTarget();
  let customValidity = "";
  const control = ref({
    form,
    value: "2025-06-14",
    setCustomValidity(message: string) { customValidity = message; },
  } as unknown as HTMLInputElement);
  const value = ref<string | null>("2025-06-14");
  const scope = effectScope();
  const field = scope.run(() => useDateField({
    value,
    label: "Departure",
    locale: "en-US",
    minValue: "2025-06-01",
    maxValue: "2025-06-30",
    required: true,
    describedBy: "departure-help",
    name: "departure",
    form: "booking",
    formControl: control,
  }));
  assert.ok(field);

  const monthProps = field.segmentProps(editable(field.segments.value, "month"));
  assert.equal(monthProps.role, "spinbutton");
  assert.equal(monthProps["aria-valuemin"], 1);
  assert.equal(monthProps["aria-valuemax"], 12);
  assert.equal(monthProps["aria-valuenow"], 6);
  assert.equal(monthProps.contenteditable, "true");
  assert.equal(monthProps.inputmode, "numeric");
  assert.equal(field.fieldProps["aria-required"], "true");
  assert.equal(field.formValueProps.type, "date");
  assert.equal(field.formValueProps.name, "departure");
  assert.equal(field.formValueProps.form, "booking");
  assert.equal(field.error.describedBy.value, "departure-help");

  value.value = "2025-07-01";
  assert.equal(field.isInvalid.value, true);
  assert.equal(field.fieldProps["aria-invalid"], "true");
  assert.equal(field.error.describedBy.value, `departure-help ${field.error.id}`);
  await nextTick();
  assert.equal(customValidity, "Enter a valid date.");

  value.value = "2025-06-20";
  control.value.value = "2025-06-20";
  form.dispatchEvent(new Event("reset"));
  await new Promise((resolve) => setTimeout(resolve, 5));
  assert.equal(value.value, "2025-06-14");
  assert.equal(control.value.value, "2025-06-14");
  scope.stop();
});

test("DateField reset clears partial segments even when the initial model is null", async () => {
  const form = new EventTarget();
  let customValidity = "";
  const control = ref({
    form,
    value: "",
    setCustomValidity(message: string) { customValidity = message; },
  } as unknown as HTMLInputElement);
  const value = ref<string | null>(null);
  const scope = effectScope();
  const field = scope.run(() => useDateField({
    value,
    label: "Arrival",
    locale: "en-US",
    formControl: control,
  }));
  assert.ok(field);

  field.segmentProps(editable(field.segments.value, "year")).onKeydown?.(keyEvent("2").event);
  field.fieldProps.onFocusout({
    relatedTarget: null,
    currentTarget: { contains: () => false },
  } as unknown as FocusEvent);
  assert.equal(editable(field.segments.value, "year").value, 2);
  await nextTick();
  assert.equal(customValidity, "Enter a valid date.");

  form.dispatchEvent(new Event("reset"));
  await new Promise((resolve) => setTimeout(resolve, 5));
  assert.equal(value.value, null);
  assert.equal(editable(field.segments.value, "year").value, undefined);
  assert.equal(customValidity, "");
  scope.stop();
});

test("DateField follows RTL visual arrows and accepts mobile beforeinput digits", () => {
  const scope = effectScope();
  scope.run(() => {
    const value = ref<string | null>(null);
    const field = useDateField({
      value,
      id: "rtl-date",
      label: "التاريخ",
      locale: "ar-EG",
    });
    assert.equal(field.fieldProps.dir, "rtl");

    const focused: string[] = [];
    for (const segment of field.segments.value) {
      if (segment.type === "literal") continue;
      field.segmentProps(segment).ref?.({
        focus() { focused.push(`rtl-date-${segment.type}`); },
      } as unknown as Element);
    }
    const day = editable(field.segments.value, "day");
    const dayProps = field.segmentProps(day);
    dayProps.onKeydown?.(keyEvent("ArrowLeft").event);
    assert.equal(focused.at(-1), "rtl-date-month");

    const year = editable(field.segments.value, "year");
    let prevented = false;
    field.segmentProps(year).onBeforeinput?.({
      inputType: "insertText",
      data: "٢٠٢٦",
      preventDefault() { prevented = true; },
    } as unknown as InputEvent);
    assert.equal(prevented, true);
    assert.equal(editable(field.segments.value, "year").value, 2026);

    let pastePrevented = false;
    field.segmentProps(editable(field.segments.value, "month")).onPaste?.({
      clipboardData: { getData: () => "2027-08-19" },
      preventDefault() { pastePrevented = true; },
    } as unknown as ClipboardEvent);
    assert.equal(pastePrevented, true);
    assert.equal(value.value, "2027-08-19");
    assert.equal(editable(field.segments.value, "day").value, 19);
  });
  scope.stop();
});

test("DateField rolls optimistic segments back when a controlled parent rejects the update", async () => {
  const source = ref<string | null>("2026-07-23");
  const controlled = computed({
    get: () => source.value,
    set: () => {},
  });
  const scope = effectScope();
  const field = scope.run(() => useDateField({ value: controlled, label: "Arrival", locale: "en-US" }));
  assert.ok(field);

  const day = () => editable(field.segments.value, "day");
  field.segmentProps(day()).onKeydown?.(keyEvent("Delete").event);
  field.segmentProps(day()).onKeydown?.(keyEvent("2").event);
  field.segmentProps(day()).onKeydown?.(keyEvent("8").event);
  assert.equal(day().value, 28);
  await nextTick();
  assert.equal(source.value, "2026-07-23");
  assert.equal(day().value, 23);
  assert.equal(field.formValueProps.value, "2026-07-23");
  scope.stop();
});

test("DateField handles mobile deletion and clamps the day when month length shrinks", () => {
  const scope = effectScope();
  scope.run(() => {
    const value = ref<string | null>("2026-03-31");
    const field = useDateField({ value, label: "Arrival", locale: "en-US" });
    const month = editable(field.segments.value, "month");
    field.segmentProps(month).onKeydown?.(keyEvent("Delete").event);
    field.segmentProps(editable(field.segments.value, "month")).onBeforeinput?.({
      inputType: "insertText",
      data: "4",
      preventDefault() {},
    } as unknown as InputEvent);
    assert.equal(value.value, "2026-04-30");
    const dayProps = field.segmentProps(editable(field.segments.value, "day"));
    assert.equal(dayProps["aria-valuenow"], 30);
    assert.equal(dayProps["aria-valuemax"], 30);

    field.segmentProps(editable(field.segments.value, "day")).onBeforeinput?.({
      inputType: "deleteContentBackward",
      data: null,
      preventDefault() {},
    } as unknown as InputEvent);
    assert.equal(editable(field.segments.value, "day").value, undefined);
  });
  scope.stop();
});

test("DateField clears native and ARIA invalidity when reactive constraints are relaxed", async () => {
  let customValidity = "";
  const control = ref({
    form: null,
    value: "2026-07-23",
    setCustomValidity(message: string) { customValidity = message; },
  } as unknown as HTMLInputElement);
  const minimum = ref("2026-08-01");
  const scope = effectScope();
  const field = scope.run(() => useDateField({
    value: ref<string | null>("2026-07-23"),
    label: "Arrival",
    minValue: minimum,
    formControl: control,
  }));
  assert.ok(field);

  field.formValueProps.onInvalid(new Event("invalid", { cancelable: true }));
  assert.equal(field.isInvalid.value, true);
  await nextTick();
  assert.equal(customValidity, "Enter a valid date.");

  minimum.value = "2026-07-01";
  assert.equal(field.isInvalid.value, false);
  assert.equal(field.fieldProps["aria-invalid"], undefined);
  await nextTick();
  assert.equal(customValidity, "");
  scope.stop();
});

test("empty DateField clears forced invalidity when required is relaxed", async () => {
  let customValidity = "";
  const required = ref(true);
  const readOnly = ref(false);
  const control = ref({
    form: null,
    value: "",
    setCustomValidity(message: string) { customValidity = message; },
  } as unknown as HTMLInputElement);
  const scope = effectScope();
  const field = scope.run(() => useDateField({
    value: ref<string | null>(null),
    label: "Arrival",
    required,
    readOnly,
    formControl: control,
  }));
  assert.ok(field);

  field.formValueProps.onInvalid(new Event("invalid", { cancelable: true }));
  assert.equal(field.isInvalid.value, true);
  await nextTick();
  assert.notEqual(customValidity, "");
  required.value = false;
  assert.equal(field.isInvalid.value, false);
  await nextTick();
  assert.equal(customValidity, "");

  required.value = true;
  field.formValueProps.onInvalid(new Event("invalid", { cancelable: true }));
  readOnly.value = true;
  assert.equal(field.isInvalid.value, false);
  scope.stop();
});
