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
- `blueprints/` — copy-in SFCs written under the Nagi CSS contract (planned).
- `playground/` — Vite lab for `usePopover` / toast / dialog (`pnpm exec vite
  playground`; `?autotest=stacking` runs the Demo B self-test).
- `demos/nuxt/` — Phase 0 Demo A: the Dropdown blueprint under a real Nuxt app
  with delayed hydration (isolated, its own install — see its README).
- `tests/` — `pnpm test` (plain `node --test`, TypeScript via type stripping).

## Status

Phase 0 (vertical slice) complete — see CHARTER §10. All four completion
criteria met; Phase 1 (useDialog / useTooltip / useDisclosure) may begin.

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
