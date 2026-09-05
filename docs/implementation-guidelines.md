# Component implementation guidelines

Nagi UI keeps DOM structure and styling visible in ordinary Vue SFCs while
moving only reusable, correctness-sensitive behavior into narrow composables.

The objective is not to make templates as small as possible. The objective is
that an owner can open a Blueprint and understand its rendered HTML, structural
decisions, slots, and CSS without first learning another component-composition
language.

The central rule is:

> It is acceptable to read a composable to understand detailed behavior. It
> should not be necessary to read a composable to discover the basic DOM a
> component renders.

## The assembly model

A component is not a linear pipeline from an abstract primitive through design
to markup. An architecture audit across all 64 components showed that a strict
`Platform → Primitive → Design → Blueprint` stack misdescribes real components
(see [Component layer audit](component-layer-audit.md)). The accurate model is
an assembly graph:

```text
                   Portable Component Contract
                              │
                     Implementation
                    ┌─────────┼─────────┐
                    │         │         │
Web Platform ─ Shared Mechanisms ─ Behavior / Policy
                    │         │         │
                    └── Visible Blueprint ◀── Nagi Design
                                  │
                           rendered DOM + CSS
```

- **Portable Component Contract** records guarantees that every conforming
  implementation must preserve: semantics, state policy, interaction, focus,
  and portable style axes. It must not fix a native element, mount lifecycle,
  portal strategy, or animation library.
- **Implementation** records how one concrete Blueprint realizes that
  contract: native elements, state owner, presence lifecycle, functional
  anatomy, binding destinations, and implementation-only functional style.
  Component Contract plus Implementation resolves to the complete Component Definition consumed
  by documentation and verification. The Definition is generated from ordinary
  test-runner results and executable anatomy; it is not a runtime layer or a
  second Requirement DSL. See [Component Definitions](component-definitions.md).
- **Web Platform**: native elements, state, form behavior, focus, dialog and
  popover top layer, and CSS are the first implementation choice for the
  standard Blueprint Implementation.
- **Shared Mechanisms**: concerns that belong to no single component —
  controlled-model acceptance, native form/reset/validity adapters, anchoring
  and element registration, link/navigation adaptation, ID and DOM relationship
  verification, document-level top-layer coordination. This is an architectural
  category, not a mandate for a package or a generic framework.
- **Behavior / Component Policy**: interaction mechanisms plus the component's
  policy choices (Tabs' automatic/manual activation, Tree's hierarchical
  left/right keys) and its binding contract — which owned elements receive
  which IDs, roles, refs, and handlers.
- **Nagi Design** owns visual decisions only. Finite visual choices are exposed
  as independently composable CSS style axes and expanded by the build-time
  style compiler; they are not Vue behavior props or DOM state attributes. It
  may consume the same feature input as behavior (orientation, for example)
  without owning the behavioral meaning.
- **Component style axes are self-scoped.** Register their public property and
  every generated private output with `inherits: false`, and author the
  declaration on the component boundary itself. A value intentionally meant to
  cascade through a subtree is a separately named context axis, not an
  accidental use of component-axis inheritance. See
  [CSS style axes](style-axes.md).
- **Visible Owned Blueprint** assembles all of the above. It is the only place
  that defines the final DOM and CSS.
- **Nagi CSS identity follows semantic priority.** A styled `div` or `span`
  with a static identifying ARIA role uses that role as its base class before
  anatomy or STN: `class="group" role="group"`, not `class="unit"`. Native
  element identities still take precedence on elements such as `li` and
  `button`; non-identifying roles (`generic`, `none`, `presentation`) do not
  become class names.
