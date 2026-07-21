# Phase 3.5 — Verified integration

Status: Complete (2026-07-18). Prop composition, template binding lint,
runtime relationship verification, and rendered accessibility checks are all
implemented and exercised against the shipped Blueprints.

## Why this phase exists

Core unit tests prove the behavior objects emitted by Nagi. They do not prove
that an owned Blueprint still applies those objects to the correct elements
after a person or coding agent edits the SFC. Phase 3.5 checks that integration
boundary without moving DOM ownership back into library wrapper components.

## `mergeNagiProps()`

`mergeNagiProps()` combines behavior wiring with local element props while
making non-composable conflicts explicit.

```ts
const props = mergeNagiProps(menu.itemProps(item), {
  class: ["button", { "-danger": item.danger }],
  onClick: () => audit(item.key),
  "aria-describedby": "permission-hint",
})
```

Merge rules:

| Prop kind | Result |
|---|---|
| `class` | Vue-normalized class string, duplicate tokens removed |
| `style` | Vue-normalized merged style |
| `onX` | handlers called in source order |
| ARIA IDREF lists | tokens merged and de-duplicated |
| every other duplicate | equal values accepted; different values throw `NagiPropConflictError` |

Token-list ARIA attributes are `aria-controls`, `aria-describedby`,
`aria-flowto`, `aria-labelledby`, and `aria-owns`. Singular semantic
relationships such as `id`, `role`, `popovertarget`, `aria-haspopup`, and
`aria-activedescendant` are intentionally not mergeable.

The returned object reads through the original source objects. Reactive
getters such as `aria-expanded` and `aria-activedescendant` therefore remain
live instead of being captured once during `setup()`.

Unit coverage fixes composition order, token order, conflict behavior,
undefined handling, getter liveness, and source immutability. Type coverage
verifies that the result retains the keys of every source.

## `eslint-plugin-nagi-ui/verified-bindings`

The first lint slice reads Vue's template AST and recognizes Nagi binding
names such as `triggerProps`, `menuProps`, `itemProps(item)`, `listboxProps`,
`optionProps(item)`, `inputProps`, `tablistProps`, `tabProps(item)`, and
`panelProps(item)`.

It currently reports:

- a behavior object applied to the wrong native element;
- a behavior button without static `type="button"`;
- menu/popover/tooltip or Combobox popup wiring without native `popover`;
- direct attributes that replace IDs, roles, ARIA state, or relationship
  wiring owned by the behavior object;
- another object `v-bind` on the same element instead of an explicit
  `mergeNagiProps()` call;
- a `v-for` owning item/option wiring without `:key`.

The repository runs the rule against every shipped Blueprint:

```sh
vp run test:integration
```

### TypeScript 7 parser boundary

The current TypeScript ESLint parser crashes while loading TypeScript 7. Nagi
does not downgrade TypeScript and does not hide that incompatibility with
`skipLibCheck`. This rule needs only the template AST, so its dedicated pass
uses vue-eslint-parser's documented `parserOptions.parser: false` mode. The
SFC script is skipped and the complete template is still parsed.

Consequences:

- template expressions are available, including member and call paths;
- script imports, aliases, and data flow are not available in this pass;
- relationships crossing a child-component boundary cannot be proven
  statically and belong to the runtime DOM assertions;
- a future TypeScript 7-compatible parser can enrich analysis without
  changing the initial rule contract.

## Runtime DOM verification

Static template analysis ends at component boundaries and cannot see dynamic
IDs or the final rendered relationship graph. The core package therefore
exports three explicit runtime APIs:

```ts
import { assertNagiDom, observeNagiDom, verifyNagiDom } from "@nagi-labs/nagi-ui"

const issues = verifyNagiDom(document)
assertNagiDom(document)

if (import.meta.env.DEV) {
  const stop = observeNagiDom(document)
  // call stop() when the application root is disposed
}
```

`verifyNagiDom()` reports duplicate IDs, missing ARIA IDREF targets, an
`aria-activedescendant` outside its owning/controlled DOM, invalid native
popover targets, trigger/popup relationship mismatches, and missing
`commandfor` targets. Tabs-specific roving count and panel visibility stay in
its dedicated browser contract instead of imposing Nagi's native-disabled /
`hidden` choices on other tab implementations in the same document.
`assertNagiDom()` converts the issue list to an
`AggregateError` for tests. `observeNagiDom()` batches mutation-driven checks
and is deliberately opt-in: Nagi does not install a production-wide observer.

Browser fixtures prove both sides of the contract: valid opened Dropdown,
Listbox, Combobox, and Tabs graphs return no issues, while deliberately
corrupted generic relationship graphs produce the expected issue codes.

## Rendered accessibility checks

The Playwright suite runs axe-core with WCAG 2 A/AA and WCAG 2.1 A/AA tags
against states that static markup checks miss:

- an open Action Menu;
- the complete Dropdown with its submenu open;
- single and multiple Listboxes after keyboard selection;
- the Combobox with an open popup and active descendant;
- automatic/manual Tabs after keyboard navigation and dynamic item removal;
- open Dialog and Tooltip states.

These checks augment rather than replace the existing keyboard, focus,
selection, dismiss, and submenu tests. No axe rule is excluded. Adding the
suite exposed insufficient secondary-text contrast in Dropdown, Listbox, and
Combobox; the shipped Blueprint colors and equivalent explicit-DOM fixture
were corrected before the phase was marked complete.

The initial Phase 3.5 browser suite was 28/28 green; post-v0 vertical slices
extend the same executable contract and record current totals in their own
alignment documents. Package-source versus owned-copy parity and upstream
diff/migration integration belong to the Phase 4 ownership tooling, built on
these same checks.
