# Framework integrations (`nagi-ui setup`)

`nagi-ui setup` selects the application-level Link and Image integrations
without forking the Blueprint catalog or adding framework component names to
Nagi's stable schemas.

```sh
# Interactive
vp exec nagi-ui setup

# Reproducible for CI and coding agents
vp exec nagi-ui setup \
  --framework nuxt \
  --link nuxt-link \
  --image nuxt-image
```

The wizard detects `nuxt`, `vue-router`, and `@nuxt/image` from the consumer's
`package.json` and offers those as defaults. Every answer also has a flag:

| Choice | Values |
| --- | --- |
| Framework | `vue`, `nuxt` |
| Link | `native`, `vue-router`, `nuxt-link` |
| Image | `native`, `nuxt-image` (Nuxt only) |

The command writes two visible, local files:

- `nagi-ui.config.json` — the durable choice used by later Nagi tooling.
- `src/nagi/integrations.ts` — small typed helpers (override the directory with
  `--dir`). It is generated code; rerun setup instead of editing it.

Existing user-owned files are not overwritten. Use `--force` when deliberately
replacing a previous config or a non-generated integration file.

## Link boundary

The Dropdown `link` node always renders a real `<a href>`. Setup does not place
`<RouterLink>` or `<NuxtLink>` inside the Blueprint and does not add their
framework-specific props to `DropdownMenuNode`.

The generated helper translates a router location into three platform-shaped
fields:

```ts
const nagiLink = useNagiLink()

const items = computed<readonly DropdownMenuNode[]>(() => [
  {
    type: "link",
    key: "settings",
    label: "Settings",
    ...nagiLink({ name: "settings" }),
  },
])
```

- `href` comes from `router.resolve(to).href`, so SSR, no-JS navigation, copy
  link, open-in-new-tab, and modified clicks retain anchor semantics.
- `navigate` performs Vue Router `router.push()` or Nuxt
  [`navigateTo()`](https://nuxt.com/docs/4.x/api/utils/navigate-to) for an
  ordinary pointer/keyboard activation.
- `prefetch` is present for Nuxt and calls
  [`preloadRouteComponents()`](https://nuxt.com/docs/4.x/api/utils/preload-route-components)
  on pointer intent.

This is intentionally narrower than rendering the actual router component.
`NuxtLink`/`RouterLink` custom slots, active-class rendering, replace policy,
external-link policy, and application-specific analytics remain caller logic
or an ownership change. Nagi does not copy those APIs into its menu schema.

## Image boundary

`native` returns `{ src }`. `nuxt-image` uses Nuxt Image's stable
[`useImage()(src, modifiers)`](https://image.nuxt.com/usage/use-image) URL
generator and still returns standard `<img>` attributes:

```vue
<script setup lang="ts">
const nagiImage = useNagiImage()
</script>

<template>
  <img
    v-bind="nagiImage('/people/ada.jpg', { width: 96, height: 96, format: 'webp' })"
    width="96"
    height="96"
    alt="Ada Lovelace"
  />
</template>
```

This keeps owned DOM readable and avoids making `<NuxtImg>` a dependency of
every package Blueprint. Features that require the actual component — picture
art direction, its placeholder lifecycle, or advanced responsive rendering —
use `<NuxtImg>`/`<NuxtPicture>` directly in caller markup or after ownership.
The currently unstable `useImage().getSizes()` API is deliberately not part of
the generated adapter.

Setup does not install or configure third-party packages. Selecting
`nuxt-image` without `@nuxt/image` prints the exact follow-up and leaves
`nuxt.config` under application ownership.

## Why this stays small

There is one canonical Blueprint implementation. Framework selection changes
only the local functions that produce standard anchor navigation callbacks and
image URLs. It does not create a second Nuxt catalog, a runtime provider, a
dynamic component escape hatch, or a framework-specific schema DSL.
