# Component Definitions

A Definition records what a component guarantees: its semantics, state,
interaction, focus behavior, functional anatomy, and visual contract. It is a
plain typed value that ships next to the Blueprint and is copied with it by
`nagi-ui own`.

Definitions have an explicit verification status. An omitted status is treated
as `draft` during migration. `verified` is reserved for a Definition whose
structured Requirements all name their provenance and repository evidence,
including every anatomy part that carries a Requirement ID.

It is deliberately not a widget runtime. Shared Requirement sets are resolved
when a Definition module is evaluated, but no Blueprint reads the result while
rendering. The resolved value is a maintenance manifest:
documentation renders it, anatomy contracts execute it against DOM, and test
labels are checked against its requirement IDs. Behavioral prose does not turn
itself into an assertion.

Button is also the pilot for composed standards provenance. Its final
Definition is still a complete list of guarantees, but three platform-owned
requirements are expanded from Nagi's locally versioned `nagi/button` revision 1 set.
The Button file supplies the adopted profile and executable evidence, then adds
only its Nagi-specific policies, anatomy, and style contract by hand.

External specifications are provenance, not runtime dependencies. Nagi never
downloads or silently synchronizes their text. A Requirement set records its
reviewed sources and local version; an upstream change is adopted only by
reviewing the difference and publishing a new local set version.

Nine Definitions currently live beside their Blueprints and travel in the
matching ownership bundles; all nine are verified. Button, Listbox, Combobox,
Popover, DropdownMenu, DatePicker, Dialog, AlertDialog, and Carousel cover a
native leaf control, collection and popup families, modal focus, nested popup
ownership, ShadowRoot lookup, native scrolling, and controlled state over time.
Listbox and Combobox prove that one source-backed set can be adopted with
different focus policies. Carousel deliberately keeps its component-specific
APG provenance directly in its Definition instead of inventing a one-consumer
shared Requirement set.

Dialog adopts `nagi/dialog` revision 1 with the `dialog`, `modal-default`,
`optional-simple`, and `configurable` profile. The same set reserves the
stricter `alertdialog`, `modal-only`, `required-message`, and
`close-request-only` choices adopted by AlertDialog. AlertDialog then adds its
explicit critical actions and least-destructive initial-focus policy without
pretending that Dialog makes the same product decisions.

## Shape

```ts
import { defineComponentDefinition } from "@nagi-labs/nagi-ui"

export const carouselDefinition = defineComponentDefinition({
  name: "Carousel",
  version: "2.0",
  status: "verified",
  references: [{
    id: "apg-carousel",
    title: "WAI-ARIA APG Carousel Pattern",
    url: "https://www.w3.org/WAI/ARIA/apg/patterns/carousel/",
    kind: "pattern",
    revision: "Rolling guidance snapshot",
    reviewedAt: "2026-09-01",
  }],
  semantics: [{
    id: "CAR-SEM-02",
    classification: "conformant",
    source: "WAI-ARIA APG Carousel Pattern",
    text: "The root exposes an author-localizable role description…",
    evidence: ["tests/component-catalog.test.ts", "tests/browser/expanded-catalog.spec.ts"],
    origin: { kind: "reference", referenceIds: ["apg-carousel"] },
  }],
  state: […],
  interaction: […],
  focus: […],
  anatomy: [
    {
      name: "root",
      match: { by: "part", scope: "carousel", part: "root" },
    },
    {
      id: "CAR-ANAT-01",
      name: "viewport",
      match: { by: "part", scope: "carousel", part: "viewport" },
      within: "root",
      outermost: true,
    },
    {
      name: "slide",
      match: { by: "part", scope: "carousel", part: "slide" },
      within: "viewport",
      multiple: true,
      outermost: true,
    },
  ],
  style: […],
})
```

The Button pilot uses the composed authoring form:

```ts
const nativeButton = adoptRequirementSet(nagiButtonRequirementsV1, {
  prefix: "BTN",
  profile: {
    element: "button",
    naming: "native-accessible-name",
    disabled: "native",
    activation: "browser",
  },
  evidence: {
    "SEM-01": ["packages/core/src/test/button-contract.ts"],
    "STATE-01": ["tests/button-control.test.ts"],
    "INT-01": ["packages/core/src/test/button-contract.ts"],
  },
})

export const buttonDefinition = defineComponentDefinition({
  name: "Button",
  version: "2.0",
  status: "verified",
  adopts: [nativeButton],
  semantics: [/* Nagi safe-type policy */],
  state: [/* Nagi focusable-disabled policy */],
  interaction: [/* Nagi composition and suppression policy */],
  focus: [/* Nagi browser-owned focus boundary */],
  anatomy: [/* owned structural identity */],
  style: [/* Nagi CSS axes */],
})
```

