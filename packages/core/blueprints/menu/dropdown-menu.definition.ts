import {
  adoptRequirementSet,
  defineComponentDefinition,
  nagiMenuRequirementsV1,
  nagiPopupRequirementsV1,
} from "@nagi-labs/nagi-ui";

const menuFoundation = adoptRequirementSet(nagiMenuRequirementsV1, {
  prefix: "MNU-MENU",
  profile: { context: "dropdown", submenu: "nested" },
  evidence: {
    "SEM-01": ["tests/browser/dropdown.spec.ts"],
    "SEM-02": ["tests/browser/dropdown.spec.ts"],
    "STATE-01": ["tests/browser/dropdown.spec.ts"],
  },
});

const nativePopup = adoptRequirementSet(nagiPopupRequirementsV1, {
  prefix: "MNU-POP",
  profile: { invocation: "native-target", focus: "menu-managed", dismissal: "auto" },
  evidence: {
    "SEM-01": ["tests/browser/dropdown.spec.ts"],
    "STATE-01": ["tests/browser/dropdown.spec.ts"],
    "INT-01": ["tests/browser/dropdown.spec.ts"],
  },
});

/** Observable guarantees owned with the editable DropdownMenu Blueprint tree. */
export const dropdownMenuDefinition = defineComponentDefinition({
  name: "DropdownMenu",
  version: "2.0",
  status: "verified",
  references: [
    {
      id: "apg-menu-button",
      title: "WAI-ARIA APG Menu Button Pattern",
      url: "https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/",
      kind: "pattern",
      revision: "Rolling guidance snapshot",
      reviewedAt: "2026-09-01",
    },
    {
      id: "apg-menu",
      title: "WAI-ARIA APG Menu and Menubar Pattern",
      url: "https://www.w3.org/WAI/ARIA/apg/patterns/menubar/",
      kind: "pattern",
      revision: "Rolling guidance snapshot",
      reviewedAt: "2026-09-01",
    },
  ],
  adopts: [menuFoundation, nativePopup],
  semantics: [
    {
      id: "MNU-SEM-03",
      classification: "conformant",
      source: "WAI-ARIA APG Menu and Menubar Pattern",
      text: "Each submenu trigger controls exactly one labelled child menu and keeps `aria-expanded` synchronized with that child.",
      evidence: ["tests/browser/dropdown.spec.ts", "tests/browser/shadow-root.spec.ts"],
      origin: { kind: "reference", referenceIds: ["apg-menu"] },
    },
    {
      id: "MNU-SEM-04",
      classification: "implementation-constraint",
      source: "Nagi native-element policy",
      text: "The DropdownMenu invoker is a native `button`, preserving trusted activation and the browser's button semantics for the owned menu relationship.",
      evidence: ["tests/browser/dropdown.spec.ts"],
      origin: { kind: "nagi", policy: "native-menu-invoker", policyVersion: "1" },
    },
  ],
  state: [
    {
      id: "MNU-STATE-01",
      classification: "conformant",
      source: "Nagi dynamic-collection policy",
      text: "Removing or disabling the active item cannot leave an open menu without a locally resolvable focus owner.",
      evidence: ["tests/browser/dropdown.spec.ts"],
      origin: { kind: "nagi", policy: "dynamic-collection-focus-repair", policyVersion: "1" },
    },
    {
      id: "MNU-STATE-02",
      classification: "intentional-extension",
      source: "Nagi controlled-state acceptance policy",
      text: "If a controlled owner rejects a submenu close, the visible child remains open and retains a valid focus owner.",
      evidence: ["tests/browser/dropdown.spec.ts"],
      origin: { kind: "nagi", policy: "controlled-submenu-close-repair", policyVersion: "1" },
    },
  ],
  interaction: [
    {
      id: "MNU-INT-01",
      classification: "conformant",
      source: "WAI-ARIA APG Menu Button Pattern",
      text: "Pointer, Enter, Space, and optional ArrowUp or ArrowDown opening paths enter the root menu at the declared boundary.",
      evidence: ["tests/browser/dropdown.spec.ts"],
      origin: { kind: "reference", referenceIds: ["apg-menu-button"] },
    },
    {
      id: "MNU-INT-02",
      classification: "conformant",
      source: "WAI-ARIA APG Menu and Menubar Pattern",
      text: "ArrowUp, ArrowDown, Home, End, and typeahead move through the current menu without activating disabled items.",
      evidence: ["tests/browser/dropdown.spec.ts"],
      origin: { kind: "reference", referenceIds: ["apg-menu"] },
    },
    {
      id: "MNU-INT-03",
      classification: "conformant",
      source: "WAI-ARIA APG Menu and Menubar Pattern",
      text: "The logical inline-end arrow opens a child menu; the opposite arrow and Escape close only that child, with arrows reversed in RTL.",
      evidence: ["tests/browser/dropdown.spec.ts", "tests/browser/shadow-root.spec.ts"],
      origin: { kind: "reference", referenceIds: ["apg-menu"] },
    },
    {
      id: "MNU-INT-04",
      classification: "intentional-extension",
      source: "Nagi menu activation policy",
      text: "An action closes the complete tree, while checkbox and radio actions default to keeping it open.",
      evidence: ["tests/browser/dropdown.spec.ts"],
      origin: { kind: "nagi", policy: "menu-activation-close-policy", policyVersion: "1" },
    },
  ],
  focus: [
    {
      id: "MNU-FOCUS-01",
      classification: "conformant",
      source: "WAI-ARIA APG Menu and Menubar Pattern",
      text: "DOM focus is placed on actual enabled menu items, with the menu container used only when no enabled item exists.",
      evidence: ["tests/browser/dropdown.spec.ts"],
      origin: { kind: "reference", referenceIds: ["apg-menu"] },
    },
    {
      id: "MNU-FOCUS-02",
      classification: "conformant",
      source: "WAI-ARIA APG Menu and Menubar Pattern",
      text: "Closing a child restores its parent item; closing the tree after action or Escape restores the root invoker.",
      evidence: ["tests/browser/dropdown.spec.ts", "tests/browser/shadow-root.spec.ts"],
      origin: { kind: "reference", referenceIds: ["apg-menu"] },
    },
  ],
  anatomy: [
    {
      id: "MNU-ANAT-01",
      evidence: ["tests/browser/dropdown.spec.ts"],
      name: "root",
      description:
        "The owned DropdownMenu scope containing the root invoker and all nested popup menus.",
      match: { by: "part", scope: "dropdown-menu", part: "root" },
    },
    {
      id: "MNU-ANAT-02",
      evidence: ["tests/browser/dropdown.spec.ts"],
      name: "trigger",
      description: "The native root invoker receiving the complete triggerProps bundle.",
      match: { by: "part", scope: "dropdown-menu", part: "trigger" },
      within: "root",
    },
    {
      id: "MNU-ANAT-03",
      evidence: ["tests/browser/dropdown.spec.ts"],
      name: "menu",
      description: "The root native Popover receiving the complete menuProps bundle.",
      match: { by: "part", scope: "dropdown-menu", part: "menu" },
      within: "root",
    },
    {
      id: "MNU-ANAT-04",
      evidence: ["tests/browser/dropdown.spec.ts"],
      name: "submenuTrigger",
      description: "A repeated parent menuitem that owns one child menu relationship.",
      match: { by: "part", scope: "dropdown-menu", part: "submenu-trigger" },
      within: "menu",
      multiple: true,
      required: false,
    },
    {
      id: "MNU-ANAT-05",
      evidence: ["tests/browser/dropdown.spec.ts"],
      name: "submenu",
      description: "A repeated child Popover receiving its own complete menuProps bundle.",
      match: { by: "part", scope: "dropdown-menu", part: "submenu" },
      within: "menu",
      multiple: true,
      required: false,
    },
    {
      id: "MNU-ANAT-06",
      evidence: ["tests/browser/dropdown.spec.ts"],
      name: "item",
      description: "A repeated actionable choice using one of the standard menu item roles.",
      match: { by: "role", role: "menuitem" },
      within: "menu",
      multiple: true,
    },
  ],
  style: [
    {
      id: "MNU-STYLE-01",
      classification: "intentional-extension",
      source: "Nagi functional-state and forced-colors policy",
      text: "Focused, expanded, checked, and disabled menu states remain visibly distinguishable, including forced colors.",
      evidence: ["tests/browser/dropdown.spec.ts"],
      origin: { kind: "nagi", policy: "menu-functional-state-visibility", policyVersion: "1" },
    },
  ],
});
