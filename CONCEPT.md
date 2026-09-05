# Nagi UI Concept

> **Nagi UI provides readable Vue components and the executable knowledge needed
> to own, change, and maintain them.**

Traditional component libraries keep their implementation private and recover
flexibility through runtime APIs: compound components, render indirection,
configuration matrices, and state-machine conventions that consumers must
learn before making structural changes. Nagi changes the premise. It publishes
a concrete implementation and the tests that define its guarantees, then lets
the application own both.

Nagi is therefore not primarily a package-first component library. It is a
methodology and toolchain for creating an owned UI system that humans and AI
agents can inspect, modify, test, and maintain using ordinary Vue development
practices.

Nagi UI began as a reference implementation and stress test for **Nagi CSS**. That remains an important role, but the broader concept is:

```text
Component Contract and Implementation tests
        ↓
Canonical Implementation
        ↓
Own
        ↓
Test / Verify
        ↓
Visual Catalog
        ↓
AI-assisted Maintenance
```

The goal is not maximum runtime configurability. The goal is to move
flexibility out of a black-box runtime and into **controlled source ownership
with explicit, executable guarantees**.

The maintenance model is intentionally visible:

```text
Readable Vue Blueprint
        +
Component Contract tests: what compatible implementations preserve
        +
Implementation tests: how this source provides it
        ↓
Own, modify, and verify with ordinary tools
```

The generated Component Definition is a browsable projection of that knowledge,
not a second specification maintained beside the tests.

---

## 1. Own-first

The primary Nagi UI model is source ownership.

The experience should feel closer to initializing a project than installing a single component dependency:

```bash
nagi-ui init
```

This creates a UI workspace inside the repository: the place where the team owns and maintains its component library.

Conceptually:

```text
ui/
├── components/
│   ├── Button.vue
│   ├── Dialog.vue
│   └── Select.vue
├── tests/
│   ├── contracts/
│   └── implementations/
├── scenarios/
└── catalog/
```

Then components can be added:

```bash
nagi-ui add button dialog select
```

The relationship is:

```text
Nagi UI
   ↓ bootstrap
Your UI System
```

You do not merely keep depending on Nagi UI's components. Nagi UI helps you establish and maintain your own component library.

---

## 2. Package mode is a convenience

Nagi UI may also provide a normal package:

```bash
vp add @nagi-labs/nagi-ui
```

This is useful for evaluation, simple use cases, or teams that do not need structural customization.

However, package mode is not the primary design constraint.

If a canonical component API no longer expresses the structure you need, the intended path is:

```text
Package
   ↓
Use as-is
   ↓
Need deeper structural customization
   ↓
Own the source
```

This means Nagi UI does not need to expand its public API to support every structure that a consumer might eventually want.

---

## 3. Structural flexibility does not belong in the public API by default

Traditional package-based UI libraries often expose highly flexible composition APIs because consumers cannot edit the implementation.

This frequently leads to APIs such as:

```text
Root
Trigger
Portal
Overlay
Content
Header
Title
Description
Close
...
```

Nagi UI starts from a different assumption.

For the common case, prefer a small Vue-native API:

```vue
<NDialog v-model="open" title="Profile">
  ...

  <template #actions>
    ...
  </template>
</NDialog>
```

If an application needs a fundamentally different anatomy, it should own the source and modify it directly.

A core rule is:

> **Configuration belongs in the API. Structural customization belongs in owned source.**

Slots are not unlimited escape hatches either. They should correspond to anatomy positions explicitly defined by the component definition.

---

## 4. Component Definition

A Nagi UI component is not just a `.vue` file.

Each component should have structured Component Contract and Implementation tests describing
what it guarantees. The Component Definition shown to maintainers is generated
from those tests and executable anatomy rules; it is not a second prose manifest
that repeats them.

For example, a Dialog definition may include:

### Semantics

- exposed as a dialog
- has an accessible name
- optional accessible description
- modal semantics when appropriate

### State

- open / closed
- dismissible / non-dismissible
- supported disabled states

### Interaction

- opens from its trigger
- closes through an explicit close action
- supports Escape dismissal when defined

### Focus

- moves focus into the dialog when opened
- contains focus while modal
- restores focus after closing

