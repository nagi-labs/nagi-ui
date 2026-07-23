# AGENTS.md

For architecture and design constraints, read `CHARTER.md` and `CLAUDE.md`
first. Use Vite+ (`vp`) as the repository entrypoint for Node, package-manager,
task, and package-binary commands. Do not invoke `pnpm` directly.

## Cursor Cloud specific instructions

Environment is a pnpm workspace (`@nagi-labs/nagi-ui`) managed through `vp`.
Dependencies are refreshed automatically on startup; the notes below cover
non-obvious startup/run caveats only.

- **Node version gotcha.** The repo needs Node `>=22.18.0` (CI uses Node 24)
  because the test script runs TypeScript through Node's native type stripping.
  Use `vp env use 24` when the current runtime is too old; do not install a
  second Node toolchain or modify global `PATH` symlinks. Verify with
  `vp node --version`.
- **Dependencies:** `vp install --frozen-lockfile`. The underlying pnpm version
  is pinned to `11.1.3` by the `packageManager` field and resolved by `vp`.
- **Tests:** `vp run test` (plain `node --test`) and `vp run typecheck`
  (TypeScript 7). `tests/ssr.test.ts` spins up
  an in-process Vite server (no external service) and writes a zero-JS
  artifact to `/tmp/nagi-zero-js-demo.html`.
- **Lint:** `vp run lint` runs separate Oxc passes for the type-aware
  TypeScript project, Vue/Vite source, and runtime tests/configuration.
  `vp run test:integration` remains the custom Nagi UI Vue-template contract
  check and is not replaced by Oxc. Do not follow `lint:typed` with
  `typecheck`; both run compiler diagnostics for the root `tsconfig.json`.
- **Browser tests:** `vp run test:browser` starts the playground through the
  Playwright `webServer` config and runs Chromium keyboard/focus coverage.
  Install the browser once with `vp exec playwright install chromium`.
- **Playground (interactive UI):** there is no `dev` script. Start the Vite
  dev server with `vp exec vite playground` (add `--host 127.0.0.1 --port
  5173` to pin the address). `PopoverLab.vue` demos `usePopover`, the dropdown
  blueprint, and toast/dialog stacking; `?autotest=stacking` paints a
  PASS/FAIL banner for the top-layer re-promotion self-test. Phase 2 Menu is
  available at `/phase2.html`; the complete Dropdown is available at
  `/dropdown.html` — the schema-driven Blueprint (LTR/RTL) beside the
  explicit-DOM fixture (`playground/src/DropdownFixture.vue`). Phase 3 labs
  are available at `/listbox.html` and `/combobox.html`.
- **Cross-repo lint.** Blueprints must pass `nagi-css check` from the sibling
  `../nagi-css` repo. That check needs an external config (kept in the
  gitignored `.sandbox/`, not committed); it is optional for running/testing
  this repo.
