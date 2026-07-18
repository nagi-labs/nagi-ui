# Nagi UI

**A Vue UI system that delegates behavior to standard attributes and lets
consumers own the source only when they need to.** The normal path is a
themeable package component; the same SFC is the source for on-demand
ownership. Popovers, dialogs, and tooltips are delegated to the platform;
JS effort is reserved for Menu / Listbox / Combobox.

Nagi UI is the reference implementation of the
[Nagi CSS contract](../nagi-css/CONTRACT.md): no wrapper tags, no Teleport,
the user owns the DOM, and every blueprint passes `nagi-css check`.

See [CHARTER.md](CHARTER.md) for the architecture charter — it fixes the
design decisions and their rationale, and is updated as implementation
learning lands.

## Layout

- `packages/core` — `@nagi-labs/nagi-ui`. `.` exports the composable layer
  (ships no CSS); `./components` exports the Blueprint SFCs;
  `./theme.css` supplies the semantic tokens.
- `packages/core/blueprints/` — canonical SFCs, distributed as raw source:
  the same files serve package consumption and on-demand source ownership;
  see [`docs/package-ownership-model.md`](docs/package-ownership-model.md).
- `playground/` — Vite labs for the phase slices (`vp exec vite playground`;
  `?autotest=stacking` runs the Demo B self-test).
- `demos/nuxt/` — Phase 0 Demo A: the Dropdown blueprint under a real Nuxt app
  with delayed hydration (isolated, its own install — see its README).
- `tests/` — `vp run test` (unit), `vp run typecheck` (TypeScript 7), and
  `vp run test:browser` (Playwright Chromium).

## Status

Phases 0–3.5 complete — see CHARTER §10. The customizable-select decision is recorded in
[`docs/phase3-select-decision.md`](docs/phase3-select-decision.md).
Phase 4 is in progress: slice 1 (package materialization: `/components`,
`theme.css`, 17 semantic tokens — [`docs/phase4-package-design.md`](docs/phase4-package-design.md))
and slice 2 (`nagi-ui own` / `diff` with the fixed `@nagi-source` metadata —
[`docs/phase4-ownership-cli.md`](docs/phase4-ownership-cli.md)) have landed;
the validation experiments come next.

### Phase 0 — vertical slice

- [x] `usePopover` — uncontrolled and controlled (`v-model:open`) via
  two-way mirror sync (CHARTER §4.4)
- [x] `v-popover-trigger` directive with `getSSRProps`
- [x] Dropdown blueprint — `:popover-open` + `@starting-style`, native
  anchor positioning with a lazily-loaded Floating UI fallback; passes
  `nagi-css check` clean
- [x] Demo A — machine half: `tests/ssr.test.ts` asserts the full popover
  wiring is server-rendered as plain attributes and emits a zero-script
  artifact (`playground/dist-ssr/zero-js-demo.html`) whose dropdown opens
  with JS disabled. SSR is optimistically native for anchor positioning.
  Real-run half: `demos/nuxt/` renders the same blueprint through Nuxt with
  `hydrate-after` delayed hydration — the dropdown opens/closes before the
  component hydrates and with JavaScript fully disabled; the demo SFCs pass
  `nagi-css check` clean.
- [x] Demo B (implementation + self-test): `useToast` re-promotes the toast
  region above later top-layer entries — including the `showModal()`
  hide-all-popovers case (see CHARTER 改訂履歴). Self-test at
  `playground/?autotest=stacking` paints a PASS/FAIL banner, confirmed PASS
  in a real browser.

### Phase 1 — thin composables

- [x] `useDialog` — modal/non-modal native dialog, controlled state,
  Invoker Commands where valid, and close fallback
- [x] `useTooltip` — hover/focus union, hoverable hint, delayed opening, and
  native/Floating UI anchoring
- [x] `useDisclosure` — native `<details>`, controlled state, SSR `open`, and
  exclusive groups

### Phase 2 — Menu DX validation

- [x] Generic `useMenu<Item>()` with typed `itemProps(item)`
- [x] APG `aria-activedescendant` focus management; disabled skipping,
  wrapping arrows, Home/End, typeahead, selection, Escape, and Tab behavior
- [x] Nagi CSS compliant `packages/core/blueprints/menu/ActionMenu.vue`
- [x] Unit/type/browser coverage and documented Reka UI DX comparison in
  [`docs/phase2-menu.md`](docs/phase2-menu.md)

### Phase 2.5 — complete Dropdown

- [x] Checkable and radio items with explicit close policies
- [x] Shared menu tree model for submenu focus, keyboard, pointer, RTL, and
  close-depth coordination
- [x] Full Dropdown Blueprint plus consuming SFC, compared at the same feature
  boundary as Reka UI / shadcn-vue
- [x] Browser coverage for nested selection, Escape, ArrowLeft/ArrowRight,
  pointer grace, light dismiss, and RTL
- [x] Design result and invariants documented in
  [`docs/phase2.5-dropdown.md`](docs/phase2.5-dropdown.md)

The complete playground is available at `/dropdown.html` after running
`vp exec vite playground`.

### Phase 2.6 — Dropdown items schema Blueprint

- [x] Blueprint-local `DropdownMenuNode` union (six node kinds) +
  `menuEntries()` flatten in `packages/core/blueprints/menu/dropdown-schema.ts`
- [x] Schema renderer: `DropdownMenu.vue` + recursive `DropdownMenuItem.vue`
  and per-node `DropdownSubmenu.vue`; consumers pass `:items` data only
- [x] Explicit-DOM blueprint demoted to `playground/src/DropdownFixture.vue`
  (the composable-level escape path)
- [x] `nagi-css check` clean; unit/type/SSR verified; extension recipe in
  [`docs/phase2.6-dropdown-schema.md`](docs/phase2.6-dropdown-schema.md)
- [x] Browser coverage — the five Phase 2.5 specs run unchanged against the
  schema Blueprint, plus a spec for items recompute while the tree is open
  and dynamic submenu registration/removal (10 passed)

### Phase 3 — thick list components (in progress)

- [x] `useListbox` single and multiple selection — shared activedescendant
  strategy, controlled `selected` ref, no-prune filtering invariant, Listbox
  blueprint + `/listbox.html`, browser suite 14/14; design notes in
  [`docs/phase3-listbox.md`](docs/phase3-listbox.md)
- [x] `useCombobox` editable value + filtering, provisional active option vs.
  committed selection, input-owned DOM focus, native popover + anchor
  positioning, and `/combobox.html`; design notes in
  [`docs/phase3-combobox.md`](docs/phase3-combobox.md)

Verified integration is complete: `mergeNagiProps`, template-only
`eslint-plugin-nagi-ui/verified-bindings`, opt-in runtime DOM verification,
and axe checks for opened Blueprint states now protect the stabilized
Menu/Listbox/Combobox contracts before Phase 4 productization; see
[`docs/phase3.5-verified-integration.md`](docs/phase3.5-verified-integration.md).
