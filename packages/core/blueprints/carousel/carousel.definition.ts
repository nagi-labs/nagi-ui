import { defineComponentDefinition } from "@nagi-labs/nagi-ui";

/** Observable guarantees owned with the native-scroll Carousel Blueprint. */
export const carouselDefinition = defineComponentDefinition({
  name: "Carousel",
  version: "2.0",
  status: "verified",
  references: [
    {
      id: "apg-carousel",
      title: "WAI-ARIA APG Carousel Pattern",
      url: "https://www.w3.org/WAI/ARIA/apg/patterns/carousel/",
      kind: "pattern",
      revision: "Rolling guidance snapshot",
      reviewedAt: "2026-09-01",
    },
    {
      id: "wai-aria-1.2-role-description",
      title: "WAI-ARIA 1.2 — aria-roledescription",
      url: "https://www.w3.org/TR/wai-aria-1.2/#aria-roledescription",
      kind: "standard",
      revision: "1.2 Recommendation (2023-06-06)",
      reviewedAt: "2026-09-01",
    },
  ],

  semantics: [
    {
      id: "CAR-SEM-01",
      classification: "conformant",
      source: "WAI-ARIA APG Carousel Pattern",
      text: "The root is a named `group` by default and a named `region` only when `landmark` marks it as important to the page information architecture.",
      evidence: [
        "packages/core/src/test/carousel-contract.ts",
        "tests/expanded-wave1.test.ts",
        "tests/browser/expanded-catalog.spec.ts",
      ],
      origin: { kind: "reference", referenceIds: ["apg-carousel"] },
    },
    {
      id: "CAR-SEM-02",
      classification: "conformant",
      source: "WAI-ARIA APG Carousel Pattern and WAI-ARIA 1.2 aria-roledescription",
      text: "The root exposes a non-empty, author-localizable `aria-roledescription`, defaulting to `carousel`; its required `label` names the content rather than repeating the component type.",
      evidence: [
        "packages/core/src/test/carousel-contract.ts",
        "tests/component-catalog.test.ts",
        "tests/expanded-wave1.test.ts",
        "tests/browser/expanded-catalog.spec.ts",
      ],
      origin: {
        kind: "reference",
        referenceIds: ["apg-carousel", "wai-aria-1.2-role-description"],
      },
    },
    {
      id: "CAR-SEM-03",
      classification: "conformant",
      source: "WAI-ARIA APG Carousel Pattern",
      text: "Previous and next controls are native buttons with accessible action labels.",
      evidence: [
        "packages/core/src/test/carousel-contract.ts",
        "tests/component-catalog.test.ts",
        "tests/browser/expanded-catalog.spec.ts",
      ],
      origin: { kind: "reference", referenceIds: ["apg-carousel"] },
    },
    {
      id: "CAR-SEM-04",
      classification: "conformant",
      source: "WAI-ARIA APG Carousel Pattern and WAI-ARIA 1.2 aria-roledescription",
      text: "Every slide is a named `group` with a non-empty, author-localizable `aria-roledescription`, defaulting to `slide`; its visible heading and supplemental position text provide the accessible name.",
      evidence: [
        "packages/core/src/test/carousel-contract.ts",
        "tests/component-catalog.test.ts",
        "tests/expanded-wave1.test.ts",
        "tests/browser/expanded-catalog.spec.ts",
      ],
      origin: {
        kind: "reference",
        referenceIds: ["apg-carousel", "wai-aria-1.2-role-description"],
      },
    },
    {
      id: "CAR-SEM-05",
      classification: "intentional-extension",
      source: "Nagi manual-carousel announcement policy",
      text: "A dedicated polite status output announces the accepted position; the component has no automatic rotation.",
      evidence: [
        "packages/core/src/test/carousel-contract.ts",
        "tests/expanded-wave1.test.ts",
        "tests/browser/expanded-catalog.spec.ts",
      ],
      origin: { kind: "nagi", policy: "manual-carousel-position-announcement", policyVersion: "1" },
    },
    {
      id: "CAR-SEM-06",
      classification: "intentional-extension",
      source: "Nagi focusable-scrollport semantics policy",
      text: "The native-scroll viewport is a named `group` with a non-empty, author-localizable role description, defaulting to `slides`. Its accessible name defaults to the Carousel label and is independently localizable through `slidesLabel`.",
      evidence: [
        "packages/core/src/test/carousel-contract.ts",
        "tests/expanded-wave1.test.ts",
        "tests/component-catalog.test.ts",
        "tests/browser/expanded-catalog.spec.ts",
        "tests/definition.test.ts",
      ],
      origin: { kind: "nagi", policy: "focusable-scrollport-semantics", policyVersion: "1" },
    },
  ],

  state: [
    {
      id: "CAR-STATE-01",
      classification: "intentional-extension",
      source: "Nagi controlled-model policy",
      text: "The consumer owns the external model. `currentIndex` derives a finite bounded view without silently rewriting an externally supplied value.",
      evidence: ["tests/expanded-wave1.test.ts"],
      origin: { kind: "nagi", policy: "controlled-carousel-index", policyVersion: "1" },
    },
    {
      id: "CAR-STATE-02",
      classification: "intentional-extension",
      source: "Nagi navigation boundary policy",
      text: '`loop` wraps navigation requests; without it, navigation stops at the first and last slide. A boundary control remains focusable with `aria-disabled="true"`, so reaching an edge does not discard focus.',
      evidence: ["packages/core/src/test/carousel-contract.ts", "tests/expanded-wave1.test.ts"],
      origin: { kind: "nagi", policy: "focus-preserving-carousel-boundary", policyVersion: "1" },
    },
    {
      id: "CAR-STATE-03",
      classification: "intentional-extension",
      source: "Nagi disabled policy",
      text: "`disabled` blocks user-originated navigation and scrolling while external model updates remain authoritative; container roles do not receive `aria-disabled`.",
      evidence: [
        "packages/core/src/test/carousel-contract.ts",
        "tests/expanded-wave1.test.ts",
        "tests/browser/expanded-catalog.spec.ts",
      ],
      origin: {
        kind: "nagi",
        policy: "externally-authoritative-disabled-carousel",
        policyVersion: "1",
      },
    },
  ],

  interaction: [
    {
      id: "CAR-INT-01",
      classification: "conformant",
      source: "WAI-ARIA APG Carousel Pattern",
      text: "Previous and next controls retain native button Enter, Space, and repeated activation behavior; Carousel does not reimplement button keyboard events.",
      evidence: [
        "packages/core/src/test/carousel-contract.ts",
        "tests/browser/expanded-catalog.spec.ts",
      ],
      origin: { kind: "reference", referenceIds: ["apg-carousel"] },
    },
    {
      id: "CAR-INT-02",
      classification: "intentional-extension",
      source: "Nagi scroll reconciliation policy",
      text: "Native pointer, wheel, and scroll-snap input requests the model index of the nearest settled owned slide without preventing native scrolling; a rejected controlled write restores the accepted slide.",
      evidence: [
        "packages/core/src/test/carousel-contract.ts",
        "tests/expanded-wave1.test.ts",
        "tests/browser/expanded-catalog.spec.ts",
      ],
      origin: { kind: "nagi", policy: "native-scroll-model-reconciliation", policyVersion: "1" },
    },
    {
      id: "CAR-INT-03",
      classification: "intentional-extension",
      source: "Nagi native-scroll keyboard policy",
      text: "The enabled viewport participates in sequential focus navigation and leaves Arrow, Home, and End scrolling to the browser without authored key handlers.",
      evidence: [
        "packages/core/src/test/carousel-contract.ts",
        "tests/browser/expanded-catalog.spec.ts",
      ],
      origin: { kind: "nagi", policy: "browser-owned-scrollport-keyboard", policyVersion: "1" },
    },
  ],

  focus: [
    {
      id: "CAR-FOCUS-01",
      classification: "conformant",
      source: "WAI-ARIA APG Carousel Pattern",
      text: "Activating Previous or Next does not move DOM focus, allowing the same control to be activated repeatedly.",
      evidence: [
        "packages/core/src/test/carousel-contract.ts",
        "tests/browser/expanded-catalog.spec.ts",
      ],
      origin: { kind: "reference", referenceIds: ["apg-carousel"] },
    },
    {
      id: "CAR-FOCUS-02",
      classification: "intentional-extension",
      source: "Nagi scrollport focus reconciliation policy",
      text: "When the native-scroll viewport receives focus, physical scroll is aligned to the accepted model index without moving focus into a slide.",
      evidence: ["packages/core/src/test/carousel-contract.ts", "tests/expanded-wave1.test.ts"],
      origin: { kind: "nagi", policy: "scrollport-focus-reconciliation", policyVersion: "1" },
    },
  ],

  anatomy: [
    {
      name: "root",
      description:
        "The rendered Carousel ownership root, identified independently of its CSS class and localized role description.",
      match: { by: "part", scope: "carousel", part: "root" },
    },
    {
      id: "CAR-ANAT-01",
      evidence: [
        "packages/core/src/test/carousel-contract.ts",
        "tests/definition.test.ts",
        "tests/expanded-wave1.test.ts",
        "tests/browser/definition-mutations.spec.ts",
      ],
      name: "viewport",
      description:
        "The focusable scrollport receiving the complete `viewportProps` binding, including element registration; its depth inside the root is unrestricted.",
      match: { by: "part", scope: "carousel", part: "viewport" },
      within: "root",
      outermost: true,
    },
    {
      name: "slide",
      description:
        "This Carousel's repeated behavior-owned slides. Layout wrappers are allowed, and the nearest scoped root excludes slides owned by a nested Carousel.",
      match: { by: "part", scope: "carousel", part: "slide" },
      within: "viewport",
      multiple: true,
      outermost: true,
    },
  ],

  style: [
    {
      id: "CAR-STYLE-01",
      classification: "intentional-extension",
      source: "Nagi functional scroll and motion policy",
      text: "The viewport uses inline mandatory scroll snap, slides are full-width, reduced motion disables smooth scrolling, and forced colors retains visible control focus.",
      evidence: [
        "packages/core/src/test/carousel-contract.ts",
        "tests/browser/expanded-catalog.spec.ts",
      ],
      origin: { kind: "nagi", policy: "carousel-functional-presentation", policyVersion: "1" },
    },
  ],
});
