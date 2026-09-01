import { defineRequirementSet } from "../definition.ts"

/**
 * Nagi-owned snapshot of the ARIA menu requirements shared by menu-family
 * components. Keyboard policy, submenu timing, and focus ownership remain
 * component-local because DropdownMenu and Menubar do not make the same
 * choices in those areas.
 */
export const nagiMenuRequirementsV1 = defineRequirementSet({
  id: "nagi/menu",
  title: "Nagi Menu requirements",
  version: "1",
  profile: {
    context: ["dropdown", "menubar"],
    submenu: ["flat", "nested"],
  },
  references: [
    {
      id: "wai-aria-1.2-menu",
      title: "WAI-ARIA 1.2 — menu and menuitem roles",
      url: "https://www.w3.org/TR/wai-aria-1.2/#menu",
      kind: "standard",
      revision: "1.2 Recommendation (2023-06-06)",
      reviewedAt: "2026-09-01",
    },
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
  requirements: [
    {
      id: "SEM-01",
      section: "semantics",
      classification: "conformant",
      text: "A named menu-button pattern exposes `role=\"button\"` with `aria-haspopup=\"menu\"`; its `aria-expanded` value reflects whether the controlled menu is open.",
      referenceIds: ["apg-menu-button"],
    },
    {
      id: "SEM-02",
      section: "semantics",
      classification: "conformant",
      text: "The popup surface has `role=\"menu\"` and an accessible name, and its actionable descendants use `menuitem`, `menuitemcheckbox`, or `menuitemradio` roles.",
      referenceIds: ["wai-aria-1.2-menu", "apg-menu"],
    },
    {
      id: "STATE-01",
      section: "state",
      classification: "conformant",
      text: "Disabled menu choices expose `aria-disabled=\"true\"`; checkbox and radio choices expose their current state through `aria-checked`.",
      referenceIds: ["wai-aria-1.2-menu", "apg-menu"],
    },
  ],
} as const)
