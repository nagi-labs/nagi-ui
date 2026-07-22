# Expanded catalog anatomy slice 1

Status: Shipped (2026-07-22).

This slice adds InputGroup, NumberField, and ToggleGroup as components 38–40.
They were selected together because each looks small in a catalog but forces a
different API-boundary decision: caller-owned native markup, a native control
with a small mechanism binding, and a repeated controlled schema.

## Product contracts

| Component | Public shape | Browser-owned behavior | Deliberately excluded |
|---|---|---|---|
| `InputGroup` | `prefix` / `suffix` text, same-name content-only slots, default control slot, action slot | semantics, attributes, value, validation, submission and reset of the caller's actual control | duplicated Input props, group role by default, field state, framework nodes and arbitrary part APIs |
| `NumberField` | label, nullable number model, native number attributes, decrement/increment labels | number parsing, validity, min/max/step rules, keyboard arrows, form association and default action | locale formatter/parser, scrub gesture, wheel policy, layout modes and compound buttons |
| `ToggleGroup` | label, flat items, single/multiple mode, controlled value, group/item disabled | button focus, keyboard activation and tab order | roving focus, toolbar semantics, arbitrary item renderers, orientation state and compound items |

## InputGroup: explicit styling surfaces

InputGroup is presentation-only. It does not instantiate Input or own a value;
the application supplies a native `input`, `select`, or `textarea` and therefore
keeps the complete platform attribute vocabulary:

```vue
<InputGroup prefix="https://" suffix=".dev">
  <input
    class="n-input-group-control"
    name="projectUrl"
    aria-label="Project URL"
    autocomplete="url"
  />
  <template #action>
    <Button class="n-input-group-action" type="submit">Open</Button>
  </template>
</InputGroup>
```

The two classes are declared Nagi CSS slot surfaces. They make cross-boundary
styling explicit and lintable instead of styling every slotted `input` or
`button` by tag name. Prefix/suffix wrappers remain owned by the SFC, so their
slots replace only content and retain default spacing and borders.

## NumberField: one fixed mechanism binding

The SFC visibly contains its label, native number input, and two step buttons.
Props, defaults, disabled-limit policy, DOM, and CSS stay in the Blueprint.
`useNumberField(input, model)` hides only three operations users should
not normally edit with that DOM:

- normalize the native empty value to `null`;
- call `stepDown()` / `stepUp()` and mirror `valueAsNumber` to the Vue model;
- restore the initial native value and model after the browser's form reset.

The binding takes two positional arguments and exposes no option object or
general numeric-field DSL. It is available only from the package's
`component-controls` boundary, not the public headless root.

## ToggleGroup: schema policy stays visible

ToggleGroup renders every item as a real `button type="button"` with
`aria-pressed`. Single-mode deselection and multiple-mode immutable updates are
short product policies that owners may change with the renderer, so they remain
in the SFC. Native buttons already provide focus and Space/Enter activation;
all enabled items remain ordinary tab stops. A roving-focus coordinator would
add a second interaction model without an ARIA requirement for this pressed
button group.

## Package and ownership invariants

- The same three SFCs back package imports and `nagi-ui own`.
- `@nagi-labs/nagi-ui/components`, the ownership registry, and the Nagi CSS
  consumer preset contain all three names.
- InputGroup's four declared slots are the only new package CSS sub-surfaces.
- NumberField's binding remains a package dependency after ordinary ownership;
  deferred composable ownership is not reopened by this slice.
- No component adds `watch`, lifecycle hooks, global DOM access, Teleport,
  literal color values, token fallbacks, or retired `.zone` anatomy.

## Browser contracts

The Forms lab verifies NumberField button and Arrow-key stepping, live model
output, FormData, native form association, and reset of both NumberField and a
caller-owned InputGroup control. The Catalog lab verifies single deselection,
Space activation, multiple independent pressed values, disabled items, and the
absence of invented `tabindex`. Existing axe scans cover both pages.

The release gate is:

```sh
vp run test
vp run typecheck
vp run test:integration
vp run test:browser
vp node ../nagi-css/packages/cli/src/cli.mjs check --config .sandbox/nagi.config.mjs --cwd .
vp node ../nagi-css/packages/cli/src/cli.mjs check --config .sandbox/nagi.consumer.config.mjs --cwd .
```

Final verification passed 221 unit/SSR tests, 80 Chromium browser/axe tests,
TypeScript 7 type checking, integration lint, both Nagi CSS boundary checks,
and package tarball inspection. The tarball contains all three raw SFCs and the
NumberField binding.

After this slice, expanded catalog progress is **40 / 54 (74.1%)**. Because
NumberField and ToggleGroup also close Base UI baseline rows, the independent
Base UI-aligned metric becomes **29 / 37 (78.4%)**.
