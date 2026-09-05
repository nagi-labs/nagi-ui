# Definition framework validation

Validation baseline: 2026-08-31. This audit evaluates whether Component
Definition is a useful maintenance method. Passing the repository test suite is
not the goal by itself.

The repository and package are currently `0.1.0`. Pilot Contract revisions are
working revisions while their Definitions remain `draft`; automated immutable
revision snapshots are intentionally deferred until the first Definition is
promoted to `verified` or a stable Contract policy is published. This is an
accepted pre-1.0 limit, not evidence that a published revision may be edited in
place.

Evidence-model amendment: the mutation results below remain valid, but the
original hand-authored manifest is no longer the target source of truth.
Component Contract/Implementation requirement tests and executable anatomy rules are the
authoritative guarantees; the Component Definition is their generated view.
Button, Carousel, Combobox, Dialog, and DatePicker now use section-independent ID-shaped test functions, native Playwright
title/tag/annotation metadata, non-exclusive section facets, and a generated result catalog. Evidence-file
paths in the compatibility manifest establish traceability only.

## Acceptance questions

| Boundary                                   | Pass condition                                                                                                                                                                                        | Failure condition                                                                                                                  |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Test catalog integrity                     | Missing, duplicate, component/layer-mismatched IDs, missing facets, incomplete declared Requirement sets, missing Implementation suites, or conflicting package/owned metadata fail before rendering. | A generated Definition row has no executable registration, or both fixtures omit the same required guarantee and still pass.       |
| Component identity sufficiency             | The Contract still defines the component's public API meaning, conceptual parts, user-observable state, operations, and focus outcomes before any Implementation is considered.                       | The Contract is only the smallest intersection of current Implementations, or could describe several materially different widgets. |
| Component Contract/Implementation boundary | Portable guarantees do not silently fix a native element, layout, or presence owner; the concrete Blueprint records those choices separately.                                                         | A Motion or custom implementation must inherit native-only constraints to claim the shared contract.                               |
| Replacement compatibility                  | Swapping package, owned, or Motion Implementations preserves consumer integration and the user-observable promises of the same Contract revision.                                                     | A replacement requires application code or expected behavior to change while still claiming the same Contract.                     |
| Composed Contract ownership                | A parent Contract owns only guarantees created by integrating its children; each child Requirement has one owner even when parent evidence exercises it.                                              | The parent copies a child Requirement, or hides a parent-specific connection behind the claim that the child already tests it.     |
| Structural execution                       | Each concrete Implementation executes its own Definition anatomy algorithm; Contract tests do not impose the package Blueprint's `data-part` structure on replacements.                               | Owned or Motion source claims the package Implementation identity without running its complete structural suite.                   |
| Behavioral evidence                        | Each generated row comes from a registered test with an observable assertion.                                                                                                                         | Merely putting an ID or evidence path in a manifest is treated as proof.                                                           |
| Mutation sensitivity                       | Representative semantic, state, interaction, anatomy, and style breaks fail at the intended assertion.                                                                                                | A mutation passes, or fails earlier for an unrelated reason.                                                                       |
| Ownership tolerance                        | Reordered controls, additional layout wrappers, authored classes, and insignificant accessible-name punctuation remain valid.                                                                         | The contract freezes canonical markup or presentation.                                                                             |
| Product feedback                           | A contradiction between the adopted requirement and the implementation changes the policy or implementation.                                                                                          | The test is relaxed only to preserve the implementation.                                                                           |

### Contract boundary audit procedure

For every new or revised Component Contract, the reviewer performs the
following boundary audit before accepting its Implementations:

1. Describe the component without naming a renderer, DOM tree, layout
   mechanism, presence owner, or animation library. The result must still be
   specific enough to distinguish this component from neighboring component
   families.
2. List the consumer integration and user-observable promises that must survive
   replacement: public API meaning, conceptual parts, accepted state,
   operations, semantics, focus outcomes, and portable functional style.
3. Apply the replacement test to the package Blueprint, an owned variant, and
   any delegated or Motion implementation. If replacement changes consumer
   code or an expected outcome, the missing promise belongs to the Contract or
   the replacement needs a different Contract.