### Structure

- canonical semantic HTML
- canonical anatomy
- canonical owned DOM boundaries

### Style

- canonical Nagi CSS
- supported variants
- documented visual states

Named test functions, runner titles, native classification metadata, and their
assertions are the operational source of truth. Documentation and the catalog
Definition are projections of those ordinary test results.

---

## 5. Tests are part of ownership

Source ownership should not mean copy-and-forget.

Tests are part of the public maintenance interface. They do more than protect
Nagi's package from regressions: they show an owner what the component promises,
which implementation choices are local, and how a proposed edit will be judged.
The source explains the implementation; the tests explain the safe boundary for
changing it.

Nagi UI treats these as one unit:

```text
Component Source
+
Tests
+
Scenarios
+
Generated Definition
```

If a team owns a Dialog and moves the close action, changes the DOM hierarchy, or modifies the layout, that is fine.

The important question is whether the component still satisfies the guarantees it claims to provide.

For example, structural changes should not accidentally break:

```text
Dialog semantics
Accessible naming
Focus containment
Focus restoration
Escape behavior
Explicit close behavior
```

If an existing test fails after an owned modification:

```text
Was the behavior change accidental?
  → Fix the implementation

Was the behavior change intentional?
  → Update the local tests and scenarios
```

Ownership means the local repository becomes the authority.

The goal is not to prevent divergence. The goal is to make divergence explicit and testable.

---

## 6. Reusable Conformance Contracts

Some tests can be provided by Nagi UI as reusable conformance contracts:

```ts
dialogContract(...)
tabsContract(...)
comboboxContract(...)
```

The purpose is not to encode the entire implementation in a generic test framework.

A conformance contract should focus on properties that remain meaningful across implementations:

1. **Semantics**
   - roles
   - accessible names
   - ARIA relationships

2. **State**
   - selected
   - expanded
   - checked
   - disabled

3. **Keyboard**
   - Enter / Space
   - Arrow navigation
   - Escape
   - Home / End
   - component-specific keyboard behavior

4. **Focus**
   - focusability
   - focus movement
   - roving focus
   - focus containment
   - focus restoration

Implementation-specific behavior remains in local tests:

- async loading
- virtualization
- custom filtering
- project-specific logic
- animation details
- visual layout
- application-specific extensions

The conformance layer must not become a second UI framework.

---

## 7. Contract Core Should Be Framework-free

Nagi UI's canonical implementation is Vue, but UI conformance itself does not need to be Vue-specific.

The contract layer ultimately cares about rendered behavior:

```text
Vue component
React component
Svelte component
      ↓
Rendered DOM
      ↓
Semantics / Keyboard / Focus
```

The contract core should therefore be:

> **Framework-free, DOM-based, and browser-first.**

React Aria test-utils is an important prior art and should be studied closely for:

- semantic discovery
- ARIA pattern testers
- interaction modeling
- complex widgets such as ComboBox, Tree, and Table

However, Nagi UI should not require React merely to test Vue components.

The better model is to reproduce the useful ideas around a framework-neutral DOM/browser boundary.

Initially, it is reasonable to be:

> **Framework-free, browser-first, Playwright-based.**

There is no need to abstract every test runner at the same time.

---

## 8. Semantic Discovery

Conformance contracts should not depend on:

- CSS classes
- `children[n]`
- fixed DOM ordering
- snapshots
- implementation-private selectors

Prefer discovery through observable semantics:

- role
- label
- accessible name
- state
- ARIA relationships

Discovery and assertion should also be separated.

For example, if accessible naming is itself under test, avoid using that accessible name as the only way to find the component.

Instead:

```text
Find role="dialog"
        ↓
Assert accessible name separately
```

If a custom locator adapter is needed, expose a restricted semantic query API rather than raw CSS selectors or index-based DOM access.

A useful rule is:

> **If an internal detail cannot be located semantically, question whether it belongs in a generic conformance contract at all.**

---

## 9. Keep Versioning Lightweight

Nagi's upstream component sources and test suites should be versioned.

An owned component should retain provenance such as:

```text
Based on: nagi/dialog@1.3
```

That information is valuable because it gives both humans and AI agents a baseline for future comparison.

