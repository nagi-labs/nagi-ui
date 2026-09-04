# Nagi UI architecture

This document is the architecture contract for Nagi UI. Changes to public
behavior or component structure must preserve these principles or update this
document with the reason the boundary changed.

The product concept — Nagi UI as a system for building and maintaining the
component library an application owns — is defined in [CONCEPT.md](CONCEPT.md).
This charter governs how the canonical components are implemented.

Nagi exposes maintenance knowledge instead of hiding flexibility inside a
runtime abstraction. An owner should be able to read the concrete Vue source,
read the tests that define its safe change boundary, modify either deliberately,
and verify the result with ordinary repository tools. Generated documentation
is an index of that process, not a substitute for it.

## Portable contract, platform-first Blueprints

Nagi UI itself is not a native-only state machine. Component Contract requirement tests
record observable public API, conceptual parts, semantics, state, interaction,
focus, and visual guarantees without requiring one renderer or presence
mechanism. Implementation requirement tests record how one concrete source
provides them. The Component Definition is generated from one Component Contract suite,
one Implementation suite, and their executable anatomy rules; it must not restate the
same guarantees as a separate hand-maintained manifest.

A named test function supplies the stable Requirement ID, its runner title
supplies the human-readable guarantee, and its assertion body is evidence.
Native runner tags classify component, Component Contract/Implementation layer,
and one or more Definition section facets. File paths and external specification links may establish traceability
or authoring context, but they are not verification by themselves. Keep
external references in suite-level runner metadata unless one Requirement
depends on a specific clause or Nagi explicitly claims conformance to a pinned
upstream revision.

The package's standard Blueprints are platform-first. They use HTML elements
and platform behavior before implementing a JavaScript state machine. Popover,
dialog, disclosure, form controls, links, and native validation remain native
in that Implementation unless a concrete requirement cannot be met.

Within a platform-first Blueprint, native state stays native: use element
state, ARIA, and `data-*` attributes instead of duplicating it in state classes.
An owned Motion- or library-driven implementation may choose another mechanism,
but it must replace the relevant state owner as a whole and re-run the shared
contract. It must not wrap a native state machine with a second competing one.

## Visible DOM ownership

Nagi UI does not expose compound `Root` / `Trigger` / `Popup` component
families, `asChild`, render props, Teleport, or portals as its normal
composition model. Vue attribute injection and composables attach behavior to
the elements visible in the template.

Nagi does not avoid abstraction. It confines behavioral abstraction to narrow
composables so rendered DOM, structural decisions, and styling remain visible
in an ordinary Vue SFC. Accessibility is not guaranteed merely by choosing a
composable instead of a primitive component: either model can be misassembled
or restyled incorrectly. Nagi's boundary exists to keep the owned source local,
traceable from rendered DOM, and editable without adopting a second component
composition language.

A composable may own behavior that is difficult to implement correctly in each
Blueprint, such as keyboard navigation, focus coordination, ID relationships,
native/model synchronization, or dismiss behavior. It must not become a hidden
renderer or a compound-component API expressed through another syntax. Keep
the following in the SFC whenever they are meaningful to an owner:

- the native elements and their nesting;
- structural branches and content placement;
- static semantics and attributes whose meaning is local to the Blueprint;
- component styling and token use.

Complexity alone does not decide this boundary. A short selection transition,
activation policy, or navigation adapter belongs in a narrow public composable
or helper when it is reusable independently of the rendered structure. Keep
template-only derivations—slot names, keys, structural branches, and event
forwarding—beside the markup. Fixed implementation glue that is unsafe or not
useful to assemble independently belongs in `component-controls`, not in the
public headless API.

Treat a composable API as too broad when understanding or changing the rendered
structure requires reconstructing it from prop getters, slot-prop protocols,
registries, or opaque context objects. A developer should be able to start from
an element in browser developer tools, find the corresponding markup in the
owned SFC, and understand the structural decision there. Reading the composable
may be necessary to understand complex behavior, but not to discover the basic
DOM that the component renders.

The default Blueprints avoid custom focus traps and custom top-layer stacks
when the browser already owns those mechanisms. A different Implementation
must name and test the replacement owner explicitly.

## Asymmetric JavaScript

Keep behavior thin where the platform is strong, including Popover, Dialog,
Tooltip, Disclosure, and ordinary form controls.

Invest JavaScript where the platform has no complete equivalent, including
Menu, Listbox, Combobox, Tabs, Tree, advanced date/time interaction, and
coordinated composite widgets.

## Own-first, package for light use

Nagi UI's primary model is source ownership: for full adoption, an application
owns its component library and Nagi UI provides the canonical implementations,
verification, and tooling to maintain it. The package remains available as a
convenience tier for evaluation and light use, but it is not the primary design
constraint.

This replaces the earlier package-first rule. Libraries grow flexible public
APIs because their consumers cannot edit the implementation; here the
verification stack exists so that editing the implementation is safe, which
removes the reason to grow those APIs. Configuration belongs in the API;
structural customization belongs in owned source.

Each component's canonical SFC is simultaneously the package implementation and
the source that ownership copies; the two must never be separate
implementations. The Blueprint is therefore a reference implementation in the
literal sense.

Customization follows this order:

1. semantic theme tokens;
2. small props or stable item schemas;
3. a few content-only slots;
4. source ownership for DOM, behavior, or product-specific integration.

Package and owned components may coexist. After ownership, the local repository
is the source of truth. Divergence is managed through `@nagi-source` provenance
metadata, git history, and executable verification — conformance contracts,
verified bindings, and Nagi CSS — not through central drift tracking or deep
behavior vendoring.

## API boundaries

- Prefer named props for common stable settings.
- Keep item schemas finite and tied to one component's product boundary.
- Do not grow a general rendering DSL to avoid ownership.
- Slots may replace content but must not obscure fixed behavior wiring.
- Fixed browser and Vue synchronization mechanisms may live in narrow helpers.
- DOM branches and policies an owner is expected to change stay in the SFC.

## Styling

Blueprints follow the Nagi CSS contract:

- component roots use the `n-` namespace derived from their filenames;
- owned selectors mirror DOM ownership;
- runtime state is attribute-based;
- colors and shared design scales use semantic tokens;
- component-specific dimensions may remain local values.

Package consumers style through tokens and public component APIs. Reaching into
package-owned internals is not a supported customization boundary; own the
source instead.

## Explicit non-goals

Nagi UI is not:

- itself a CSS, animation, presence, or portal runtime;
- a promise that every Implementation can reuse the default Blueprint's Behavior API;
- a schema-driven form system;
- a virtualized data grid;
- a replacement for gesture-heavy sheets or fully custom select widgets;
- a promise of feature parity with every component library.

Use another focused library inside an owned Implementation when a
product requires arbitrary overlay stacking, fine-grained dismiss policy,
gesture physics, or custom presence. Use a different component product when the
shared Nagi contract or verification model is also a poor fit.
