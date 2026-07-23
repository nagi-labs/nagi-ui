# Nagi UI

**A Vue UI system that delegates behavior to standard attributes and lets
consumers own the source only when they need to.** The normal path is a
themeable package component; the same SFC is the source for on-demand
ownership. Popovers, dialogs, and tooltips are delegated to the platform;
JS effort is reserved for Menu / Listbox / Combobox / Tabs and advanced
date/time interaction.

Nagi UI is the reference implementation of the
[Nagi CSS contract](../nagi-css/CONTRACT.md): no wrapper tags, no Teleport,
the user owns the DOM, and every blueprint passes `nagi-css check`.

See [CHARTER.md](CHARTER.md) for the architecture charter — it fixes the
design decisions and their rationale, and is updated as implementation
learning lands.

## Layout

- `packages/core` — `@nagi-labs/nagi-ui`. `.` exports the composable layer
  (ships no CSS); `./components` exports the Blueprint SFCs;
  `./default-theme.css` supplies the complete semantic-token defaults.
- `packages/core/blueprints/` — canonical SFCs, distributed as raw source:
  the same files serve package consumption and on-demand source ownership;
  see [`docs/package-ownership-model.md`](docs/package-ownership-model.md).
- `packages/core/recipes/testing/` — package-shipped Vitest Browser Mode and
  Playwright consumer contracts for package and owned components.
- `packages/core/recipes/control-expansion.md` — copyable examples for replacing
  a package component mapping with the complete public `useX({...})` form.
- `packages/core/recipes/unovis/` — the opt-in theme bridge and integration
  boundary for composing Unovis directly inside Card without a Chart proxy.
- `playground/` — Vite labs for the phase slices (`vp exec vite playground`;
  `?autotest=stacking` runs the Demo B self-test).
- `demos/nuxt/` — Phase 0 Demo A: the Dropdown blueprint under a real Nuxt app
  with delayed hydration (isolated, its own install — see its README).
- `tests/` — `vp run lint` (Oxc), `vp run test` (unit), `vp run typecheck`
  (TypeScript 7 for library code plus TypeScript 6/`vue-tsc` for SFCs), and
  `vp run test:browser` (Playwright Chromium).

Root linting is split by type boundary. `lint:typed` combines Oxc type-aware
rules and compiler diagnostics for the pure-TypeScript `tsconfig.json` scope.
`lint:vue` checks Blueprint, playground, and demo Vue/Vite source without
pretending to replace Vue SFC type checking. `lint:runtime` covers the CLI,
runtime tests, recipes, and configuration files outside that TypeScript
project. `vp run test:integration` remains separate: it runs Nagi's custom
`verified-bindings` Vue-template rule, which Oxc does not replace.
`vp run typecheck` remains the standalone full type check. It uses the
`@typescript/native` alias for the TypeScript 7 CLI on `tsconfig.json`, while
the `typescript` package resolves to the TypeScript 6 compatibility package
required by `vue-tsc` for `tsconfig.vue.json`. In a combined gate, do not chain
`typecheck:ts` after `lint:typed`: that Oxc pass already includes compiler
diagnostics for the same pure-TypeScript project. Run only `typecheck:vue`
after root lint. The SFC project keeps the root strictness, including
`exactOptionalPropertyTypes`; component overloads explicitly accept the
`undefined` values Vue uses for absent declared props. Only diagnostics inside
third-party declaration files are skipped.

## Status

Phases 0–4 are complete — see CHARTER §10. Phase 4 ships the package-first /
own-on-demand model, fixed ownership metadata and CLI, validated ownership
boundaries, a 12-component v0 baseline plus post-v0 native form controls, the
consumer Nagi CSS preset, and
real-browser consumer test recipes. Start with
[`docs/when-not-to-use-nagi-ui.md`](docs/when-not-to-use-nagi-ui.md) when the
product needs custom dismiss/stack state, gesture sheets, or Motion-level
orchestration. The customizable-select decision is recorded in
[`docs/phase3-select-decision.md`](docs/phase3-select-decision.md).

The expanded cross-library benchmark currently has
**60 / 60 (100%)** shipped components. The narrower Base UI-aligned shipped
scope is **37 / 37 (100%)**. Native recipes,
explicit declines, and separate products such as Nagi Grid are not counted;
see [`docs/expanded-vue-component-catalog.md`](docs/expanded-vue-component-catalog.md)
and [`docs/base-ui-component-comparison.md`](docs/base-ui-component-comparison.md).
The latest intent/navigation/range slice and its native-boundary audit are
recorded in
[`docs/expanded-catalog-interaction-slice-2.md`](docs/expanded-catalog-interaction-slice-2.md).
Calendar, RangeCalendar, DateField, DatePicker, DateRangePicker, and TimeField
are shipped as the advanced path; native date/time inputs remain the stable
path for simple values.
The final expanded slice—Autocomplete, Carousel, ContextMenu, Menubar,
MultiSelect, NavigationMenu, OTPField, Resizable, TagsInput, Toolbar, and
Tree—is shipped after its full release gate and fourth independent audit. Its
boundaries and evidence are recorded in
[`docs/expanded-catalog-completion.md`](docs/expanded-catalog-completion.md).

