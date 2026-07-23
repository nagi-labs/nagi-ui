# Nuxt lazy-hydration demo (Phase 0 Demo A)

Renders the focused `demos/NativePopoverDropdown.vue` proof inside a Nuxt app under
delayed hydration to prove CHARTER §4.5: because the wiring is native
(`popovertarget` + `popover`), the dropdown opens **before the component
hydrates** — and with JavaScript fully disabled.

This demo is **isolated** from the library's `packages/*` workspace: it has its
own `package.json`, `pnpm-workspace.yaml`, and lockfile so Nuxt's heavy dependency
tree never enters the published library's install. Its workspace explicitly
allows the required native build scripts (`esbuild`, `@parcel/watcher`).

```sh
cd demos/nuxt
vp install --frozen-lockfile
vp run dev      # http://localhost:3000
```

## Quality checks

```sh
vp run fmt
vp run fmt:check
vp run lint
vp run typecheck
vp run check
vp run build
```

This isolated demo has no framework-independent TypeScript directory:
`nuxt.config.ts`, the Vue SFCs, and the external proof SFC all depend on Nuxt or
Vue-generated types. Oxc therefore performs syntax and correctness linting
without `--type-check`, while `nuxi typecheck` remains the authoritative
Nuxt/Vue SFC type check. If a standalone TypeScript directory with its own
`tsconfig.json` is added later, lint that directory separately with
`oxlint <dir> --ignore-path .gitignore --type-check --tsconfig=<config>` before
the Nuxt-only lint pass. This focused demo has no separate test task, so `check`
ends with Nuxt type checking and the production build remains an explicit gate.
The isolated workspace disables pnpm's global virtual store so Oxc and Nuxt
native optional binaries are always linked for the current operating system.

What to look for:

- `app.vue` mounts the component with `:hydrate-after="8000"`, so its client JS
  does not run until 8s after load. Click **Actions** immediately — the dropdown
  opens while `component hydrated: false`.
- Disable JavaScript entirely (DevTools → "Disable JavaScript") and reload: the
  dropdown still opens, closes on Esc, and re-opens. The marker stays `false`.

The demo SFCs (`../NativePopoverDropdown.vue`, `app.vue`, and
`components/DropdownDemo.vue`) pass `nagi-css check`.