4. Review every item assigned to Implementation. `native`, `custom`, and
   `Motion` are not sufficient reasons by themselves. A native platform result
   remains a Contract guarantee when applications rely on it; only the concrete
   mechanism may vary.
5. Reject lowest-common-denominator revisions. An Implementation that cannot
   satisfy an existing Contract is fixed or assigned another Contract; the
   published Contract is not weakened to admit it.
6. For every composed child, separate its existing guarantee from the outcome
   created by the connection. Keep the former in the child Contract and the
   latter in the parent Contract. Parent evidence may operate the child but
   must assert and name the integration outcome.

The audit records both failure directions: implementation leakage makes the
Contract unnecessarily restrictive, while identity loss makes it too weak to
represent the component. Passing only one direction is not sufficient.

## Results

| Probe                                                                    | Result                                                                                         | What it demonstrates                                                                                                     |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Duplicate IDs and section-encoded runner IDs                             | rejected                                                                                       | Runner IDs stay stable when reviewers add or remove a section facet.                                                     |
| Several section facets on one Requirement                                | accepted                                                                                       | State, interaction, and focus are non-exclusive views of one meaningful guarantee.                                       |
| No section facet                                                         | rejected                                                                                       | Every guarantee remains discoverable without forcing it into exactly one chapter.                                        |
| Package and owned both omit one declared Contract ID                     | rejected                                                                                       | Matching omissions cannot weaken an immutable Contract revision.                                                         |
| Package and owned declare different complete Contract sets               | rejected                                                                                       | Fixture adapters cannot redefine the Contract they claim.                                                                |
| A test exists outside the declared complete set                          | rejected                                                                                       | Accidental additions require an intentional Contract revision decision.                                                  |
| Component Contract suite without an Implementation suite                 | rejected                                                                                       | Disabling the Blueprint suite cannot publish a Contract-only Definition as passing.                                      |
| Owner-qualified custom Implementation ID                                 | accepted                                                                                       | Deep Sea and application-owned implementations keep their owner identity without claiming the Blueprint namespace.       |
| Contract references `CAR-STATE-99`                                       | rejected                                                                                       | `contractTitle` cannot claim an undeclared requirement.                                                                  |
| `div role="button"` replaces the default Button Blueprint                | rejected at native `tagName` assertion                                                         | Role equivalence may satisfy part of the Component Contract, but it does not satisfy the selected native Implementation. |
| Focusable-disabled click reaches consumer code                           | rejected at activation counter                                                                 | State attributes alone cannot hide a broken interaction policy.                                                          |
| Button public style axis is removed                                      | rejected at computed custom property                                                           | The style contract is observable after compilation.                                                                      |
| Carousel viewport loses its part identity                                | rejected by `inspectAnatomy` with `missing-part`                                               | Browser conformance executes the Definition's anatomy algorithm.                                                         |
| Carousel Next stops updating the model                                   | rejected at the consumer-owned model output                                                    | Correct DOM and ARIA do not mask broken behavior.                                                                        |
| Carousel scroll snap is removed                                          | rejected at computed style                                                                     | Functional styling is tested separately from anatomy.                                                                    |
| Carousel role descriptions are localized                                 | accepted by package and structurally reordered owned contracts                                 | User-facing ARIA wording is independent of Behavior lookup.                                                              |
| Carousel slide discovery uses localized `aria-roledescription` text      | rejected by source-boundary assertion                                                          | Internal ownership must use scoped parts, not assistive-technology presentation strings.                                 |
| Owned Carousel reorders controls and inserts wrappers                    | accepted                                                                                       | `within` preserves layout freedom; direct parentage is not invented.                                                     |
| Package and owned slide names differ in comma whitespace                 | accepted                                                                                       | The contract checks label and position participation, not unpromised punctuation.                                        |
| Combobox active option is removed dynamically                            | accepted only after `aria-activedescendant` clears                                             | The contract observes a changing collection and resolves the IDREF inside the controlled listbox.                        |
| Combobox active IDREF points to a removed option                         | rejected at the scoped relationship assertion                                                  | Static ARIA attributes cannot hide a dangling relationship.                                                              |
| Combobox moves DOM focus into the popup option                           | rejected at the input-focus assertion                                                          | Active-descendant focus and roving DOM focus are not treated as equivalent implementations.                              |
| `div role="dialog"` replaces native `<dialog>`                           | rejected at the native-element assertion                                                       | Equivalent role naming does not satisfy the native modal guarantee.                                                      |
| Dialog opens through `showModal()`                                       | accepted only while the exposed surface matches `:modal`                                       | A visible `<dialog open>` is not mistaken for the fixed modal-only Blueprint choice.                                     |
| Dialog backdrop is activated under `closedby="any"`                      | accepted only after native light dismissal closes, mirrors the model, and restores the invoker | A `closedby` attribute is not treated as proof of the temporal dismissal contract.                                       |
| Dialog close redirects focus away from its invoker                       | rejected at the restoration assertion                                                          | The contract checks behavior after close, not only the open DOM.                                                         |
| AlertDialog loses its required `aria-describedby` relationship           | rejected at the computed-description assertion                                                 | A visible warning paragraph is not treated as sufficient when the AlertDialog Contract requires an exposed message.      |
| Owned Combobox inserts control and popup wrappers                        | accepted                                                                                       | `within` records structural scope without freezing depth.                                                                |
| Owned Dialog moves actions before title/body                             | accepted                                                                                       | Naming, native surface, containment, and focus survive consumer-owned order.                                             |
| DropdownMenu omits closed `aria-expanded="false"`                        | rejected at the menu-button semantics assertion                                                | A real implementation defect is not hidden by the native Popover still opening correctly.                                |
| Nested Menu runs inside ShadowRoot                                       | accepted                                                                                       | Item discovery and parent/trigger restoration stay inside locally registered roots.                                      |
| `aria-modal="true"` is added to the native-popover DatePicker            | rejected at `DTP_IMPLEMENTATION_01`                                                            | The standard Implementation stays explicitly non-modal without making non-modal presence part of the Component Contract. |
| DatePicker runs inside ShadowRoot                                        | accepted                                                                                       | Selected-day lookup and invoker restoration do not require document-global discovery.                                    |
| DatePicker minimum, maximum, unavailable, required, and invalid policies | accepted only when package and owned fixtures reject the same dates and form states            | Native input is an Implementation mechanism; public constraint and validation results remain Contract guarantees.        |

