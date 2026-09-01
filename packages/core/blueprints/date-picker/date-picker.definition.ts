import {
  adoptRequirementSet,
  defineComponentDefinition,
  nagiCalendarRequirementsV1,
  nagiPopupRequirementsV1,
} from "@nagi-labs/nagi-ui";

const calendar = adoptRequirementSet(nagiCalendarRequirementsV1, {
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

/** Observable guarantees owned with the composed native-Popover DatePicker. */
export const datePickerDefinition = defineComponentDefinition({
  name: "DatePicker",
  version: "2.0",
  status: "verified",
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
    {
      id: "html-date-state",
      title: "HTML Living Standard — Date state (input type=date)",
      url: "https://html.spec.whatwg.org/multipage/input.html#date-state-(type=date)",
      kind: "living-standard",
      revision: "Living Standard snapshot",
      reviewedAt: "2026-09-01",
    },
  ],
  adopts: [calendar, popup],
  semantics: [
    {
      id: "DTP-SEM-01",
      classification: "conformant",
      source: "WAI-ARIA APG Spinbutton Pattern and HTML date state",
      text: "A labelled segmented field exposes editable date segments as spinbuttons and submits one native ISO date form value.",
      evidence: ["packages/core/src/test/date-picker-contract.ts"],
      origin: { kind: "reference", referenceIds: ["apg-spinbutton", "html-date-state"] },
    },
    {
      id: "DTP-SEM-02",
      classification: "intentional-extension",
      source: "HTML Popover API and WAI-ARIA APG Date Picker Dialog Example",
      text: 'A native button controls a named non-modal native Popover whose surface exposes `role="dialog"`; it does not claim modal dialog semantics.',
      evidence: ["packages/core/src/test/date-picker-contract.ts"],
      origin: { kind: "nagi", policy: "non-modal-date-picker-surface", policyVersion: "1" },
    },
  ],
  state: [
    {
      id: "DTP-STATE-01",
      classification: "intentional-extension",
      source: "Nagi controlled-model acceptance policy",
      text: "Controlled date and open models remain authoritative; accepted calendar selection updates the ISO value and closes the popup.",
      evidence: [
        "packages/core/src/test/date-picker-contract.ts",
        "tests/date-picker-candidate.test.ts",
      ],
      origin: { kind: "nagi", policy: "controlled-date-selection-acceptance", policyVersion: "1" },
    },
    {
      id: "DTP-STATE-02",
      classification: "conformant",
      source: "HTML date constraints and Nagi unavailable-date policy",
      text: "Minimum, maximum, unavailable, required, and explicit invalid inputs remain consistent across field, calendar, and native form validity.",
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
      source: "Nagi native Popover and DatePicker composition policy",
      text: "The field trigger opens the composed calendar Popover and transfers focus to the calendar's single roving focus owner.",
      evidence: ["packages/core/src/test/date-picker-contract.ts"],
      origin: { kind: "nagi", policy: "date-picker-calendar-composition", policyVersion: "1" },
    },
    {
      id: "DTP-INT-03",
      classification: "intentional-extension",
      source: "WAI-ARIA APG Date Picker Dialog Example and Nagi native Popover policy",
      text: "Activating an available day selects it and closes the popup; Escape closes without changing the accepted date.",
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
      text: "Selection or Escape restores the invoking button, while light dismissal to another control does not steal focus back.",
      evidence: [
        "packages/core/src/test/date-picker-contract.ts",
        "tests/browser/shadow-root.spec.ts",
      ],
      origin: { kind: "nagi", policy: "local-trigger-focus-restoration", policyVersion: "1" },
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
    },
    {
      id: "DTP-ANAT-08",
      evidence: ["packages/core/src/test/date-picker-contract.ts"],
      name: "day",
      description: "A repeated native date action receiving cellButtonProps.",
      match: { by: "part", scope: "date-picker", part: "day" },
      within: "grid",
      multiple: true,
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
