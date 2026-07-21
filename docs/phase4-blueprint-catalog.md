# Phase 4 slice 4 — Blueprint catalog expansion

Status: Complete (2026-07-21). The v0 catalog now covers every public behavior
primitive plus the finite styling-only baseline defined by CHARTER §3.5.

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
| `Popover` | Popover API + `usePopover` | trigger label, `area`/`offset` props + content slot |
| `Dialog` | native `<dialog>` + `useDialog` | title/description props with same-name rich-content slots + body/action slots |
| `Tooltip` | hint popover + `useTooltip` | trigger/text, disabled, `area`/`offset` props |
| `Disclosure` | native `<details>` + `useDisclosure` | summary prop with same-name rich-content slot + disabled prop + body slot |
| `Toast` | manual popover + `useToast` + explicit `createToastManager()` | manager prop; structured add/update/close/promise API and F6 notification region |

The slot choices follow CHARTER §3.5: Popover, Dialog, and Disclosure exist to
contain free application markup. Behavior wiring never crosses a slot. Trigger,
close, tooltip, and toast anatomy remain owned by the SFC; Disclosure exposes
only the content inside its owned native `summary`. Requests to replace those
elements structurally use `nagi-ui own`.

The styling-only baseline is intentionally small:

| Component | Shape choice | Public customization boundary |
|---|---|---|
| `Button` | fixed native button | label slot + variant/size/focusable-disabled props |
| `Card` | semantically neutral frame | optional title/description props with same-name rich-content slots + body/footer slots |
| `Alert` | fixed status frame | title prop with same-name rich-content slot + tone/role props + icon/body slots |
| `Badge` | fixed inline label | label prop with same-name rich-content slot + tone prop |

Card, Alert, and Badge are the concrete styling-only examples named in CHARTER
§3.5. This is the v0 completion boundary, not a claim that future needs such
as an application-specific skeleton or empty state are forbidden. New
styling-only components remain phase-independent and require observed reuse;
they do not reopen Phase 4 or justify copying another suite's catalog.

## API discipline

- no `Root` / `Trigger` / `Content` component families;
- no Teleport, custom focus trap, `asChild`, render prop, or pass-through prop;
- all relationships remain native attributes emitted by the existing core;
- package use and `own` copy the same raw SFC;
- theme references contain no literal fallbacks; the required manifest,
  default theme and Blueprint vocabulary pass coverage checks;
- each new source is registered in `/components` and the ownership CLI.

## Completion criteria

1. package entry and ownership registry expose all v0 sources;
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

## Tone tokens

Alert and Badge are the second concrete users of positive/warning semantic
colors and tone surfaces. That satisfies the "two Blueprints before token
promotion" rule from `phase4-package-design.md`, so six roles join the public
theme vocabulary:

- `--nagi-color-success` / `--nagi-color-warning`;
- `--nagi-color-surface-accent`;
- `--nagi-color-surface-success` / `surface-warning` / `surface-danger`.

The `success` prop maps to CSS variant `-positive`: Nagi CSS reserves
`success` as runtime-state vocabulary, while the styling choice is a stable
tone identity. Default foreground/background pairs are all WCAG AA and remain
covered by the no-exclusion axe catalog test.

## Result

- `/components` and `nagi-ui own/list/diff` expose 12 v0 components, including
  the eight behavior-backed components and Button/Card/Alert/Badge;
- package-facade SSR verifies native IDs, commands, popovers, roles, and live
  regions before hydration;
- unit 103/103, TypeScript 7, verified-bindings, theme parity, and Nagi CSS
  checks pass;
- the package-import playground at `/catalog.html` passes behavior, runtime
  relationship, and no-exclusion axe coverage; the browser suite is 37/37.

Post-v0 Base UI alignment A1 (2026-07-21) added the boundaries shown in the
tables above plus a native-anchor Dropdown item. Current verification is unit
108/108 and browser + axe 40/40, with TypeScript 7, verified-bindings, theme
parity, and owned/consumer Nagi CSS checks green.

Post-v0 Alignment B adds nine native-first form/indicator Blueprints without
reopening the historical v0 boundary. The current package catalog is therefore
21 components; its contracts are recorded in
[`base-ui-alignment-b.md`](base-ui-alignment-b.md).

Post-v0 Alignment C keeps the catalog at 21 components while strengthening
Toast into explicit notification infrastructure. Its manager, announcement,
focus and deliberate modal boundary are recorded in
[`base-ui-alignment-c.md`](base-ui-alignment-c.md).

Post-v0 Alignment D1 adds Tabs as the 22nd package/ownable component. Its
independent roving-focus core, content-only panel slot and deliberate omissions
are recorded in [`base-ui-alignment-d-tabs.md`](base-ui-alignment-d-tabs.md).

The first cross-library strengthening slice keeps the catalog at 22 while
adding the product anatomy independently established by shadcn-vue and
PrimeVue: Alert icon markup, Button small/default/large sizing, and Card footer
content. A follow-up applies the same rule to the stable title/description
parts of Card and Dialog, the title part of Alert, Disclosure summary and Badge
label: same-name content-only slots preserve their string props as fallbacks
and receive those values as slot props. The SFCs continue to own the wrappers,
ARIA relationships, native summary behavior, typography and tone. All remain
one-SFC package/ownership surfaces; no compound family, whole-header slot,
behavior-bearing slot, icon-name DSL, or expanded pass-through API was introduced. The complete
decision ledger and 59.5% component-creation metric are in
[`base-ui-component-comparison.md`](base-ui-component-comparison.md).