The first full browser run also exposed two defects in the supposedly valid
implementation:

1. Behavior binding bundles returned getter objects that Vue did not update when
   an owned template used one `v-bind`. The model advanced while the rendered
   Previous button stayed disabled. The bundles are now reactive.
2. A non-looping Next button became natively disabled at the final slide and the
   browser discarded focus. This contradicted the adopted Carousel requirement
   that repeated control activation does not move focus. Boundary controls now
   remain focusable with `aria-disabled="true"`; a disabled Carousel still uses
   native disabled controls.

Both failures were corrected in the implementation and Definition policy. The
contract was not weakened to accept them.

The Combobox/Dialog audit exposed three more implementation defects before the
new contracts were accepted:

1. Combobox found its active option with `document.getElementById`. The
   `listboxProps` bundle now registers the owned listbox and scroll lookup stays
   inside it.
2. Dialog and the shared Popover behavior rediscovered surfaces and invokers
   through the document. Their complete binding bundles now register both ends
   locally without assuming a document-wide owner. Dedicated ShadowRoot fixtures
   now cover Combobox relationships, Dialog restoration, nested Menu, and
   DatePicker calendar entry/restoration.
3. DropdownMenu omitted `aria-expanded="false"` while closed even though the
   adopted APG menu-button Requirement requires state reflection. The complete
   trigger bundle now exposes a reactive true/false value.

The audit also disproved an initial defect hypothesis: Dialog's public `id`
belongs to its wrapper, while the Behavior API generates a distinct native
surface ID. SSR now asserts the public ID appears once without changing its
existing destination.

