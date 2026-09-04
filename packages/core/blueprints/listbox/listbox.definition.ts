import {
  adoptRequirementSet,
  defineComponentContract,
  defineComponentDefinition,
  defineComponentImplementation,
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

export const listboxContract = defineComponentContract({
  id: "nagi/listbox",
  revision: "1",
  description:
    "Listbox naming, selection, collection navigation, orientation, and active-descendant focus guarantees independent of concrete markup and styling.",
  api: [
    { name: "items", kind: "prop", description: "Provides the keyed option collection." },
    { name: "selected", kind: "model", description: "Controls the selected option keys." },
    { name: "label", kind: "prop", description: "Names the choice collection." },
    { name: "mode", kind: "prop", description: "Selects single or multiple selection." },
    { name: "orientation", kind: "prop", description: "Selects the navigation axis." },
    { name: "dir", kind: "prop", description: "Selects logical inline direction." },
    { name: "loop", kind: "prop", description: "Controls navigation at collection boundaries." },
  ],
  parts: [
    { name: "listbox", description: "The named focus owner for the choice collection." },
    { name: "option", description: "One selectable choice.", multiple: true },
  ],
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
});

export const activeDescendantListboxImplementation = defineComponentImplementation({
  id: "nagi/blueprint/listbox-active-descendant",
  title: "Active-descendant Listbox Blueprint",
  version: "1",
  strategy: "aria-composite",
  description:
    "The standard Blueprint renders one focusable listbox and keyed option elements while DOM focus remains on the collection.",
  decisions: [
    {
      name: "focus",
      value: "aria-activedescendant",
      description: "Keep DOM focus on the listbox and identify its active option by ID.",
      evidence: ["tests/listbox.test.ts", "tests/browser/listbox.spec.ts"],
    },
    {
      name: "collection",
      value: "keyed-vue-list",
      description: "Register the rendered keyed options without document-global discovery.",
      evidence: ["tests/listbox.test.ts"],
    },
    {
      name: "presence",
      value: "persistent",
      description: "The listbox has no open or exit lifecycle.",
      evidence: ["tests/listbox.test.ts"],
    },
  ],
  anatomy: [
    {
      id: "LST-ANAT-01",
      evidence: ["tests/browser/listbox.spec.ts"],
      name: "listbox",
      description: "The focusable listbox receiving the complete listboxProps binding.",
      match: { by: "role", role: "listbox" },
      contractPart: "listbox",
    },
    {
      name: "option",
      description: "A repeated selectable option receiving the complete optionProps binding.",
      match: { by: "role", role: "option" },
      within: "listbox",
      multiple: true,
      contractPart: "option",
    },
  ],
});

export const listboxDefinition = defineComponentDefinition({
  name: "Listbox",
  version: "2.0",
  status: "verified",
  contract: listboxContract,
  implementation: activeDescendantListboxImplementation,
});