Nagi UI does not need to centrally track every divergence, waiver, or upstream change.

After ownership, the local repository is the source of truth:

```text
Owned source
+
Local tests
+
Local scenarios
+
Git history
```

If the owned Dialog is based on `nagi/dialog@1.3` and upstream is now `1.6`, an AI agent can review the semantic differences:

```text
1.4
- Focus restoration bug fix
→ Recommend applying

1.5
- New fullscreen variant
→ Not relevant locally

1.6
- Improved aria-describedby handling
→ Recommend applying
```

Then the team selectively applies useful changes and reruns verification.

Instead of building a complex synchronization system, Nagi UI relies on:

> **Explicit facts + Git history + executable tests + AI reasoning.**

---

## 10. Component Catalog / Workbench

Owned components should remain visible as a coherent UI system.

Without dedicated tooling, copied components eventually become ordinary files scattered across the repository.

Nagi UI should provide a component catalog or workbench for visually inspecting and managing the owned UI library.

It does not need to be Storybook specifically.

A component view may show:

```text
Dialog

Based on
nagi/dialog@1.3

Scenarios
- Default
- Destructive
- Long content
- Non-dismissible

Verification
✓ Nagi CSS
✓ Accessibility
✓ Interaction
✓ Browser tests

Source
ui/components/Dialog.vue
```

The catalog may eventually expose:

- component inventory
- visual states
- scenarios
- source location
- tests
- definitions
- upstream provenance
- verification status

The purpose is to preserve the UI library as a system even after the source is fully owned.

---

## 11. Scenarios Are More Than Demos

Story-like scenarios should represent supported states of a component, not just documentation examples.

For example:

```text
Button
- Default
- Disabled
- Loading
- Icon-only
- Destructive
```

The same scenarios can support:

```text
Catalog rendering
Visual regression
Interaction tests
Accessibility checks
AI verification
```

If an owned component introduces a new supported state:

```text
Implementation changes
        ↓
Requirement tests change
        ↓
Scenario added
        ↓
Generated Definition updates
```

This keeps the component's visible behavior and executable expectations aligned.

---

## 12. AI-assisted Maintenance Is a Design Assumption

Nagi UI assumes that AI agents will participate heavily in UI maintenance.

The important capability is not merely that AI can generate code.

It is that AI can change the code and then verify whether the result remains valid.

A typical loop is:

```text
AI modifies component
        ↓
Nagi CSS
        ↓
Static verification
        ↓
Component tests / contracts
        ↓
Scenario rendering
        ↓
Browser / visual verification
```

Nagi UI should not create a huge DSL purely for AI.

The preferred model is:

> **Keep the source and definitions understandable to humans, and make correctness machine-checkable.**

This is the same general philosophy as Nagi CSS.

---

## 13. Relationship to Nagi CSS

Nagi CSS is the foundation.

```text
Nagi CSS
────────────────
How should native CSS be written?
How is identity derived?
Who owns a selector?
How is state represented?

Nagi UI
────────────────
Can that model sustain a real UI system?
How should components be owned?
How should they be tested and maintained?
```

Nagi UI is both a reference implementation and a stress test for Nagi CSS. At
measurement commit `23f409238fed4656ed1ffbf390971c46afc0e21c`, the documentation site contains 555
explicit base identities. Of these, 426 / 555 (76.8%) are determined by the
contract after the authored structure is known: their identities follow from
the route or file surface, component boundary or slot, role, STN position, or
native element mapping. Another 129 / 555 (23.2%) select from four bounded
anatomy words, giving 555 / 555 (100.0%) base identities that require no new
vocabulary. Including 176 implicit component identities, 602 / 731 (82.4%)
are contract-determined and 731 / 731 (100.0%) require no new vocabulary. Open-ended
author vocabulary is concentrated in 147 variant occurrences across 81 stems.

This is a self-hosted evaluation of Nagi UI, which is designed around Nagi CSS.
It does not show that the same rates generalize to third-party codebases or
that naming derivation reduces maintenance time or human cognitive load. See
the definitions, denominators, machine-readable results, semantic-erasure
experiment, and reproduction command in
[`docs/evaluations/naming-derivation.md`](docs/evaluations/naming-derivation.md).