The final Carousel provenance review exposed one additional coupling: runtime
slide discovery used the English `aria-roledescription="slide"` value and found
the nearest owner through `aria-roledescription="carousel"`. WAI-ARIA defines
those values as author-localized human-readable descriptions. Discovery now
uses scoped `root` and `slide` parts, while independent role-description props
can change without altering Behavior. The same package/owned contract exercises
both default and customized descriptions.

## Current STOP after identity-first review

The complete-set and multi-Implementation generator foundations now pass their
negative probes. The report carries the full Requirement set declared by each
runner revision, namespaces Implementation-local IDs by owner-qualified
identity, and permits several Implementations for one Component Contract.
Owned fixtures no longer claim the standard Blueprint Implementation merely
because they satisfy the same Contract.

The stricter review also found a real Dialog mismatch: Chromium's native modal
dialog transiently focused `document.body` at the sequential Tab boundary even
though `DLG-FOCUS-01` promised an uninterrupted loop. The assertion was not
relaxed. `useDialog` now supplies a local boundary repair through
`dialogProps.onKeydown`, and package, owned, AlertDialog, and ShadowRoot-capable
markup share that Behavior wiring. The actions slot also exposes the Behavior
`close` operation so a consumer-authored primary action can satisfy the same
close-and-restore guarantee without discovering an internal surface ID.

The focus repair is currently exercised only by the repository's Chromium
Playwright project. It is accepted as a Chromium-supported pilot behavior;
Firefox and WebKit parity are not claimed until those projects execute the same
Contract runner. The repair must stay local and small rather than becoming a
custom cross-browser dialog runtime in anticipation of unobserved failures.

Contract API completeness also remains a human/AI review item. Reviewers compare
the shipped Vue props, models, slots, events, and exposed methods against the
portable Contract API, record mismatches in the component audit, and avoid
assuming that equal TypeScript names prove equal semantics. No reflection or
API-diff gate is required during the pilot unless repeated audits reveal a
stable mechanical invariant worth enforcing.

Carousel now provides the first materially different replacement proof. The
package and owned fixtures use the native-scroll Implementation, while Deep
Sea mounts one keyed slide through Motion presence and has no scroll viewport.
All three execute the same `nagi/carousel@1` Contract runner; Deep Sea disables
the native-scroll suite and separately executes its owner-qualified
`deep-sea/carousel-motion@1` Implementation requirements. The shared runner is
consumed from the packed `@nagi-labs/nagi-ui/test` entrypoint rather than from a
workspace source path, so the proof includes the intended external package
boundary. A popup replacement remains the next distinct presence/focus case,
but Carousel's renderer-replacement claim is no longer WIP.

Toast adds a time-dependent dynamic-collection replacement proof. The package
Blueprint and Deep Sea Motion stack execute the same `nagi/toast@1` Contract
runner for live announcements, explicit manager state, action updates, F6
routing, timer pausing, live-item limits, promise replacement, and focus
continuity. Deep Sea separately verifies its native manual-popover layer,
retained Motion exit DOM, compact/expanded stack layout, and non-zero presence
transitions. This exposed and corrected an immediate-removal assumption in
`useToast`: item identity is now bound into component props, so focus is
handed to a live item or the external origin even while `AnimatePresence` keeps
the removed DOM for visual exit.

Combobox adds a popup and active-descendant replacement proof. Its public Vue
API was first corrected in `nagi/combobox@2`: `modelValue` is the editable text
and the named `selected` model is the committed option key. The package and Deep
Sea fixtures execute that same Contract revision. Deep Sea keeps the native
input and auto popover as focus and visibility owners, while an inner Motion
surface handles spring entry and a scoped shared-layout indicator follows the
provisional active option. An initial attempt to bind Behavior-owned popup refs
to the Motion component made native popover registration unreliable; separating
the native owner from the presentational Motion child restored the invariant.

Rollout beyond the current pilots remains stopped until the remaining
identity-first gaps are closed:

