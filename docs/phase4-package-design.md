# Phase 4 slice 1 - Package implementation design

Status: Implemented (2026-07-18). D1-D5 were approved in review and have been
implemented. Implementation results appear at the end.

## Objective

Make the implementation catch up with the package-first model in CHARTER
sections 0 and 3. On completion, these imports work:

```ts
import { DropdownMenu, Listbox, Combobox } from "@nagi-labs/nagi-ui/components"
import "@nagi-labs/nagi-ui/default-theme.css"
```

Blueprints remain a single source; there is no fork between the package build
and the source copied by `own`.

## D1. Distribution format: ship raw SFCs without compilation

Core already ships raw TypeScript (`exports: "./src/index.ts"`) without a build.
Components follow the same policy and ship as raw `.vue` files.

- **The single-source model is structural:** files included in the package are
  the exact source copied by `own`. The ownership model's warning sign of
  divergence between the package build and copy source is impossible because
  no separate build artifact exists.
- Opening `node_modules` reveals the Blueprint as-is, which helps both coding
  agents and humans.
- Vite and Nuxt can compile dependency `.vue` files directly through
  plugin-vue.
- Tradeoff: environments without a bundler and Vue plugin, such as direct CDN
  consumption, are unsupported. This prerequisite is acceptable for SFC users
  and is documented under cases where Nagi is not a fit.

## D2. Package layout: move Blueprints inside the package

npm cannot include files outside the package root, so move the repository-root
`blueprints/` directory to `packages/core/blueprints/` with `git mv` to preserve
history.

```text
packages/core/
  src/            <- composable layer; contains no CSS (the section 3 invariant applies per layer)
  blueprints/     <- component layer; SFCs including scoped CSS
  components.ts   <- "/components" entry; named SFC re-exports only
  theme/default-theme.css <- complete default token definitions
```

Exports map:

```jsonc
{
  ".": "./src/index.ts",              // composables only; unchanged
  "./components": "./components.ts",  // named Blueprint SFC re-exports
  "./default-theme.css": "./theme/default-theme.css",
  "./theme.css": "./theme/default-theme.css", // compatibility alias
  "./blueprints/*": "./blueprints/*"  // own command and direct imports
}
```

- **Do not mix components into `.` (recommended design).** First, unit tests
  import `.` through `node --test` and type stripping, and adding `.vue` to that
  module graph would break Node execution. Second, the invariant that the core
  layer contains no CSS is visible at the exports boundary. Third, this removes
  reliance on tree shaking. Update the import example in
  `docs/package-ownership-model.md` from `@nagi-labs/nagi-ui` to the
  `/components` subpath.
- Rejected alternative: make `.` a facade for composables and components. This
  saves one subpath in the developer experience but makes Node-based core use
  and SSR unit tests require a `.vue` loader.
- Declare `sideEffects` as `["**/*.vue", "*.css"]` so aggressive tree shaking
  does not remove style chunks for used components.

## D3. Theme-token layer

### Position in the contract

The Nagi CSS CONTRACT limits non-owned styling inside library components to the
ladder "props -> Pass Through -> **CSS custom properties** -> `::part()`". It
forbids descending with `>` from a boundary class and explicitly names custom
properties as the canonical path for design tokens. The theme layer is not a
new mechanism; it supplies token vocabulary to the CONTRACT's default path.

### Chosen form: a small semantic set, shadcn-style model B

Four models were compared: (1) three token layers, as in Material and PrimeVue
v4 (primitive -> semantic -> component); (2) a small semantic set, as in
shadcn; (3) only primitive scales, as in Radix Colors and Open Props; and
(4) public per-component tokens, as in Vuetify and Ant Design.

**Choose model 2.** It matches the customization ladder in section 3 exactly:
theme tokens -> small props -> a few slots -> ownership. The component-token
layers in models 1 and 4 duplicate ownership's role, which ownership fulfills in
Nagi. Model 3 leaves direct scale references in components, so rebranding
beyond hue requires component edits.

### Seven operating principles

1. **A token represents a role, not a value.** Consolidate values only when
   their roles match. For example, surface and on-accent text remain separate
   roles even if both currently equal `#fff`. A role becomes a token only after
   it recurs in **at least two Blueprints**. A value unique to one Blueprint
   remains a literal expression of that SFC's design; changing it belongs to
   ownership. Integration vocabulary for a specialized library is an exception
   only when a package-shipped recipe and a live playground/browser contract
   both exist and Nagi does not proxy the library API. Do not fabricate
   references in unrelated Blueprints merely to justify a token.