---

## 14. What Nagi UI Is Not Trying to Do

Nagi UI is not trying to:

- maximize public API flexibility
- make compound components the default solution
- genericize every ARIA pattern
- fully automate synchronization with upstream owned-source changes
- centrally track every downstream divergence
- build a second framework inside Vue
- replace application E2E tests
- finish an entire UI ecosystem before Nagi CSS can be published

The system should remain small enough that the methodology is easier to understand than the problem it solves.

---

## 15. Initial Product Shape

A reasonable first owned-source workflow is:

```bash
nagi-ui init
nagi-ui add button dialog tabs
nagi-ui dev
nagi-ui check dialog
```

Conceptually:

### `nagi-ui init`

- configure Nagi CSS
- create the owned UI workspace
- configure component verification
- initialize the component catalog
- install AI-agent guidance

### `nagi-ui add`

Add a canonical component together with its:

- source
- Component Contract and Implementation tests
- generated Definition catalog entry
- scenarios
- provenance metadata

### `nagi-ui dev`

Open the component catalog/workbench.

### `nagi-ui check`

Run the relevant static, behavioral, accessibility, and browser verification.

The exact CLI and directory structure remain implementation details.

---

## 16. Positioning

Nagi UI is not positioned as another Vue component package or as a headless
runtime with a different composition API. Its canonical description is:

> **Nagi UI provides readable Vue components and the executable knowledge needed
> to own, change, and maintain them.**

The shorter ownership message is:

> **Own your components. Keep the tests that explain how to change them.**

Source copying alone is not the product. The product is the complete maintenance
lifecycle:

```text
Component Contract and Implementation tests
        ↓
Canonical Implementation
        ↓
Own
        ↓
Modify
        ↓
Verify
        ↓
Maintain as a coherent UI system
```

The component library is the starting implementation. Nagi's distinguishing
product is the methodology and tooling that keep an owned UI library readable
and verifiable for humans and AI agents.

---

## 17. Prior art

Surveyed August 2026. Nearly every individual idea in this document has prior
art. This section exists so that work is not rebuilt from scratch, so that
existing solutions can be studied, and so that descriptions of Nagi UI stay
accurate. None of these ideas originated here.

| Idea                                                                            | Prior art                                                                              |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Source-ownership CLI                                                            | shadcn/ui, shadcn-vue, jsrepo                                                          |
| Shipping source together with tests, examples, and stories                      | jsrepo (`--with test`, file roles)                                                     |
| Agent instructions distributed with components                                  | shadcn/skills                                                                          |
| Machine-readable component specifications                                       | OpenUI Specification (openuispec.org); W3C UI Specification Schema CG (closed 2026-05) |
| Component anatomy, states, and behavior vocabulary                              | Open UI                                                                                |
| Specification linked to executable tests                                        | ARIA APG (tests bound to its own reference examples); ACT Rules Format 1.1             |
| Portable accessibility conformance suites run against arbitrary implementations | **Evinced Unit Tester** (commercial)                                                   |
| A thin consumer call where the suite lives in the upgradable package            | Evinced Unit Tester                                                                    |
| Scenarios driving browser-level verification                                    | Storybook (portable stories, Vitest addon)                                             |
| Behavior as typed attribute bundles bound to your own markup                    | React Aria hooks, Ariakit, Melt UI builders, **Zag.js (including Vue)**                |
| Native-platform-first implementation                                            | Ignite UI Web Components and other platform-native projects                            |

Two entries deserve emphasis as the closest existing work, worth studying
directly.

**Evinced Unit Tester** ships portable, pattern-based conformance testing:
APG-derived suites covering roles, names, ARIA relationships, required states,
state transitions, keyboard activation, roving focus, focus traps, Escape
dismissal, and modal inertness, executed in real browsers and invoked by a thin
consumer call. It is a commercial product, so its suites cannot be reused here,
but it establishes that this form of verification works in practice.

