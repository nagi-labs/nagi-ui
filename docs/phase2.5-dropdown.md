# Phase 2.5 — Complete Dropdown validation

Status: Implemented

> **Note (Phase 2.6):** the blueprint validated here was since replaced by the
> schema-driven `packages/core/blueprints/menu/DropdownMenu.vue`; the explicit-DOM SFC this
> document describes now lives at `playground/src/DropdownFixture.vue` and
> remains the reference for the composable-level escape path. See
> [`phase2.6-dropdown-schema.md`](./phase2.6-dropdown-schema.md).

## Outcome

The Phase 2 attribute-injection shape still holds at the complete Dropdown
feature boundary. Stateful items and menu-tree coordination live in core;
groups, labels, separators, shortcuts, nested popovers, and every styling hook
remain visible in one caller-owned SFC.

The result is intentionally more markup than the action-only Blueprint. That
markup is the rendered structure rather than component-part ceremony: changing
a label, shortcut, group, separator, or item layout remains a local template and
CSS edit.

## Public API

`useMenu()` now exposes a behavior-specific props function for each interactive
item kind:

```ts
const menu = useMenu({
  items: rootItems,
  getKey: (item) => item.key,
  getTextValue: (item) => item.label,
  dir: "ltr",
  anchor: true,
})

const shareMenu = useSubmenu(menu, shareItem, {
  items: shareItems,
  getKey: (item) => item.key,
  getTextValue: (item) => item.label,
})
```

```vue
<button v-bind="menu.itemProps(actionItem)">Duplicate</button>
<button v-bind="menu.checkboxItemProps(toolbarItem, toolbarOptions)">
  Show toolbar
</button>
<button v-bind="menu.radioItemProps(sortItem, sortOptions)">Sort by name</button>
<button v-bind="menu.submenuTriggerProps(shareItem, shareMenu)">Share</button>
```

The hidden menu-tree controller is shared only through these returned objects.
There is no provider, Root component, Portal component, implicit registration
by component ancestry, or DOM query that defines the logical tree.

## Selection and close policy

| Item kind | Default after activation | Override |
| --- | --- | --- |
| action | close the entire tree and restore root-trigger focus | `closeOnSelect` |
| checkbox | update and keep the menu open | `closeOnSelect` |
| radio | update and keep the menu open | `closeOnSelect` |
| submenu trigger | open the child menu | not a selection |

An indeterminate checkbox exposes `aria-checked="mixed"`; activating it resolves
to checked. Activating an already-checked radio is idempotent.

## Menu-tree behavior

- Every level owns one `role="menu"` focus container and one
  `aria-activedescendant`. DOM focus moves between menu containers, never among
  individual items.
- The logical inline-end arrow opens a child; the opposite arrow closes one
  level. Under RTL these keys reverse.
- `Enter` / `Space` on a submenu trigger opens its child. On an action they
  select and close the complete tree.
- `Escape` closes one child level and restores focus to its parent menu. At the
  root it closes the tree and restores trigger focus.
- `Tab` closes the tree without trapping or restoring focus.
- Handled child key events stop propagation, preventing an ancestor menu from
  processing the same keystroke.
- Moving to another item closes sibling branches. Nested action selection and
  native light dismiss close all descendants.
- Pointer opening waits 120ms; closing waits 300ms. Entering the child during
  that grace period cancels close, allowing the pointer to cross the trigger-to-
  submenu gap.

Submenus are DOM-nested popovers. The native Popover API owns top-layer
relationships and light dismiss. Anchor Positioning uses logical inline-end;
both the native path and Floating UI fallback resolve it against the menu
direction explicitly.

## Visible structure and Nagi CSS

The complete reference is
[`packages/core/blueprints/menu/DropdownMenu.vue`](../packages/core/blueprints/menu/DropdownMenu.vue), and
its consuming SFC is
[`playground/src/DropdownLab.vue`](../playground/src/DropdownLab.vue).

Display-only parts do not need behavior components:

- labels are ordinary presentational list items referenced by `aria-labelledby`;
- groups use `role="group"`;
- separators keep the Element Class Table identity `item` and are selected by
  `[role="separator"]` rather than copying the role into a second class;
- shortcuts are visible text with `aria-hidden="true"`;
- open, checked, expanded, disabled, and active styling uses
  `:popover-open`, `aria-*`, and `data-active`, never runtime state classes.

The Blueprint and consuming SFC pass the sibling `nagi-css check` with an
external, uncommitted config.

## Same-boundary comparison

| Concern | Nagi complete Blueprint | Compound-part libraries |
| --- | --- | --- |
| group / label / separator / shortcut | native markup | dedicated parts |
| checkbox / radio | one item props call | dedicated item components |
| submenu tree | `useSubmenu()` plus one trigger props call | Root/Sub/Trigger/Content parts |
| overlay | nested native popovers | Portal plus positioned content |
| state selectors | native, ARIA, `data-active` | part-defined data attributes |
| structure and styling ownership | one copy-in SFC | distributed across library internals and caller composition |

The tradeoff is explicit: Nagi exposes more wiring at each interactive element,
but the resulting SFC shows the actual browser structure and the exact state
selector that changes it. Core still hides the unsafe coordination work:
keyboard dispatch, focus ownership, open path, close depth, RTL, pointer grace,
and native/Floating placement agreement.

## Verification

- Unit coverage: item variants, mixed state, LTR/RTL arrows, nested close depth,
  focus return, event propagation, pointer grace, and the Phase 2 behavior set.
- TypeScript 7 coverage: all returned props variants and `useSubmenu()` generic
  inference.
- Chromium coverage: checkbox/radio persistence, submenu keyboard round trip,
  nested selection, RTL placement, pointer crossing, and native light dismiss.
- Interactive page: `/dropdown.html` from `vp exec vite playground`.

Phase 3 can now reuse the item-distribution pattern for `useListbox`, followed
by `useCombobox`. Verified integration remains deferred to Phase 3.5, after
those interaction props contracts stabilize.
