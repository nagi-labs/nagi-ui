# Phase 4 slice 4 — Blueprint catalog expansion

Status: Behavior-catalog sub-slice complete (2026-07-21). This closes the gap
between the public behavior core and the package/ownable component catalog;
styling-only expansion remains.

## Scope boundary

"Expand all Blueprints" is not an unbounded promise to clone every component
name in mature suites. Nagi uses two finite inventories:

1. every public behavior composable that represents a complete UI primitive
   must have a package component and an `own` source;
2. styling-only components are added from observed product needs, not from a
   speculative checklist (CHARTER §3.5).

Before this slice, Dropdown/Menu, Listbox, and Combobox covered the thick core,
while Button was the first styling-only component. The thin public behaviors
still existed only as playground fixtures. This slice ships the missing five:

| Component | Platform/core source | Public customization boundary |
|---|---|---|
| `Popover` | Popover API + `usePopover` | trigger label prop + content slot |
| `Dialog` | native `<dialog>` + `useDialog` | string props + body slot |
| `Tooltip` | hint popover + `useTooltip` | trigger/text props |
| `Disclosure` | native `<details>` + `useDisclosure` | summary prop + body slot |
| `Toast` | manual popover + `useToast` | exposed `toast()` / `dismiss()` methods |

The slot choices follow CHARTER §3.5: Popover, Dialog, and Disclosure exist to
contain free application markup. Behavior wiring never crosses a slot. Trigger,
close, summary, tooltip, and toast anatomy remain owned by the SFC; requests to
replace them structurally use `nagi-ui own`.

## API discipline

- no `Root` / `Trigger` / `Content` component families;
- no Teleport, custom focus trap, `asChild`, render prop, or pass-through prop;
- all relationships remain native attributes emitted by the existing core;
- package use and `own` copy the same raw SFC;
- theme references keep literal fallbacks and pass theme parity checks;
- each new source is registered in `/components` and the ownership CLI.

## Completion criteria

1. package entry and ownership registry expose all five sources;
2. SSR proves the native relationship attributes before hydration;
3. browser tests prove open/close/focus behavior through the package import;
4. opened states pass axe with no rule exclusions;
5. all shipped Blueprint templates pass verified-bindings and Nagi CSS lint.

## Nagi CSS consumer preset

`@nagi-labs/nagi-ui/nagi-css-preset` exports the fixed package-component
boundary classes and declared default-slot sub-surfaces. A consumer merges it
into the `semantic` section of its external Nagi CSS config:

```js
import nagiUi from "@nagi-labs/nagi-ui/nagi-css-preset"

export default {
  eslintFiles: ["src/**/*.vue"],
  stylelintFiles: ["src/**/*.vue"],
  semantic: nagiUi,
}
```

Package use is therefore opaque at the SFC boundary. After `own`, the copied
filename-derived surface becomes ordinary application-owned DOM and no
package-boundary entry is needed for that local import.

The two modes must be linted separately: package/owned Blueprint source uses
normal filename-derived surface rules, while a consumer SFC importing package
components uses this preset. Applying the opaque-boundary preset to the raw
Blueprint implementation itself would intentionally reject its owned `>`
chains and is a configuration error.

## Result

- `/components` and `nagi-ui own/list/diff` expose all five new raw SFCs;
- package-facade SSR verifies native IDs, commands, popovers, roles, and live
  regions before hydration;
- unit 102/102, TypeScript 7, verified-bindings, theme parity, and Nagi CSS
  checks pass;
- the package-import playground at `/catalog.html` passes behavior, runtime
  relationship, and no-exclusion axe coverage; the browser suite is 36/36.

Styling-only Card/Alert/Badge-style surfaces are the next sub-slice. Their
inventory will be driven by concrete composition needs and does not block
behavior-catalog parity.
