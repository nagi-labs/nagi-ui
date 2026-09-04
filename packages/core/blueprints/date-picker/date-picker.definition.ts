import {
  adoptRequirementSet,
  defineComponentContract,
  defineComponentDefinition,
  defineComponentImplementation,
  nagiCalendarRequirementsV2,
  nagiPopupRequirementsV1,
} from "@nagi-labs/nagi-ui";

const calendar = adoptRequirementSet(nagiCalendarRequirementsV2, {
  prefix: "DTP-CAL",
  profile: { context: "date-picker", selection: "single" },
  evidence: {
    "SEM-01": ["packages/core/src/test/date-picker-contract.ts"],
    "SEM-02": ["packages/core/src/test/date-picker-contract.ts"],
    "INT-01": [
      "packages/core/src/test/date-picker-contract.ts",
      "tests/calendar-candidate.test.ts",
    ],
    "FOCUS-01": [
      "packages/core/src/test/date-picker-contract.ts",
      "tests/calendar-candidate.test.ts",
    ],
  },
});

const popup = adoptRequirementSet(nagiPopupRequirementsV1, {
  prefix: "DTP-POP",
  profile: { invocation: "native-target", focus: "calendar-managed", dismissal: "auto" },
  evidence: {
    "SEM-01": ["packages/core/src/test/date-picker-contract.ts"],
    "STATE-01": ["packages/core/src/test/date-picker-contract.ts"],
    "INT-01": ["packages/core/src/test/date-picker-contract.ts"],
  },
});

