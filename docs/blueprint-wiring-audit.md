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

## Audit result

| Group | Components | Result |
|---|---|---|
| presentation-only | Alert, Badge, Card, Fieldset, Separator | props, slots, DOM and CSS only |
| native elements | Input, Checkbox, Radio, Select, Slider, Switch, Meter, Progress | native control remains visible; reset/property synchronization is in a fixed helper |
| behavior composition | Dialog, Disclosure, Listbox, Popover, Tabs, Toast, Toggle, Tooltip | the SFC declares models and binds returned standard attributes; state machines stay in composables |
| menu renderers | ActionMenu, DropdownMenu, DropdownSubmenu, DropdownMenuItem | editable schema-to-DOM branches stay visible; fixed node option and navigation mechanics moved to an owned helper |
| renderer-specific mechanisms | Avatar, Combobox, Button | image races, native combobox form channels, and focusable-disabled activation are package composables and are not copied by ordinary `own` |

The current shipped SFC set contains no `watch` / `watchEffect`, lifecycle hook,
`document` / `window` access, or `useAttrs()` call. This is an audit outcome,
not a permanent ban on every future use.

## Changes made

- Toast delegates manager creation/disposal, popover synchronization, and F6
  to `useToast`; renderer-specific focused-item repair lives in the package
  `useToastRenderer`. Its SFC retains order, tone,
  announcement text, DOM, and CSS.
- Avatar delegates image load races, missed hydration errors, and default
  initials to package `useAvatar`.
- Combobox delegates native reset ordering, custom validity, and clear-focus to
  package `useComboboxControl`.
- Tabs delegates the controlled `defineModel` snapshot bridge to
  `useTabsModelBridge`.
- DropdownMenuItem delegates editable action/checkbox/radio/link adapter
  mappings to `dropdown-options.ts`; the schema branches remain in the
  template.
- Button delegates focusable-disabled event suppression to package
  `useFocusableDisabled`.
- Input, Checkbox, Switch, and Slider bind `$attrs` directly in the template;
  Combobox merges `$attrs` with its behavior props through `mergeNagiProps`.
  Consumer attributes, classes, styles, and listeners intentionally target the
  inner native control; root layout changes remain an ownership concern.

## Deliberately visible

- props, defaults, `defineModel`, public `defineExpose`, and IDs which connect
  visible ARIA relationships;
- composable option objects, because they state component policy;
- schema-to-DOM branches and menu entry flattening, because owners extend them
  together;
- Toast order, tone and announcement transforms;
- the native control ref plus a one-line reset helper declaration.

## Ownership invariant

Ordinary `own` does not copy composables. Fixed behavior remains a package
dependency until the deferred `vue` / `all` ownership design is resumed.
Blueprint-local schema and renderer modules are different: owners are expected
to edit them with the SFC, so `own` copies their complete relative-import
closure. A unit test scans every registered Vue/TS source and fails when the
ownership registry omits an edge, including TS-to-TS dependencies.

## Styling is a separate boundary

Blueprint CSS uses theme tokens without literal fallbacks. Visual DOM and CSS
remain exposed because they are intended ownership surfaces; hiding behavior
mechanisms does not move styling into a runtime API.