Package components are available without copying source:

```ts
import {
  Accordion,
  Alert,
  AlertDialog,
  Autocomplete,
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  ButtonGroup,
  Calendar,
  Card,
  Carousel,
  Checkbox,
  Combobox,
  ContextMenu,
  DateField,
  DatePicker,
  DateRangePicker,
  Dialog,
  Disclosure,
  DropdownMenu,
  EmptyState,
  Fieldset,
  FileInput,
  Input,
  InputGroup,
  Kbd,
  Listbox,
  Meter,
  Menubar,
  MultiSelect,
  NavigationMenu,
  NumberField,
  OTPField,
  Pagination,
  Popover,
  Progress,
  PreviewCard,
  Radio,
  RangeCalendar,
  RangeSlider,
  Rating,
  Resizable,
  Select,
  Separator,
  Skeleton,
  Slider,
  Spinner,
  Stepper,
  Switch,
  Tabs,
  TagsInput,
  Textarea,
  TimeField,
  Toolbar,
  Toast,
  Toggle,
  ToggleGroup,
  Tree,
  Tooltip,
} from "@nagi-labs/nagi-ui/components"
import "@nagi-labs/nagi-ui/default-theme.css"
```

Blueprint CSS contains no token fallback. Import the default theme and override
only the roles you need, or provide a complete replacement theme and gate it in
CI:

```sh
vp exec nagi-ui theme check src/styles/nagi-theme.css
```

Inspect package installation, theme evidence, and owned-source drift together:

```sh
vp exec nagi-ui status
vp exec nagi-ui status src/styles/nagi-theme.css
```

These are independent axes, not destructive migration stages: a theme continues
to apply after a component is owned, and package components can remain beside
owned ones. With no CSS argument, `status` detects a static
`default-theme.css`/`theme.css` import; if it cannot prove the active theme, it
reports `unresolved` instead of guessing. Pass all CSS files that make up a
replacement theme to validate its token coverage. Confirmed package, theme, or
owned-source problems produce a nonzero exit code; ordinary local `modified`
owned files do not.

For an explicit development-time cascade check, call
`warnMissingNagiThemeTokens(document.documentElement)`. Nagi UI does not install
a production observer automatically. `./theme.css` remains a compatibility
alias, but new code should use `./default-theme.css`.

The component catalog runs at `/catalog.html`; the date/time family runs at
`/date-time.html`; native form controls and the
strengthened Combobox run at `/forms.html`; the Alignment D Tabs matrix runs at
`/tabs.html`; the recommended Unovis composition runs at `/chart.html`.
Package/ownership details are in
[`docs/phase4-blueprint-catalog.md`](docs/phase4-blueprint-catalog.md).

Charts are an integration recipe rather than a Nagi component. Unovis is the
recommended default; Nagi provides Card anatomy, six mode-independent series
tokens and a CSS-custom-property bridge, while data/scales/axes/datum tooltips
remain Unovis vocabulary. See
[`docs/unovis-integration.md`](docs/unovis-integration.md).

Framework integration is selected once through the setup wizard:

```sh
vp exec nagi-ui setup
```

It offers native / Vue Router / Nuxt Link navigation and native / Nuxt Image
image URLs without creating framework-specific Blueprint copies. The generated
adapter, non-interactive flags, and exact boundary are documented in
[`docs/setup-integrations.md`](docs/setup-integrations.md).

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
  hide-all-popovers case (see the CHARTER revision history). Self-test at
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
- [x] Managed focus on each actual `tabindex="-1"` native item; disabled
  skipping, wrapping arrows, Home/End, typeahead, trusted anchor activation,
  selection, Escape, and Tab behavior
- [x] Nagi CSS compliant `packages/core/blueprints/menu/ActionMenu.vue`
- [x] Unit/type/browser coverage and documented Reka UI DX comparison in
  [`docs/phase2-menu.md`](docs/phase2-menu.md)

### Phase 2.5 — complete Dropdown

- [x] Checkable and radio items with explicit close policies
- [x] Shared menu tree model for submenu focus, keyboard, pointer, RTL, and
  close-depth coordination
- [x] Full Dropdown Blueprint plus consuming SFC, compared at the same feature
  boundary as Reka UI / shadcn-vue
- [x] Browser coverage for nested selection, Escape, ArrowLeft/ArrowRight,
  pointer grace, light dismiss, and RTL
- [x] Design result and invariants documented in
  [`docs/phase2.5-dropdown.md`](docs/phase2.5-dropdown.md)

The complete playground is available at `/dropdown.html` after running
`vp exec vite playground`.

### Phase 2.6 — Dropdown items schema Blueprint