- **UI Anatomy is reserved for `div` and `span`.** Names such as `field`,
  `value`, `actions`, `media`, `icon`, and `text` must not replace the fixed
  identity of a semantic element. Treat `<p class="p">` as uncommon and use it
  only for intentionally authored prose whose paragraph boundary matters. A
  complete sentence or a prop named `description` is not sufficient; labels,
  hints, statuses, and short component microcopy normally use
  `<span class="text">`. A rich slot that may contain several paragraphs or
  other block content owns those elements and must not be wrapped in `p`.
  Whether content is genuinely a paragraph remains an HTML review decision,
  while the Nagi CSS lint mechanically rejects `p.text` and Element Class
  identities used on the wrong tag.

## Six governing principles

1. **The default Blueprint is platform first, with capability truth.** Delegate
   to native behavior and document browser-dependent degradation or post-event
   repair honestly. An alternative owned Implementation may delegate presence or
   behavior to another library, but must name one state owner and supply its own
   evidence. Some native transitions cannot be synchronously vetoed; controlled
   state is then repaired, not prevented, and the Implementation must say so.
2. **The Definition owns cross-cutting features.** A feature such as
   `orientation`, `disabled`, or `multiple` may affect semantics, behavior,
   structure, and design at once; the Definition assigns each effect rather
   than forcing the feature into one layer.
3. **Unstyled does not mean DOM-free.** Behavior may require functional
   anatomy — Carousel needs an ordered set of semantic slides scoped beneath
   its registered viewport; Resizable measures the separator's parent; Tree
   requires recursive treeitem/group bindings. Such requirements must be
   explicit, testable, and independent of Nagi visual classes. Declare them in
   the component's Definition, where they are executable; see
   [Component Definitions](component-definitions.md).
4. **The Blueprint tree is the final assembler.** Final native elements,
   hierarchy, branches, slots, anatomy bindings, attribute destinations, and
   CSS remain visible in the owning Vue sources. A parent may assemble an
   independently contracted child component instead of repeating its DOM; the
   child source remains the visible owner of those native elements. A Behavior
   API must not become a hidden renderer.
5. **Every owned dependency is governed.** An ownable Blueprint may depend only
   on a stable public API or files included in its ownership bundle. Shared
   behavior upgrades require browser-contract verification, because an owned
   SFC can change behavior without changing textually.
   Public child Blueprints are component dependencies: `nagi-ui own` resolves
   them recursively and keeps the parent connected through the same relative
   import used by the package source. Private child renderers remain files in
   the parent's own bundle.
6. **Extract mechanisms from evidence, not symmetry.** Share behavior when
   multiple components demonstrably maintain the same invariant. Do not create
   a generic framework merely to make the architecture diagram uniform.

## When behavior belongs in a composable

Before moving a derivation into a composable, first ask whether JavaScript is
needed at all. Layout that follows child count, intrinsic size, or state already
represented in the DOM should be derived by CSS. A Blueprint may generate a
component-local CSS property only when a reviewed platform limitation requires
one; for example, native range values are not exposed to CSS and a controlled
splitter value must cross the script/CSS boundary. `vp run audit:templates`
guards this boundary with a narrow, explicit exception list.

Function length is not a responsibility boundary. Even a one-line function
belongs in the Behavior API when it decides state, interaction, focus, DOM
synchronization, or the ordered composition of those effects with a native
event. Blueprint-local functions are reserved for rendering-only derivations
such as a row identity or dynamic slot name. `vp run audit:templates` records
those rare exceptions explicitly and rejects an unreviewed local function.

Move behavior into a composable when one or more of the following is true:

- **Several attributes and states must remain consistent.** Tabs coordinates
  selected key, focused key, `aria-selected`, `tabindex`, `aria-controls`, and
  panel visibility.
- **Keyboard behavior changes component state.** ArrowRight in Tabs locates the
  next enabled tab, moves DOM focus, updates the roving target, and updates
  selection in automatic mode.
- **Dynamic content requires repair.** If a selected tab is removed, Tabs must
  choose a replacement and repair its roving target and DOM focus.
- **Native state and Vue state must be synchronized.** A `v-model` write calls
  `showModal()`/`close()`; a native Escape mirrors back into the model.