**Zag.js** separates behavior from rendering as framework-independent machines
exposing typed prop bundles (`api.getTriggerProps()`), with a Vue adapter and
machines modelled on the APG. Its `createAnatomy()` declares a component's
parts once and derives attributes and CSS selectors from that declaration,
which is a useful precedent for declaring anatomy as a value rather than as
prose. Nagi adopts the useful `data-scope` / `data-part` split for explicit
structural identity while keeping user-facing ARIA semantics independent. The
difference is not the attribute vocabulary: Zag's machine is the component
state authority, while Nagi's Definition, visible owned Vue source,
Implementation, and conformance evidence remain separate layers. A Nagi CSS
class is still never an anatomy anchor because it is derived from the DOM and
changes with it. See the functional anatomy contracts in the
[component layer audit](docs/component-layer-audit.md). Zag's state ownership
model is also the opposite of the standard Blueprint Implementation: the machine owns
state that those Blueprints delegate to native elements and the browser's top
layer.

### A Definition collects Component Contract and Implementation tests

The three names are not peer concepts. Component Contract tests verify what users and
applications can rely on across implementations. Implementation tests verify how one
concrete implementation provides those guarantees. A Component Definition is
the generated view that collects both groups:

```text
Component Contract tests ─┐
                         ├── generated Component Definition
Implementation tests ─────┘
```

The package's default Blueprints use platform-first Implementations. An owned
application may instead use a Motion-owned Implementation—for example delegated
enter/exit presence—while claiming the same Component Contract only after its
shared Contract and local Implementation suites pass. Implementations are not
runtime variants or props; they describe the source that actually ships in that repository.

This boundary follows established library practice rather than inventing a
Nagi-only lifecycle. Ark UI and Zag Presence distinguish logical presence from
mounting and expose exit completion. Radix UI and Reka UI keep animated content
mounted and allow JavaScript animation libraries to own unmount timing through
`forceMount`. Floating UI distinguishes logical `open` from `isMounted`, and
Base UI exposes `keepMounted` plus animation-aware teardown. Nagi adopts the
shared architectural lesson—visibility intent and render presence may have
different owners—without adding any of those runtimes to core.

The generated Definition remains implementation-specific. It collects one
Component Contract suite plus exactly one Implementation suite; it never pretends that
native and Motion implementations have identical DOM. Anatomy and native
element constraints therefore belong to Implementation tests; observable user
guarantees belong to Component Contract tests.

The
[Open UI Component Specification Template](https://open-ui.org/component-spec-template/)
is Nagi's authoring checklist and shared vocabulary, not the sole source of
truth. Normative requirements come from HTML, ARIA, and CSS; APG supplies
established but informative interaction guidance. Zag, Ark UI, Radix, Reka,
Base UI, and Motion are implementation prior art. The operational source of
truth for what Nagi ships is the passing Component Contract and Implementation test set. The
Definition is its generated documentation view. External references normally
belong to the component or suite; per-test source revisions are required only
for an explicit pinned conformance claim.
See
[Component Definitions](docs/component-definitions.md#authoring-model-and-sources-of-authority).

### Scope of the conformance contracts

A general accessibility product can only assert what any conformant
implementation must satisfy. The APG accepts both automatic and manual tab
activation, so a generic suite cannot demand either one. Because a Definition
declares the choice and the contract takes it as a capability parameter —
`tabsContract({ activation: "manual", orientation: "vertical" })` — the suite
can verify the policy this component claims to implement. Select's native
versus custom modes and ComboBox's `editable` / `selection` / `popup`
capabilities work the same way.

Two limits. This is a matter of what the suite is given, not a technical
barrier: a general product could take capability parameters too. And the
shipped contracts only exercise accessibility-adjacent policy so far
(activation, orientation, dismissal). Genuinely non-accessibility invariants —
Table routing consumer attributes to its overflow wrapper, OTPField rendering
one input rather than N, Select being deliberately native — are within the
design but are not yet demonstrated by a contract.

### Consequences

- Do not rebuild what already exists. Storybook covers catalogs and scenarios;
  `nagi-ui own` already covers source copying. Neither needs a replacement.
- The W3C community group pursuing a general machine-readable UI meta-model
  closed in May 2026 without shipping one. The decision not to build a schema
  compiler or component-definition DSL stands.
- This landscape moves quickly, and the survey above will go stale. Re-check it
  before relying on any entry.
