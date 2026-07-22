# Expanded catalog thin slice

Status: Complete (2026-07-22).

This slice moves the first seven entries from the expanded Vue catalog into
the package/ownership catalog without introducing another behavior system.
The package now ships 34 of the 54 adopted slices (63.0%). The independent
Base UI-aligned metric remains 27 / 37 (73.0%).

## Shipped components

| Component | Public contract | Deliberate boundary |
|---|---|---|
| `Breadcrumb` | readonly flat items (`key`, `label`, optional `href` / `current`), accessible label and text separator | native `nav` + `ol`; exactly one current item; router components stay in setup adapters or ownership |
| `ButtonGroup` | optional accessible label and horizontal/vertical layout | owns only `role="group"` and layout; child Button APIs remain Button's responsibility |
| `EmptyState` | required title, optional description and one action slot | no fixed heading level, icon API, page block DSL or behavior |
| `Kbd` | required plain label | native presentation only; no shortcut registry or key listener |
| `Skeleton` | no props or slots | always decorative; the content owner supplies `aria-busy` / loading state |
| `Spinner` | optional accessible label | labelled form is `status`; unlabelled form is decorative; no progress value API |
| `Textarea` | required label, string model, native form props and inner-control attrs | native textarea and shared reset mechanism; autosize remains a separate future behavior |

## SFC boundary audit

The final SFC review applies the same rule as
[`blueprint-wiring-audit.md`](blueprint-wiring-audit.md): leave policy and
editable DOM mapping visible; hide fixed browser/Vue synchronization.

- Breadcrumb keeps its small schema-to-native-DOM mapping and current-item
  rule in the SFC because ownership may change navigation anatomy.
- Textarea delegates only the native reset event ordering and DOM/model repair
  to `useNativeValueReset`; `$attrs` are visibly attached to the real
  `<textarea>`.
- ButtonGroup, EmptyState and Kbd have no behavior mechanism to extract.
- Skeleton and Spinner contain only fixed ARIA policy plus CSS motion, with a
  reduced-motion branch. Neither creates a reactive loading state.
- The seven SFCs contain no watcher, lifecycle hook, direct DOM global,
  provider, Teleport, compound family, custom state attribute or token
  fallback.

## Package and ownership integration

Every component is:

1. exported from `@nagi-labs/nagi-ui/components`;
2. registered in `nagi-ui own/list/diff` with the same SFC as its copy source;
3. present in the Nagi CSS consumer preset;
4. exercised through the package import at `/catalog.html`; and
5. covered by direct SSR/source tests plus package-facade and browser tests.

The consumer preset stores component names with `componentClassPrefix: "n-"`.
Nagi CSS derives the opaque boundary from the normal convention
(`ButtonGroup` → `n-button-group`); the preset does not maintain a second
hand-written component-to-class table. Slot sub-surfaces remain explicit
because their names cannot be derived from the component name alone.

## Quality gates

The slice is accepted only after all of the following pass:

- dedicated SSR/source tests for all seven components;
- package facade, ownership registry and preset parity tests;
- TypeScript 7 typecheck and repository integration lint;
- canonical Blueprint and opaque-consumer Nagi CSS checks;
- Chromium catalog behavior, native form reset and no-exclusion axe scan;
- package tarball inspection proving all seven source SFCs are shipped; and
- a final diff audit for mechanism leakage, literal colors and token fallback.

Final verification: unit/SSR/source **198 / 198**, Chromium behavior + axe
**75 / 75**, TypeScript 7, repository integration lint, canonical and consumer
Nagi CSS, and package tarball inspection are all green.
