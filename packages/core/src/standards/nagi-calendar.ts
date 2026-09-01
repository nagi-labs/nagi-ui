import { defineRequirementSet } from "../definition.ts";

/**
 * Nagi's reviewed snapshot of the calendar grid contract used by Calendar and
 * DatePicker.  Date arithmetic, locale formatting, and range-selection policy
 * remain component-owned; this set only covers the observable grid boundary.
 */
export const nagiCalendarRequirementsV1 = defineRequirementSet({
  id: "nagi/calendar",
  title: "Nagi Calendar grid requirements",
  version: "1",
  profile: {
    context: ["standalone", "date-picker"],
    selection: ["single", "range"],
  },
  references: [
    {
      id: "wai-aria-grid-1.2",
      title: "WAI-ARIA 1.2 — grid, gridcell, and aria-selected",
      url: "https://www.w3.org/TR/wai-aria-1.2/#grid",
      kind: "standard",
      revision: "1.2 Recommendation (2023-06-06)",
      reviewedAt: "2026-09-01",
    },
    {
      id: "apg-grid",
      title: "WAI-ARIA APG Grid Pattern",
      url: "https://www.w3.org/WAI/ARIA/apg/patterns/grid/",
      kind: "pattern",
      revision: "Rolling guidance snapshot",
      reviewedAt: "2026-09-01",
    },
    {
      id: "apg-datepicker",
      title: "WAI-ARIA APG Date Picker Dialog Example",
      url: "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/",
      kind: "example",
      revision: "Rolling guidance snapshot",
      reviewedAt: "2026-09-01",
    },
  ],
  requirements: [
    {
      id: "SEM-01",
      section: "semantics",
      classification: "conformant",
      text: "The calendar exposes an accessibly named `grid` containing `gridcell` elements with explicit `aria-selected` values.",
      referenceIds: ["wai-aria-grid-1.2", "apg-grid", "apg-datepicker"],
    },
    {
      id: "SEM-02",
      section: "semantics",
      classification: "conformant",
      text: "Each selectable calendar date is represented by a native `button` with an accessible date name.",
      referenceIds: ["apg-grid", "apg-datepicker"],
    },
    {
      id: "INT-01",
      section: "interaction",
      classification: "conformant",
      text: "The grid supports roving focus for date navigation with arrow keys, Home/End, and page navigation at its declared boundaries.",
      referenceIds: ["apg-grid", "apg-datepicker"],
    },
    {
      id: "FOCUS-01",
      section: "focus",
      classification: "conformant",
      text: "The calendar has at most one enabled date button with `tabindex=0`; other date buttons are removed from the sequential tab order.",
      referenceIds: ["apg-grid", "apg-datepicker"],
    },
  ],
} as const);
