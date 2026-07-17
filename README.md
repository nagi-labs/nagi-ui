# Nagi UI

**A Vue headless layer that injects standard attributes instead of replaying
behavior in JS.** Popovers, dialogs, and tooltips are delegated to the
platform (Popover API, `<dialog>`, Invoker Commands); JS effort is reserved
for the patterns the platform does not cover (Menu / Listbox / Combobox).

Nagi UI is the reference implementation of the
[Nagi CSS contract](../nagi-css/CONTRACT.md): no wrapper tags, no Teleport,
the user owns the DOM, and every blueprint passes `nagi-css check`.

See [CHARTER.md](CHARTER.md) for the architecture charter — it fixes the
design decisions and their rationale, and is updated as implementation
learning lands.

## Layout

- `packages/core` — `@nagi-labs/nagi-ui`: composables plus directive sugar.
  Ships no CSS.
- `blueprints/` — copy-in SFCs written under the Nagi CSS contract.
- `playground/` — Vite labs for the phase slices (`vp exec vite playground`;
  `?autotest=stacking` runs the Demo B self-test).
- `demos/nuxt/` — Phase 0 Demo A: the Dropdown blueprint under a real Nuxt app
  with delayed hydration (isolated, its own install — see its README).
- `tests/` — `vp run test` (unit), `vp run typecheck` (TypeScript 7), and
  `vp run test:browser` (Playwright Chromium).

## Status

Phases 0–2 complete — see CHARTER §10. Phase 3 may begin with `useListbox`,
followed by `useCombobox` only after the listbox selection model is stable.

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
- [x] Nagi CSS compliant `blueprints/menu/ActionMenu.vue`
- [x] Unit/type/browser coverage and documented Reka UI DX comparison in
  [`docs/phase2-menu.md`](docs/phase2-menu.md)
