# Component layer audit

Date: 2026-08-30. Scope: all 64 public/ownable components.

This audit treated a proposed linear layer model —
`Platform → Unstyled Primitive → Nagi Design → Visible Blueprint` — as a
hypothesis to falsify. The hypothesis survived only in a weaker form: the four
concepts are valid vocabulary for every component, but several components are
concrete counterexamples to the strictly linear, DOM-independent formulation.
The corrected assembly model and the six governing principles derived from this
audit are normative in the
[implementation guidelines](implementation-guidelines.md); this document
preserves the evidence.

## Key falsification findings

- **Toast is not one component primitive.** `createToastManager` owns data and
  timers; the Toast-specific document coordinator installs document listeners,
  discovers open F6 regions, and coordinates modal containment and top-layer
  re-promotion; `useToastRenderer` repairs focus through
  `data-scope="toast"` / `data-part="item"`. Toast is a
  service + document coordinator + renderer Blueprint + design, and must be
  described that way.
- **Carousel behavior depends on rendered geometry, not direct parentage.**
  `useCarousel` discovers this Carousel's semantic slide descendants inside the
  behavior-bearing viewport, then reads their bounding rectangles and the viewport's
  scroll position. Layout wrappers are allowed; membership in one scrollport
  and one Carousel owner is the functional constraint.
- **Resizable measures its parent.** `useResizable` uses the separator's
  `parentElement` as the measured root; a two-panel measurable anatomy is part
  of the behavioral contract.
- **Menu is several mechanisms under one controller.** `useMenu` owns popover
  state, item focus, typeahead, selection, submenu controllers, pointer grace,
  restoration, IDs, and navigation. The public API shape is narrow; the
  internal responsibility count is not.
- **MultiSelect owns distinct collection policy.** It still owns filtering,
  active-descendant, selection, and popup policy rather than pretending to be
  Combobox or Listbox. Only keyed DOM registration is shared privately.
- **DateField and TimeField share mechanisms, not one engine.** Locale-digit
  parsing and buffered typing are shared privately; segment ranges,
  `textContent` repair, hidden-input sync, and date/time model policy remain in
  their component behaviors.
- **Instance-bound registration replaced trigger rediscovery.** Popover,
  Tooltip, DatePicker, and the reviewed collection components receive elements
  through their binding bundles. They no longer recover an instance by scanning
  the ambient document; multi-instance and ShadowRoot evidence covers the
  boundary.
- **Native controlled state cannot always be vetoed.** Popover hide transitions
  are not cancelable; a rejected close is repaired by reopening. Dialog
  `closedby` degrades with browser support. Definitions must state observable
  policy, not pretend Vue state precedes platform state.
- **Composite form ownership spans layers.** Date/time fields, calendars,
  MultiSelect, and TagsInput combine visible controls, hidden form channels,
  validity, reset, readonly, and model acceptance — shared platform
  integration plus component policy, not design.

## Boundary comparison with unstyled libraries

Nagi's public primitive boundary is narrower than Base UI, Ark, Reka, and
Vuetify 0 (which expose composition, parts, or machines as public language);
similar in spirit to React Aria's hook side; and API-shape-adjacent to Akaza.
The narrowness follows from visible ownership: a consumer who edits the source
needs fewer public concepts to hold in mind. Internally, Nagi is sometimes too
coarse rather than too narrow: Menu, Toast, Calendar, and the date/time fields
aggregate multiple mechanisms behind one composable, while collection and form
mechanisms are duplicated across components. Nothing in the comparison requires
adopting a compound-component framework.

## Component matrix

Legend — **Platform**: browser/native semantics. **Primitive**: unstyled
behavior or state coordination. **Design**: Nagi visual contract.
**Blueprint**: visible Vue assembly. **Cross-cutting**: shared infrastructure.
Confidence describes classification confidence, not component quality.