- **Owned source can reuse the behavior after changing structure.** An owned
  Dialog can reorder its title, body, actions, and close button while keeping
  `useDialog` and `vDialogClose`.

Composable output remains a small set of typed native-element binding bundles
and actions:

```ts
const tabs = useTabs(options);

tabs.tablistProps;
tabs.tabProps(item);
tabs.panelProps(item);
tabs.select(item);
```

The caller chooses the elements receiving those bindings. A composable must not
become a hidden renderer or a compound-component API expressed in another
syntax.

A binding bundle is complete for its destination. When behavior needs a DOM
reference, the bundle includes its Vue `ref` callback alongside the roles,
ARIA, state attributes, and event handlers it coordinates. A Blueprint should
not recreate that connection with an inline callback, duplicate the same
element in a local ref, or cast template callback arguments merely to adapt an
incomplete Behavior API. The visible wiring should normally remain:

```vue
<div v-bind="behavior.viewportProps">
```

This does not hide structure: the Blueprint still chooses the element and the
binding destination. The Definition explains what the behavior guarantees,
the binding type exposes what must be attached, and the Behavior API owns how
the attached ref and handlers maintain those guarantees.

State-dependent DOM relationships follow the same rule. When validity decides
whether a field or grid receives `aria-describedby`, the Behavior binding
exposes both the stable message target ID and the reactive relationship token.
The Blueprint still renders the visible message element, but it must not rebuild
an ID from another binding or repeat the invalid-state condition. Keep these two
values distinct: `error.id` names the target for its whole lifetime, while
`error.describedBy` becomes defined only while that relationship applies.

### Register elements at the smallest useful scope

A single trigger, input, surface, or region needs a local element variable (or
a shallow ref when another reactive adapter observes replacement) and one
named callback in its binding bundle. Do not put a singleton into a registry
merely to make registration APIs look uniform.

Use the private keyed element registry only for a rendered collection whose
items can be inserted, removed, reordered, or replaced. The registry owns the
repeated correctness problem: stable Vue ref callbacks, key-to-element lookup,
stale-item pruning, and ShadowRoot-safe focus. Component policy such as
selection, filtering, range rules, or popup state remains in that component.

Likewise, a named reconciliation function normally stays in the Behavior file
that owns its invariant. Extract a shared helper only when multiple components
have the same invariant—not merely similarly shaped code. DateField and
TimeField, for example, share locale-digit parsing and a timed digit buffer;
their segment ranges and date/time model policies remain separate. Toast uses
a Toast-specific document coordinator rather than introducing a generic popup
coordinator.

## Prefer explanatory code over incidental brevity

Behavior code should make the invariant being maintained visible. When a
reactive source changes and the component must repair related state, extract
that repair into a named function such as `reconcileCollection` or
`syncInputFromSelection`. Keep independently triggered repairs separate even
when combining them would remove a few lines: their names and watch sources
should explain what changed and why a side effect follows.

The same rule applies beyond watchers. Split multi-step behavior into small,
purpose-named functions when doing so exposes interaction policy, ownership of
state, or a correctness boundary. A little repetition or indirection is
acceptable when its runtime cost is insignificant and it makes those decisions
easier to review and maintain. Do not add abstractions that obscure control
flow, duplicate expensive work, or materially regress performance merely for
uniformity.

Complexity is not the boundary. ToggleGroup's selection transition is short but
defines reusable policy, so it belongs in `useToggleGroup`. Conversely, longer
template-specific derivations — slot selection, display labels, structural
branches, rendering keys — stay beside the markup. The correct question is:

> Is this reusable interaction behavior that must remain correct independently
> of the canonical DOM structure?

## What remains in the template

A public component should normally invoke one primary `useX` binding. Native
form synchronization, element refs, renderer ordering, and other behavior that
the component always needs must not be assembled in the SFC through an extra
`useXRenderer` or `useXNativeForm` call. The component overload of the primary
Behavior API returns that complete binding.