2. **Fix the vocabulary grammar.** Use
   `--nagi-<tier>-<role>[-<state>]`. The tier set is closed to
   `color / font / radius / shadow / size / space`. `space` was added on
   2026-07-18 after an explicit density requirement; changes to the tier set
   must likewise be deliberate revisions. Roles form a small closed set, while
   state suffixes are limited to values such as `active`, `disabled`, and
   `muted`. Sort tokens alphabetically within each tier.
3. **Treat background roles as pairs with foreground colors.** When a consumer
   replaces a background token such as `surface` or `surface-active`, they are
   responsible for its contrast with the foreground token rendered on it.
   Phase 3.5 axe tests validate this mechanically by scanning the themed
   playground. Names should make these pairs clear; do not promote decorative
   colors without a foreground pair into background-role tokens.
4. **No fallbacks, plus coverage tests.** Blueprints always use the form
   `var(--nagi-color-text)`. Defaults live only in `default-theme.css`, so a
   missing theme import or incomplete replacement theme is not hidden by a
   visual fallback. Unit tests enforce parity among the manifest, default
   theme, and token vocabulary referenced by Blueprints. Replacement themes use
   `nagi-ui theme check`, and an explicit development warning detects missing
   values in the actual cascade.
5. **Tokens survive ownership.** Copied SFCs retain their `var()` references,
   so **brand changes continue to reach all components through the default
   theme and overrides after ownership**. An owned component disconnects from
   the theme only when the consumer deliberately removes those references.
6. **Tokens are package public API.** Under the package-first model, token names
   are versioned compatibility commitments just like schema unions. Additions
   follow the section 3.5 discipline: promote frequently observed real needs
   and forbid speculative additions. Renames and removals are breaking changes.
7. **Names are mode-independent.** Value-based names such as `white` and
   `light-gray` are forbidden; use roles only. Future dark and multi-theme modes
   provide different values for the same token names through selectors such as
   `[data-nagi-theme="dark"]`, without changing the vocabulary. That work is a
   future slice.

### Derivation procedure

Audit in this order during implementation:

1. enumerate literal values in every Blueprint `<style>` block
2. assign each occurrence a **role**, classifying by purpose rather than value
3. retain only roles repeated in two or more Blueprints, and normalize value
   variance within each role; for example, the four current muted grays
   `#667d84`, `#5d7279`, `#50676f`, and `#526970` become one or two roles, which
   also constitutes a practical color audit
4. name tokens with the grammar in principle 2 and verify foreground pairs for
   background roles as required by principle 3
5. replace literals in Blueprints with fallback-free `var()` references, define
   defaults in `default-theme.css`, and add coverage tests for the manifest,
   defaults, and referenced vocabulary

The expected range is 16-25 tokens. Repeated values at the time suggested
color roles for text, text-muted, text-disabled, accent, surface,
surface-active, border, focus-ring, and danger; radius roles for control and
overlay; shadow for overlay; size for control; and font for detail.

### Relationship with nagi-css

The table in section 3 assigns theme distribution to the Nagi CSS package. Until
nagi-css defines a token specification, however, **the Nagi UI package owns the
token vocabulary and `default-theme.css`**. When nagi-css provides token checks
as a contract preset, such as linting references to undefined tokens, transfer
the source of truth there. Do not make cross-repository coordination a blocker
for this slice.

## D4. `own` metadata, not implemented in this slice

Shipping raw SFCs reduces `own` to copying the same file from `node_modules`
into the application, stamping it with
`@nagi-source <component>@<version>`, and switching the import. Slice 2 fixes
the metadata format and CLI after implementation validation, following the
ownership-model rule not to freeze the design before validating it.

## D5. Implementation changes and verification

Changes:

- `git mv blueprints packages/core/blueprints` and update references in
  playground labs, tests, `.sandbox/nagi.config.mjs`,
  `eslint.nagi.config.mjs`, and documentation paths
- add `src/components.ts`; update package exports, files, and side effects
- replace Blueprint CSS values with tokens and add
  `theme/default-theme.css`
- switch playground lab imports from relative paths to
  `@nagi-labs/nagi-ui/components`, so **the playground proves the package
  consumption path**

Verification, all mechanically enforceable through existing infrastructure:

1. unit tests, typecheck, `test:integration`, and `nagi-css check` remain green
2. the browser suite remains 28/28 green while labs import through the package
3. the theme proof adds a themed playground section that overrides several
   tokens and confirms, including axe checks, that rebranding works **without
   ownership**; this is preparation for the Button experiment
4. the CLI and an explicit development diagnostic enumerate missing tokens when
   the default theme is not imported or a replacement theme is incomplete

## Decisions approved in review on 2026-07-18

1. separate `/components` exports as recommended in D2
2. design theme tokens as the small semantic set in model 2 under the seven
   operating principles above
