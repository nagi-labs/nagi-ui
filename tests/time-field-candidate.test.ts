import assert from "node:assert/strict";
import test from "node:test";

import { computed, effectScope, nextTick, ref } from "vue";

import {
  useTimeField,
  type TimeFieldSegment,
} from "../packages/core/src/time-field.ts";

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
  segments: readonly TimeFieldSegment[],
  type: "hour" | "minute" | "second" | "dayPeriod",
) {
  const segment = segments.find((candidate) => candidate.type === type);
  assert.ok(segment);
  return segment;
}

test("TimeField derives 12/24-hour segment order from Intl while preserving ISO", () => {
  const scope = effectScope();
  scope.run(() => {
    const value = ref<string | null>("13:45");
    const us = useTimeField({ value, label: "Start", locale: "en-US" });
    assert.deepEqual(us.segments.value.map((segment) => segment.type), [
      "hour", "literal", "minute", "literal", "dayPeriod",
    ]);
    assert.equal(editable(us.segments.value, "hour").text, "01");
    assert.equal(editable(us.segments.value, "dayPeriod").value, 1);
    assert.equal(us.formValueProps.value, "13:45");

    const french = useTimeField({ value, label: "Début", locale: "fr-FR" });
    assert.deepEqual(french.segments.value.map((segment) => segment.type), [
      "hour", "literal", "minute",
    ]);
    assert.equal(editable(french.segments.value, "hour").text, "13");
  });
  scope.stop();
});

test("TimeField edits second-granularity values and day period without changing ISO vocabulary", () => {
  const scope = effectScope();
  scope.run(() => {
    const value = ref<string | null>(null);
    const field = useTimeField({
      value,
      label: "Reminder",
      locale: "en-US",
      granularity: "second",
      hourCycle: 12,
    });
    for (const digit of "11") {
      field.segmentProps(editable(field.segments.value, "hour")).onKeydown?.(keyEvent(digit).event);
    }
    for (const digit of "05") {
      field.segmentProps(editable(field.segments.value, "minute")).onKeydown?.(keyEvent(digit).event);
    }
    for (const digit of "09") {
      field.segmentProps(editable(field.segments.value, "second")).onKeydown?.(keyEvent(digit).event);
    }
    field.segmentProps(editable(field.segments.value, "dayPeriod")).onKeydown?.(keyEvent("p").event);

    assert.equal(value.value, "23:05:09");
    assert.equal(field.formValueProps.step, 1);
    const secondProps = field.segmentProps(editable(field.segments.value, "second"));
    assert.equal(secondProps["aria-valuemax"], 59);
    assert.equal(secondProps.contenteditable, "true");
    assert.equal(secondProps.inputmode, "numeric");
  });
  scope.stop();
});

test("TimeField exposes native min/max/reset and keyboard cycle semantics", async () => {
  const form = new EventTarget();
  let customValidity = "";
  const control = ref({
    form,
    value: "09:30",
    setCustomValidity(message: string) { customValidity = message; },
  } as unknown as HTMLInputElement);
  const value = ref<string | null>("09:30");
  const scope = effectScope();
  const field = scope.run(() => useTimeField({
    value,
    label: "Office hours",
    locale: "en-GB",
    minValue: "09:00",
    maxValue: "17:00",
    name: "office-time",
    form: "settings",
    required: true,
    describedBy: "office-hours-help",
    formControl: control,
  }));
  assert.ok(field);

  const up = keyEvent("ArrowUp");
  field.segmentProps(editable(field.segments.value, "minute")).onKeydown?.(up.event);
  assert.equal(up.prevented(), true);
  assert.equal(value.value, "09:31");
  assert.equal(field.formValueProps.type, "time");
  assert.equal(field.formValueProps.step, 60);
  assert.equal(field.formValueProps.name, "office-time");
  assert.equal(field.fieldProps["aria-required"], "true");
  assert.equal(field.error.describedBy.value, "office-hours-help");

  value.value = "18:00";
  assert.equal(field.isInvalid.value, true);
  assert.equal(field.fieldProps["aria-invalid"], "true");
  assert.equal(field.error.describedBy.value, `office-hours-help ${field.error.id}`);
  await nextTick();
  assert.equal(customValidity, "Enter a valid time.");

  value.value = "10:00";
  control.value.value = "10:00";
  form.dispatchEvent(new Event("reset"));
  await new Promise((resolve) => setTimeout(resolve, 5));
  assert.equal(value.value, "09:30");
  assert.equal(control.value.value, "09:30");
  scope.stop();
});

