import {
  adoptRequirementSet,
  defineComponentDefinition,
  nagiListboxRequirementsV1,
} from "@nagi-labs/nagi-ui";

const standaloneListbox = adoptRequirementSet(nagiListboxRequirementsV1, {
  prefix: "LST",
  profile: {
    context: "standalone",
    selection: "single-or-multiple",
  },
  evidence: {
    "SEM-01": ["tests/listbox.test.ts", "tests/browser/listbox.spec.ts"],
    "SEM-02": ["tests/listbox.test.ts", "tests/browser/listbox.spec.ts"],
    "STATE-01": ["tests/listbox.test.ts", "tests/browser/listbox.spec.ts"],
  },
});

/** Observable guarantees owned with the editable Listbox Blueprint. */
export const listboxDefinition = defineComponentDefinition({
  name: "Listbox",
  version: "1.0",
  status: "verified",
  adopts: [standaloneListbox],

  state: [
    {
      id: "LST-STATE-02",
      classification: "intentional-extension",
      source: "Nagi controlled-selection and dynamic-collection policy",
      text: "The selected-key model is authoritative. Filtering or removing a rendered option does not silently prune its selected key.",
      evidence: ["tests/listbox.test.ts"],
      origin: {
        kind: "nagi",
        policy: "controlled-selection-and-dynamic-collection",
        policyVersion: "1",
      },
    },
  ],

  interaction: [
    {
      id: "LST-INT-01",
      classification: "intentional-extension",
      source: "Nagi selection-follows-focus policy within the WAI-ARIA APG Listbox Pattern",
      text: "In single-select mode, Arrow, Home, End, and type-ahead navigation select the active enabled option; the configured loop policy only changes behavior at collection boundaries.",
      evidence: ["tests/listbox.test.ts", "tests/browser/listbox.spec.ts"],
      origin: { kind: "nagi", policy: "selection-follows-focus", policyVersion: "1" },
    },
    {
      id: "LST-INT-02",
      classification: "conformant",
      source: "WAI-ARIA APG Listbox Pattern",
      text: "In multiple-select mode, arrow navigation moves active option without selecting it; Space toggles that option, Shift+Arrow extends selection, and Ctrl/Cmd+A toggles all enabled options.",
      evidence: ["tests/listbox.test.ts", "tests/browser/listbox.spec.ts"],
      origin: { kind: "nagi", policy: "modifier-free-multiple-selection", policyVersion: "1" },
    },
    {
      id: "LST-INT-03",
      classification: "conformant",
      source: "WAI-ARIA APG Listbox Pattern",
      text: "Vertical listboxes use Up and Down arrows. Horizontal listboxes use logical previous and next arrows, reversing Left and Right in RTL.",
      evidence: ["tests/listbox.test.ts"],
      origin: { kind: "nagi", policy: "logical-orientation-navigation", policyVersion: "1" },
    },
  ],

  focus: [
    {
      id: "LST-FOCUS-01",
      classification: "conformant",
      source: "WAI-ARIA 1.2 aria-activedescendant and WAI-ARIA APG Listbox Pattern",
      text: "DOM focus remains on the listbox. When an option is active, `aria-activedescendant` resolves to that current option; when no option is active, the attribute is absent.",
      evidence: ["tests/listbox.test.ts", "tests/browser/listbox.spec.ts"],
      origin: { kind: "nagi", policy: "listbox-active-descendant-focus", policyVersion: "1" },
    },
  ],

  anatomy: [
    {
      id: "LST-ANAT-01",
      evidence: ["tests/browser/listbox.spec.ts"],
      name: "listbox",
      description: "The focusable listbox receiving the complete listboxProps binding.",
      match: { by: "role", role: "listbox" },
    },
    {
      name: "option",
      description: "A repeated selectable option receiving the complete optionProps binding.",
      match: { by: "role", role: "option" },
      within: "listbox",
      multiple: true,
    },
  ],
});
