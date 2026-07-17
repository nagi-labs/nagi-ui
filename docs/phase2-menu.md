# Phase 2 — Menu composable DX validation

Status: Implemented

## Scope

Phase 2 validates the last unproven API shape in the Nagi UI charter: applying
typed behavior to repeated Vue template items through `itemProps(item)` without
introducing compound component wrappers.

This phase covers an action menu only. Checkable items, radio items, groups,
submenus, listbox selection, and combobox filtering remain later work.

## Behavior contract

- The trigger uses native `popovertarget` wiring and exposes
  `aria-haspopup="menu"` plus `aria-controls`.
- The popup uses `role="menu"`, receives DOM focus, and identifies the visual
  focus target with `aria-activedescendant`.
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

The WAI-ARIA APG documents roving `tabindex` and `aria-activedescendant` as
alternative composite-focus strategies. Nagi UI uses `aria-activedescendant`
for Menu because it lets DOM focus remain on one user-owned container while
`itemProps(item)` only injects standard attributes and handlers into repeated
items.

The two strategies are not mixed. Every item receives `tabindex="-1"`; the
menu container receives `tabindex="-1"` and `aria-activedescendant`.

Reference: [WAI-ARIA APG action menu using aria-activedescendant](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/examples/menu-button-actions-active-descendant/).

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

`data-active` is the only additional styling state. It represents the item
referenced by the container's `aria-activedescendant`; there is no native or
item-level ARIA selector that CSS can use for that relationship. Open state
continues to use `:popover-open`, and disabled state uses `aria-disabled`.

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

- `activeKey` is `null` or identifies an enabled current item.
- `aria-activedescendant` is absent when no enabled item exists.
- Arrow navigation skips disabled items and obeys the configured loop policy.
- Repeated printable keys cycle matching items; the buffer resets after the
  configured timeout.
- Selection happens at most once and disabled activation is a no-op.
- Browser tests verify focus ownership, visible active state, keyboard
  selection, disabled skipping, Escape restoration, and Tab escape.
