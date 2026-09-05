# Component Definitions

A **Component Definition** is the generated maintenance view for one concrete
component implementation:

```text
Component Contract tests ─┐
                         ├── generated Component Definition
Implementation tests ─────┤
Executable anatomy rules ─┘
```

Its purpose is not to make Nagi more abstract. It makes the maintenance method
public. The owned Vue source shows how the component works; Component Contract and Implementation
tests show what may change and what must remain true. The Definition only groups
that executable knowledge so a maintainer can inspect it by component and
section.

Component Contract and Implementation classify different kinds of executable requirements:

- the **Component Contract** records what an application and its users can rely
  on regardless of the renderer: public API, conceptual parts, semantics,
  state, interaction, focus, and visual guarantees;
- the **Implementation** records how this source provides those
  guarantees: native elements or a delegated runtime, state and presence
  owners, DOM locators and structural constraints, binding destinations, and
  implementation-only functional style.

Component Contract and Implementation are not runtime modes and are not selected with a
component prop. One concrete implementation runs one Component Contract suite and its own
Implementation suite. The Definition is their catalog and documentation projection;
it is not a third set of guarantees that authors repeat by hand.

The owned source takes ownership of its Implementation, but keeps the Component
Contract and shared runner as development dependencies. Nagi UI therefore is
not native-only. Its standard Blueprint, an owned variant, and a Deep Sea
Motion variant can all claim the same Contract revision while running different
Implementation suites.

## Compatibility identity

A Component Contract is identified by an immutable ID and revision, such as
`nagi/carousel@1`. That identity means more than “current Carousel tests pass”:
it names the complete shared guarantee accepted by interchangeable
implementations. Once published, requirements in revision 1 are not added,
removed, or reinterpreted in place. Any such change creates
`nagi/carousel@2`. If the component's underlying meaning changes rather than
its compatibility generation, create a different Contract ID.

Nagi UI is currently at `0.1.x`, and every pilot Definition marked `draft`
uses a working Contract revision rather than a published compatibility
commitment. Those draft revisions may still be corrected in place while the
boundary method is being validated. Automated revision freezing is therefore
deferred until a Definition first becomes `verified` or Nagi publishes a
stable Contract policy. At that boundary, its complete Requirement set must be
snapshotted and any later addition, removal, or semantic change must create a
new revision. This keeps the `0.1` work honest without building publication
infrastructure before there is a published Contract to protect.

Package Blueprint, owned source, and Motion-driven source are Implementations.
Native scroll, CSS scroll snap, native Popover, Motion presence, and portal
ownership belong to those Implementations, not to the Component Contract.
Meaning, accepted state, user operations, focus outcomes, and other guarantees
that must survive replacement belong to the Component Contract.

### The Contract preserves component identity

Implementation independence is not a reason to weaken a Contract. A Component
Contract is not the smallest intersection of the Implementations that happen to
exist today. It defines the observable identity of the component first, and
each Implementation must conform to it. If a custom or Motion-driven
Implementation cannot preserve that identity, Nagi changes that Implementation
or gives it a different Contract; it does not silently remove the guarantee
from the existing Contract revision.

For example, a Carousel Contract must still describe an ordered slide
collection, accepted current position, navigation, boundary and disabled
behavior, announcements, and focus outcomes. Native scrolling, CSS scroll
snap, transform layout, and Motion exit timing can vary by Implementation.
Reducing the Contract to a role and accessible name would no longer identify a
Carousel and is therefore a boundary failure.

Use replacement as the boundary test:

> If replacing the Implementation requires consumer code or a user-observable
> expectation to change, either the missing guarantee belongs to the Contract
> or the replacement is a different Contract.

This rule does not mean that every native-platform choice is automatically an
Implementation detail. If native form submission, validation, or another
platform behavior is part of the public promise, its observable result belongs
to the Contract. The concrete element belongs to the Implementation only when
another implementation can provide the same promise faithfully. Contract
authoring therefore starts from component identity and replacement
expectations, not from a mechanical `native` versus `custom` classification.

### Contract ownership under component composition

Implementations should compose existing components when a child can keep its
own Contract and coordinate with the parent through public props, models,
events, and slots. Composition deliberately reuses Implementation code; it
must not duplicate ownership of the child's guarantees in the parent Contract.

