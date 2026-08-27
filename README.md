# Nagi UI

Nagi UI is a native-first Vue component system. It delegates behavior to web
platform features where they are strong, adds JavaScript where no native
equivalent exists, and lets applications take ownership of component source
when the package API is no longer the right boundary.

## Principles

- Prefer native HTML behavior, attributes, and top-layer APIs.
- Keep component DOM visible and avoid wrapper component families.
- Ship one canonical Vue SFC for package use and source ownership.
- Use semantic design tokens and the [Nagi CSS contract](https://github.com/nagi-labs/nagi-css).
- Keep package APIs small; own the source for structural customization.

See [CHARTER.md](CHARTER.md) for the architecture contract and
[when not to use Nagi UI](docs/when-not-to-use-nagi-ui.md) for deliberate
product boundaries.

## Requirements

- Vue 3.5 or newer
- Node.js 22.18 or newer for the CLI and repository tooling
- Modern browsers for Popover API, native dialog, and related platform features

## Install

```sh
vp add @nagi-labs/nagi-ui
```

Import components and the default theme:

```ts
import {
  Button,
  Dialog,
  DropdownMenu,
  Table,
} from "@nagi-labs/nagi-ui/components"
import "@nagi-labs/nagi-ui/default-theme.css"
```

The root package export contains composables and runtime helpers. The
`./components` export contains the canonical Vue components.

## Component catalog

Nagi UI ships:

`Accordion`, `Alert`, `AlertDialog`, `Autocomplete`, `Avatar`, `Badge`,
`Breadcrumb`, `Button`, `ButtonGroup`, `Calendar`, `Card`, `Carousel`,
`Checkbox`, `Combobox`, `ContextMenu`, `DateField`, `DatePicker`,
`DateRangePicker`, `Dialog`, `Disclosure`, `DropdownMenu`, `EmptyState`,
`Fieldset`, `FileInput`, `Input`, `InputGroup`, `Kbd`, `Listbox`,
`Menubar`, `Meter`, `MultiSelect`, `NavigationMenu`, `NumberField`,
`OTPField`, `Pagination`, `Popover`, `PreviewCard`, `Progress`, `Radio`,
`RangeCalendar`, `RangeSlider`, `Rating`, `Resizable`, `Select`,
`Separator`, `Skeleton`, `Slider`, `Spinner`, `Stepper`, `Switch`,
`Table`, `Tabs`, `TagsInput`, `Textarea`, `TimeField`, `Toast`, `Toggle`,
`ToggleGroup`, `Toolbar`, `Tooltip`, and `Tree`.

Table is intentionally read-oriented. Sorting, editing, selection,
virtualization, and grid keyboard behavior belong to Nagi Grid. See the
[Table guide](docs/table.md).

## Theme

The default theme defines the complete semantic token set:

```ts
import "@nagi-labs/nagi-ui/default-theme.css"
```

Override roles as needed, or provide a complete replacement theme. Check its
coverage with:

```sh
vp exec nagi-ui theme check src/styles/nagi-theme.css
```

Inspect package installation, theme detection, and owned-source drift:

```sh
vp exec nagi-ui status
vp exec nagi-ui status src/styles/nagi-theme.css
```

## Own component source

Package components are the default. When a component needs structural changes,
copy its canonical source into the application:

```sh
vp exec nagi-ui own dropdown-menu
```

Nagi UI records source metadata so local changes can be compared with a newer
installed version:

```sh
vp exec nagi-ui diff dropdown-menu
```

Package and owned components may coexist. See the
[ownership model](docs/package-ownership-model.md).

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
vp install --frozen-lockfile
vp run lint
vp run test:integration
vp run test
vp run typecheck:vue
vp run test:browser
```

Use `vp` for package and script commands. See
[CONTRIBUTING.md](CONTRIBUTING.md) before changing public behavior or
architecture.

## License

[MIT](LICENSE), by nagi-labs contributors.
