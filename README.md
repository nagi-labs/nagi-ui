# Nagi UI

Nagi UI is a system for building and maintaining the component library you
own. It ships native-first Vue components as canonical reference
implementations: use them from the package for evaluation and light use, or
own their source — together with the definitions, tests, and verification that
keep an owned UI system correct over time.

## Principles

- Prefer native HTML behavior, attributes, and top-layer APIs.
- Keep component DOM visible and avoid wrapper component families.
- Confine complex behavior to narrow composables; keep structure and styling
  in ordinary Vue SFCs.
- Ship one canonical Vue SFC for package use and source ownership.
- Use semantic design tokens and the [Nagi CSS contract](https://github.com/nagi-labs/nagi-css).
- Keep package APIs small; own the source for structural customization.

See [CONCEPT.md](CONCEPT.md) for the product concept, [CHARTER.md](CHARTER.md)
for the architecture contract, and
[when not to use Nagi UI](docs/when-not-to-use-nagi-ui.md) for deliberate
product boundaries.

## Requirements

- Vue 3.5 or newer
- Node.js 22.18 or newer for the CLI and repository tooling
- Modern browsers for Popover API, native dialog, and related platform features

Vue Vapor status is tracked in the
[Vapor compatibility assessment](docs/vapor-compatibility.md).

## Install

```sh
vp add @nagi-labs/nagi-ui
```

Import components and the default theme:

```ts
import {
  NButton,
  NDialog,
  NDropdownMenu,
  NTable,
} from "@nagi-labs/nagi-ui/components"
import "@nagi-labs/nagi-ui/styles.css"
```

The root package export contains composables and runtime helpers. The
`./components` export contains the canonical Vue components.

Button appearance is authored through composable CSS axes such as
`--button-tone`, `--button-appearance`, `--button-shape`, and `--button-size`.
Add `nagiStyleCompiler()` from `@nagi-labs/nagi-ui/style-compiler` to the
application's PostCSS pipeline to validate and expand those finite values for
cross-browser output. See the [CSS style-axis guide](docs/style-axes.md) for the
Vite/Nuxt setup, value table, generated CSS, and static-runtime boundary.

## Component catalog

The Nuxt documentation and application showcase lives in [`site/`](site/README.md). It is built
entirely with Nagi UI and plain CSS governed by Nagi CSS.

Nagi UI ships `N*` exports rendered as kebab-case component tags:

`NAccordion`, `NAlert`, `NAlertDialog`, `NAutocomplete`, `NAvatar`, `NBadge`,
`NBreadcrumb`, `NButton`, `NButtonGroup`, `NCalendar`, `NCard`, `NCarousel`,
`NCheckbox`, `NCombobox`, `NContextMenu`, `NDateField`, `NDatePicker`,
`NDateRangePicker`, `NDialog`, `NDisclosure`, `NDropdownMenu`, `NEmptyState`,
`NFieldset`, `NFileInput`, `NInput`, `NInputGroup`, `NKbd`, `NListbox`,
`NMenubar`, `NMeter`, `NMultiSelect`, `NNavigationMenu`, `NNumberField`,
`NOtpField`, `NPagination`, `NPopover`, `NPreviewCard`, `NProgress`, `NRadio`,
`NRangeCalendar`, `NRangeSlider`, `NRating`, `NResizable`, `NSelect`,
`NSeparator`, `NSidebar`, `NSidebarLink`, `NSidebarSection`, `NSkeleton`, `NSlider`, `NSpinner`, `NStepper`, `NSwitch`,
`NTable`, `NTabs`, `NTagsInput`, `NTextarea`, `NTimeField`, `NToast`, `NToggle`,
`NToggleGroup`, `NToolbar`, `NTooltip`, and `NTree`.

Table is intentionally read-oriented. Sorting, editing, selection,
virtualization, and grid keyboard behavior belong to Nagi Grid. See the
[Table guide](docs/table.md).

Sidebar is persistent native application navigation, not a menu or tree. See
the [Sidebar guide](docs/sidebar.md) for its composition and boundaries.

## Theme

The combined stylesheet provides the complete semantic token set and a small,
opt-in native-element baseline:

```ts
import "@nagi-labs/nagi-ui/styles.css"
```

Its visual baseline is a dense, flat product UI: neutral surfaces, hairline
borders, compact 30px controls, restrained type, and elevation reserved for
overlays. The base layer supplies predictable box sizing, body typography,
form-control font inheritance, and accessible native links without erasing
browser control semantics.

Applications that already own their global baseline can import only the token
theme. The layers can also be imported separately:

```ts
import "@nagi-labs/nagi-ui/default-theme.css"
import "@nagi-labs/nagi-ui/base.css"
```

See the [base styles guide](docs/base-styles.md) for the exact boundary and
integration instructions.

Override roles as needed, or provide a complete replacement theme. Check its
coverage with:

```sh
vp exec nagi-ui theme check src/styles/nagi-theme.css
```

Inspect package installation, theme detection, and owned-source provenance:

```sh
vp exec nagi-ui status
vp exec nagi-ui status src/styles/nagi-theme.css
```

## Own component source

Owning the source is Nagi UI's primary model; the package is the light-use
tier. When an application adopts a component fully, copy its canonical source:

```sh
vp exec nagi-ui own dropdown-menu
```

Owned files carry `@nagi-source` provenance metadata. After ownership the local
repository is the source of truth: divergence is managed through provenance,
git history, and executable verification rather than central drift tracking.

Where a component has one, a [Component Definition](docs/component-definitions.md)
travels with the source. It records the guarantees the component makes, and its
functional anatomy is executable: `verifyAnatomy` fails when an owner's edit
breaks a structural requirement the behavior depends on.

Package and owned components may coexist. See the
[ownership model](docs/package-ownership-model.md).
Attribute destinations in owned Blueprints follow the
[attribute forwarding policy](docs/attribute-forwarding.md).

Owned Dialog and Tabs sources can opt into the experimental browser-level
[conformance contracts](docs/conformance-contracts.md). The contract
implementation remains in `@nagi-labs/nagi-ui/test`, so upgrading Nagi UI also
upgrades the shared accessibility and interaction invariants.

## Framework integration

```sh
vp exec nagi-ui setup
```

The setup command generates a local adapter for native navigation, Vue Router,
Nuxt Link, and Nuxt Image without creating framework-specific component copies.
See [framework integrations](docs/setup-integrations.md).

## Optional integrations

Charts remain composition rather than a Nagi component. The recommended Unovis
theme bridge is documented in the [Unovis guide](docs/unovis-integration.md).

## Development

```sh
vp run agents:setup
vp install --frozen-lockfile
vp run lint
vp run test:integration
vp run test
vp run audit:definitions
vp run typecheck:vue
vp run test:browser
```

`agents:setup` installs the repository-pinned APM 0.28.0 when necessary, then
restores ignored Claude Code, Codex, and Copilot files from `apm.lock.yaml`.
Use `vp` for package and script commands. See
[CONTRIBUTING.md](CONTRIBUTING.md) before changing public behavior or
architecture.

## License

[MIT](LICENSE), by nagi-labs contributors.