For example, DateField owns date-segment editing and Calendar owns grid
navigation. A DatePicker that composes them owns only the guarantees created by
their integration: both surfaces share one accepted value, calendar selection
updates the field, popup dismissal follows the DatePicker policy, and focus is
restored to the DatePicker invoker. A DatePicker browser test may exercise
Calendar keyboard behavior on the way to an integration assertion, but the
DatePicker Contract does not repeat Calendar's keyboard Requirement.

Use this distinction during review:

- **Contract ownership must not overlap.** Give each observable guarantee one
  component owner and do not copy its Requirement ID or claim into a parent.
- **Implementation reuse should overlap.** A parent may render a child
  Implementation and depend on its public Contract instead of rebuilding the
  same DOM and Behavior.
- **Integration evidence may cross boundaries.** A parent test can operate a
  child to prove the connection between them, provided its title and assertion
  describe the parent-specific outcome.

Do not encode the complete transitive component tree into Contract revision
identities. An Implementation audit records important component dependencies;
the parent Contract remains a statement of public compatibility rather than a
package-manager lockfile.

The Contract API lists consumer-facing members whose meaning, state, or
operation must survive replacement. Generic Vue/DOM pass-through such as
`id`, `class`, `style`, `title`, and ordinary forwarded DOM events need not be
repeated when they do not change component-specific behavior. Component props,
models, slots, or methods that select a state or interaction policy are not
pass-through and must either appear in the Contract or be explicitly identified
as an Implementation-only extension.

Contract API completeness is currently a review responsibility, not another
reflection framework. For each pilot, a maintainer or AI reviewer compares the
Blueprint's public props, models, slots, events, and exposed methods with the
Contract API and asks:

- does replacement require this member or its observable meaning to survive;
- is a component-specific member missing from the Contract;
- is an Implementation-only extension mislabeled as portable; and
- do the Contract name and the shipped Vue API describe the same operation.

The result belongs in the component audit. Add automation only after repeated
reviews expose one stable mechanical rule; do not attempt to infer semantic
compatibility from TypeScript names alone.

## Authoring model and sources of authority