That binding also owns the final props for an element whose behavior it owns.
Do not call `useX` and then rebuild the same element's binding with a local
`computed(() => mergeElementProps(...))`; pass consumer attrs into the component
overload and bind its returned object once. This keeps ref registration,
behavior-dependent ARIA, native attributes, and listener composition in one
reviewable boundary. A template-local conversion from behavior output to a
visual CSS custom property is different: it remains beside the CSS it drives
because the Behavior must not own presentation. `Resizable`'s panel percentage
to `--local-first-basis` mapping is an example of an intentional visible bridge.

Before composing another Behavior implementation, check whether its component
can be rendered instead. Prefer component composition when the child keeps an
independent Contract and can coordinate through public props, models, events,
and slots. The parent Behavior then owns only parent state and integration
policy; it must not instantiate a second copy of the child's Behavior.

Compose Behaviors directly only when the parent must coordinate intermediate
state or registered elements that the child cannot expose without leaking its
Implementation. Private named helpers may divide a long algorithm without
creating another public composable layer.

- **Native elements and hierarchy.** The composable must not generate them.
- **Structural branches** (`v-if="description"`): whether and where content
  appears is an ownership-visible decision.
- **Item rendering and keys** (`v-for="item in items" :key="item.key"`).
- **Slot placement.** Slots customize content at anatomy positions defined by
  the component definition; they are not a protocol from which the hierarchy
  must be reconstructed.
- **Static semantics local to the Blueprint.** Native element choice,
  `type="button"`, sectioning, and landmarks stay visible. Behavior-dependent
  roles and ARIA relationships may live in binding bundles because they must
  stay synchronized with state and IDs.

### Split branch renderers by owned meaning, not line count

A discriminated item schema may justify a private renderer when one branch has
its own semantic root, repeated children, and component-local CSS. Keep that
renderer in the same ownership bundle so the final DOM remains editable and
traceable. DropdownMenu's labelled `group` and `radio-group`, for example,
share one group renderer; action, link, and checkbox leaves remain together
because splitting them would mostly duplicate the same menu-item presentation.

Place private renderer SFCs under the Blueprint's `internal/` directory. They
must not appear in the package component entrypoint, and the corresponding
package subpath is blocked from direct import. “Internal” does not mean hidden
from an owner: `nagi-ui own` copies the directory as part of the editable
bundle, and the documentation site labels those files as **Internal
component** beside the **Public component** entry SFC.

Private renderers do not need to be reusable. A coherent region may move to an
owner-specific private SFC when it has its own rendered surface, owns a closed
CSS subtree, and can consume existing Behavior bindings without moving their
logic. DatePicker and DateRangePicker therefore keep their field composition
and Behavior creation in their public entry SFCs while their popup calendars
live in separate private renderers. A typed instance-local context connects the
two without adding a DOM wrapper; `nagi-ui own` copies both files.

Repeated markup is evidence to inspect, not proof that a shared renderer is
needed. Extract a child component when the repeated region has one stable
Contract and public coordination boundary. DateField controls and Calendar
surfaces are candidates because standalone and picker components should not
reimplement the same child Behavior. An owner-specific private renderer remains
appropriate when the region has no independent Contract; it may inject its
owner's binding, but it must not reimplement commit, popup, focus, or controlled
state transitions.

Nagi CSS ownership follows the component boundary. The parent may style the
child root for external layout but must not select into the child's internals.
If composition requires the parent to reach through the child with scoped CSS,
the child is missing a public styling contract or is not yet a sound component
boundary.

Visible verbosity can also be contractual. Combobox and MultiSelect spell out
the supported native input attributes and consumer events because root, input,
popup, listbox, and form proxy are all plausible destinations; replacing those
bindings with one broad forwarding object would make misrouting harder to
review. RangeSlider likewise keeps its WebKit, Gecko, focus, disabled, and
forced-colors thumb rules beside the two visible native range inputs. These are
platform differences owned by the component, not evidence for a generic input
or slider renderer.

