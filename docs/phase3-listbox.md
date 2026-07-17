# Phase 3 (slice 1) — useListbox

Status: Complete. Unit / type / SSR / `nagi-css check` verified; browser
suite (`vp run test:browser`) passed 14/14 including the four listbox specs.

Phase 3 validates that the Phase 2 item-distribution pattern
(`optionProps(item)` over caller-owned `v-for` DOM) survives a selection
model. `useCombobox` (input + filtering + active descendant) is the next
slice; Select waits on the customizable-select standard (CHARTER §7, §10).

## API

```ts
const listbox = useListbox({
  items: () => visibleItems.value,   // MaybeRefOrGetter, key-identified
  getKey: (item) => item.key,
  getTextValue: (item) => item.label, // typeahead
  isDisabled: (item) => item.disabled ?? false,
  mode: "multiple",                  // "single" (default) | "multiple"
  selected,                          // optional Ref<readonly Key[]> — controlled
  defaultSelected: [],
  onSelectionChange: (keys) => {},
})

listbox.listboxProps                 // role=listbox, tabindex=0, aria-activedescendant,
                                     // aria-multiselectable?, keyboard + focus handlers
listbox.optionProps(item)            // role=option, id, aria-selected, aria-disabled?, data-active?
listbox.selectedKeys                 // the selection source of truth (the controlled ref if given)
```

## Design decisions

- **Focus strategy is shared with `useMenu`**: DOM focus stays on the
  `role="listbox"` container, options are `aria-activedescendant` targets.
  One strategy across list-like components, per CHARTER §7.
- **Selection is an array of keys, in both modes.** Single mode holds at most
  one key. One shape keeps the controlled contract (`selected` ref +
  `onSelectionChange`) and the blueprint `v-model:selected` identical across
  modes.
- **Single mode: selection follows focus** (APG-recommended, native-select
  behavior): arrows, Home/End, and typeahead select as they move. **Multiple
  mode: focus moves independently**; Space/Enter and click toggle,
  Shift+Arrow extends, Ctrl/Cmd+A toggles all enabled options. Range
  selection with a click anchor is out of scope for this slice.
- **Selection is never pruned by the items list.** Keys that disappear from
  `items` stay in `selectedKeys`; only the visual active option is re-parked.
  Filtering must not destroy selection — this is the invariant `useCombobox`
  will build on, and the browser spec pins it with a filter input.
- Hover does not move the active option (unlike menus, where pointer
  tracking feeds submenu grace). Pointer highlight is CSS `:hover`; the
  active option is a keyboard concept.

## Blueprint

`blueprints/listbox/Listbox.vue` — flat `items` prop
(`{ key, label, disabled? }[]`), `v-model:selected`, `mode` prop. Options are
data-shaped (CHARTER §3.5), so the blueprint is schema-style with no slots;
custom option content is a copy-in edit exactly like the dropdown recipe
(`docs/phase2.6-dropdown-schema.md`).

Playground: `/listbox.html` — single (fruit), multiple with a filter input
(toppings) demonstrating the no-prune invariant.

## Verification

- Unit (`tests/listbox.test.ts`): mode matrix (focus/selection coupling),
  controlled ref + change events, click paths, Ctrl+A, typeahead, disabled
  skip, filter no-prune, emitted attribute shapes, horizontal RTL arrows —
  `vp run test`: 64 pass.
- Types (`tests/types/listbox.ts`): generic key inference, controlled ref
  variance (explicit key union), closed `mode` vocabulary.
- SSR: `ListboxLab.vue` renders with roles/ids/aria-selected present.
- `nagi-css check`: clean (blueprint + lab).
- Browser (`tests/browser/listbox.spec.ts`): selection-follows-focus,
  multi-select keyboard set, disabled click guard (`force: true` to bypass
  Playwright actionability), filter no-prune — 14/14 passed.