3. move `blueprints/` from the repository root to
   `packages/core/blueprints/`, following D2's directory design

## Implementation results (2026-07-18)

- The four shipped components were `Button`, `DropdownMenu`, `Listbox`, and
  `Combobox`, plus schema types. `ActionMenu` and the Phase 0 popover Dropdown
  remain historical validation Blueprints. They are not exported from
  `/components` and were not tokenized.
- **Naming rule, revised 2026-07-22:** SFC filenames and public exports use the
  product name directly, such as `Button.vue` and `Button`, without embedding
  the library namespace in the filename. Under the strict Nagi CSS
  `surfaceRootPrefixes: ["n-"]` contract, the surface root is uniquely derived
  as `n-` plus the kebab-cased filename (`Button.vue` -> `.n-button`). Both bare
  `.button` and filename-mismatched `.n-control` are lint errors.
- The derivation procedure produced **22 tokens**: color 10, font 2, radius 3,
  shadow 2, size 1, and space 4. As anticipated, `--nagi-color-danger` was
  promoted when Button became its second consumer. The audit consolidated the
  three muted text colors `#50676f`, `#526970`, and `#61777e` into
  `--nagi-color-text-muted`, and the two hover/active backgrounds `#e5f1f4`
  and `#edf5f7` into `--nagi-color-surface-active`.
- **Space tier and density:** the four roles are `surface-inset`, `item`,
  `item-gap`, and `control`. The work normalized the two control-padding values
  (trigger `0.5/0.8rem`, input `0.55/0.7rem`) and combobox item padding
  (`0.4/0.6rem`). **Density is expressed as a theme preset that overrides the
  space and size token groups together, not as a multiplier token.** Applying
  `calc()` everywhere conflicts with the readable-CSS contract, and one
  multiplier cannot tune spacing independently from tap-target size. Menu-only
  spacing for category labels and separators remains literal under principle 1.
- **Applying principle 1 directly means `danger` and `separator`, each used
  only by Menu, were not tokenized.** They become the first promotion candidates
  when a second component appears, such as the Button experiment or a future
  ContextMenu.
- `tests/theme-parity.test.ts` mechanically enforces parity among the manifest,
  default theme, and Blueprint token references, and also enforces the absence
  of Blueprint fallbacks.
- The playground now demonstrates the package consumption path: labs import
  `@nagi-labs/nagi-ui/components`; every component lab imports
  `default-theme.css`; and the Themed section demonstrates brand changes using
  token overrides alone. Because the popover is not teleported, custom
  properties inherit directly into the open menu tree.
- Verification: unit tests 89/89, including three parity tests; typecheck;
  `test:integration`; clean `nagi-css check`; and successful SSR execution for
  three lab variants. The browser suite was 29/29 green, including themed axe
  checks, when run on 2026-07-21.

### Slice 4 token promotion (2026-07-21)

The initial 22 tokens grew by six roles after Alert and Badge established
two-component repetition: positive and warning foregrounds, plus accent,
positive, warning, and danger surfaces. The total is now 28 tokens. Even though
`surface-accent` and `surface-active` currently have the same value, their roles
differ, so the theme public API keeps distinct names. See
`docs/phase4-blueprint-catalog.md` for details.

### Theme contract revision (2026-07-21)

The initial policy of giving each `var()` a literal fallback and making the
theme import optional has been retired. Fallbacks conceal missing tokens
visually and make incomplete custom themes difficult to detect before release.
Consumers now import `default-theme.css` explicitly. Complete replacement
themes use `nagi-ui theme check` as a CI gate and may call
`warnMissingNagiThemeTokens()` to inspect the real cascade during development.
The old `/theme.css` export remains a compatibility alias to the same default
file, but is not the canonical name.

### Unovis series palette (2026-07-22)

Unovis is the recommended Chart integration, and the theme adds
`--nagi-color-series-1` through `--nagi-color-series-6`. The manifest now
contains **34 tokens**. Instead of fabricating references in existing
Blueprints, parity tests recognize the package-shipped
`recipes/unovis/theme.css` as the formal consumer. Unovis is only a development
dependency of the root playground, never a core dependency or peer dependency.
Nagi does not add `Chart.vue`, a data schema, or scale and axis proxies. The
default theme provides light-mode values; a complete dark replacement theme
overrides all of them through the same mode-independent token names. Color must
not be the sole identifier, so the recipe requires labels, dash or marker
distinctions, and a native data table.

## Release invariant

Immediately after changing the version in `packages/core/package.json`, run
`vp run test` before tagging or publishing. CLI markers read the installed
version, so this gate catches hard-coded fixture values and ownership-status
regressions that only appear after a version bump.
