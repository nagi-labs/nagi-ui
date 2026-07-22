# Blueprint wiring exposure audit

Status: Complete (2026-07-22).

## Decision rule

The deciding question is not whether a source owner *can* change a line. It is:

> Is this a place where Nagi wants the user to make ordinary product changes?

Keep product policy, visible markup, schema rendering, and CSS in the SFC. Hide
browser ordering, lifecycle cleanup, focus repair, model/DOM synchronization,
and race handling behind a narrowly named component or native helper.

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
| `getKey`, `getTextValue`, `isDisabled` for a Blueprint-local item type | keep | owners change these when extending the schema |
| `items: () => loading ? [] : items` | keep | visible renderer policy for loading and empty states |
| item selection translated to a public component event | keep | defines the component's public contract |

The package uses narrow component adapters such as
`useTooltipControl(props, open)`. They are isolated in the
`@nagi-labs/nagi-ui/component-controls` subpath instead of enlarging the
headless package-root API. It does not use a generic prop mapper. If the SFC
must repeat the field mapping to call an adapter, the adapter has failed.
Ordinary `own` continues to copy only the SFC and editable schema/renderer
modules; these fixed adapters remain package dependencies.

A call containing schema interpretation stays intact even if a few of its
fields are direct model/prop connections. Splitting `useCombobox` or `useTabs`
into several adapters only to hide those fields would separate one editable
renderer decision across more vocabulary.

## Audit result

This inventory covers SFCs exported from `@nagi-labs/nagi-ui/components`.
Historical playground fixtures which are not package or ownership sources are
excluded.

| Group | Components | Result |
|---|---|---|
| presentation/native structure | Alert, Badge, Breadcrumb, ButtonGroup, Card, EmptyState, Fieldset, Kbd, Separator, Skeleton, Spinner | props, schema policy, fixed ARIA, slots, DOM and CSS only; no behavior mechanism exists to extract |
| native elements | Input, Textarea, Checkbox, Radio, Select, Slider, Switch, Meter, Progress | native control remains visible; reset/property synchronization is in a fixed helper |
| behavior composition | Accordion, AlertDialog, Dialog, Disclosure, Listbox, Popover, Tabs, Toast, Toggle, Tooltip | thin components use one package adapter; schema-aware components retain their editable mapping; state machines stay in composables |
| menu renderers | ActionMenu, DropdownMenu, DropdownSubmenu, DropdownMenuItem | editable schema-to-DOM branches stay visible; fixed node option and navigation mechanics moved to an owned helper |
| renderer-specific mechanisms | Avatar, Combobox, Button | image races, native combobox form channels, and focusable-disabled activation are package composables and are not copied by ordinary `own` |

The current shipped SFC set contains no `watch` / `watchEffect`, lifecycle hook,
`document` / `window` access, or `useAttrs()` call. This is an audit outcome,
not a permanent ban on every future use.

## Changes made

- Toast delegates manager creation/disposal, popover synchronization, and F6
  to `useToast`; renderer-specific focused-item repair lives in the package
  `useToastRenderer`, which accepts the component props directly. Its SFC retains order, tone,
  announcement text, DOM, and CSS.
- Avatar delegates image load races, missed hydration errors, and default
  initials to package `useAvatarControl`.
- Combobox delegates native reset ordering, custom validity, and clear-focus to
  package `useComboboxControl(props, input, combobox)` while its schema-aware
  `useCombobox` mapping remains visible.
- Tabs delegates the controlled `defineModel` snapshot bridge to
  `useTabsModelBridge`.
- DropdownMenuItem delegates editable action/checkbox/radio/link adapter
  mappings to `dropdown-options.ts`; the schema branches remain in the
  template.
- Button delegates focusable-disabled attributes and event suppression to
  package `useButtonControl`.
- Dialog, Disclosure, Popover, Tooltip, and Toggle replace direct prop option
  objects with their package `use*Control(props, model)` adapters.
- Accordion delegates generated native grouping, exclusive/multiple open-key
  synchronization, native toggle ordering and disabled summary activation to
  `useAccordionControl(props, openKeys)`. Its SFC retains `item.key`,
  `item.disabled`, summary/content fallbacks, slots and DOM as editable schema
  interpretation.
- AlertDialog delegates its fixed `modal: true` / `closedby: "closerequest"`
  policy to `useAlertDialogControl(open)`. Required labels, action tone,
  public action/cancel events, visible IDREFs and explicit button anatomy stay
  in the SFC. Native close commands replace a nested `form method="dialog"`,
  so ownership remains safe inside consumer forms.
- The expanded thin slice adds no new adapter: Breadcrumb's flat-schema/current
  rule is editable renderer policy; ButtonGroup, EmptyState, Kbd, Skeleton and
  Spinner have no state mechanism; Textarea reuses the existing one-line
  `useNativeValueReset` boundary.
- Input, Checkbox, Switch, and Slider bind `$attrs` directly in the template;
  Combobox merges `$attrs` with its behavior props through `mergeNagiProps`.
  Consumer attributes, classes, styles, and listeners intentionally target the
  inner native control; root layout changes remain an ownership concern.

## Deliberately visible

- props, defaults, `defineModel`, public `defineExpose`, and IDs which connect
  visible ARIA relationships;
- composable option objects that interpret an editable local schema or contain
  a real renderer branch; direct prop forwarding is not included;
- schema-to-DOM branches and menu entry flattening, because owners extend them
  together;
- Toast order, tone and announcement transforms;
- the native control ref plus a one-line reset helper declaration.

## Ownership invariant

Ordinary `own` does not copy composables. Fixed behavior remains a package
dependency until the deferred `vue` / `all` ownership design is resumed.
Owned SFCs import their fixed component adapters from
`@nagi-labs/nagi-ui/component-controls`; custom renderers import the public
headless composables from the package root. The subpath is an implementation
boundary for canonical/owned SFCs, not an invitation to build application
policy from control adapters.
Blueprint-local schema and renderer modules are different: owners are expected
to edit them with the SFC, so `own` copies their complete relative-import
closure. A unit test scans every registered Vue/TS source and fails when the
ownership registry omits an edge, including TS-to-TS dependencies.

## Styling is a separate boundary

Blueprint CSS uses theme tokens without literal fallbacks. Visual DOM and CSS
remain exposed because they are intended ownership surfaces; hiding behavior
mechanisms does not move styling into a runtime API.
