# Carousel specification audit

Audit baseline: 2026-08-31; source-provenance review: 2026-09-01; Component Contract/Implementation
split: 2026-09-02. This document
was defined before the corresponding Carousel correction and then reviewed
against the cited upstream revisions before verified status. It is the
acceptance checklist for that work, not a description inferred from the
finished implementation.

This matrix remains the component-level authoring audit. Its rows are registered
as Component Contract or native-scroll Implementation tests; the generated site
Definition collects those tests rather than duplicating their prose and evidence
paths by hand.

## Authority and scope

Carousel implements a non-rotating basic carousel. Its normative accessibility
baseline is the WAI-ARIA Authoring Practices Guide
[Carousel Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/) and the
[WAI-ARIA 1.2 role definitions](https://www.w3.org/TR/wai-aria-1.2/).

APG is a design-pattern guide rather than a web standard. This audit therefore
labels every decision as one of:

- **conformant** — directly follows the adopted APG pattern;
- **intentional-extension** — Nagi behavior not required by APG;
- **implementation-constraint** — structure required by this implementation,
  not by the accessible pattern;
- **gap** — missing, contradictory, or not executable enough to accept.

A row passes only when its policy is present in the Definition, its binding is
visible in the implementation, and its named test exercises the observable
result. Axe alone is never evidence for a pattern requirement.

## Pre-implementation acceptance matrix

| ID           | Classification            | Adopted requirement or policy                                                                                                                                                                                                                                                                                                                                                                                                 | Implementation target                                                                               | Required evidence                                                                                                                               |
| ------------ | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| CAR-SEM-01   | conformant                | The root is a named `group` by default and a named `region` only when the consumer marks the carousel as an important landmark.                                                                                                                                                                                                                                                                                               | `rootProps`; required `label`; `landmark` policy                                                    | Node props test and browser role/name test for both modes                                                                                       |
| CAR-SEM-02   | conformant                | The root exposes a non-empty author-localized `aria-roledescription`, defaulting to `carousel`. Its label names the content and does not need to repeat the component type.                                                                                                                                                                                                                                                   | `rootProps`; `carouselRoleDescription`                                                              | Node fallback/localization test and SSR/browser attribute test                                                                                  |
| CAR-SEM-03   | conformant                | Previous and next controls expose button semantics with action labels.                                                                                                                                                                                                                                                                                                                                                        | portable contract; `previousButtonProps`, `nextButtonProps`                                         | SSR and browser role/name test                                                                                                                  |
| CAR-SEM-04   | conformant                | Every slide is a named `group` with a non-empty author-localized `aria-roledescription`, defaulting to `slide`. The visible slide heading participates in that accessible name; position text may supplement it.                                                                                                                                                                                                              | `slideProps`; `slideRoleDescription`; slide heading binding                                         | Node fallback/localization test and SSR/browser accessible-name test                                                                            |
| CAR-SEM-05   | intentional-extension     | Manual position changes are announced by a dedicated polite status output. Carousel has no automatic rotation.                                                                                                                                                                                                                                                                                                                | `announcement`, Blueprint output                                                                    | Node formatting test and browser announcement test                                                                                              |
| CAR-SEM-06   | implementation-constraint | The native-scroll Implementation's focusable viewport is a named `group` with a non-empty author-localized role description, defaulting to `slides`. Its accessible name defaults to the Carousel label and is independently localizable through `slidesLabel`.                                                                                                                                                               | `viewportProps`; `slidesLabel`; `slidesRoleDescription`                                             | Node fallback/localization test and SSR/browser role, name, role-description, and focus tests                                                   |
| CAR-STATE-01 | intentional-extension     | The external model remains consumer-owned. A derived current index is finite and bounded; Nagi does not silently rewrite an externally supplied value.                                                                                                                                                                                                                                                                        | portable contract; accepted position derivation                                                     | shared package/owned out-of-range browser contract and non-finite controlled-model Node tests                                                   |
| CAR-STATE-02 | intentional-extension     | `loop` wraps navigation requests; without it, navigation stops at the ends. A non-looping boundary control remains focusable with `aria-disabled="true"`, avoiding focus loss when the user reaches an edge.                                                                                                                                                                                                                  | `normalized`, button state                                                                          | Node boundary and browser focus tests                                                                                                           |
| CAR-STATE-03 | intentional-extension     | `disabled` blocks user-originated navigation and native controls, but does not block an external model update. It is not exposed as `aria-disabled` on non-widget `region` or `group` containers.                                                                                                                                                                                                                             | buttons, scroll reconciliation, root styling state                                                  | Node and browser disabled tests                                                                                                                 |
| CAR-INT-01   | conformant                | Previous and next controls support repeated Button activation without Carousel-specific key commands.                                                                                                                                                                                                                                                                                                                         | portable contract; `previousButtonProps`; `nextButtonProps`                                         | browser activation/model test                                                                                                                   |
| CAR-INT-02   | implementation-constraint | Native pointer, wheel, and scroll-snap input selects the nearest settled owned slide and requests the corresponding model value; rejected controlled writes restore the accepted slide.                                                                                                                                                                                                                                       | `onScroll`, `onPointerdown`, `onWheel`                                                              | browser scroll/model test and controlled rejection Node test                                                                                    |
| CAR-INT-03   | implementation-constraint | The enabled native-scroll viewport is sequentially focusable and leaves Arrow, Home, and End scrolling to the browser; a disabled non-scrollable viewport uses `tabindex="-1"`.                                                                                                                                                                                                                                               | viewport `tabindex`; no `onKeydown`                                                                 | browser focus/default-prevention test and axe `scrollable-region-focusable` check                                                               |
| CAR-FOCUS-01 | conformant                | Repeated Previous or Next activation retains DOM focus on that button.                                                                                                                                                                                                                                                                                                                                                        | native button focus                                                                                 | browser repeated-activation test                                                                                                                |
| CAR-FOCUS-02 | implementation-constraint | In the native-scroll Implementation, focusing the viewport aligns physical scroll to the accepted model index without moving focus into a slide.                                                                                                                                                                                                                                                                              | `viewportProps.onFocus`                                                                             | Node alignment test and browser viewport-focus test                                                                                             |
| CAR-ANAT-01  | implementation-constraint | Direct parentage is not a contract. `data-scope="carousel"` plus the `root`, `viewport`, and repeated `slide` parts expose structural identity. Runtime discovery uses those internal part markers inside the registered viewport, never localized ARIA text or `document`; wrappers are allowed and the nearest scoped root excludes nested Carousel slides. The complete `viewportProps` binding owns element registration. | `viewportProps.ref`; scoped part discovery; `carouselDefinition.anatomy`; Blueprint part attributes | default wrapped Blueprint, binding-ref test, nested-Carousel isolation, controlled scroll, missing-viewport-part, and browser interaction tests |
| CAR-STYLE-01 | implementation-constraint | The native-scroll Implementation uses inline mandatory scroll snap; slides are full-width; reduced motion disables smooth scrolling; forced colors retains visible control focus.                                                                                                                                                                                                                                             | Blueprint CSS                                                                                       | browser computed-style tests                                                                                                                    |

## Explicit non-requirements

- No automatic rotation, rotation timer, or rotation control.
- No tablist or slide-picker pattern.
- No authored Arrow, Home, or End behavior on the scroll viewport.
- No requirement for generated slide IDs unless an ARIA relationship references
  them.
- No claim that anatomy verification proves the semantic, state, interaction,
  focus, or style rows. Each row needs its own test evidence.

## Completion rule

The correction is complete only when no matrix row remains a gap, Contract and
Implementation test grouping distinguishes portable behavior from native-scroll
constraints, and Node, browser, type, lint, integration, and static-site checks
all pass. A compatibility Definition entry is not evidence by itself.

Carousel reached the separated Component Contract/Implementation shape at draft Definition
revision 3.0 after this matrix, package/owned contracts, and the mutation probes passed together.
Its shared runner now covers ordered named slides, bounded and looping edges, controlled accepted,
rejected, and out-of-range state, disabled input, manual announcements, and focus continuity. It
remains WIP until a materially different replacement Implementation passes that runner.

## Recorded amendment

During the first browser run, removing the viewport from the tab sequence caused
axe's `scrollable-region-focusable` rule to fail for every enabled Carousel.
CAR-INT-03 was amended before acceptance: the viewport remains focusable so native
keyboard scrolling is reachable, while the custom Arrow/Home/End handler stays
removed. This is evidence-driven correction of the audit premise, not an
implementation exception hidden after completion.

The first CAR-ANAT-01 draft used `data-nagi-carousel-track` because the verifier
could only resolve parts from parent to child. Review showed that this made a
verification limitation leak into owned DOM without a product or accessibility
requirement. CAR-ANAT-01 was amended to resolve the semantic slides first and
derive their unique parent as the viewport. The one-off marker was
then removed from the Blueprint, runtime props, tests, and documentation.

Further review showed that deriving the slide parent still preserved an
unnecessary `viewport.children` implementation constraint and could not prove that
the derived element carried Carousel behavior. CAR-ANAT-01 was amended again
before acceptance: the binding marks the actual behavior-bearing scrollport,
slide discovery is scoped beneath it by internal part identity and Carousel ownership,
and no direct-child relation is required. Accessible naming remains solely a
CAR-SEM-04 requirement rather than an anatomy locator condition.

Review of that marker exposed one more false premise: CAR-INT-01 deliberately
makes the scroll viewport focusable, so the viewport is not invisible implementation
machinery from the user's perspective. Before changing the implementation,
CAR-SEM-06 was added as a native-scroll Implementation constraint.

Final review separated two concerns that the previous amendment had combined.
The viewport is now a named group with `aria-roledescription="slides"`; its
accessible name defaults to the Carousel label and may be localized through
`slidesLabel`. Anatomy no longer treats that user-facing name as an internal
key. Carousel adopts the generic `data-scope` / `data-part` vocabulary for the
root, viewport, and slides. Runtime slide discovery now uses the same internal
part vocabulary inside the directly registered viewport; localized
`aria-roledescription` values are never implementation locators. The rejected
component-specific `data-nagi-carousel-track` attribute remains removed.

The provenance review also found that `aria-roledescription` is explicitly an
author-localized value in WAI-ARIA 1.2. The root, viewport, and slide role
descriptions therefore gained independent props with non-empty English
fallbacks. Package and owned browser contracts use different values while
exercising the same Behavior, proving that presentation semantics and internal
ownership identity are no longer coupled.

The same review found that exposing `viewportProps` and a separate imperative
registration method made the binding incomplete and forced an inline callback
and casts into the Blueprint. `viewportProps` now contains the Vue ref callback
alongside its semantics and event handlers. The template only selects its DOM
destination with `v-bind`, which matches the Behavior/Blueprint responsibility
boundary defined before this correction.