export const datePickerComponentContract = defineComponentContract({
  id: "nagi/date-picker",
  revision: "1",
  description:
    "Segmented date entry, calendar selection, accepted-value state, keyboard navigation, dismissal, and focus restoration shared by interchangeable DatePicker implementations.",
  api: [
    { name: "modelValue", kind: "model", description: "Controls the accepted ISO date." },
    { name: "open", kind: "model", description: "Controls calendar-surface visibility." },
    { name: "label", kind: "prop", description: "Names the segmented date field." },
    { name: "calendarLabel", kind: "prop", description: "Names the calendar grid." },
    { name: "name", kind: "prop", description: "Names the submitted ISO date value." },
    { name: "form", kind: "prop", description: "Selects the owning form." },
    { name: "min", kind: "prop", description: "Sets the earliest selectable date." },
    { name: "max", kind: "prop", description: "Sets the latest selectable date." },
    {
      name: "unavailableDates",
      kind: "prop",
      description: "Excludes otherwise in-range dates from selection.",
    },
    { name: "required", kind: "prop", description: "Requires an accepted date for submission." },
    { name: "invalid", kind: "prop", description: "Forces the public invalid state." },
    {
      name: "validationMessage",
      kind: "prop",
      description: "Supplies the public form-validation message.",
    },
  ],
  parts: [
    { name: "field", description: "The segmented date-entry surface." },
    { name: "calendar", description: "The selectable date grid." },
    { name: "day", description: "One selectable calendar date.", multiple: true },
  ],
  adopts: [calendar],
  references: [
    {
      id: "apg-datepicker",
      title: "WAI-ARIA APG Date Picker Dialog Example",
      url: "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/",
      kind: "example",
      revision: "Rolling guidance snapshot",
      reviewedAt: "2026-09-01",
    },
    {
      id: "apg-spinbutton",
      title: "WAI-ARIA APG Spinbutton Pattern",
      url: "https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/",
      kind: "pattern",
      revision: "Rolling guidance snapshot",
      reviewedAt: "2026-09-01",
    },
  ],
  semantics: [
    {
      id: "DTP-SEM-01",
      classification: "conformant",
      source: "WAI-ARIA APG Spinbutton Pattern",
      text: "A labelled segmented field exposes editable date segments as spinbuttons and one accepted ISO date value.",
      evidence: ["packages/core/src/test/date-picker-contract.ts"],
      origin: { kind: "reference", referenceIds: ["apg-spinbutton"] },
    },
  ],
  state: [
    {
      id: "DTP-STATE-01",
      classification: "intentional-extension",
      source: "Nagi controlled-model acceptance policy",
      text: "Controlled date and open models remain authoritative; accepted calendar selection updates the ISO value and closes the calendar surface.",
      evidence: [
        "packages/core/src/test/date-picker-contract.ts",
        "tests/date-picker-candidate.test.ts",
      ],
      origin: { kind: "nagi", policy: "controlled-date-selection-acceptance", policyVersion: "1" },
    },
    {
      id: "DTP-STATE-02",
      classification: "conformant",
      source: "Nagi date-constraint policy",
      text: "Minimum, maximum, unavailable, required, and explicit invalid states remain consistent across the field and calendar.",
      evidence: ["tests/date-picker-candidate.test.ts", "tests/browser/date-time.spec.ts"],
      origin: { kind: "nagi", policy: "date-constraint-consistency", policyVersion: "1" },
    },
  ],
  interaction: [
    {
      id: "DTP-INT-01",
      classification: "conformant",
      source: "WAI-ARIA APG Spinbutton Pattern",
      text: "Each editable date segment is a spinbutton and responds to increment, decrement, and deletion without moving DOM focus outside the field.",
      evidence: ["tests/date-picker-candidate.test.ts", "tests/browser/date-time.spec.ts"],
      origin: { kind: "reference", referenceIds: ["apg-spinbutton"] },
    },
    {
      id: "DTP-INT-02",
      classification: "intentional-extension",
      source: "Nagi DatePicker composition policy",
      text: "The field trigger opens the calendar surface and transfers focus to the calendar's single roving focus owner.",
      evidence: ["packages/core/src/test/date-picker-contract.ts"],
      origin: { kind: "nagi", policy: "date-picker-calendar-composition", policyVersion: "1" },
    },
    {
      id: "DTP-INT-03",
      classification: "intentional-extension",
      source: "WAI-ARIA APG Date Picker Dialog Example",
      text: "Activating an available day selects it and closes the calendar surface; Escape closes without changing the accepted date.",
      evidence: ["packages/core/src/test/date-picker-contract.ts"],
      origin: { kind: "nagi", policy: "date-picker-selection-dismissal", policyVersion: "1" },
    },
  ],
  focus: [
    {
      id: "DTP-FOCUS-01",
      classification: "conformant",
      source: "WAI-ARIA APG Date Picker Dialog Example",
      text: "Opening places focus on the selected date or the calendar's declared fallback date.",
      evidence: ["packages/core/src/test/date-picker-contract.ts"],
      origin: { kind: "reference", referenceIds: ["apg-datepicker"] },
    },
    {
      id: "DTP-FOCUS-02",
      classification: "conformant",
      source: "WAI-ARIA APG Date Picker Dialog Example and Nagi light-dismiss policy",
      text: "Selection or Escape restores the invoking control, while light dismissal to another control does not steal focus back.",
      evidence: [
        "packages/core/src/test/date-picker-contract.ts",
        "tests/browser/shadow-root.spec.ts",
      ],
      origin: { kind: "nagi", policy: "local-trigger-focus-restoration", policyVersion: "1" },
    },
  ],
});

