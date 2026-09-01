# Definition framework validation

Validation baseline: 2026-08-31. This audit evaluates whether Component
Definition is a useful maintenance method. Passing the repository test suite is
not the goal by itself.

## Acceptance questions

| Boundary | Pass condition | Failure condition |
| --- | --- | --- |
| Manifest integrity | Duplicate, misplaced, empty, and undeclared requirement IDs fail before rendering. | A typo or duplicate ID can still appear as verified evidence. |
| Structural execution | The same Definition anatomy algorithm runs against package and owned browser DOM. | A browser contract restates `data-part` expectations independently. |
| Behavioral evidence | A test ID must exist in the Definition, and each claimed behavior has an observable assertion. | Merely putting an ID in a test name is treated as proof. |
| Mutation sensitivity | Representative semantic, state, interaction, anatomy, and style breaks fail at the intended assertion. | A mutation passes, or fails earlier for an unrelated reason. |
| Ownership tolerance | Reordered controls, additional layout wrappers, authored classes, and insignificant accessible-name punctuation remain valid. | The contract freezes canonical markup or presentation. |
| Product feedback | A contradiction between the adopted requirement and the implementation changes the policy or implementation. | The test is relaxed only to preserve the implementation. |

## Results

| Probe | Result | What it demonstrates |
| --- | --- | --- |
| Duplicate and section-mismatched IDs | rejected | `validateDefinition` protects manifest identity, not behavior. |
| Contract references `CAR-STATE-99` | rejected | `contractTitle` cannot claim an undeclared requirement. |
| `div role="button"` replaces native Button | rejected at native `tagName` assertion | Role equivalence does not satisfy the native-element guarantee. |
| Focusable-disabled click reaches consumer code | rejected at activation counter | State attributes alone cannot hide a broken interaction policy. |
| Button public style axis is removed | rejected at computed custom property | The style contract is observable after compilation. |
| Carousel viewport loses its part identity | rejected by `inspectAnatomy` with `missing-part` | Browser conformance executes the Definition's anatomy algorithm. |
| Carousel Next stops updating the model | rejected at the consumer-owned model output | Correct DOM and ARIA do not mask broken behavior. |
| Carousel scroll snap is removed | rejected at computed style | Functional styling is tested separately from anatomy. |
| Carousel role descriptions are localized | accepted by package and structurally reordered owned contracts | User-facing ARIA wording is independent of Behavior lookup. |
| Carousel slide discovery uses localized `aria-roledescription` text | rejected by source-boundary assertion | Internal ownership must use scoped parts, not assistive-technology presentation strings. |
| Owned Carousel reorders controls and inserts wrappers | accepted | `within` preserves layout freedom; direct parentage is not invented. |
| Package and owned slide names differ in comma whitespace | accepted | The contract checks label and position participation, not unpromised punctuation. |
| Combobox active option is removed dynamically | accepted only after `aria-activedescendant` clears | The contract observes a changing collection and resolves the IDREF inside the controlled listbox. |
| Combobox active IDREF points to a removed option | rejected at the scoped relationship assertion | Static ARIA attributes cannot hide a dangling relationship. |
| Combobox moves DOM focus into the popup option | rejected at the input-focus assertion | Active-descendant focus and roving DOM focus are not treated as equivalent implementations. |
| `div role="dialog"` replaces native `<dialog>` | rejected at the native-element assertion | Equivalent role naming does not satisfy the native modal guarantee. |
| Dialog opens through `showModal()` | accepted only while the exposed surface matches `:modal` | A visible `<dialog open>` is not mistaken for the adopted modal-default profile. |
| Dialog backdrop is activated under `closedby="any"` | accepted only after native light dismissal closes, mirrors the model, and restores the invoker | A `closedby` attribute is not treated as proof of the temporal dismissal contract. |
| Dialog close redirects focus away from its invoker | rejected at the restoration assertion | The contract checks behavior after close, not only the open DOM. |
| AlertDialog loses its required `aria-describedby` relationship | rejected at the computed-description assertion | A visible warning paragraph is not treated as sufficient when the adopted alert-dialog profile requires an exposed message. |
| Owned Combobox inserts control and popup wrappers | accepted | `within` records structural scope without freezing depth. |
| Owned Dialog moves actions before title/body | accepted | Naming, native surface, containment, and focus survive consumer-owned order. |
| DropdownMenu omits closed `aria-expanded="false"` | rejected at the menu-button semantics assertion | A real implementation defect is not hidden by the native Popover still opening correctly. |
| Nested Menu runs inside ShadowRoot | accepted | Item discovery and parent/trigger restoration stay inside locally registered roots. |
| `aria-modal="true"` is added to DatePicker | rejected at the non-modal surface assertion | The Definition borrows the APG calendar boundary without falsely claiming the example's modal-dialog policy. |
| DatePicker runs inside ShadowRoot | accepted | Selected-day lookup and invoker restoration do not require document-global discovery. |

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

## What is and is not guaranteed

The useful unit is not the Definition value alone. It is the combination of:

1. the typed Definition and its stable requirement IDs;
2. manifest validation and audit-to-Definition coverage;
3. executable anatomy against real DOM;
4. component-family Node and browser contracts;
5. mutation probes that challenge the claimed boundary.

The framework still cannot prove that prose and an assertion mean the same
thing. `evidence` paths and validated test labels provide traceability; code
review and mutation probes establish whether that trace is honest. Some policy
facets also remain best verified below the shared browser contract: Carousel's
out-of-range controlled model and loop modulo are Node-level evidence, while
Button's finite compiler table is compiler evidence.

The verified pilots now cover a native leaf control, a standalone and popup
listbox, editable active-descendant focus, native popup lifecycle, nested menu
ownership, ShadowRoot boundaries, a composed non-modal DatePicker, and a modal
native Dialog with browser-owned focus containment and dismissal, plus a
native-scroll Carousel whose physical position reconciles with controlled
state. This is
enough evidence that the framework supports UI-library maintenance rather than
merely documenting markup.

Rollout should still proceed by behavior family rather than by file count. The
remaining untested families include selection across multiple editable tokens,
tree repair across lazy descendants, and range selection spanning more than one
calendar view. Requirement-level evidence must continue to distinguish
manifest-only, Node/static, browser, ShadowRoot, and mutation coverage. AI can
draft and maintain the mapping, but executable contracts and mutation probes
remain the oracle.
