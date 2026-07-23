<script setup lang="ts">
import { ref } from "vue";

import {
  Calendar,
  DateField,
  DatePicker,
  DateRangePicker,
  RangeCalendar,
  TimeField,
} from "@nagi-labs/nagi-ui/components";
import type { RangeCalendarValue } from "@nagi-labs/nagi-ui";

const inlineDate = ref<string | null>("2026-07-23");
const inlineRange = ref<RangeCalendarValue | null>({
  start: "2026-07-20",
  end: "2026-07-22",
});
const fieldDate = ref<string | null>("2026-07-23");
const pickedDate = ref<string | null>("2026-07-24");
const pickedRange = ref<RangeCalendarValue | null>({
  start: "2026-07-25",
  end: "2026-07-27",
});
const fieldTime = ref<string | null>("13:45");
const emptyDate = ref<string | null>(null);
const emptyTime = ref<string | null>(null);
const qaMode = typeof window !== "undefined"
  && new URLSearchParams(window.location.search).has("qa");
const qaControlledDate = ref<string | null>("2026-07-23");
const qaPickerDate = ref<string | null>("2026-07-24");
const qaPickerOpen = ref(qaMode);
const qaReadonlyDate = ref<string | null>(null);
const qaReadonlyRange = ref<RangeCalendarValue | null>(null);
const qaPartialRange = ref<RangeCalendarValue | null>(null);
const submission = ref("No submission yet");

function submit(event: SubmitEvent) {
  const form = event.currentTarget;
  if (!(form instanceof HTMLFormElement)) return;
  submission.value = JSON.stringify(Object.fromEntries(new FormData(form)));
}
</script>

<template>
  <main>
    <h1>Date and time components</h1>
    <form id="date-time-form" @submit.prevent="submit">
      <DateField
        v-model="fieldDate"
        label="Field date"
        name="fieldDate"
        locale="en-US"
        min="2026-07-01"
        max="2026-08-31"
      />
      <TimeField
        v-model="fieldTime"
        label="Field time"
        name="fieldTime"
        locale="en-US"
      />
      <DateField v-model="emptyDate" label="Initially empty date" locale="en-US" />
      <TimeField v-model="emptyTime" label="Initially empty time" locale="en-GB" />
      <DatePicker
        v-model="pickedDate"
        label="Picked date"
        calendar-label="Picked date calendar"
        trigger-label="Choose picked date"
        name="pickedDate"
        locale="en-US"
        time-zone="UTC"
        min="2026-07-01"
        max="2026-08-31"
      />
      <DateRangePicker
        v-model="pickedRange"
        label="Picked range"
        calendar-label="Picked range calendar"
        trigger-label="Choose picked range"
        start-name="pickedStart"
        end-name="pickedEnd"
        locale="en-US"
        time-zone="UTC"
        min="2026-07-01"
        max="2026-08-31"
      />
      <button type="submit">Submit dates</button>
      <button type="reset">Reset dates</button>
    </form>

    <Calendar
      v-model="inlineDate"
      label="Inline date calendar"
      name="inlineDate"
      form="date-time-form"
      locale="en-US"
      time-zone="UTC"
      min="2026-07-01"
      max="2026-08-31"
      :unavailable-dates="['2026-07-24']"
    />
    <RangeCalendar
      v-model="inlineRange"
      label="Inline range calendar"
      start-name="inlineStart"
      end-name="inlineEnd"
      form="date-time-form"
      locale="en-US"
      time-zone="UTC"
      min="2026-07-01"
      max="2026-08-31"
      :unavailable-dates="['2026-07-24']"
    />

    <output data-testid="date-model">{{ fieldDate }}</output>
    <output data-testid="time-model">{{ fieldTime }}</output>
    <output data-testid="empty-date-model">{{ emptyDate }}</output>
    <output data-testid="empty-time-model">{{ emptyTime }}</output>
    <output data-testid="submission">{{ submission }}</output>

    <section v-if="qaMode" aria-label="Date and time QA fixtures">
      <DateField
        :model-value="qaControlledDate"
        label="Rejected controlled date"
        locale="en-US"
        @update:model-value="() => {}"
      />
      <output data-testid="qa-controlled-date">{{ qaControlledDate }}</output>
      <DatePicker
        v-model="qaPickerDate"
        v-model:open="qaPickerOpen"
        label="Initially open date"
        calendar-label="Initially open date calendar"
        trigger-label="Choose initially open date"
        locale="en-US"
        time-zone="UTC"
      />
      <Calendar
        v-model="qaReadonlyDate"
        label="Readonly date calendar"
        name="qaReadonlyDate"
        form="date-time-form"
        locale="en-US"
        default-visible-month="2026-07-23"
        read-only
        required
      />
      <RangeCalendar
        v-model="qaReadonlyRange"
        label="Readonly range calendar"
        start-name="qaReadonlyStart"
        end-name="qaReadonlyEnd"
        form="date-time-form"
        locale="en-US"
        default-visible-month="2026-07-23"
        read-only
        required
      />
      <RangeCalendar
        v-model="qaPartialRange"
        label="Optional partial range"
        start-name="qaPartialStart"
        end-name="qaPartialEnd"
        form="date-time-form"
        locale="en-US"
        default-visible-month="2026-07-23"
      />
      <button type="button">Outside picker target</button>
    </section>
  </main>
</template>