`defineComponentDefinition` expands adopted statements into the ordinary
`semantics`, `state`, `interaction`, and `focus` arrays. Existing documentation
and contracts therefore consume one resolved shape; they do not need a second
code path for standard requirements.

The Requirement set owns the allowed profile vocabulary as well as its
statements. Composition fails if a component omits a choice, invents a choice,
or selects a value the set does not support. A statement is source-backed by
default; a genuinely shared Nagi choice carries an explicit versioned `policy`
instead of being attributed to an external reference. For example, `nagi/button`
accepts only `element: button`; changing the profile to `element: div` cannot
retain the native-button Requirements accidentally.

Each adopted source records:

- a stable local source ID;
- the exact source URL;
- whether it is a fixed standard, Living Standard, pattern, or example;
- its fixed version or rolling-snapshot label;
- the date Nagi reviewed it.

A source used by only one component is recorded directly in that Component
Definition through `references` and `origin.kind: "reference"`. This preserves
the same URL, revision, and review date without manufacturing a one-component
Requirement set. Shared guarantees use `adopts`; component-specific standards
provenance uses `references`; Nagi choices use a versioned `nagi` policy origin.

For a Living Standard or rolling APG page, the review date is part of the
snapshot identity. Where a stable upstream commit snapshot is available, a
future Requirement set may record that as its revision. A set named `V1` is
immutable: reviewing a substantive upstream change produces `V2` instead of
rewriting components that adopted `V1`.

Structured statements map a stable requirement ID to its classification,
authority, origin, prose, and test files. `origin.kind` distinguishes a
source-backed Requirement from a versioned Nagi policy, including policies
shared through a Requirement set. Audited anatomy rules carry IDs as well. Tests
verify that every audit ID appears in the Definition and that every named
evidence file contains the ID. Shared contracts reject undeclared or duplicate
IDs before registering their browser tests.

`verified` is not inferred from prose and does not mean that the Definition
executes its own interaction requirements. Repository evidence auditing checks
that each evidence path stays inside the repository, exists, and contains the
stable Requirement ID. The corresponding Node, browser, compiler, or manual
verification must still run successfully. A Definition with invented paths,
unstructured prose, missing origin metadata, or an anatomy Requirement without
evidence cannot validate as `verified`.

That mapping proves traceability, not semantic equivalence between prose and
test code. Representative mutations must also fail at the assertion intended to
protect the requirement. The current validation and its limits are recorded in
[`docs/audits/definition-framework-validation.md`](audits/definition-framework-validation.md).
Older string entries remain valid for gradual adoption, but the site labels
them unclassified and without mapped evidence. The `anatomy` field itself is
executable through `verifyAnatomy`.

## Functional anatomy

Some components' behavior depends on rendered structure, not only on which
element receives which binding. `useCarousel` measures the semantic slide
descendants of its scroll viewport; `useResizable` measures the separator's
immediate parent. Ownership makes this acute, because rewriting the DOM is the
point of owning the source.

An anatomy contract must therefore be stated over things that survive an
owner's edits:

- `{ by: "root" }` — the component root supplied to the verifier;
- `{ by: "part", scope: "carousel", part: "viewport" }` — an explicitly named component part;
- `{ by: "role", role: "group" }` — an ARIA role;
- `{ by: "role", role: "group", nameFrom: "aria-label" }` — a role with a non-empty author-provided name;
- `{ by: "element", element: "button" }` — a native element;
- `{ by: "marker", attribute: "data-custom-hook" }` — a legacy one-off marker attribute.

`data-scope` and `data-part` separate structural identity from user-facing
semantics. Use a part match when behavior or ownership tooling needs one stable
name even if the role or accessible name changes. Role and element matches
remain useful when the semantic or native identity is itself the structural
contract. The generic marker form remains available for legacy one-off
identities. New component anatomy should normally use `data-scope` /
`data-part` when no native element, role, or ARIA relationship expresses the
required structural identity.

**Never state an anatomy contract over a Nagi CSS class.** A class name is
derived from the DOM — from the file, the component, the native element, the
role, and the structural position — so it changes when the DOM changes. It is a
consequence of the structure and cannot anchor a requirement about it.

Structural requirements are expressed by relating parts:

```ts
{ name: "root", match: { by: "part", scope: "carousel", part: "root" } },
{
  name: "viewport",
  match: { by: "part", scope: "carousel", part: "viewport" },
  within: "root",
  outermost: true,
},
{
  name: "slide",
  match: { by: "part", scope: "carousel", part: "slide" },
  within: "viewport",
  multiple: true,
  outermost: true,
},
```

