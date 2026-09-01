import { defineRequirementSet } from "../definition.ts";

/**
 * Nagi-owned snapshot of the ARIA listbox requirements shared by standalone
 * Listbox and a Combobox popup. Interaction and focus-owner policy deliberately
 * stay outside this set: a standalone Listbox and an editable Combobox use
 * different keyboard and DOM-focus models.
 */
export const nagiListboxRequirementsV1 = defineRequirementSet({
  id: "nagi/listbox",
  title: "Nagi Listbox requirements",
  version: "1",
  profile: {
    context: ["standalone", "combobox-popup"],
    selection: ["single", "single-or-multiple"],
  },
  references: [
    {
      id: "wai-aria-1.2",
      title: "WAI-ARIA 1.2 — listbox, option, and aria-selected",
      url: "https://www.w3.org/TR/wai-aria-1.2/#listbox",
      kind: "standard",
      revision: "1.2 Recommendation (2023-06-06)",
      reviewedAt: "2026-09-01",
    },
    {
      id: "apg-listbox",
      title: "WAI-ARIA APG Listbox Pattern",
      url: "https://www.w3.org/WAI/ARIA/apg/patterns/listbox/",
      kind: "pattern",
      revision: "Rolling guidance snapshot",
      reviewedAt: "2026-09-01",
    },
  ],
  requirements: [
    {
      id: "SEM-01",
      section: "semantics",
      classification: "conformant",
      text: "The choices are exposed by an accessibly named `listbox` containing `option` elements.",
      referenceIds: ["wai-aria-1.2", "apg-listbox"],
    },
    {
      id: "SEM-02",
      section: "semantics",
      classification: "conformant",
      text: "Each selectable option exposes the listbox's current accessibility selection state with an explicit `aria-selected` value of `true` or `false`.",
      referenceIds: ["wai-aria-1.2", "apg-listbox"],
    },
    {
      id: "STATE-01",
      section: "state",
      classification: "conformant",
      text: "The listbox exposes `aria-multiselectable=\"true\"` exactly when configured for multiple selection; single selection leaves the default false state implied.",
      referenceIds: ["wai-aria-1.2", "apg-listbox"],
    },
  ],
} as const);