test("TimeField reset clears partial segments even when the initial model is null", async () => {
  const form = new EventTarget();
  let customValidity = "";
  const control = ref({
    form,
    value: "",
    setCustomValidity(message: string) { customValidity = message; },
  } as unknown as HTMLInputElement);
  const value = ref<string | null>(null);
  const scope = effectScope();
  const field = scope.run(() => useTimeField({
    value,
    label: "Start",
    locale: "en-GB",
    formControl: control,
  }));
  assert.ok(field);

  field.segmentProps(editable(field.segments.value, "hour")).onKeydown?.(keyEvent("1").event);
  field.fieldProps.onFocusout({
    relatedTarget: null,
    currentTarget: { contains: () => false },
  } as unknown as FocusEvent);
  assert.equal(editable(field.segments.value, "hour").value, 1);
  await nextTick();
  assert.equal(customValidity, "Enter a valid time.");

  form.dispatchEvent(new Event("reset"));
  await new Promise((resolve) => setTimeout(resolve, 5));
  assert.equal(value.value, null);
  assert.equal(editable(field.segments.value, "hour").value, undefined);
  assert.equal(customValidity, "");
  scope.stop();
});

test("TimeField canonicalizes the controlled ISO value when granularity changes", () => {
  const scope = effectScope();
  scope.run(() => {
    const value = ref<string | null>("13:45");
    const granularity = ref<"minute" | "second">("minute");
    const field = useTimeField({ value, label: "Start", granularity });
    granularity.value = "second";
    assert.equal(value.value, "13:45:00");
    assert.equal(field.formValueProps.step, 1);
    assert.ok(field.segments.value.some((segment) => segment.type === "second"));
    granularity.value = "minute";
    assert.equal(value.value, "13:45");
  });
  scope.stop();
});

test("TimeField rolls segments back after a rejected controlled update and handles mobile deletion", async () => {
  const source = ref<string | null>("13:45");
  const controlled = computed({
    get: () => source.value,
    set: () => {},
  });
  const scope = effectScope();
  const field = scope.run(() => useTimeField({ value: controlled, label: "Start", locale: "en-GB" }));
  assert.ok(field);
  const minute = () => editable(field.segments.value, "minute");
  field.segmentProps(minute()).onKeydown?.(keyEvent("ArrowUp").event);
  assert.equal(minute().value, 46);
  await nextTick();
  assert.equal(source.value, "13:45");
  assert.equal(minute().value, 45);

  field.segmentProps(minute()).onBeforeinput?.({
    inputType: "deleteContentBackward",
    data: null,
    preventDefault() {},
  } as unknown as InputEvent);
  assert.equal(minute().value, undefined);
  scope.stop();
});

test("TimeField clears native and ARIA invalidity when reactive constraints are relaxed", async () => {
  let customValidity = "";
  const control = ref({
    form: null,
    value: "18:00",
    setCustomValidity(message: string) { customValidity = message; },
  } as unknown as HTMLInputElement);
  const maximum = ref("17:00");
  const scope = effectScope();
  const field = scope.run(() => useTimeField({
    value: ref<string | null>("18:00"),
    label: "Office hours",
    maxValue: maximum,
    formControl: control,
  }));
  assert.ok(field);

  field.formValueProps.onInvalid(new Event("invalid", { cancelable: true }));
  assert.equal(field.isInvalid.value, true);
  await nextTick();
  assert.equal(customValidity, "Enter a valid time.");

  maximum.value = "19:00";
  assert.equal(field.isInvalid.value, false);
  assert.equal(field.fieldProps["aria-invalid"], undefined);
  await nextTick();
  assert.equal(customValidity, "");
  scope.stop();
});

test("empty TimeField clears forced invalidity when required or enabled state is relaxed", async () => {
  let customValidity = "";
  const required = ref(true);
  const disabled = ref(false);
  const control = ref({
    form: null,
    value: "",
    setCustomValidity(message: string) { customValidity = message; },
  } as unknown as HTMLInputElement);
  const scope = effectScope();
  const field = scope.run(() => useTimeField({
    value: ref<string | null>(null),
    label: "Start",
    required,
    disabled,
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
  disabled.value = true;
  assert.equal(field.isInvalid.value, false);
  scope.stop();
});