| Component | Platform | Primitive | Design | Blueprint | Cross-cutting concerns | Confidence | Problems |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Accordion | `details`, `summary`, native open/name | controlled key normalization | disclosure anatomy | items, summary/panel slots | SSR/native-state sync | High | Data schema is less structurally free than Disclosure, but ownership remains visible. |
| Autocomplete | text input, form value, popup/listbox semantics | Combobox-derived filtering and free-text settlement | field, popup, empty state | label/input/options markup and native attrs | reset, anchor, IDs | High | Reuse is real but inherits Combobox DOM coupling. |
| Alert | section plus `status`/`alert` roles | none beyond safe prop merge | tone treatment | icon/title/body slots | chosen role is semantic, not design | High | `role` must stay outside tone/variant classification. |
| AlertDialog | native modal dialog, ESC, focus trap | fixed Dialog policy and close directive | critical action anatomy/tone | trigger/title/body/actions | feature detection, controlled open | High | `closedby` behavior is capability-dependent; action policy crosses Blueprint/runtime. |
| Avatar | native image load/error and alt | image race/fallback state | image/fallback presentation | img/fallback slot | root attrs vs image semantics | High | Not purely presentational; fixed helper is justified. |
| Badge | native span | none | tone | label slot | root attrs | High | Clean design/Blueprint case. |
| Breadcrumb | nav/list/links/`aria-current` | none | separator/current appearance | item policy and current derivation | navigation remains native | High | Current-item normalization is component policy in Blueprint. |
| Button | native activation/focus/disabled | focusable-disabled coordination | composable CSS tone, appearance, shape, size, and states | actual button, slot, emits | protected attr/event merge plus build-time finite-axis expansion | High | Baseline fits after classifying `useButton` as fixed behavior support; visual axes remain outside behavior and DOM state. |
| ButtonGroup | native `group` semantics | none | horizontal/vertical layout | slot composition | label/orientation ARIA | High | Orientation is layout metadata here, unlike Tabs. |
| Card | native generic sections | none | surface/anatomy | title/description/body/footer slots | root attrs | High | Clean Blueprint/design component. |
| Calendar | buttons/table/grid/form channel | date math, grid navigation, selection | month/grid/error anatomy | complete grid DOM | locale, validity, reset, DOM focus adapter | Medium | "Primitive" currently bundles several mechanisms; anatomy contract is strong. |
| Carousel | buttons, scroll, articles, CSS snapping | index, scroll reconciliation, announcement | viewport/slide design | ordered slides and controls | geometry and controlled acceptance | Medium | Functional anatomy and scoped slide order are runtime requirements. |
| Checkbox | native checkbox/form/disabled | indeterminate DOM sync/reset | custom check appearance | label/input/span | attrs target input | High | `indeterminate` is behavior/DOM state, not a design state. |
| Combobox | input, listbox/option ARIA, native form | filtering, active descendant, provisional/committed selection | field/clear/popup/status | label/input/options/error DOM | popover, anchor, validity, model acceptance | High | Input and popup registration are instance-bound; provisional versus committed selection remains explicit component policy. |
| ContextMenu | popover, links/buttons, context events | Menu + pointer/long-press sessions | target/positioner/menu anatomy | item union and target slot | virtual anchor, focus restoration, link adapter | Medium | Composite widget engine, not one small primitive. |
| DateField | contenteditable segments and hidden form input | segmented date editing and constraints | segmented date field | segments/literals/error/proxy DOM | locale, validity, reset, DOM focus | Medium-high | Shares only locale-digit parsing and buffered typing with TimeField; date policy and registered segment focus remain local. |
| DatePicker | field, grid, popover | composition of DateField/Calendar/Popover | popup date-picker anatomy | trigger, segments, calendar DOM | form coordination, focus restoration | Medium-high | Instance-bound trigger registration removes the former document-global lookup; composite form and focus policy remain the review boundary. |
| DateRangePicker | two fields, range grid, popover, two form values | field/range/calendar transaction | range-picker anatomy | start/end segments, trigger, grid | composite validity and focus | Medium-low | Five coordinated state views lack one explicit transaction contract. |
| Dialog | native dialog/top layer/focus/ESC | native-model sync and close wiring | trigger/header/body/footer | complete visible hierarchy and slots | generated IDs, capability detection | High | Global ID resolution creates a bounded DOM adapter dependency. |
| Disclosure | native details/summary | controlled sync and disabled-summary policy | summary/panel | slots and native structure | native event mirroring | High | Strongest platform-first example. |
| DropdownMenu | popover, native links/buttons | Menu/submenu tree, focus, typeahead | list/item/check/radio/submenu | recursive item union across owned files | anchor, navigation, controlled state | Medium | Large controller aggregates multiple mechanisms; exact IDs/bindings are functional contract. |
| EmptyState | ordinary content | none | empty-state composition | title/description/icon/action slots | consumer owns heading level | High | Clean structure/design case. |
| Fieldset | native fieldset/legend/disabled propagation | none | layout | legend and content | attrs target fieldset | High | Clean platform case. |
| FileInput | native chooser/form/reset/multiple | none | native chooser styling | visible label/input | attrs target input | High | Deliberately refuses synthetic file state. |
| Input | native input/validation/readonly | reset/model bridge | control styling | label and input API | broad native attrs/events | High | Small adapter model works. |
| InputGroup | generic DOM | none | frame/adornment/action anatomy | slots | attrs target frame, not slotted input | High | Not a form primitive; destination must remain explicit. |
| Kbd | native `kbd` | none | key appearance | label | attrs target root | High | Clean platform/design case. |
| Listbox | listbox/option semantics | active descendant, selection, typeahead | inline list anatomy | list/options | IDs and direction | High | Good primitive, but lower cursor behavior is duplicated elsewhere. |
| Menubar | nav/buttons/anchors/popovers | roving top level plus Menu controllers | bar/menu anatomy | top-level schema | direction, focus, controlled open | Medium | Compound engine; cannot be described as only a narrow stateless binding. |
| Meter | native meter ranges | none | meter appearance | label and numeric props | generated label relationship | High | Platform owns interpretation. |
| MultiSelect | input, popup listbox, hidden multiple select | filtering, active descendant, selection, chips | multiselect field/popup/chips | visible and form-proxy DOM | anchor, validity, reset, model acceptance | Medium-high | Shares keyed element registration while retaining distinct selection, chip, filtering, and form policy. |
| NavigationMenu | native nav/links/popovers | preview, activation, focus/hover policy | link/trigger/panel anatomy | link-or-panel schema | anchor and controlled state | Medium | Product policy and primitive behavior are currently combined. |
| NumberField | native number input/step/form | numeric reconciliation and step actions | compound field | input and two buttons | reset and attr destination | High | Functional compound behavior, not merely native input. |
| OTPField | one native text input | normalization, composition, fixed length | decorative cells | one input plus cells | reset/model acceptance | High | Excellent example of design cells not becoming behavioral DOM. |
| Pagination | nav, links, buttons | current selection policy | current/disabled layout | item schema | native link adapter | High | Link and button items intentionally have different activation owners. |
| Popover | native Popover API/light dismiss/ESC | model bridge and anchor pair | trigger/popup anatomy | visible trigger/content | placement, controlled repair | High | Trigger and surface are locally registered; rejected native close is repaired rather than synchronously vetoed. |
| PreviewCard | native link navigation and popover | hover/focus intent | metadata preview | anchor and preview content | anchor refs and controlled open | High | `disabled` disables preview, not navigation; policy must be explicit. |
| Progress | native determinate/indeterminate progress | none | progress appearance | label/value | generated label relationship | High | Indeterminate is absence of native value. |
| Radio | native grouping/selection/reset | reset bridge | radio appearance | input and label | attrs target input | High | No RadioGroup state machine is needed. |
| RangeCalendar | grid/buttons/two form values | range selection, preview, date navigation | range grid | table/cells/error/proxies | locale, validity, reset | Medium | Shares date builders but selection/form responsibilities remain broad. |
| RangeSlider | two native range inputs | ordered tuple, rail pointer behavior | two-thumb rail | fieldset, outputs, inputs | two form channels and bounds | High | Behavior depends on compound anatomy but remains unstyled. |
| Rating | native radio group | reset/model bridge | star treatment | fieldset and radios | numeric model conversion | High | Selection stays platform-owned. |
| Resizable | pointer capture and keyboard events | clamp, keyboard and pointer geometry | two-panel separator | two sections and handle | parent measurement, direction | Medium | Primitive requires a measurable two-panel anatomy; this is functional, not visual anatomy. |
| Select | native select/options/selection/reset | browser-selected fallback/model sync | select appearance | label/select/options | attrs target select | High | The custom "unstyled Select" example does not apply; this is intentionally native. |
| Separator | native hr or ARIA separator | none | line orientation | conditional root | orientation changes semantics and element | High | Cross-cutting prop; handled visibly in Blueprint. |
| Sidebar | aside/nav/footer | none | persistent navigation layout | slots and optional footer | accessible landmarks | High | No interactive sidebar primitive is implied. |
| SidebarLink | native anchor | modified-click-safe navigation adapter | current appearance | link slot | router integration | High | Integration helper is not component behavior or design. |
| SidebarSection | labelled section | none | section grouping | heading/content | generated relationship | High | Clean structure/design case. |
| Skeleton | inert hidden span | none | animation/reduced motion | root | `aria-hidden` ownership | High | Presentation-only. |
| Slider | native range input | sanitized value/reset bridge | slider/output appearance | label/input/output | attrs target input | High | Browser owns keyboard/range behavior. |
| Spinner | optional native status semantics | none | animation/reduced motion | labelled or hidden root | label selects semantic mode | High | Label is semantic policy, not design. |
| Stepper | nav/list/buttons | workflow selection policy | current/completed appearance | item schema | disabled/current semantics | High | Completion derivation is product policy, not a generic visual variant. |
| Switch | native checkbox/form behavior plus switch role | reset bridge | track/thumb | label/input | attrs target input | High | Native checked state remains the source of truth. |
| Table | native table semantics | none | layout/alignment/overflow | caption/head/body/cell slots | attrs target overflow wrapper | High | Intentionally not Grid; wrapper destination must be documented. |
| Tabs | buttons plus authored tab semantics | selection, roving focus, activation | horizontal/vertical tab/panel | item and panel slot DOM | IDs, direction, focus repair | Medium-high | Functional anatomy is required; orientation crosses behavior and design cleanly. |
| TagsInput | input/buttons/hidden multiple select | token add/remove/paste policies | chips/input | chips and form proxy | validity/reset/model acceptance | Medium-high | Multi-value form mechanisms overlap MultiSelect but semantics differ. |
| Textarea | native textarea/form/readonly | reset bridge | textarea appearance | label/control | attrs target textarea | High | Clean small-adapter case. |
| TimeField | contenteditable segments and hidden input | segmented time editing and constraints | segmented time field | segments/literals/error/proxy | locale, validity, reset, DOM focus | Medium-high | Shares only locale-digit parsing and buffered typing with DateField; time ranges, day period, granularity, and model policy stay local. |
| Toast | live regions, buttons, manual popover | manager, timers, lifecycle | toast items/actions/tones | renderer list/items | document-level F6 routing, modal/top-layer coordination | Medium-high | Manager, Toast-specific document coordination, and renderer focus repair are explicit separate responsibilities. |
| Toggle | native button activation | pressed selection and disabled | pressed appearance | button/slot | protected `aria-pressed` | High | Clean behavior/design split. |
| ToggleGroup | native group and buttons | single/multiple transitions | grouped pressed buttons | item loop | no roving focus by policy | High | `multiple` is behavior, not design; ordinary tab stops are intentional. |
| Toolbar | native buttons/links plus toolbar role | roving focus/direction | toolbar layout | action/link item schema | IDs and focus repair | Medium | Arbitrary descendants cannot be inserted without extending the binding contract. |
| Tooltip | tooltip role and hint popover | hover/focus timers/open sync | trigger/hint | button trigger and text | anchor and local registration | High | Trigger and hint are direct bindings; timing and hover/focus policy remain local to Tooltip. |
| Tree | tree/treeitem/group semantics | hierarchy, expansion, selection, navigation | tree/branch treatment | recursive owned companion | IDs and active descendant | Medium | Exact recursive bindings are required; loading is controlled state without async protocol. |

