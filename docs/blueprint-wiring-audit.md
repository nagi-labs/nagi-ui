# Blueprint wiring exposure audit

Status: Complete (2026-07-22).

## Decision rule

The deciding question is not whether a source owner *can* change a line. It is:

> Is this a place where Nagi wants the user to make ordinary product changes?

Keep visible markup, renderer branches, public event transforms, and CSS in the
owned source. Hide browser ordering, lifecycle cleanup, focus repair,
model/DOM synchronization, and race handling behind a narrowly named component
or native helper. A stable package schema may use the same public `useX`
function's component overload while the one-argument complete headless form
remains available.

`watch`, lifecycle hooks, template refs, and direct DOM APIs in a shipped SFC
are review signals, not automatic violations. A one-line template ref passed to
a fixed native reset helper is an intentional declaration; the reset event
ordering itself does not belong in the SFC.

## Option-object boundary

A composable option object is not automatically product policy. Classify every
entry by what the source owner would change:

| Mapping | Decision | Reason |
|---|---|---|
| `openDelay: props.openDelay` | hide | key-for-key forwarding; users change the prop value or default |
| `disabled: () => props.disabled` | hide | reactive wrapping required by the core API, not a product choice |
| `{ area, offset }` reshaped into `anchor` | hide | API-shape adaptation only |
| optional property omission required by a core type | hide | compatibility mechanism |
| `getKey`, `getTextValue`, `isDisabled` for the package's stable flat item schema | component overload | most owners should not reread identical wiring; the complete options form remains available when the schema itself changes |
| `items: () => loading ? [] : items` for canonical Combobox states | component overload | package rendering and behavior define this default together; full options can replace the mapping |
| recursive flatten, union branch, or renderer callback | keep | changes with the owned DOM/schema and cannot be hidden without moving policy away |
| item selection translated to a public component event | keep | defines the component's public contract |

Adaptable behavior uses one public name: `useTooltip(props, open)` for package
defaults and `useTooltip(fullOptions)` for complete ownership. Common changes
use named component props. A third options path is intentionally absent so the
model, form, ARIA, and renderer cannot observe different settings. Fixed native bindings remain isolated in
`@nagi-labs/nagi-ui/component-controls`. Ordinary `own` copies only the SFC and
editable schema/renderer modules; imported composables remain package
dependencies.

There are three distinct outcomes:

1. **Expandable default** — Listbox, Tabs, Combobox and five thin components
   use a one-line `useX(props, model)` overload. Common stable behavior stays
   on named component props. `recipes/control-expansion.md` shows complete
   `useX({...})` ownership for schema or algorithm changes.
2. **Fixed mechanism** — reset ordering, focus repair, native property sync,
   races and lifecycle stay hidden even when product behavior is expanded.
3. **Renderer policy** — union branches, recursive menu flattening, DOM-linked
   schema conversion and public events remain in owned source.

## Audit result

This inventory covers SFCs exported from `@nagi-labs/nagi-ui/components`, plus
the retained ActionMenu reference renderer called out separately below.
Historical playground fixtures which are not package or ownership sources are
excluded.

| Group | Components | Result |
|---|---|---|
| presentation/native structure | Alert, Badge, Breadcrumb, ButtonGroup, Card, EmptyState, Fieldset, InputGroup, Kbd, Separator, Skeleton, Spinner | props, schema policy, fixed ARIA, slots, DOM and CSS only; no behavior mechanism exists to extract |
| native elements | Input, Textarea, Checkbox, Radio, Select, Slider, Switch, Meter, Progress | native control remains visible; reset/property synchronization is in a fixed helper (`useNativeCheckbox` for the checkbox-only indeterminate channel) |
| small native interaction | FileInput, NumberField, Pagination, Rating, ToggleGroup | file state stays entirely native; number stepping/reset uses one fixed binding; pagination and toggle-group keep editable schema policy visible; rating exposes real radios and delegates only native reset ordering |
| behavior composition | Accordion, AlertDialog, Dialog, Disclosure, Listbox, Popover, Tabs, Toast, Toggle, Tooltip | stable defaults use the public component overload; fixed state-machine mechanisms stay in composables; DOM-linked policy stays owned |
| menu renderers | DropdownMenu, DropdownSubmenu, DropdownMenuItem | editable union/schema-to-DOM branches and recursive flattening stay owned; core `useMenu` owns focus/ARIA mechanics |
| retained reference renderer | ActionMenu | not exported or ownable; kept as the explicit-DOM Phase 2 reference |
| renderer-specific mechanisms | Avatar, Combobox, Button | image races, native form channels, and focusable-disabled activation stay package dependencies; Combobox's default schema mapping is separately expandable |

The current shipped SFC set contains no `watch` / `watchEffect`, lifecycle hook,
`document` / `window` access, or `useAttrs()` call. This is an audit outcome,
not a permanent ban on every future use.