## Verifying the Behavior API / Template boundary

This responsibility boundary is an implementation contract, not something a
Component Definition can prove by itself. A Definition verifies the observable
result; boundary checks verify where the code maintaining that result lives.
Both forms of evidence are required for a verified complex component.

Review each binding destination from both directions:

| Behavior API must own                                                                | Template must own                                                         |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| Element registration needed by behavior, exposed through the binding bundle's `ref`  | Native element choice and visible DOM hierarchy                           |
| State-dependent roles, ARIA relationships, `tabindex`, and event handlers            | Slots, item rendering, structural branches, and rendering keys            |
| Keyboard and pointer policy, focus movement/restoration, and controlled-state repair | Static local semantics such as `type="button"`, sectioning, and landmarks |
| Lookup scoped to registered elements, their root, or their controlled surface        | The destination receiving one complete `v-bind="...Props"` bundle         |
| Named reconciliation functions that preserve invariants after reactive changes       | Presentation and layout that behavior does not need to interpret          |

A Blueprint normally fails this boundary when it contains any of the
following:

- an inline `:ref` callback that casts an element and calls `setX` or otherwise
  duplicates registration already needed by behavior;
- Template-local keyboard, focus, collection-repair, or model-synchronization
  logic;
- `document.querySelector*` or `document.getElementById` used to rediscover an
  element that could have been registered by its binding bundle;
- separately bound state-dependent ARIA attributes or handlers that restate a
  partial `...Props` bundle;
- a binding type that omits a required `ref`, attribute, or handler and forces
  the canonical Blueprint to repair the API with casts or glue.

Verification uses several complementary layers:

1. **Type boundary.** The public binding type lists the complete attributes,
   handlers, and registration callback required by one destination. The
   Blueprint typechecks while consuming the bundle with one `v-bind`.
2. **Source-boundary check.** A focused Node test asserts the expected
   `v-bind="behavior.xxxProps"` destination and rejects known boundary leaks
   such as inline registration, casts, `setX`, and document-global lookup.
   `tests/definition.test.ts` contains the current Carousel, Combobox, and
   Dialog examples.
3. **Runtime contract.** Package and structurally changed owned fixtures run the
   same browser contract. This proves that the bundle remains reactive and
   complete when the Template changes; source matching alone cannot do that.
4. **Isolation contract.** Multi-instance, ShadowRoot, and nested-popup tests
   prove that registration is actually local rather than a wrapper around
   document-global rediscovery.
5. **Mutation probe.** Remove or misplace a binding, leave a stale relationship,
   or redirect focus and confirm that the intended contract assertion fails.
   An ID in a test title is traceability, not proof by itself.

Run the existing boundary and browser evidence with:

```sh
vp exec node --test tests/definition.test.ts
vp exec playwright test tests/browser/conformance-contract.spec.ts tests/browser/shadow-root.spec.ts
```

`vp run audit:templates` applies the catalog-wide baseline: every Blueprint is
formatted consistently, invokes at most one non-Vue Behavior composable,
rejects inline ref callbacks and template-local state
transitions are rejected, and lifecycle reconciliation or document-global
lookup cannot live in an SFC setup block. It also maintains an explicit list of
Behavior-owned binding destinations: each destination must consume one complete
bundle, must not duplicate its `ref`, and must register locally rather than
rediscovering its element from `document`. The catalog-wide source patterns
still cannot infer new component-specific destinations automatically, so a new
complex Definition must add its destinations to the audit and still provide a focused
source check plus package, owned, and applicable isolation evidence. If a
component intentionally needs fixed Template glue, record the exception and
its reason in the component audit instead of weakening the general boundary
silently.

## Visual review