export const nativePopoverDatePickerImplementation = defineComponentImplementation({
  id: "nagi/blueprint/date-picker-native-popover",
  title: "Native-popover DatePicker Blueprint",
  version: "1",
  strategy: "platform-first-composite",
  description:
    "The standard Blueprint realizes the DatePicker Component Contract with a native date form channel, native buttons, and a non-modal native Popover.",
  references: [
    {
      id: "html-date-state",
      title: "HTML Living Standard — Date state (input type=date)",
      url: "https://html.spec.whatwg.org/multipage/input.html#date-state-(type=date)",
      kind: "living-standard",
      revision: "Living Standard snapshot",
      reviewedAt: "2026-09-01",
    },
  ],
  decisions: [
    {
      name: "presence",
      value: "native-popover",
      description: "Use the browser's non-modal auto-popover lifecycle for the calendar surface.",
      evidence: ["packages/core/src/test/date-picker-contract.ts"],
    },
    {
      name: "form-channel",
      value: "native-date-input",
      description: "Submit and validate the accepted ISO value through a native date input.",
      evidence: ["packages/core/src/test/date-picker-contract.ts"],
    },
  ],
  adopts: [popup],
  semantics: [
    {
      id: "DTP-SEM-02",
      classification: "implementation-constraint",
      source: "HTML Popover API and native DatePicker Blueprint policy",
      text: 'A native button controls a named non-modal native Popover whose surface exposes `role="dialog"`; a native date input carries the accepted ISO form value.',
      evidence: ["packages/core/src/test/date-picker-contract.ts"],
      origin: { kind: "nagi", policy: "native-date-picker-surface", policyVersion: "1" },
    },
  ],
  anatomy: [
    {
      id: "DTP-ANAT-01",
      evidence: ["packages/core/src/test/date-picker-contract.ts"],
      name: "root",
      description: "The owned DatePicker scope joining its field, popup, and form channel.",
      match: { by: "part", scope: "date-picker", part: "root" },
    },
    {
      id: "DTP-ANAT-02",
      evidence: ["packages/core/src/test/date-picker-contract.ts"],
      name: "field",
      description: "The labelled segmented date field receiving fieldProps.",
      match: { by: "part", scope: "date-picker", part: "field" },
      within: "root",
      contractPart: "field",
    },
    {
      id: "DTP-ANAT-03",
      evidence: ["packages/core/src/test/date-picker-contract.ts"],
      name: "segment",
      description: "A repeated editable or literal locale date segment.",
      match: { by: "part", scope: "date-picker", part: "segment" },
      within: "field",
      multiple: true,
    },
    {
      id: "DTP-ANAT-04",
      evidence: ["packages/core/src/test/date-picker-contract.ts"],
      name: "trigger",
      description: "The native popup invoker receiving the complete triggerProps bundle.",
      match: { by: "part", scope: "date-picker", part: "trigger" },
      within: "field",
    },
    {
      id: "DTP-ANAT-05",
      evidence: ["packages/core/src/test/date-picker-contract.ts"],
      name: "formControl",
      description: "The native date input carrying ISO form value and constraint validity.",
      match: { by: "part", scope: "date-picker", part: "form-control" },
      within: "field",
    },
    {
      id: "DTP-ANAT-06",
      evidence: ["packages/core/src/test/date-picker-contract.ts"],
      name: "popup",
      description: "The named non-modal native Popover containing the calendar.",
      match: { by: "part", scope: "date-picker", part: "popup" },
      within: "root",
    },
    {
      id: "DTP-ANAT-07",
      evidence: ["packages/core/src/test/date-picker-contract.ts"],
      name: "grid",
      description: "The calendar grid receiving the complete gridProps bundle.",
      match: { by: "part", scope: "date-picker", part: "grid" },
      within: "popup",
      contractPart: "calendar",
    },
    {
      id: "DTP-ANAT-08",
      evidence: ["packages/core/src/test/date-picker-contract.ts"],
      name: "day",
      description: "A repeated native date action receiving cellButtonProps.",
      match: { by: "part", scope: "date-picker", part: "day" },
      within: "grid",
      multiple: true,
      contractPart: "day",
    },
  ],
  style: [
    {
      id: "DTP-STYLE-01",
      classification: "intentional-extension",
      source: "Nagi functional-state and forced-colors policy",
      text: "The focused calendar date retains a visible focus indicator in forced-colors mode.",
      evidence: ["packages/core/src/test/date-picker-contract.ts"],
      origin: {
        kind: "nagi",
        policy: "date-picker-functional-state-visibility",
        policyVersion: "1",
      },
    },
  ],
});

/** Observable guarantees owned with the composed native-Popover DatePicker. */
export const datePickerDefinition = defineComponentDefinition({
  name: "DatePicker",
  version: "3.0",
  status: "draft",
  contract: datePickerComponentContract,
  implementation: nativePopoverDatePickerImplementation,
});