## Changes made

- Toast delegates manager creation/disposal, popover synchronization, and F6
  to `useToast`; renderer-specific focused-item repair lives in the package
  `useToastRenderer`, which accepts the component props directly. Its SFC retains order, tone,
  announcement text, DOM, and CSS.
- Avatar delegates image load races, missed hydration errors, and default
  initials to package `useAvatar`.
- Listbox, Tabs, and Combobox use canonical one-line overloads for their shipped
  flat schemas. Listbox exposes `orientation`, `dir`, and `loop` as named props.
  All three can switch the same public function name to complete options using
  the package recipe; none has a third-argument override.
- Tabs keeps the controlled `defineModel` snapshot bridge after expansion;
  Combobox keeps native reset, validity, and clear-focus through
  `useNativeCombobox`. These are fixed mechanisms, not schema policy.
- DropdownMenuItem delegates editable action/checkbox/radio/link mapping
  mappings to `dropdown-options.ts`; the schema branches remain in the
  template.
- Button delegates focusable-disabled attributes and event suppression to
  package `useButton`.
- Dialog, Disclosure, Popover, Tooltip, and Toggle use the same public `useX`
  name for component defaults and complete options.
- Accordion delegates generated native grouping, exclusive/multiple open-key
  synchronization, native toggle ordering and disabled summary activation to
  `useAccordion(props, openKeys)`. Its SFC retains `item.key`,
  `item.disabled`, summary/content fallbacks, slots and DOM as editable schema
  interpretation.
- AlertDialog delegates its fixed `modal: true` / `closedby: "closerequest"`
  policy to `useAlertDialog(open)`. Required labels, action tone,
  public action/cancel events, visible IDREFs and explicit button anatomy stay
  in the SFC. Native close commands replace a nested `form method="dialog"`,
  so ownership remains safe inside consumer forms.
- The expanded thin slice adds no new binding: Breadcrumb's flat-schema/current
  rule is editable renderer policy; ButtonGroup, EmptyState, Kbd, Skeleton and
  Spinner have no state mechanism; Textarea reuses the existing one-line
  `useNativeValueReset` boundary.
- The small interactive slice keeps FileInput free of component state and
  forwards consumer attributes to its real file control. Pagination leaves its
  flat schema, controlled current-key rule, native link navigation and public
  selection event in the SFC because owners may change that renderer policy.
  Rating leaves radio items/markup visible and calls only
  `useNativeRadioGroupReset(inputs, model)`; the fixed helper owns reset event
  ordering and restores the numeric model plus checked member without a config
  object or component-specific state machine.
- Select and Slider delegate only native default/sanitization/reset synchronization
  to fixed `useSelect(select, model)` and `useSlider(input, model)` bindings;
  neither invents a configurable behavior option object.
- The first anatomy-sensitive slice keeps InputGroup presentation-only: caller
  markup owns the native control and opts into the declared control/action CSS
  surfaces. NumberField exposes the real `input[type=number]`, while
  `useNumberField(input, model)` contains only native step and reset
  synchronization. ToggleGroup keeps its single/multiple items policy beside
  the renderer and relies on ordinary pressed buttons and native tab order; it
  has no focus coordinator to hide.
- Input, Checkbox, Switch, and Slider bind `$attrs` directly in the template;
  Combobox merges `$attrs` with its behavior props through `mergeNagiProps`.
  Consumer attributes, classes, styles, and listeners intentionally target the
  inner native control; root layout changes remain an ownership concern.

## Deliberately visible

- props, defaults, `defineModel`, public `defineExpose`, and IDs which connect
  visible ARIA relationships;
- composable option objects that contain an actual renderer branch or public
  event transform; standard flat-schema defaults are hidden but expandable;
- schema-to-DOM branches and menu entry flattening, because owners extend them
  together;
- Toast order, tone and announcement transforms;
- the native control ref plus a one-line reset helper declaration.

## Ownership invariant

Ordinary `own` does not copy composables. Public component overloads and fixed
behavior remain package dependencies until the deferred `vue` / `all`
ownership design is resumed. Owned SFCs import adaptable `useX` functions from
the package root and fixed bindings from `component-controls`. Partial options
reuse the headless vocabulary; full ownership replaces the overload with the
one-argument form. `nagi-ui diff` compares owned files and does not report
imported-composable drift, so such changes require release notes and the
consumer browser recipe.
Blueprint-local schema and renderer modules are different: owners are expected
to edit them with the SFC, so `own` copies their complete relative-import
closure. A unit test scans every registered Vue/TS source and fails when the
ownership registry omits an edge, including TS-to-TS dependencies.

## Styling is a separate boundary

Blueprint CSS uses theme tokens without literal fallbacks. Visual DOM and CSS
remain exposed because they are intended ownership surfaces; hiding behavior
mechanisms does not move styling into a runtime API.