`vp run test:visual` compares every component page's Basic section in
desktop-light and mobile-dark, plus representative focus, invalid, open
collection, calendar, and dialog states. The suite also fails on Vue hydration
errors. Use `vp run test:visual:update` only after an intentional visual change,
then inspect the affected PNGs before accepting the new baseline; regenerating
images is not itself a design review.

## Fixed component glue

Some behavior is too coupled to a package component to be a useful headless
API, but too easy to implement incorrectly in every Blueprint. It lives in the
`@nagi-labs/nagi-ui/component-controls` entrypoint, which is a stable
ownership-support API: it is public, versioned, and importable by owned
Blueprints.

`useButton` is the representative example. It connects the one native root and
implements Nagi Button's focusable-disabled policy, keeping one invariant
together: omit native
`disabled`, stay in the tab order, expose `aria-disabled="true"`, and suppress
activation in the capture phase before consumer click handlers run. It is
also the single composition point for consumer root attributes and the safe
native `type`; the Blueprint must not reconstruct those props after calling it.
It is justified despite being short — the decision is semantic coupling, not
line count. It must not expand into ownership of Button markup, style axes,
slots, declared consumer events, or CSS declarations.

## Attribute composition

When behavior attributes, Blueprint policy, and consumer attributes target the
same native element, they are combined through `mergeElementProps`, which is a
precedence boundary, not last-write-wins. The governing rule:

> Attributes derived from the component's behavioral definition cannot be
> overridden accidentally.

- **Behavior-owned**: `role`, `aria-selected`, `aria-controls`,
  `aria-labelledby`, `aria-activedescendant`, roving `tabindex`, disabled
  policy, behavior event handlers.
- **Blueprint-owned**: native element choice, `type`, canonical popover/dialog
  policy, static local semantics.
- **Consumer-owned**: `aria-label`/`aria-describedby`, `data-*`, `title`,
  `form`/`name` and native input hints, consumer listeners — when the
  destination is unambiguous.

Compound components route attributes to an explicit destination rather than
forwarding one broad attrs object. See the
[attribute forwarding policy](attribute-forwarding.md).

## Platform-first Blueprint asymmetry

The standard Blueprint Implementation intentionally varies JavaScript weight by
platform capability:

- Card, Badge, native Table: almost entirely template and CSS;
- Button, Select, Disclosure: native behavior plus a small adapter;
- Dialog, Popover: native top-layer behavior plus model synchronization;
- Tabs, Menu, Listbox: dedicated interaction composables;
- ComboBox, Tree, Calendar, date/time fields: larger behavior engines where the
  platform has no complete widget.

## Practices to avoid

- Do not replace the visible Blueprint with a compound graph
  (`<DialogRoot><DialogTrigger as-child>…`).
- Do not turn composables into a structural protocol
  (`const { root, trigger, header, …, renderParts } = useDialog(…)`).
- Do not implement custom focus traps, overlay stacks, or state machines when a
  native platform primitive already provides the behavior.
- Do not move a local rendering decision into a composable merely to shorten
  the SFC.

## Implementation decision checklist

For a new component, ask in order:

1. Can native HTML provide the required semantics and behavior?
2. Is only a small adapter needed to synchronize native state with Vue state?
3. Does the widget need keyboard, focus, selection, or collection coordination?
4. Is that behavior meaningful independently of the canonical DOM hierarchy?
5. Can an owned source reuse it after changing its structure?
6. Does the returned API remain a small set of typed bindings and actions?
7. Can a developer still understand the rendered DOM by reading the SFC first?

If the final answer is no, the abstraction is probably too broad.

## Final principle

Nagi UI does not avoid abstraction. It places abstraction at the behavior
boundary while keeping ownership-visible structure in Vue:

```text
ordinary Vue template
  + native HTML
  + narrow behavior composable
  + explicit attribute bindings
  + Nagi CSS
```

This is what allows the package component and the owned source to share one
implementation without turning Nagi UI into a second component composition
language.
