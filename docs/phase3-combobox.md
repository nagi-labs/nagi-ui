# Phase 3 (slice 2) — useCombobox

Status: Complete. Unit / type / SSR / `nagi-css check` verified; the full
browser suite passes 19/19 including five Combobox focus, keyboard, filtering,
selection, and native-popover specs.

This slice validates the thickest part of the Phase 3 hypothesis: caller-owned
input and option DOM can remain readable while filtering and three distinct
states are coordinated by one composable.

## API

```ts
const combobox = useCombobox({
  items,                              // full data set
  getKey: (item) => item.key,
  getTextValue: (item) => item.label,
  isDisabled: (item) => item.disabled,
  filter: (item, input) => true,      // optional; default is substring match
  inputValue,                         // optional controlled Ref<string>
  selected,                           // optional controlled Ref<Key | null>
  onInputValueChange: (value) => {},
  onSelectionChange: (key) => {},
  onSelect: (item) => {},
})

combobox.inputProps                  // input: role, value, ARIA, handlers
combobox.listboxProps                // popover listbox: id, role, toggle
combobox.optionProps(item)           // option: id, state, click/pointer behavior
combobox.visibleItems                // filtered render source
combobox.activeKey                   // provisional keyboard suggestion
combobox.selectedKey                 // committed option; never filter-pruned
```

## Three states, not one overloaded value

- **`inputValue`** is editable text and drives filtering. It may be arbitrary
  text; changing it does not silently destroy the previously committed option.
- **`activeKey`** is the provisional suggestion reached by ArrowDown/ArrowUp.
  Escape clears it and closes the popup without changing input or selection.
- **`selectedKey`** changes only on Enter, option click, `select()`, or
  `clear()`. A selected key remains selected when filtering or data visibility
  removes it, carrying forward the Listbox no-prune invariant.

Composing `useListbox({ mode: "single" })` directly would be incorrect here:
single Listbox intentionally makes selection follow focus, whereas Combobox
must allow exploration followed by lossless Escape. The composables share the
key-identified active-descendant model and no-prune invariant, not a forced
selection state machine.

## Focus and keyboard decisions

- DOM focus remains on the native text `<input>`. `aria-activedescendant`
  points to the active option; options never enter the Tab sequence.
- ArrowDown/ArrowUp open the popup, move provisional focus, and skip disabled
  options. Enter commits. Escape closes without undoing typed text or the last
  committed option.
- Left/Right, Home/End, Backspace/Delete, and IME composition stay browser-owned
  so native single-line editing is not intercepted.
- The active suggestion uses `aria-selected="true"`, following the APG
  Combobox listbox-popup contract. It does not duplicate that state with
  `data-active`; CHARTER §6 was corrected accordingly.
- Active options are scrolled into view because browsers do not do that for
  `aria-activedescendant` targets automatically.

Reference: [WAI-ARIA APG Combobox Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/).

## Popup and controlled rendering

The suggestion list is a native `popover` with Anchor Positioning and the same
lazy Floating UI fallback as other anchored surfaces. The input cannot use
`popovertarget` (it is an editable text control), so `useCombobox` drives the
popover model while still emitting the complete SSR relationship (`role`,
`aria-controls`, `aria-expanded`, popup/listbox ids).

Filtering waits until Vue's next render before deciding popup visibility. This
is required for `defineModel` and other controlled/custom refs: their setter
publishes to the parent before their getter necessarily exposes the new prop.
The browser test caught this boundary when a no-match query was replaced while
the input retained focus.

## Blueprint

`blueprints/combobox/Combobox.vue` uses the Phase 3 schema shape:

```vue
<Combobox
  v-model="inputValue"
  v-model:selected="selectedKey"
  label="Framework"
  :items="frameworks"
/>
```

The copy-in SFC owns the `<label>`, `<input>`, popover `<ul>`, option `<li>`
loop, and all CSS. The consumer owns only data and models. Custom option
content remains a local Blueprint edit, not a core DSL or compound component.

Playground: `/combobox.html`.

## Consumer notes (deliberate behaviors worth knowing)

Three consequences of the design above are intentional, not omissions:

1. **`aria-selected` means different things in Listbox and Combobox.** In
   `useListbox`, `aria-selected` is the committed selection and `data-active`
   is the visual focus. In the Combobox popup, `aria-selected` marks the
   provisional active suggestion, per the APG combobox listbox-popup contract
   (CHARTER §6). Style sheets and tests written against one component must not
   assume the other's semantics.
2. **The committed option has no visual marker when the popup reopens** (no
   check mark). This matches the APG list-autocomplete examples. If a product
   wants one, it is a copy-in Blueprint edit: compare
   `combobox.selectedKey.value` against the option key in the `<li>` loop and
   style via a documented `data-*` attribute — do not repurpose
   `aria-selected`, which already carries the active-suggestion state.
3. **Blur keeps uncommitted text.** Typing "che" and leaving the field keeps
   the input showing "che" while `selectedKey` still holds the previously
   committed option — `inputValue !== getTextValue(selected)` is a
   representable state, the price of lossless Escape and non-destructive
   typing. Consumers that need strict agreement (e.g. form submission) should
   validate or reset from `selectedKey` at submit/blur time in the caller.

## Verification

- Unit (`tests/combobox.test.ts`): standard attribute graph, controlled refs,
  filtering, disabled skip, provisional navigation, Enter/Escape, pointer
  selection, editing-key/IME preservation, active repair, no-prune selection.
- Types (`tests/types/combobox.ts`): generic key inference and controlled-key
  variance.
- SSR (`tests/ssr.test.ts`): input/listbox roles and id references exist before
  hydration.
- `nagi-css check`: clean for the Blueprint and playground lab.
- Browser (`tests/browser/combobox.spec.ts`): input focus retention,
  `aria-activedescendant`, filtering, lossless Escape, keyboard/pointer commit,
  no-results close, and light dismiss; full suite 19/19.
