import { defineRequirementSet } from "../definition.ts";

/**
 * Nagi-owned snapshot of the platform requirements adopted by Button.
 *
 * This is not downloaded from upstream at runtime. Updating an upstream source
 * requires an explicit review and a new local Requirement-set version.
 */
export const nagiButtonRequirementsV1 = defineRequirementSet({
  id: "nagi/button",
  title: "Nagi Button requirements",
  version: "1",
  profile: {
    element: ["button"],
    naming: ["native-accessible-name"],
    disabled: ["native"],
    activation: ["browser"],
  },
  references: [
    {
      id: "html-button-ls",
      title: "HTML Living Standard — The button element",
      url: "https://html.spec.whatwg.org/multipage/form-elements.html#the-button-element",
      kind: "living-standard",
      revision: "Living Standard snapshot",
      reviewedAt: "2026-08-31",
    },
    {
      id: "accname-1.1",
      title: "Accessible Name and Description Computation 1.1",
      url: "https://www.w3.org/TR/2018/REC-accname-1.1-20181218/",
      kind: "standard",
      revision: "1.1 Recommendation (2018-12-18)",
      reviewedAt: "2026-08-31",
    },
    {
      id: "apg-button",
      title: "WAI-ARIA APG Button Pattern",
      url: "https://www.w3.org/WAI/ARIA/apg/patterns/button/",
      kind: "pattern",
      revision: "Rolling guidance snapshot",
      reviewedAt: "2026-08-31",
    },
  ],
  requirements: [
    {
      id: "SEM-01",
      section: "semantics",
      classification: "conformant",
      text: "The root is a native `button` with an implicit button role. Its accessible name comes from its content or consumer-provided naming attributes.",
      referenceIds: ["html-button-ls", "accname-1.1"],
    },
    {
      id: "STATE-01",
      section: "state",
      classification: "conformant",
      text: "Ordinary disabled state uses the native `disabled` attribute and leaves disabled focus and activation behavior to the browser.",
      referenceIds: ["html-button-ls"],
    },
    {
      id: "INT-01",
      section: "interaction",
      classification: "conformant",
      text: "Enabled click, Enter, and Space activation remain browser-owned; the Behavior API does not reimplement them.",
      referenceIds: ["html-button-ls", "apg-button"],
    },
  ],
} as const);

/**
 * Renderer-independent Button contract. Revision 1 remains available as the
 * historical native-element requirement choices; revision 2 describes observable Button
 * guarantees so native and delegated implementations can adopt the same set.
 */
export const nagiButtonRequirementsV2 = defineRequirementSet({
  id: "nagi/button",
  title: "Nagi Button requirements",
  version: "2",
  profile: {
    semantics: ["button"],
    naming: ["accessible-name"],
    disabled: ["perceivable-inoperable"],
    activation: ["click-enter-space"],
  },
  references: [
    {
      id: "accname-1.1",
      title: "Accessible Name and Description Computation 1.1",
      url: "https://www.w3.org/TR/2018/REC-accname-1.1-20181218/",
      kind: "standard",
      revision: "1.1 Recommendation (2018-12-18)",
      reviewedAt: "2026-09-02",
    },
    {
      id: "apg-button",
      title: "WAI-ARIA APG Button Pattern",
      url: "https://www.w3.org/WAI/ARIA/apg/patterns/button/",
      kind: "pattern",
      revision: "Rolling guidance snapshot",
      reviewedAt: "2026-09-02",
    },
  ],
  requirements: [
    {
      id: "SEM-01",
      section: "semantics",
      classification: "conformant",
      text: "The root exposes button semantics and an accessible name from its content or consumer-provided naming attributes.",
      referenceIds: ["accname-1.1", "apg-button"],
    },
    {
      id: "STATE-01",
      section: "state",
      classification: "conformant",
      text: "Disabled state remains perceivable and makes the Button unavailable for activation.",
      referenceIds: ["apg-button"],
    },
    {
      id: "INT-01",
      section: "interaction",
      classification: "conformant",
      text: "An enabled Button supports pointer click, Enter, and Space activation.",
      referenceIds: ["apg-button"],
    },
  ],
} as const);
