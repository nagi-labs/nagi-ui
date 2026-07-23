# Phase 2 — Menu composable DX validation

Status: Implemented; focus architecture revised 2026-07-23

## Scope

Phase 2 validates the last unproven API shape in the Nagi UI charter: applying
typed behavior to repeated Vue template items through `itemProps(item)` without
introducing compound component wrappers.

This phase covers an action menu only. Checkable items, radio items, groups,
and submenus are the Phase 2.5 Dropdown completion scope. Listbox selection
and combobox filtering remain Phase 3 work.

## Behavior contract

- The trigger uses native `popovertarget` wiring and exposes
  `aria-haspopup="menu"` plus `aria-controls`.
- The popup uses `role="menu"` and delegates key events from the actual focused
  native item. The container receives focus only when no enabled item exists.
- Each item has a stable id derived from the menu id and the caller's stable key.
- `ArrowDown` / `ArrowUp` open from the first / last enabled item.
- Open-menu navigation supports `ArrowDown`, `ArrowUp`, `Home`, `End`, printable
  typeahead, `Enter`, `Space`, `Escape`, and `Tab`.
- Disabled items are never made active and cannot be selected.
- Selection and `Escape` close the menu and restore focus to the trigger.
- `Tab` closes without trapping focus.
- Native Popover behavior owns pointer opening, light dismiss, top-layer
  placement, and the reflected expanded state.

## Focus strategy

Nagi UI uses managed DOM focus on the rendered menu item. Every item receives
`tabindex="-1"` so the menu remains one tab stop, while Arrow keys, Home/End,
typeahead, pointer movement, and direct focus all converge on the same
`activeKey` and actual button or anchor. The menu container keeps
`tabindex="-1"` only as the empty/all-skipped fallback.

This replaced the original container `aria-activedescendant` decision after
native links exposed a contradiction: a keyboard event whose target is the
container cannot produce trusted anchor activation. Synthetic modifier clicks,
hidden clones, `window.open`, and location assignment all reimplement or break
some combination of ancestor cancellation, router interception, analytics,
`target`, `rel`, and `download`.

The APG link-menu example likewise focuses actual HTML anchors so their browser
behavior remains available:
[WAI-ARIA APG Navigation Menu Button Example](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/examples/menu-button-links/).

## API shape

```ts
const menu = useMenu<Action>({
  items: () => props.items,
  getKey: (item) => item.key,
  getTextValue: (item) => item.label,
  isDisabled: (item) => item.disabled ?? false,
  onSelect: (item) => emit("select", item),
  anchor: true,
});
```

```vue
<div class="action-menu">
  <button class="button -trigger" v-bind="menu.triggerProps">Actions</button>
  <ul class="list" popover v-bind="menu.menuProps">
    <li v-for="item in items" :key="item.key" class="item" role="none">
      <button class="button" v-bind="menu.itemProps(item)">{{ item.label }}</button>
    </li>
  </ul>
</div>
```

The focused item is styled with native `:focus`; Menu no longer emits
`data-active`. Open state continues to use `:popover-open`, and disabled state
uses `aria-disabled`.

## DX comparison

The comparison target is the documented Reka UI Dropdown Menu anatomy. The
minimal repeated-action template requires Root, Trigger, Portal, Content, and
Item component parts. Nagi UI uses five visible native elements and no hidden
wrapper, provider, or portal contract.

| Measure                                         |                                 Nagi UI |            Reka UI documented anatomy |
| ----------------------------------------------- | --------------------------------------: | ------------------------------------: |
| Template component tags                         |                                       0 |                      5 distinct parts |
| Visible/native opening tags in the minimal menu |                                       5 |     0 required by the public template |
| Provider/root wrapper                           |                                      No |                                   Yes |
| Portal                                          |                                      No |                                   Yes |
| Repeated-item expression                        |                       `itemProps(item)` |          component item + event props |
| Styling ownership                               | Entire DOM is owned and passes nagi-css | Component internals are library-owned |

The Nagi template is not shorter at any cost: it keeps the actual DOM,
relationships, and state selectors visible. The additional setup is a typed,
ordinary function call rather than component-part imports. This meets the
Phase 2 criterion because the repeated expression stays local and the template
does not gain wrapper or slot ceremony.

Comparison source: [Reka UI Dropdown Menu documentation](https://reka-ui.com/docs/components/dropdown-menu).

## Invariants and tests

- `activeKey` is `null` or identifies the enabled item that owns DOM focus.
- The menu container owns focus only when no enabled item exists.
- Arrow navigation skips disabled items and obeys the configured loop policy.
- Repeated printable keys cycle matching items; the buffer resets after the
  configured timeout.
- Selection happens at most once and disabled activation is a no-op.
- A native link's focused Enter event is never canceled or reproduced by core;
  nested menus stop propagation without preventing its default.
- Browser tests verify actual-item focus, trusted link interception, dynamic
  repair, visible focus, disabled skipping, Escape restoration, and both Tab
  directions.

## Breaking migration from the original Phase 2 focus contract

- Replace Menu selectors such as `[data-active]` with `:focus` (or
  `:focus-visible` for an additional modality-specific ring).
- Do not read Menu `aria-activedescendant`; inspect `document.activeElement` or
  the public `activeKey` when application logic genuinely needs the owner.
- Tests must send subsequent keys through the focused item/page, not refocus
  the `role="menu"` container with `locator.press()`.
- Listbox, Combobox, MultiSelect, and Tree keep their own documented
  active-descendant/data-active contracts; this migration applies only to
  Menu and Menu-derived popups.
