import {
  adoptRequirementSet,
  defineComponentDefinition,
  nagiListboxRequirementsV1,
  nagiPopupRequirementsV1,
} from "@nagi-labs/nagi-ui";

const popupListbox = adoptRequirementSet(nagiListboxRequirementsV1, {
  prefix: "CMB-LBX",
  profile: {
    context: "combobox-popup",
    selection: "single",
  },
  evidence: {
    "SEM-01": ["packages/core/src/test/combobox-contract.ts", "tests/combobox.test.ts"],
    "SEM-02": ["packages/core/src/test/combobox-contract.ts", "tests/combobox.test.ts"],
    "STATE-01": ["packages/core/src/test/combobox-contract.ts", "tests/combobox.test.ts"],
  },
});

const nativePopup = adoptRequirementSet(nagiPopupRequirementsV1, {
  prefix: "CMB-POP",
  profile: {
    invocation: "behavior-imperative",
    focus: "input-retained",
    dismissal: "auto",
  },
  evidence: {
    "SEM-01": ["packages/core/src/test/combobox-contract.ts", "tests/browser/combobox.spec.ts"],
    "STATE-01": ["tests/browser/combobox.spec.ts"],
    "INT-01": ["tests/browser/combobox.spec.ts"],
  },
});

/** Observable guarantees owned with the editable Combobox Blueprint. */
export const comboboxDefinition = defineComponentDefinition({
  name: "Combobox",
  version: "2.0",
  status: "verified",
  references: [
    {
      id: "apg-combobox",
      title: "WAI-ARIA APG Combobox Pattern",
      url: "https://www.w3.org/WAI/ARIA/apg/patterns/combobox/",
      kind: "pattern",
      revision: "Rolling guidance snapshot",
      reviewedAt: "2026-09-01",
    },
    {
      id: "wai-aria-1.2-active-descendant",
      title: "WAI-ARIA 1.2 — aria-activedescendant",
      url: "https://www.w3.org/TR/wai-aria-1.2/#aria-activedescendant",
      kind: "standard",
      revision: "1.2 Recommendation (2023-06-06)",
      reviewedAt: "2026-09-01",
    },
  ],
  adopts: [popupListbox, nativePopup],
  semantics: [
    {
      id: "CMB-SEM-01",
      classification: "conformant",
      source: "WAI-ARIA APG Combobox Pattern",
      text: 'A labelled native text input exposes `role="combobox"` and `aria-autocomplete="list"`.',
      evidence: ["packages/core/src/test/combobox-contract.ts", "tests/combobox.test.ts"],
      origin: { kind: "reference", referenceIds: ["apg-combobox"] },
    },
    {
      id: "CMB-SEM-02",
      classification: "conformant",
      source: "WAI-ARIA APG Combobox Pattern and HTML Popover API",
      text: "`aria-expanded` follows the native Popover state and `aria-controls` resolves to the component's listbox.",
      evidence: [
        "packages/core/src/test/combobox-contract.ts",
        "tests/combobox.test.ts",
        "tests/browser/shadow-root.spec.ts",
      ],
      origin: {
        kind: "reference",
        referenceIds: ["apg-combobox"],
      },
    },
    {
      id: "CMB-SEM-03",
      classification: "conformant",
      source: "WAI-ARIA APG Combobox Pattern",
      text: "Disabled suggestions expose `aria-disabled` and cannot become the active or committed suggestion.",
      evidence: ["packages/core/src/test/combobox-contract.ts", "tests/combobox.test.ts"],
      origin: { kind: "reference", referenceIds: ["apg-combobox"] },
    },
    {
      id: "CMB-SEM-04",
      classification: "conformant",
      source: "WAI-ARIA APG Managing Focus in Composites Using aria-activedescendant",
      text: "While a suggestion is active, `aria-activedescendant` resolves to that option inside the controlled listbox; otherwise it is absent.",
      evidence: [
        "packages/core/src/test/combobox-contract.ts",
        "tests/combobox.test.ts",
        "tests/browser/shadow-root.spec.ts",
        "tests/browser/definition-mutations.spec.ts",
      ],
      origin: {
        kind: "reference",
        referenceIds: ["apg-combobox", "wai-aria-1.2-active-descendant"],
      },
    },
  ],
  state: [
    {
      id: "CMB-STATE-01",
      classification: "intentional-extension",
      source: "Nagi provisional-selection policy",
      text: "Editable text, provisional active suggestion, and committed selection are distinct states; filtering and navigation do not commit.",
      evidence: ["packages/core/src/test/combobox-contract.ts", "tests/combobox.test.ts"],
      origin: { kind: "nagi", policy: "provisional-selection", policyVersion: "1" },
    },
    {
      id: "CMB-STATE-02",
      classification: "conformant",
      source: "WAI-ARIA valid IDREF requirement and Nagi dynamic-collection policy",
      text: "Removing the active option clears its active reference, while filtering does not prune the committed selection.",
      evidence: [
        "packages/core/src/test/combobox-contract.ts",
        "tests/combobox.test.ts",
        "tests/browser/definition-mutations.spec.ts",
      ],
      origin: { kind: "nagi", policy: "dynamic-collection-repair", policyVersion: "1" },
    },
    {
      id: "CMB-STATE-03",
      classification: "conformant",
      source: "HTML disabled/read-only semantics and Nagi read-only inspection policy",
      text: "Native disabled blocks interaction; read-only options remain inspectable but editing, clearing, and committing are blocked.",
      evidence: ["tests/combobox.test.ts"],
      origin: { kind: "nagi", policy: "read-only-inspection", policyVersion: "1" },
    },
  ],
  interaction: [
    {
      id: "CMB-INT-01",
      classification: "conformant",
      source: "WAI-ARIA APG Combobox Pattern",
      text: "Typing filters and opens suggestions without intercepting standard single-line text editing or IME input.",
      evidence: ["packages/core/src/test/combobox-contract.ts", "tests/combobox.test.ts"],
      origin: { kind: "nagi", policy: "browser-owned-text-editing", policyVersion: "1" },
    },
    {
      id: "CMB-INT-02",
      classification: "conformant",
      source: "WAI-ARIA APG Combobox Pattern",
      text: "Arrow keys move provisional activity through enabled options with declared boundary and optional loop behavior.",
      evidence: ["packages/core/src/test/combobox-contract.ts", "tests/combobox.test.ts"],
      origin: { kind: "nagi", policy: "provisional-arrow-navigation", policyVersion: "1" },
    },
    {
      id: "CMB-INT-03",
      classification: "conformant",
      source: "WAI-ARIA APG Combobox Pattern",
      text: "Enter and pointer activation commit a suggestion; Escape dismisses without committing provisional navigation.",
      evidence: ["packages/core/src/test/combobox-contract.ts", "tests/combobox.test.ts"],
      origin: { kind: "nagi", policy: "manual-selection-commit", policyVersion: "1" },
    },
    {
      id: "CMB-INT-04",
      classification: "intentional-extension",
      source: "Nagi native-layer policy",
      text: "Suggestions use native Popover and browser-owned light dismissal without Teleport or a document-global rediscovery step.",
      evidence: ["packages/core/src/test/combobox-contract.ts"],
      origin: { kind: "nagi", policy: "native-popover-layer", policyVersion: "1" },
    },
  ],
  focus: [
    {
      id: "CMB-FOCUS-01",
      classification: "conformant",
      source: "WAI-ARIA APG Combobox Pattern",
      text: "DOM focus remains on the input while `aria-activedescendant` identifies the active option; pointer selection does not first move focus into the popup.",
      evidence: [
        "packages/core/src/test/combobox-contract.ts",
        "tests/combobox.test.ts",
        "tests/browser/definition-mutations.spec.ts",
      ],
      origin: { kind: "nagi", policy: "input-owned-active-descendant-focus", policyVersion: "1" },
    },
  ],
  anatomy: [
    {
      id: "CMB-ANAT-01",
      evidence: ["packages/core/src/test/combobox-contract.ts", "tests/definition.test.ts"],
      name: "root",
      description:
        "The owned Combobox scope. It bounds relationship lookup without prescribing a CSS class.",
      match: { by: "part", scope: "combobox", part: "root" },
    },
    {
      name: "input",
      description: "The native editable input receiving the complete inputProps bundle.",
      match: { by: "part", scope: "combobox", part: "input" },
      within: "root",
    },
    {
      name: "popup",
      description: "The native Popover that owns suggestion visibility.",
      match: { by: "part", scope: "combobox", part: "popup" },
      within: "root",
    },
    {
      name: "listbox",
      description: "The controlled listbox receiving the complete listboxProps bundle.",
      match: { by: "part", scope: "combobox", part: "listbox" },
      within: "popup",
    },
    {
      name: "option",
      description: "A repeated suggestion whose stable ID can be referenced by the focused input.",
      match: { by: "part", scope: "combobox", part: "option" },
      within: "listbox",
      multiple: true,
    },
  ],
  style: [
    {
      id: "CMB-STYLE-01",
      classification: "intentional-extension",
      source: "Nagi functional-state and forced-colors policy",
      text: "Open popup, active option, disabled option, and forced-colors input focus remain visibly distinguishable.",
      evidence: ["packages/core/src/test/combobox-contract.ts"],
      origin: { kind: "nagi", policy: "functional-state-visibility", policyVersion: "1" },
    },
  ],
});
