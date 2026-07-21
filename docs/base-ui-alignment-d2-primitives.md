# Base UI alignment D2 — Avatar, Separator, Toggle

Status: Complete (2026-07-22).

This slice moves three thin, common capabilities from the comparison ledger
into package/ownership Blueprints without adopting compound component APIs.

## Contracts

| Component | Stable package API | Browser-owned behavior | Deliberate omissions |
|---|---|---|---|
| `Avatar` | required `alt`, optional `src`/`fallback`, content-only fallback slot | native image loading/error | group/stack provider, image component abstraction |
| `Separator` | `horizontal | vertical`, `decorative` | horizontal semantic `<hr>` | content-bearing divider, layout margin props |
| `Toggle` | `v-model`, `disabled`, default content slot | native button activation and disabled behavior | `asChild`, custom state attributes, Toggle Group coordination |

Avatar keeps one stable accessible wrapper name while the visual resource moves
between `<img alt="">` and fallback. The fallback is emitted during SSR, a
missed pre-hydration error is detected from the native image, and changing
`src` clears the failed request without accepting a stale error event.

Separator does not simulate vertical `<hr>` semantics. Horizontal semantic
separation is a native `<hr>`; vertical uses `role="separator"` plus
`aria-orientation="vertical"`; decoration uses `aria-hidden="true"`.

Toggle uses one contained `useToggle()` composable for the `aria-pressed`
model. The SFC remains a native `<button type="button">`; keyboard activation
and disabled event suppression stay with the browser.

## Surface namespace cleanup

The same slice removes the old filename workaround (`NagiButton.vue`) from all
Blueprints. Public names and SFC filenames are now prefix-free, while CSS owns
the namespace:

```text
Button                 package export
Button.vue             package and owned source
.n-button              exact Nagi CSS surface
```

Nagi CSS accepts `.n-button` only when `surfaceRootPrefixes` contains `n-` and
the remaining name exactly matches `Button.vue`. Bare `.button` and unrelated
`.n-control` fail. Multiple prefixes represent explicit repository namespaces;
they are not arbitrary `startsWith` exemptions.

Package consumers use the component boundary map from `nagi-css-preset`.
Consumers linting an owned copy add the separately exported
`nagiUiSurfaceRootPrefixes` to their own prefix configuration.

## Verification

- unit/SSR: exports, native semantics, fallback markup, controlled toggle;
- browser: Avatar load → error fallback → source recovery and pointer/keyboard
  Toggle activation;
- no-exclusion axe catalog coverage;
- TypeScript 7 and verified-bindings;
- owned and package-consumer Nagi CSS checks;
- ownership registry and package tarball coverage.

The live catalog is `/catalog.html`.
