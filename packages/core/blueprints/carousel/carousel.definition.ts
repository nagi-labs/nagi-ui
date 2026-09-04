import {
  defineComponentContract,
  defineComponentDefinition,
  defineComponentImplementation,
} from "@nagi-labs/nagi-ui";

export const carouselContract = defineComponentContract({
  id: "nagi/carousel",
  revision: "1",
  description:
    "Carousel meaning, manual navigation, controlled state, announcements, and focus continuity independent of how slides are laid out or animated.",
  api: [
    {
      name: "items",
      kind: "prop",
      description:
        "Provides the ordered slides; each item has a stable key, visible label, and optional presentational content.",
    },
    {
      name: "modelValue",
      kind: "model",
      description: "Controls the accepted zero-based position.",
    },
    { name: "label", kind: "prop", description: "Names the Carousel's content." },
    { name: "landmark", kind: "prop", description: "Promotes an important Carousel to a region." },
    {
      name: "loop",
      kind: "prop",
      description: "Allows navigation to wrap at collection boundaries.",
    },
    { name: "disabled", kind: "prop", description: "Blocks user-originated navigation." },
    {
      name: "carouselRoleDescription",
      kind: "prop",
      description: "Localizes the Carousel's exposed component type.",
    },
    {
      name: "slideRoleDescription",
      kind: "prop",
      description: "Localizes the exposed type of each slide.",
    },
    {
      name: "previousLabel",
      kind: "prop",
      description: "Names the control that requests the preceding slide.",
    },
    {
      name: "nextLabel",
      kind: "prop",
      description: "Names the control that requests the following slide.",
    },
    {
      name: "formatAnnouncement",
      kind: "prop",
      description: "Formats the accepted position announced by the status output.",
    },
    {
      name: "formatSlideLabel",
      kind: "prop",
      description: "Formats position text that participates in each slide's accessible name.",
    },
  ],
  parts: [
    { name: "carousel", description: "The named collection and its navigation controls." },
    { name: "previous control", description: "Requests the preceding slide." },
    { name: "next control", description: "Requests the following slide." },
    { name: "slide", description: "One named item in the collection.", multiple: true },
    { name: "status", description: "Announces the accepted position." },
  ],
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
      text: "Previous and next controls expose button semantics with accessible action labels.",
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
  ],
  state: [
    {
      id: "CAR-STATE-01",
      classification: "intentional-extension",
      source: "Nagi controlled-model policy",
      text: "The consumer owns the external model. `currentIndex` derives a finite bounded view without silently rewriting an externally supplied value.",
      evidence: ["packages/core/src/test/carousel-contract.ts", "tests/expanded-wave1.test.ts"],
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
      text: "`disabled` blocks user-originated navigation while external model updates remain authoritative; container roles do not receive `aria-disabled`.",
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
      text: "Previous and next controls support repeated button activation without adding Carousel-specific key commands.",
      evidence: [
        "packages/core/src/test/carousel-contract.ts",
        "tests/browser/expanded-catalog.spec.ts",
      ],
      origin: { kind: "reference", referenceIds: ["apg-carousel"] },
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
  ],
});

export const nativeScrollCarouselImplementation = defineComponentImplementation({
  id: "nagi/blueprint/carousel-native-scroll",
  title: "Native-scroll Carousel Blueprint",
  version: "1",
  strategy: "platform-first",
  description:
    "The standard Blueprint realizes the Carousel contract with a focusable native scrollport, CSS scroll snap, and model reconciliation after scrolling.",
  decisions: [
    {
      name: "layout",
      value: "native-scroll",
      description: "Let the browser own physical pointer, wheel, touch, and keyboard scrolling.",
      evidence: ["packages/core/src/test/carousel-contract.ts", "tests/expanded-wave1.test.ts"],
    },
    {
      name: "positioning",
      value: "css-scroll-snap",
      description: "Use CSS scroll snap rather than a JavaScript transform track.",
      evidence: ["packages/core/src/test/carousel-contract.ts"],
    },
    {
      name: "reconciliation",
      value: "nearest-owned-slide",
      description: "Resolve settled native scroll position back to the nearest owned slide.",
      evidence: ["tests/expanded-wave1.test.ts", "tests/browser/expanded-catalog.spec.ts"],
    },
    {
      name: "presence",
      value: "persistent",
      description: "All slides remain mounted; this Blueprint does not own enter or exit presence.",
      evidence: ["packages/core/src/test/carousel-contract.ts"],
    },
    {
      name: "viewport-semantics",
      value: "named-slides-group",
      description:
        "Expose the focusable scroll viewport as a named slides group; `slidesLabel` and `slidesRoleDescription` are native-scroll Implementation extensions, not portable Contract API.",
      evidence: ["packages/core/src/test/carousel-contract.ts"],
    },
  ],
  semantics: [
    {
      id: "CAR-SEM-06",
      classification: "implementation-constraint",
      source: "Native-scroll Carousel Blueprint semantics",
      text: "The scroll viewport is a named `group` with a non-empty, author-localizable role description, defaulting to `slides`. Its accessible name defaults to the Carousel label and is independently localizable through `slidesLabel`.",
      evidence: [
        "packages/core/src/test/carousel-contract.ts",
        "tests/expanded-wave1.test.ts",
        "tests/component-catalog.test.ts",
        "tests/browser/expanded-catalog.spec.ts",
        "tests/definition.test.ts",
      ],
      origin: { kind: "nagi", policy: "native-scroll-viewport-semantics", policyVersion: "1" },
    },
  ],
  interaction: [
    {
      id: "CAR-INT-02",
      classification: "implementation-constraint",
      source: "Native-scroll Carousel Blueprint reconciliation",
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
      classification: "implementation-constraint",
      source: "Native-scroll Carousel Blueprint keyboard policy",
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
      id: "CAR-FOCUS-02",
      classification: "implementation-constraint",
      source: "Native-scroll Carousel Blueprint focus reconciliation",
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
      contractPart: "carousel",
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
      contractPart: "slide",
    },
  ],
  style: [
    {
      id: "CAR-STYLE-01",
      classification: "implementation-constraint",
      source: "Native-scroll Carousel Blueprint functional presentation",
      text: "The viewport uses inline mandatory scroll snap, slides are full-width, reduced motion disables smooth scrolling, and forced colors retains visible control focus.",
      evidence: [
        "packages/core/src/test/carousel-contract.ts",
        "tests/browser/expanded-catalog.spec.ts",
      ],
      origin: { kind: "nagi", policy: "carousel-functional-presentation", policyVersion: "1" },
    },
  ],
});

/** Resolved guarantees for the standard, native-scroll Carousel Blueprint. */
export const carouselDefinition = defineComponentDefinition({
  name: "Carousel",
  version: "3.0",
  status: "draft",
  contract: carouselContract,
  implementation: nativeScrollCarouselImplementation,
});
