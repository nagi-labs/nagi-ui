import { ref } from "vue";

import {
  useDateField,
  useTimeField,
  type DateFieldBinding,
  type DateFieldSegmentType,
  type TimeFieldBinding,
  type TimeFieldSegmentType,
} from "@nagi-labs/nagi-ui";

const dateValue = ref<string | null>("2026-07-23");
const date = useDateField({
  value: dateValue,
  label: "Arrival",
  locale: "en-GB",
  dir: "ltr",
  minValue: "2026-01-01",
});
date satisfies DateFieldBinding;
date.segments.value[0]?.type satisfies DateFieldSegmentType | undefined;

const timeValue = ref<string | null>("13:45:30");
const time = useTimeField({
  value: timeValue,
  label: "Start",
  locale: "en-US",
  granularity: "second",
  hourCycle: 12,
});
time satisfies TimeFieldBinding;
time.segments.value[0]?.type satisfies TimeFieldSegmentType | undefined;

// @ts-expect-error DateField models ISO strings, not Date objects.
useDateField({ value: ref<Date | null>(null), label: "Invalid" });

// @ts-expect-error TimeField supports only minute or second granularity.
useTimeField({ value: timeValue, label: "Invalid", granularity: "millisecond" });

// @ts-expect-error Direction uses the platform ltr/rtl vocabulary.
useDateField({ value: dateValue, label: "Invalid", dir: "auto" });