## Ownership sensitivity

- **Easy structure ownership**: Alert, Badge, Button, Card, native form
  controls, Dialog, Disclosure, OTPField, Sidebar, Table, Toggle — few binding
  destinations, freely rearrangeable within semantic constraints.
- **Binding-sensitive**: Tabs, Listbox, Combobox, Calendar, DateField,
  TimeField, Menu, Toolbar, Tree — generated IDs, exact roles, and binding
  bundles must land on the correct elements.
- **Anatomy/geometry-sensitive**: Carousel and Resizable (direct-child or
  parent geometry), Toast (item markers and focusable actions) — integration
  sites that are part of the behavioral contract.

A functional anatomy contract must be stated over what survives an owner's DOM
edits: scoped part markers, roles, native elements, ARIA relationships, and the
element references the composable already receives. Carousel's viewport and
slide parts use `data-scope`/`data-part`; runtime membership is the semantic
slide order scoped beneath the registered viewport, with wrappers allowed.
Resizable's is that the separator's parent contains both panels and is
measurable; Tree's is expressed by treeitem/group nesting. None of these need a
CSS naming scheme, and none may be expressed through Nagi CSS classes: those
are derived from the DOM and change with it. Toast items now use the same
`data-scope` / `data-part` vocabulary rather than a component-specific marker.

## Remaining recommended work

Focused implementation work identified by the audit, in rough priority order:

1. extend multi-instance and owner-document tests to each newly reviewed
   collection or popup before calling its implementation publishable;
2. add explicit functional-anatomy failure tests for Carousel, Resizable, Tree,
   Toolbar, Menu, and Toast;
3. unify composite form reset/validity mechanisms only where contracts match;
4. keep the explicit binding-destination audit current as new components gain
   local registration;
5. extend source review evidence when a Behavior boundary changes; the current
   37-file result is recorded in
   [the Behavior API source review](audits/behavior-api-source-review.md).

Deliberately rejected: a public generic collection registry, compound
Root/Trigger/Content APIs, a framework-independent behavior runtime, an
automatic Definition schema compiler, deep behavior-ownership tooling, and
wholesale rewrites of Menu, Calendar, or Toast.
