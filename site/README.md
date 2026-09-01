# Nagi UI documentation and showcase

This Nuxt site is both the Nagi UI documentation and a realistic customer-operations
application showcase. The whole site dogfoods Nagi UI and plain CSS checked by the Nagi CSS
contract; it does not use a utility framework, CSS Modules, or CSS-in-JS.

The catalog currently prerenders one focused documentation route for each of the 64 public Nagi
UI components. This count is derived from the catalog metadata used by the Nuxt prerender config.
Each route loads its owned Vue SFC directly from `packages/core/blueprints` and derives its
property reference from that same `defineProps` declaration. The catalog does not maintain a
second copy of Blueprint source or its prop names.

Nagi CSS is a separate product. The site names it as the CSS contract used here,
but links to the [official Nagi CSS documentation](https://nagi-labs.github.io/nagi-css/)
instead of maintaining a second explanation inside the Nagi UI site.

Every component page also publishes Definition progress. Verified Definitions show their
requirements and executable evidence; components that have not completed that audit show
`Definition · WIP` instead of silently omitting the section. The catalog cards expose the same
status so migration progress is visible before opening a component page.

## Local development

Run commands from the repository root:

```sh
vp install --frozen-lockfile
vp run site:dev
vp run nagi-ui-site#format
vp run nagi-ui-site#format:check
vp run site:lint
vp run site:typecheck
vp run site:generate
vp run test:visual
```

Static generation writes the deployable site to `site/.output/public`.
The site formatter keeps each Vue or HTML attribute on its own line when an
element has multiple attributes. Example SFCs embedded in TypeScript strings
must follow the same layout in their authored string because the formatter
does not parse arbitrary string contents as Vue templates.
Named-slot content also starts on the line after `<template #...>`. Oxfmt
preserves that authored layout, while `vp run audit:slot-format` checks both
real Vue files and decoded documentation example strings.

Visual baselines cover every Basic example in desktop-light and mobile-dark,
with additional interaction-state screenshots. After an intentional visual
change, run `vp run test:visual:update` and inspect the changed images before
accepting them.

Highlighted code HTML is a deliberate rendering boundary: only
`highlightRepositorySource` may brand repository-local Shiki output for
`CodeDisclosure`. Do not pass user-authored or otherwise untrusted HTML to that component.

## GitHub Pages

The Pages workflow generates and deploys the site on pushes to `main` and by manual dispatch.
In GitHub Actions, Nuxt derives the project-page base path from `GITHUB_REPOSITORY`, so assets
and navigation work at `https://<owner>.github.io/<repository>/`.

Set `NUXT_APP_BASE_URL=/` when deploying to a custom domain. The same variable can provide any
other hosting base path without changing application source.

The color theme is restored by a blocking head script before styles are painted. It reads the
saved `nagi-theme` preference and otherwise follows `prefers-color-scheme`, preventing a light
frame during full-page navigation or reload while dark mode is active.

## Relationship to Nagi

Nagi UI supplies the native-first Vue components and semantic theme tokens. Nagi CSS checks the
site's actual Vue templates and scoped plain CSS, including surface roots, anatomy, variants, and
runtime state. The site imports Nagi UI's combined `styles.css` entry and therefore dogfoods both
the default tokens and the opt-in native-element baseline; `site.css` contains only site-specific
decisions and token overrides. The source deliberately keeps ordinary Nuxt, Vue, HTML, and CSS
visible.

The Nuxt Vite CSS pipeline also runs `nagiStyleCompiler()`. Button contexts in `site.css` select
the concrete `.n-button` and author the public `--button-tone`, `--button-appearance`,
`--button-shape`, and `--button-size` axes there. Both public and generated properties are
non-inheriting, so a Dialog, action wrapper, or other ancestor cannot style a descendant Button by
accident. The integration is configured in `nuxt.config.ts` and documented in
[`docs/style-axes.md`](../docs/style-axes.md).
