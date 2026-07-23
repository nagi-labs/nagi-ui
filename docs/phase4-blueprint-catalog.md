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

`@nagi-labs/nagi-ui/nagi-css-preset` exports the opaque package-component
names, the `n-` component prefix, and declared slot sub-surfaces.
Nagi CSS derives each boundary (`ButtonGroup` → `n-button-group`); the preset
does not duplicate a hand-written class map. A package consumer
merges it into the `semantic` section of its external Nagi CSS config:

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
package-boundary entry is needed for that local import. Owned Nagi sources use
prefix-free filenames and exact `n-` roots (`Button.vue` → `.n-button`); add
the separately exported `nagiUiSurfaceRootPrefixes` to the consumer's
`surfaceRootPrefixes` when linting owned sources.

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

Post-v0 Alignment D2 adds Avatar, Separator and Toggle as components 23–25.
Avatar keeps a stable accessible name across native image error/fallback and
source recovery; Separator translates horizontal semantics to `<hr>` and
vertical semantics to `role="separator"`; Toggle uses a native
`<button aria-pressed>`. The same slice removes `Nagi` from every SFC filename
and moves every Blueprint surface to the exact `.n-<filename-kebab>` namespace.

Post-v0 Alignment D3 adds Accordion and AlertDialog as components 26–27.
Accordion keeps repeated disclosure behavior in native `<details name>` while a
fixed `useAccordion` binding owns generated grouping, controlled `openKeys` synchronization
and disabled activation suppression. AlertDialog reuses native modal Dialog
behavior with `role="alertdialog"`, required description, explicit owned
Cancel/Action buttons and no nested form. Decisions and browser contracts are
recorded in
[`base-ui-alignment-d3-accordion-alert-dialog.md`](base-ui-alignment-d3-accordion-alert-dialog.md).
The same integration migrates the retired Nagi CSS anatomy class `.zone` to
`.unit` across every shipped Blueprint and playground fixture, without a
compatibility alias.

The expanded-catalog thin slice adds components 28–34: Breadcrumb,
ButtonGroup, EmptyState, Kbd, Skeleton, Spinner and Textarea. Native semantics
or presentation own the entire contract; no composable state machine, compound
family, autosize behavior, shortcut registry, or loading DSL was added. The
same SFCs are exported, registered for ownership, declared as opaque consumer
boundaries and exercised in `/catalog.html`. The catalog is now 34 / 54
(63.0%); the independent Base UI-aligned metric remains 27 / 37 (73.0%).

The small interactive slice adds components 35–37: FileInput, Pagination and
Rating. FileInput leaves chooser state, `FileList`, submission and reset to the
visible native file control. Pagination renders a flat schema as real links or
native buttons and keeps data fetching and router-specific nodes outside its
contract. Rating renders same-name native radios; only the browser reset/model
ordering is hidden in a fixed two-argument helper. None adds compound parts,
custom focus movement, pointer-only state or an upload engine. The catalog is
now 37 / 54 (68.5%), while the Base UI-aligned metric remains 27 / 37 (73.0%).

The first anatomy-sensitive slice adds components 38–40: InputGroup,
NumberField and ToggleGroup. InputGroup owns only a visual frame and requires
explicit `n-input-group-control` / `n-input-group-action` slot surfaces, leaving
native control attributes and semantics with caller markup. NumberField keeps a
visible native number input, uses native `stepUp()` / `stepDown()` and hides only
step/reset synchronization in one fixed `useNumberField` binding. ToggleGroup renders a flat
schema as real `button[aria-pressed]` controls and leaves every enabled button in
the native tab order instead of adding roving focus. The catalog is now 40 / 54
(74.1%), and shipping the two matching Base UI rows moves that independent
metric to 29 / 37 (78.4%). Contracts and browser results are recorded in
[`expanded-catalog-anatomy-slice-1.md`](expanded-catalog-anatomy-slice-1.md).

The second interaction follow-up adds components 41–43: PreviewCard,
RangeSlider and Stepper. PreviewCard keeps a real link and native auto popover
while its composable owns delayed pointer/focus transit. RangeSlider preserves
two native form controls and constant tab order on one visual track. Stepper is
only flat step navigation, not a wizard controller. At that point the catalog
reached 43 / 54 (79.6%), and PreviewCard plus RangeSlider moved the independent Base UI-aligned
metric to 31 / 37 (83.8%). Contracts and browser results are recorded in
[`expanded-catalog-interaction-slice-2.md`](expanded-catalog-interaction-slice-2.md).

The first cross-library strengthening slice originally kept the catalog at 22 while
adding the product anatomy independently established by shadcn-vue and
PrimeVue: Alert icon markup, Button small/default/large sizing, and Card footer
content. A follow-up applies the same rule to the stable title/description
parts of Card and Dialog, the title part of Alert, Disclosure summary and Badge
label: same-name content-only slots preserve their string props as fallbacks
and receive those values as slot props. The SFCs continue to own the wrappers,
ARIA relationships, native summary behavior, typography and tone. All remain
one-SFC package/ownership surfaces; no compound family, whole-header slot,
behavior-bearing slot, icon-name DSL, or expanded pass-through API was introduced. The complete
decision ledger records the adopted Base UI-aligned scope in
[`base-ui-component-comparison.md`](base-ui-component-comparison.md); the
current expanded shipped metric is 60 / 60 (100%) after the independently
approved final eleven-component slice documented in
[`expanded-vue-component-catalog.md`](expanded-vue-component-catalog.md).