`directChildOf` forbids an element between the two parts. `within` allows any
depth. Carousel deliberately uses `within`: layout wrappers are not part of its
behavior contract. Parts resolve in declaration order, so every relationship
may only reference a part declared before it.

## Verification

Run the repository-wide manifest and evidence audit with:

```sh
vp run audit:definitions
```

The audit discovers every `blueprints/**/*.definition.ts` module, validates its
manifest, rejects duplicate component names, and checks repository evidence for
Definitions declared `verified`. CI runs the same command. Draft Definitions
are still structurally validated, but their evidence is not presented as a
complete guarantee.

```ts
import { verifyAnatomy, assertAnatomy } from "@nagi-labs/nagi-ui"
import { carouselDefinition } from "@nagi-labs/nagi-ui/blueprints/carousel/carousel.definition.ts"

const issues = verifyAnatomy(carouselDefinition, carouselElement)
```

| Code | Meaning |
| --- | --- |
| `missing-part` | A required part was not found in its declared scope. |
| `misplaced-part` | A part matched, but not where the structure requires it — usually an inserted wrapper. |
| `ambiguous-part` | A singular part matched more than once, so the structure no longer distinguishes it. |
| `missing-parent` | The part's declared parent is missing, so the part could not be checked. |
| `unknown-parent` | The Definition references a part that is not declared before it. |

`assertAnatomy` throws an `AggregateError` and suits tests and explicit dev
assertions.

Shared Playwright contracts pass the same serializable algorithm to
`locator.evaluate`, so package and owned fixtures do not maintain a second list
of part selectors.

For Carousel, the verifier finds the explicitly marked viewport and then the
outermost slide parts anywhere below it. Their exact depth is intentionally
unconstrained. Separate requirements and tests verify their ARIA semantics.

## What this catches

The shipped Carousel itself includes a layout wrapper between its scrollport
and slides. Browser tests operate that wrapped structure, while the anatomy test
confirms it remains valid. A missing viewport part or a viewport without slide
parts still fails verification.

`tests/definition.test.ts` covers the verifier itself.

Behavior is a separate layer. Shared contracts execute native semantics, state,
interaction, focus, anatomy, and applicable functional style against real
fixtures. DatePicker additionally composes its calendar and popup foundations;
DropdownMenu exercises a dynamic nested popup tree. Test titles are validated
against the supplied Definition, but assertion code remains the evidence. A
requirement may also need Node or compiler evidence when it cannot be
established honestly from one browser fixture.

Combobox and Dialog also demonstrate why a complete binding bundle includes
element registration. `listboxProps`, `triggerProps`, `popoverProps`, and
`dialogProps` carry their Vue ref callbacks along with attributes and event
handlers. The Template only chooses the destination with `v-bind`; behavior
never has to rediscover an owned element from the global document. Relationship
tests then resolve `aria-controls` and `aria-activedescendant` inside the
component scope while the collection changes.

## Semantic and structural identity

Carousel slides use `role="group"`, `aria-roledescription="slide"`, and an
accessible name from their visible heading plus position text. APG does not
assign a separate role to the scroll viewport. Nagi deliberately extends the
pattern because its viewport is focusable for native keyboard scrolling:
`viewportProps` exposes a named `group` with a role description that defaults
to `slides`. Its accessible name defaults to the Carousel label and is
independently localizable through `slidesLabel`. `carouselRoleDescription`,
`slidesRoleDescription`, and `slideRoleDescription` localize the three
user-facing role terms and fall back to non-empty English values.

Structural identity is deliberately separate:
`data-scope="carousel" data-part="viewport"` identifies the viewport to the
Definition and ownership tooling without turning a localized accessible name
into an implementation key. The complete `viewportProps` binding includes the
Vue ref callback, semantics, focusability, and scroll handlers. The Blueprint
chooses the destination with one `v-bind` and contains no registration callback
or type cast.

A matching slide group inside an outer slide belongs to consumer-owned nested
content and is ignored. Runtime discovery uses the `data-scope` / `data-part`
identity and checks the nearest scoped Carousel root, so a nested Carousel keeps
its own slides. It never uses a localized `aria-roledescription` as an
implementation locator.

## Adding a Definition

1. Write `blueprints/<component>/<component>.definition.ts`.
2. Add the file to the component's ownership bundle in `cli/ownership.mjs`, so
   an owner receives the guarantees with the source.
3. Register it in `site/data/component-definitions.ts` to replace that
   component page's `Definition · WIP` notice with the authored documentation.
4. If the anatomy carries structural requirements, add a failure test that
   proves the requirement is enforced, not merely described.
5. Add an intentional behavioral or style mutation and verify that the shared
   contract fails at the expected assertion, not merely somewhere in the test.
