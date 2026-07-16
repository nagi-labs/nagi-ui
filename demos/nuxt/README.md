# Nuxt lazy-hydration demo (Phase 0 Demo A)

Renders the real `blueprints/dropdown/DropdownMenu.vue` inside a Nuxt app under
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

What to look for:

- `app.vue` mounts the component with `:hydrate-after="8000"`, so its client JS
  does not run until 8s after load. Click **Actions** immediately — the dropdown
  opens while `component hydrated: false`.
- Disable JavaScript entirely (DevTools → "Disable JavaScript") and reload: the
  dropdown still opens, closes on Esc, and re-opens. The marker stays `false`.

The SFCs here (`app.vue`, `components/DropdownDemo.vue`) pass `nagi-css check`.
