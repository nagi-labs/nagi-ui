# AGENTS.md

For architecture and design constraints, read `CHARTER.md` and `CLAUDE.md`
first. For standard commands, see `README.md` (`pnpm test`).

## Cursor Cloud specific instructions

Environment is a pnpm workspace (`@nagi-labs/nagi-ui`). Dependencies are
refreshed automatically on startup; the notes below cover non-obvious
startup/run caveats only.

- **Node version gotcha.** The repo needs Node `>=22.18.0` (CI uses Node 24)
  because `pnpm test` runs the TypeScript tests through Node's native type
  stripping — an older Node fails on the `.ts` test files. The VM's default
  `node` on `PATH` (`/exec-daemon/node`) is `v22.14.0`, which is too old, so
  Node 24 is installed via `nvm` and symlinked into `/usr/local/cargo/bin`
  (first on `PATH`) to win over that shim. Verify with `node -v` → `v24.x`.
- **pnpm** is provided by Corepack and pinned to `11.1.3` via the
  `packageManager` field; just run `pnpm ...` and Corepack resolves the right
  version per repo.
- **Tests:** `pnpm test` (plain `node --test`). `tests/ssr.test.ts` spins up
  an in-process Vite server (no external service) and writes a zero-JS
  artifact to `/tmp/nagi-zero-js-demo.html`.
- **Playground (interactive UI):** there is no `dev` script. Start the Vite
  dev server with `pnpm exec vite playground` (add `--host 127.0.0.1 --port
  5173` to pin the address). `PopoverLab.vue` demos `usePopover`, the dropdown
  blueprint, and toast/dialog stacking; `?autotest=stacking` paints a
  PASS/FAIL banner for the top-layer re-promotion self-test.
- **Cross-repo lint.** Blueprints must pass `nagi-css check` from the sibling
  `../nagi-css` repo. That check needs an external config (kept in the
  gitignored `.sandbox/`, not committed); it is optional for running/testing
  this repo.
