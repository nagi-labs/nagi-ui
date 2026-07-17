# Phase 3.5 — Verified integration

Status: In progress. Slice 1 (`mergeNagiProps` + template binding lint) is
complete. Runtime relationship assertions and rendered accessibility checks
remain.

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
`optionProps(item)`, and `inputProps`.

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

## Remaining slices

1. Runtime DOM assertions for missing ID targets, invalid
   `aria-activedescendant`, duplicate item IDs/keys, and trigger/popup
   relationship mismatches.
2. Rendered accessibility checks for each opened Blueprint state, combined
   with the existing Playwright keyboard/focus contracts.
3. Ownership workflow integration: run the same checks against package-source
   SFCs and owned copies, then use them as safety rails for upstream diff and
   migration.