- [x] Blueprint-local `DropdownMenuNode` union (seven node kinds, including a
  native `<a href>` link) + `menuEntries()` flatten in
  `packages/core/blueprints/menu/dropdown-schema.ts`
- [x] Schema renderer: `DropdownMenu.vue` + recursive `DropdownMenuItem.vue`
  and per-node `DropdownSubmenu.vue`; consumers pass `:items` data only
- [x] Explicit-DOM blueprint demoted to `playground/src/DropdownFixture.vue`
  (the composable-level escape path)
- [x] `nagi-css check` clean; unit/type/SSR verified; extension recipe in
  [`docs/phase2.6-dropdown-schema.md`](docs/phase2.6-dropdown-schema.md)
- [x] Browser coverage — the five Phase 2.5 specs run unchanged against the
  schema Blueprint, plus a spec for items recompute while the tree is open
  and dynamic submenu registration/removal (10 passed)

### Phase 3 — thick list components (complete)

- [x] `useListbox` single and multiple selection — shared activedescendant
  strategy, controlled `selected` ref, no-prune filtering invariant, Listbox
  blueprint + `/listbox.html`, browser suite 14/14; design notes in
  [`docs/phase3-listbox.md`](docs/phase3-listbox.md)
- [x] `useCombobox` editable value + filtering, provisional active option vs.
  committed selection, input-owned DOM focus, native popover + anchor
  positioning, and `/combobox.html`; design notes in
  [`docs/phase3-combobox.md`](docs/phase3-combobox.md)

Verified integration is complete: `mergeNagiProps`, template-only
`eslint-plugin-nagi-ui/verified-bindings`, opt-in runtime DOM verification,
and axe checks for opened Blueprint states now protect the stabilized
Menu/Listbox/Combobox contracts before Phase 4 productization; see
[`docs/phase3.5-verified-integration.md`](docs/phase3.5-verified-integration.md).

### Phase 4 — package-first productization (complete)

- [x] package components, raw ownership sources, theme tokens, and Nagi CSS
  consumer preset share one Blueprint source
- [x] `nagi-ui own` / `diff` and per-file `@nagi-source` metadata preserve an
  auditable upstream-update path
- [x] package-first boundaries passed Button / Dropdown / Combobox coding-agent
  experiments; see
  [`docs/phase4-validation-experiments.md`](docs/phase4-validation-experiments.md)
- [x] the v0 catalog exposes 12 package and ownable components; see
  [`docs/phase4-blueprint-catalog.md`](docs/phase4-blueprint-catalog.md)
- [x] constraints and component-level mixing guidance are explicit in
  [`docs/when-not-to-use-nagi-ui.md`](docs/when-not-to-use-nagi-ui.md)
- [x] copyable Vitest Browser Mode / Playwright contracts ship in
  [`packages/core/recipes/testing/`](packages/core/recipes/testing/README.md)

The recipe keeps keyboard, focus, dismiss, form, DOM wiring, and opened-state
accessibility behavior executable after ownership. `nagi-ui diff` tells the
consumer when upstream changed; the browser contract tells them whether their
local version still works. Both signals are required for safe owned-source
upgrades.

### Post-v0 — Base UI alignment

- [x] Alignment A adds local guarantees to existing components without
  importing Base UI's compound API shape.
- [x] Alignment B ships native-first Input, Checkbox, Radio, Switch, Select,
  Fieldset, Progress, Meter and single-thumb Slider, and completes ordinary
  Combobox form behavior. See
  [`docs/base-ui-alignment-b.md`](docs/base-ui-alignment-b.md).
- [x] Alignment C strengthens Toast with an explicit manager, structured
  notifications, upsert/update/close/promise, limit and F6 focus. See
  [`docs/base-ui-alignment-c.md`](docs/base-ui-alignment-c.md).
- [x] Alignment D1 ships Tabs as an independent thick slice with
  manual/automatic activation, roving focus, orientation/RTL, dynamic fallback
  and a content-only panel slot. See
  [`docs/base-ui-alignment-d-tabs.md`](docs/base-ui-alignment-d-tabs.md).
- [x] Alignment D2 ships Avatar, Separator and Toggle as small native
  primitives, and normalizes every shipped SFC to a prefix-free filename with
  an exact `n-` surface namespace. See
  [`docs/base-ui-alignment-d2-primitives.md`](docs/base-ui-alignment-d2-primitives.md).
- [x] Alignment D3 ships Accordion as a controlled native `<details>` group
  and AlertDialog as an explicit native modal decision surface. See
  [`docs/base-ui-alignment-d3-accordion-alert-dialog.md`](docs/base-ui-alignment-d3-accordion-alert-dialog.md).
- [x] The Blueprint wiring audit keeps ordinary product change points in SFCs,
  moves fixed browser/Vue mechanisms behind narrow helpers, and verifies that
  `own` copies every local dependency. See
  [`docs/blueprint-wiring-audit.md`](docs/blueprint-wiring-audit.md).