Nagi uses the
[Open UI Component Specification Template](https://open-ui.org/component-spec-template/)
as a shared authoring checklist and vocabulary. Definition authors review its
APIs, appearance, anatomy, states and interactions, accessibility,
globalization, security, performance, platform requirements, tooling, and
resources instead of inventing a different checklist for every component.
Open UI describes this template as a point-in-time guide; it is not the
normative authority for HTML, ARIA, or CSS conformance and it is not Nagi's
shipped specification.

The source hierarchy is explicit:

| Role                                      | Source                                                           | Nagi treatment                                                  |
| ----------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------- |
| Normative platform requirements           | HTML, ARIA, and CSS specifications                               | Authoring authority and component-level reference               |
| Established interaction guidance          | WAI-ARIA Authoring Practices Guide                               | Pattern baseline; tests express the policy Nagi actually adopts |
| Authoring checklist and shared vocabulary | Open UI Component Specification Template and component research  | Review input, not a conformance standard                        |
| Implementation prior art                  | Ark UI, Zag, Radix, Reka, Base UI, Motion, and similar libraries | Input when choosing and testing a concrete Implementation       |
| Executed Nagi evidence                    | Passing Component Contract and Implementation requirement tests  | Operational evidence for the registered Requirements            |

Nagi adds only the maintenance mechanisms needed to collect those tests:

- stable Requirement IDs supplied by named test functions;
- Component Contract/Implementation layering and non-exclusive section facets through native runner metadata;
- generic anatomy rules that are both test input and documentation input;
- generated catalog and site views.

The Open UI headings do not need to become one runtime field each. Authors use
them during review, then add tests only for guarantees the component actually
makes. Public API, conceptual parts, semantics, state, interaction, focus, and
portable visual behavior are Contract tests. Concrete DOM discovery,
structural constraints, native-element choices, and presence ownership are
Implementation tests. Globalization, security, or performance may be noted in the
component audit as not applicable rather than padded with invented fields.

`verified` is not an authored claim. It is derived when every collected
Requirement has an executable test or generic anatomy rule and the relevant
suites pass. The test title is the human-readable guarantee and its body is the evidence; a string such as
`evidence: ["tests/browser/toast.spec.ts"]` is not evidence and must not be the
long-term verification mechanism.

Definition generation is deliberately not a widget runtime. No Blueprint reads
the generated view while rendering. Tests execute the requirements; the site
and ownership tooling collect the same registrations without a second list of
behavioral prose.

Button, Carousel, Combobox, Dialog, and DatePicker are the first
Component Contract/Implementation classification pilots.
Button separates portable activation and disabled behavior from the standard
Blueprint's native-button choice. Carousel separates portable navigation from
native scrolling, CSS scroll snap, viewport anatomy, and scroll
reconciliation. Toast then exercises the same boundary across presence
ownership: notification and focus guarantees belong to its Contract tests;
immediate Vue removal or Motion-owned exit completion belongs to its Implementation
tests.

External specifications are authoring references, not runtime dependencies or
test evidence. References belong to the component or suite, not to every test.
Nagi does not require a source ID and revision on each Requirement. A revision
is recorded only when Nagi formally claims conformance to a pinned upstream
version or when an upstream interpretation must be preserved. Otherwise the
reference URL, the requirement test, and git history are sufficient.

Ten compatibility Definitions currently live beside their Blueprints and
travel in the matching ownership bundles. They cover Button, Listbox,
Combobox, Popover, DropdownMenu, DatePicker, Dialog, AlertDialog, Carousel, and
Toast. Their current Requirement sets, origin metadata, and evidence paths are
legacy migration inputs, not the target authoring model. Button, Carousel,
Combobox, Dialog, and DatePicker now additionally generate their behavioral
catalog from ordinary Playwright tests; the other five components have not migrated. Behavioral and
structural assertions must be preserved while those manifests are replaced by
test registrations; metadata that exists only to connect prose to a file can
then be deleted.

## Shape

Definition authoring uses the test runner directly. Nagi does not wrap
Playwright or `node:test` in a Requirement DSL:

```ts
test.describe(
  `Carousel / Component Contract / ${options.name}`,
  {
    tag: ["@definition", "@carousel", "@component-contract"],
    annotation: [
      {
        type: "component-contract",
        description: "nagi/carousel@1",
      },
      {
        type: "component-contract-requirements",
        description: "CAR_CONTRACT_01,CAR_CONTRACT_02,CAR_CONTRACT_03",
      },
      {
        type: "reference",
        description: "https://www.w3.org/WAI/ARIA/apg/patterns/carousel/",
      },
    ],
  },
  () => {
    async function CAR_CONTRACT_02({ page }: { page: Page }) {
      await page.getByRole("button", { name: "Next slide" }).click();
      await expect(page.getByRole("group", { name: "2 of 3" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Next slide" })).toBeFocused();
    }

    test(
      "Navigation advances to the accepted slide",
      {
        tag: ["@interaction", "@state", "@focus", `@${CAR_CONTRACT_02.name}`],
      },
      CAR_CONTRACT_02,
    );
  },
);
```

The named function is the stable Requirement ID. Its ID contains the component
and Component Contract/Implementation layer, but deliberately does not contain a section name.
The test title explains one meaningful guarantee. Component and layer tags
identify its owner; one or more section tags attach searchable facets. The
function body is its evidence. Suite-level `reference`
annotations record the broad authoring baseline without repeating a URL on
every test. A Requirement-level reference annotation is reserved for a claim
that depends on one specific clause or pinned interpretation.

Playwright reports function IDs through their generated tags; its reporter does
not otherwise expose callback names. Writing `` `@${CAR_CONTRACT_02.name}` ``
keeps the metadata tied to the function without duplicating the ID as a string.
The collector rejects an ID whose component or Component Contract/Implementation layer does not
match its other tags, and rejects a Requirement with no section facet.

Each shared runner revision also declares its complete Requirement ID set once
at suite level. The collector compares that declaration with the tests actually
registered by every fixture. If package and owned fixtures both omit the same
test, disagree about the set, or register a test outside it, generation fails.
This completeness metadata is not a second prose specification: the ordinary
test title and body remain the guarantee and evidence. It prevents an
Implementation from weakening `nagi/carousel@1` merely by omitting a scenario
option.

Contract policy is fixed by the runner revision. Fixture options identify
locators, expected consumer-owned values, and other adapter data; they must not
turn core guarantees such as modal containment, boundary behavior, or dismissal
on and off. A genuinely different policy requires another Contract revision or
identity.

Sections are not exclusive storage locations. Semantics, state, interaction,
focus, anatomy, and style are different ways to find the same guarantee. For
example, “Escape closes the popup without committing and restores the trigger”
is one temporal guarantee with `interaction`, `state`, and `focus` facets. It is
stored once and shown under all three headings:

```json
{
  "key": "DTP_CONTRACT_06",
  "sections": ["state", "interaction", "focus"]
}
```

A Requirement may contain several assertions when they jointly describe one
user-observable flow. Split it only when the title hides unrelated guarantees,
one part has an independent change boundary, an Implementation supports only part of
it, or a failure no longer identifies the broken promise. Do not split merely
because an operation crosses state, interaction, and focus.

The same Contract suite function registers this title and body against package
and owned fixtures. Ownership does not keep claiming the package Blueprint's
Implementation identity: the standard Implementation suite runs only for the
package Blueprint unless the owned source explicitly registers its own
owner-qualified Implementation. An Implementation with a different state or presence owner supplies different
Implementation tests because its guarantees actually differ; it does not reuse a native
assertion under a rewritten description.

After ownership, the application owns the Vue Implementation and its local
Implementation tests. It continues to import the versioned Component Contract
runner from `@nagi-labs/nagi-ui/test` as a development dependency. A custom
fixture disables the standard Blueprint checks:

```ts
carouselContract({
  definition: deepSeaCarouselDefinition,
  includeStandardImplementation: false,
  // semantic fixture names and observable model outputs
});
```

Deep Sea registers `DEEP_SEA_CAROUSEL_IMPLEMENTATION_NN` tests for Motion
presence, reduced-motion policy, and its concrete layout. The shared
`CAR_CONTRACT_NN` tests execute against
`nagi/carousel@1`; native scroll and CSS scroll snap are not inherited.
`includeStandardImplementation: false` by itself makes only a Contract claim;
it does not prove or catalog the owned Implementation. A standalone consumer
report must additionally register at least one owner-qualified Implementation
suite. In Nagi's repository report, owned markup is deliberately a Contract
fixture while the package suite supplies the one cataloged standard
Implementation.

Every concrete Implementation suite must register exactly one Implementation
identity and at least one Implementation Requirement. A report may contain
several Implementation suites for the same Component Contract; their local
`CAR_IMPLEMENTATION_NN` IDs are namespaced by Implementation identity rather
than forced to be globally unique. Disabling the standard suite without
registering any Implementation in a standalone report is an error, but an
individual Contract-only fixture may coexist with another concrete suite in the
same report.
Implementation IDs are owner-qualified slash IDs, for example
`nagi/blueprint/carousel-native-scroll@1` or `deep-sea/carousel-motion@1`; they
are not forced into Nagi's Blueprint namespace.

The Deep Sea proof imports its Definition primitives, Contract, and runner through
packed package entrypoints (`@nagi-labs/nagi-ui/definition`,
`@nagi-labs/nagi-ui/contracts/carousel`, and `@nagi-labs/nagi-ui/test`). These
entrypoints ship executable JavaScript while
retaining the authored TypeScript as their type source. Consumer conformance
tests therefore do not depend on Playwright transpiling TypeScript inside
`node_modules`.

Node, browser, type, source, compiler, and visual checks may use different
runner reporters, but all project their ordinary test identity into the same
Component Contract/Implementation catalog.
The generated Definition groups those registrations for the site and ownership
bundle; it does not restate their assertions.

### Migration status

The repository still uses manually authored `defineComponentDefinition` values
for public API, conceptual parts, Implementation decisions, and executable anatomy.
Those values remain the compatibility format while each component migrates.
Button, Carousel, Combobox, Dialog, and DatePicker browser-behavior rows are
generated from passing Playwright results by `vp run definitions:generate`; their pages no longer use manually
authored Requirement prose for those rows. The site labels the recorded result
as `Browser evidence passed` while independently displaying `Contract audit
WIP`; it never turns passing browser discovery into a completed component
audit. Node, source, compiler, type, and visual reporters
must migrate before full `verified` status can be derived from the generated
catalog. New documentation must not present
an evidence path as stronger than it is: the corresponding assertion remains
the actual guarantee. Migration is complete only when component pages can be
generated from runner reports, extracted API data, and executable anatomy
without duplicating Requirement text in a Definition file.

### Delegated presence belongs to an Implementation

This split follows existing lifecycle designs rather than defining a Nagi-only
animation protocol:

- [Ark UI Presence](https://ark-ui.com/docs/utilities/presence) and
  [Zag Presence](https://zagjs.com/components/vue/presence) expose mounted
  presence and exit completion separately from requested visibility;
- [Radix animation](https://www.radix-ui.com/primitives/docs/guides/animation)
  and [Reka animation](https://reka-ui.com/docs/guides/animation) use
  `forceMount` when a JavaScript animation library must own unmount timing;
- [Floating UI transitions](https://floating-ui.com/docs/usetransition)
  distinguish logical `open` from `isMounted`;
- [Base UI animation](https://base-ui.com/react/handbook/animation) exposes
  `keepMounted` and animation-aware teardown.

A Motion-owned implementation should therefore register Implementation tests for
delegated presence, exit completion, interruption, and final removal. It must
keep requested visibility separate from rendered presence. Accessible naming,
focus restoration, Escape behavior, and state acceptance remain portable
Contract tests when the component promises them. Motion-specific spring values
remain owned style, not shared Contract requirements.

### Reference policy

References explain the authoring background; they do not prove a test. Keep
them once in component- or suite-level runner annotations instead of attaching
the same source object to every Requirement. A link is normally sufficient. A
test-level annotation is appropriate only when one Requirement depends on a
specific clause or pinned interpretation. Record a fixed revision only for an
explicit conformance target or when preserving one upstream interpretation is
itself important. Living Standards and rolling APG guidance must not acquire
artificial Nagi versions merely to make the manifest look precise.

A test may combine HTML, ARIA, APG convention, browser behavior, and a Nagi
product decision. Forcing one `source` field onto that test would be misleading.
The assertion should state the behavior Nagi guarantees; component-level
references and git history explain how that behavior was selected.

### Verification semantics

The test body is the evidence. Anatomy rules are executable inputs to the
generic DOM verifier and therefore count as tests rather than descriptive
metadata. The current browser projection uses `Browser evidence passed`: every
collected browser Requirement ran successfully for the working repository
revision, but the Contract boundary may remain WIP and other evidence families
have not yet been joined. `Contract audit ready` is a separate maturity
decision and is shown only when the Definition is marked `verified` and its
collected browser evidence matches and passes. A future
generated `verified` status requires every declared browser, Node, source,
compiler, type, and visual requirement to pass. File existence, matching
Requirement IDs, or links to external specifications are useful audit signals
but are not verification by themselves.

Representative mutations should still fail at the assertion intended to
protect the requirement. That determines whether a test is sensitive to the
claimed behavior rather than merely passing through the same scenario. The
current validation and its limits are recorded in
[`docs/audits/definition-framework-validation.md`](audits/definition-framework-validation.md).

## Functional anatomy

Open UI's conceptual anatomy and Nagi's executable DOM anatomy are related but
not identical:

| Layer                    | Example                                 | Meaning                                                    |
| ------------------------ | --------------------------------------- | ---------------------------------------------------------- |
| Contract `parts`         | Carousel `slide`                        | A portable concept every conforming implementation exposes |
| Implementation `anatomy` | native-scroll `viewport`                | A concrete element this implementation needs               |
| `contractPart` mapping   | DOM `slide` realizes conceptual `slide` | Connects a concrete locator to the portable vocabulary     |

Some implementations depend on rendered structure, not only on which element
receives which binding. Those locators and relationships belong to the
Implementation. `useCarousel` measures slide descendants of its scroll
viewport; a Motion Carousel may have no scroll viewport at all while still
exposing conceptual slides. `useResizable` measures the separator's immediate
parent. Ownership makes this acute, because rewriting the DOM is the point of
owning the source.

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
The separation is reciprocal: Nagi CSS does not use Nagi UI's `data-part`,
accessible names, or ARIA ID relationships to decide whether a local variant is
necessary. A structural marker such as `data-part="viewport"` and an explanatory
style variant such as `unit -viewport` may coexist because they belong to
different contracts.

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

During migration, run the repository-wide compatibility audit with:

```sh
vp run audit:definitions
```

The current audit discovers every `blueprints/**/*.definition.ts` module,
validates its compatibility manifest, and rejects duplicate component names.
Its evidence-path checks establish traceability only. CI must also run the
actual Node, browser, type, source, compiler, and visual suites that contain the
assertions.

The pilot collector executes the tagged Button, Carousel, Combobox, Dialog, and
DatePicker Playwright suites, rejects missing or mismatched function-ID tags,
requires one or more section facets while allowing several on one Requirement,
requires every Component Contract row to execute against both package and owned
fixtures, and requires each fixture to execute the complete set declared by the
Contract runner revision. Implementation rows are fixture-specific: copied or
customized owned source must not continue to claim the package Blueprint's
Implementation identity unless it still runs that exact complete suite. They may intentionally
guarantee package styling or another concrete implementation choice. The
collector writes that distinction into the catalog consumed by the site:

```sh
vp run definitions:generate
```

CI runs `vp run definitions:check` and fails when the committed site projection
does not match the passing test metadata.

Other runners need equivalent reporters before their checks can supply rows.
No separate evidence-path scan is needed for a component after all its evidence
has migrated.

```ts
import { verifyAnatomy, assertAnatomy } from "@nagi-labs/nagi-ui";
import { carouselDefinition } from "@nagi-labs/nagi-ui/blueprints/carousel/carousel.definition.ts";

const issues = verifyAnatomy(carouselDefinition, carouselElement);
```

| Code             | Meaning                                                                                |
| ---------------- | -------------------------------------------------------------------------------------- |
| `missing-part`   | A required part was not found in its declared scope.                                   |
| `misplaced-part` | A part matched, but not where the structure requires it — usually an inserted wrapper. |
| `ambiguous-part` | A singular part matched more than once, so the structure no longer distinguishes it.   |
| `missing-parent` | The part's declared parent is missing, so the part could not be checked.               |
| `unknown-parent` | The Definition references a part that is not declared before it.                       |

`assertAnatomy` throws an `AggregateError` and suits tests and explicit dev
assertions.

Shared Playwright contracts pass the same serializable anatomy algorithm to
`locator.evaluate`, so package and owned fixtures do not maintain a second list
of part selectors. The anatomy rule itself also supplies the generated
Definition row.

For Carousel, the verifier finds the explicitly marked viewport and then the
outermost slide parts anywhere below it. Their exact depth is intentionally
unconstrained. Separate requirements and tests verify their ARIA semantics.

## What this catches

The shipped Carousel itself includes a layout wrapper between its scrollport
and slides. Browser tests operate that wrapped structure, while the anatomy test
confirms it remains valid. A missing viewport part or a viewport without slide
parts still fails verification.

`tests/definition.test.ts` covers the verifier itself.

Behavior is a separate layer. Shared contracts execute semantics, state,
interaction, focus, anatomy, and applicable functional style against real
fixtures. DatePicker additionally composes its calendar and popup foundations;
DropdownMenu exercises a dynamic nested popup tree. The registered assertion
is collected into the generated Definition instead of being validated against
a separately authored prose row. A requirement may use Node or compiler
evidence when it cannot be established honestly from one browser fixture.

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

The target workflow is:

1. Create the component's ordinary Component Contract test suite and fix its
   immutable `nagi/<component>@revision` identity.
2. Create the standard Blueprint's ordinary Implementation test suite.
3. Give each test body a section-independent ID-shaped function name, a
   human-readable test title, and native component/layer/function-ID tags plus
   every applicable section facet. Keep one meaningful user flow together even
   when it spans state, interaction, and focus.
4. Keep upstream references in suite-level runner annotations. Add a
   Requirement-level reference only for a specific clause or pinned
   interpretation; do not add evidence paths by default.
5. Add the suites and executable rules to the ownership bundle, then regenerate
   the catalog consumed by the site.
6. Add an intentional mutation and verify that the expected assertion fails,
   not merely that the overall suite becomes red.

Until all runner reporters and source extractors exist, a compatibility
`blueprints/<component>/<component>.definition.ts` may still be required by the
current site and ownership tooling. Treat it as migration output, not as a
second authoritative description to expand indefinitely.