- Carousel executes its controlled external/rejected-write, bounded-view,
  boundary/loop, disabled activation, manual announcement, default group, and
  ordered named-slide policies against package, owned, and materially different
  Deep Sea Motion fixtures. Native scroll position, viewport anatomy, keyed
  presence, and reduced-motion timing remain in their respective Implementation
  suites rather than leaking into the shared Contract.
- Combobox now aligns `modelValue`/`selected` with the shipped Vue API in
  `nagi/combobox@2`, but still needs disabled, read-only, popup visibility,
  boundary, IME, pointer, and controlled-state evidence.
- Dialog still needs an external controlled-open/rejected-write scenario.
- DatePicker still needs disabled/read-only, segmented editing, broader calendar
  keyboard navigation, external form association, controlled-open, and
  post-selection/light-dismiss focus evidence.

These are Contract-sufficiency failures, not reasons to weaken the boundary or
to add more components. The next audit remains STOP until package and owned
fixtures execute those identity guarantees.

## What is and is not guaranteed

The useful unit is not a prose manifest. It is the combination of:

1. registered Component Contract tests plus one concrete Implementation test suite;
2. executable anatomy against real DOM;
3. component-family Node, browser, type, source, compiler, and visual checks;
4. a generated Definition/catalog view;
5. mutation probes that challenge the claimed boundary.

Keeping the human-readable requirement name beside the assertion removes most
of the prose-to-test mapping problem, but the framework still cannot prove that
the assertion is sensitive to the intended behavior. Code review and mutation
probes establish that. Some policy facets also remain best verified below the
shared browser contract: Carousel now exposes out-of-range controlled state to
the shared runner, while its non-finite normalization and generic loop modulo
remain Node-level evidence. Button's finite compiler table remains compiler
evidence.

The first DatePicker runner audit over-corrected toward one classification per
test. That produced separate rows for Escape cancellation and trigger-focus
restoration even though they are one dismissal flow. The catalog now treats
sections as facets and records that flow once as `DTP_CONTRACT_06` with state,
interaction, and focus facets. The same review removed duplicated Button
activation/focus, Carousel navigation/focus, Combobox navigation/provisional
state/focus, and Dialog Escape/model/focus rows. Independently changeable Button
axis/focus and Carousel snap/reduced-motion/focus checks were split instead of
being hidden under broad style rows. DatePicker's independently changeable
selection constraints, required submission, and forced validation policy are
also separate rows. The resulting pilot catalogs keep those guarantees as
independently traceable Requirements without removing a guarantee.

The browser-passing pilot evidence currently covers a platform-first leaf-control Implementation, a standalone and popup
listbox, editable active-descendant focus, native popup lifecycle, nested menu
ownership, ShadowRoot boundaries, a composed non-modal DatePicker, and a modal
native Dialog with browser-owned modality and dismissal plus a small Tab-boundary repair, and a
native-scroll Carousel Implementation whose physical position reconciles with
controlled state. The Deep Sea suite additionally proves that the same Carousel
Contract survives replacement by a single-slide Motion presence Implementation
with no viewport or native scroll state. The Deep Sea Toast stack likewise
retains removed DOM for Motion exit while the shared Contract keeps manager
state, announcements, timers, and focus routing authoritative. Its Combobox
keeps native focus and popup owners while delegating presentation to an inner
Motion surface and shared-layout indicator. Button and Carousel prove the initial renderer boundary;
Listbox and Combobox separate shared collection guarantees from their concrete
focus and popup owners; Toast separates notification guarantees from immediate
native-popover presence. These cases show that implementation choices can be
separated from portable guarantees without weakening the complete Definition. This is
evidence that the framework can expose real implementation defects rather than
merely documenting markup. It is not yet evidence for unrestricted rollout,
because the STOP items above still leave some Contract identities too thin.

Rollout should still proceed by behavior family rather than by file count. The
remaining untested families include selection across multiple editable tokens,
tree repair across lazy descendants, and range selection spanning more than one
calendar view. Requirement-level evidence must continue to distinguish
manifest-only, Node/static, browser, ShadowRoot, and mutation coverage. AI can
draft and maintain the mapping, but executable contracts and mutation probes
remain the oracle.
