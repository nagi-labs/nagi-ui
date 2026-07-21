# Cross-library component benchmark and Nagi UI coverage policy

Status: Research and decision baseline (2026-07-21). This document is a
coverage compass, not an API-compatibility promise and not an implementation
backlog by itself.

## Purpose and source snapshot

Nagi uses three libraries for different kinds of evidence instead of treating
one catalog as the whole market:

| Reference | What it is evidence for | What Nagi does not copy |
|---|---|---|
| [Base UI 1.6.0](https://base-ui.com/llms.txt) | Behavior, accessibility, keyboard, focus and state-management guarantees | React compound parts, portals, render props, providers and event-cancellation framework |
| [shadcn-vue rolling catalog](https://www.shadcn-vue.com/docs/components) | Common Vue product anatomy, source-ownership ergonomics and practical composition | Reka compound APIs, `as-child`, Tailwind and one-file-per-part public families |
| [PrimeVue 5 catalog](https://primevue.dev/components/) | Package-first expectations, themeable defaults and commonly requested props/slots | Pass-through surface, global services and an API for every visual variation |

The platform remains the highest-priority source. HTML, CSS and ARIA decide
whether the browser can own behavior; the three libraries show which product
requirements users repeatedly expect around that behavior.

The primary coverage scope is:

- every component Nagi currently ships: **22 / 22** below;
- every component in the Base UI 1.6.0 baseline: **37 / 37**, split between
  the 18 direct shipped mappings and 19 unshipped capabilities below.

PrimeVue's 90+ catalog and every shadcn-vue block are not automatic Nagi scope.
Data grids, calendars and other product domains should receive their own
benchmark slice when Nagi chooses to enter that domain.

For component-creation progress, the adopted implementation set is currently
37 slices: 22 shipped components plus 15 unbuilt component slices (eight
`Candidate`, six `Defer`, and the separate multi-thumb Slider). This is
**22 / 37 = 59.5%**. `Native/recipe` and `Decline` rows are deliberately not
counted as components to build. This metric tracks Nagi's chosen product, not
API parity with any reference catalog.

## Benchmark rule

### Behavior and accessibility

Base UI is the main comparison for non-native behavior. A guarantee is worth
adopting when it represents a common accessibility or interaction requirement
and can be implemented by the browser or one contained composable. Presence in
Base UI does not authorize a second JavaScript state machine when the platform
already owns the interaction.

### Product anatomy

When both shadcn-vue and PrimeVue independently expose the same visible part or
small enum, that agreement is sufficient product evidence. It is **not
speculative API** and does not need additional Nagi-specific examples before
review. Examples include Card footer and Button size.

Agreement is evidence for the capability, not for the source API. Nagi still
translates it through CHARTER §3.5:

1. fixed structure becomes owned DOM;
2. strings, booleans and enums become props;
3. homogeneous repetition may become a small items schema;
4. genuinely free markup becomes the minimum justified slot;
5. deeper variation remains source ownership or direct composable use.

A feature present in only one styled reference stays evidence-gated. A feature
common to all references may still be declined when its defining implementation
conflicts with native ownership, such as custom Select, gesture Drawer or a
portal/focus-trap runtime.

### Decision vocabulary

| Decision | Meaning |
|---|---|
| **Shipped** | The practical common contract is already present. |
| **Strengthen** | Nagi ships the component, but the cross-library audit found a small compatible gap. |
| **Candidate** | A separate component/composable is justified and compatible with the charter. |
| **Native/recipe** | HTML/CSS or composition of existing Nagi components is the correct product. |
| **Defer** | The capability is valuable but needs an independent vertical slice and browser tests. |
| **Decline** | The defining behavior conflicts with Nagi's platform-first or ownership model. |

## Architectural translation, not API translation

| External concept | Nagi translation |
|---|---|
| `Root` state owner | `useX()` composable or native element state |
| `Trigger` / `Item` / `Popup` parts | Standard attributes and event props applied to owned DOM |
| `Header` / `Content` / `Footer` styling parts | Fixed anatomy in one SFC with only the necessary content holes |
| `Title` / `Description` | String props and owned semantic DOM |
| Arbitrary icon or action content | A justified named slot only when multiple product references establish the part |
| Portal | Native top layer; no Teleport/portal |
| Positioner | CSS Anchor Positioning with isolated Floating UI fallback |
| Backdrop | Native `::backdrop` when the platform provides it |
| `render` / `asChild` | Native markup through a composable, framework adapter, or source ownership |
| Provider/context coordination | Explicit manager object or local composable only when coordination is the requirement |
| `data-*` state hooks | Native pseudo-class/ARIA first, then a documented Nagi state only when needed |

## Shipped Nagi component audit

This table applies the same four-axis review to every package/ownable component.
"Common" means common capability, not API parity.

| Nagi component | Platform / Base UI guarantee | shadcn-vue product signal | PrimeVue product signal | Nagi decision |
|---|---|---|---|---|
| `Alert` | Native `status`/`alert`; Base UI has Alert Dialog, not a visual callout | [Alert](https://www.shadcn-vue.com/docs/components/alert): icon, title, description, destructive variant | [Message](https://primevue.dev/message/): severity, icon and optional close behavior | **Shipped**: title/body/tone/role plus one free-markup `icon` slot cover the common anatomy. Dismiss remains non-common. |
| `Badge` | No behavior primitive required | [Badge](https://www.shadcn-vue.com/docs/components/badge): compact variant label | [Tag](https://primevue.dev/tag/): value, severity, icon and rounded presentation | **Shipped**: label + tone cover the common status-label core. Icon/size additions need a more precise common contract. |
| `Button` | [Button](https://base-ui.com/react/components/button): native semantics and focusable-disabled behavior | [Button](https://www.shadcn-vue.com/docs/components/button): variants, small/default/large and icon sizes, icon/spinner composition | [Button](https://primevue.dev/button/): severity/variants, sizes, icons and loading | **Shipped**: native button, variants, arbitrary label/icon content, focusable-disabled and the small/default/large enum cover the common contract. Loading remains composable content plus explicit busy semantics until its contract is fixed. |
| `Card` | No direct Base UI Card; semantics should remain caller-owned | [Card](https://www.shadcn-vue.com/docs/components/card): header/title/description/action/content/footer, size and image composition | [Card](https://primevue.dev/card/): header media, title/subtitle, content and footer | **Shipped**: title/description/body plus one minimal footer slot cover the common frame without a `CardFooter` compound part. The footer wrapper stays a neutral `div`, preserving caller-owned semantics. Header action is shadcn-specific; image/media is common in capability but still needs a prop/integration decision. |
| `Checkbox` | [Checkbox](https://base-ui.com/react/components/checkbox): checked, indeterminate, form and validation behavior | [Checkbox](https://www.shadcn-vue.com/docs/components/checkbox): control composed with caller-owned label | [Checkbox](https://primevue.dev/checkbox/): binary/multiple use, indeterminate and form integration | **Shipped**: real checkbox, label, indeterminate, form/reset and validation. Group state is evaluated separately, not hidden in this component. |
| `Combobox` | [Combobox](https://base-ui.com/react/components/combobox): filtering, keyboard, selection and form guarantees | [Combobox](https://www.shadcn-vue.com/docs/components/combobox): Popover/Command composition and customizable rows | [AutoComplete](https://primevue.dev/autocomplete/): suggestions, templates, multiple mode and virtual scrolling | **Shipped** for restricted single selection, clear/loading/empty/form/reset. Rich rows use ownership; multiple, creatable and virtualization are independent components/slices rather than mode growth. |
| `Dialog` | [Dialog](https://base-ui.com/react/components/dialog): modal/non-modal, controlled state, title/description/close and nested behavior | [Dialog](https://www.shadcn-vue.com/docs/components/dialog): trigger/content/header/title/description/footer/close | [Dialog](https://primevue.dev/dialog/): header/content/footer, modal/close plus draggable, resizable and maximize options | **Shipped**: native dialog, description, body, actions/footer and close are complete common anatomy. Add nested and scroll-layout tests; PrimeVue-only window-management features are not baseline. |
| `Disclosure` | [Collapsible](https://base-ui.com/react/components/collapsible): controlled panel and disabled state; native `<details>` owns the base behavior | [Collapsible](https://www.shadcn-vue.com/docs/components/collapsible): trigger/content composition | [Accordion](https://primevue.dev/accordion/) is the nearest repeated-panel product, not a one-panel primitive | **Shipped**: summary/body/open/disabled and exclusive native `name`. Repeated groups are evaluated as Accordion. |
| `DropdownMenu` | [Menu](https://base-ui.com/react/components/menu): action/link/check/radio/group/submenu and keyboard behavior | [Dropdown Menu](https://www.shadcn-vue.com/docs/components/dropdown-menu): the same complete menu family | [TieredMenu](https://primevue.dev/tieredmenu/): item schema, popup/groups/separators and nested menus | **Shipped**: full action/native-link/check/radio/group/separator/submenu schema. Arbitrary item templates and framework component nodes remain ownership/adapters, not schema escape hatches. |
| `Fieldset` | [Fieldset](https://base-ui.com/react/components/fieldset): grouped controls, legend and disabled cascade | No direct Fieldset component; Field/Form composition is the nearest shape | [Fieldset](https://primevue.dev/fieldset/): legend/content with optional toggle behavior | **Shipped**: native fieldset, legend, disabled cascade and body. Collapsing is composed with Disclosure rather than becoming a mode. |
| `Input` | [Input](https://base-ui.com/react/components/input): native input foundation | [Input](https://www.shadcn-vue.com/docs/components/input): styled native input; Input Group is separate | [InputText](https://primevue.dev/inputtext/): styled native input with states/sizes; grouping and labels are separate products | **Shipped**: label, native types/attributes, model, form/reset and validation states. Input groups, adornments and floating labels remain separate anatomy. |
| `Listbox` | Base UI exposes listbox behavior mainly inside Select/Combobox rather than a standalone package component | No standalone Listbox | [Listbox](https://primevue.dev/listbox/): single/multiple selection, filter, groups, templates and virtual scrolling | **Shipped** as Nagi's reusable single/multiple selection foundation. PrimeVue-only product expansion does not enlarge the stable schema without another common signal. |
| `Meter` | [Meter](https://base-ui.com/react/components/meter) and native `<meter>` define scalar-range semantics | No direct Meter | [MeterGroup](https://primevue.dev/metergroup/) is a multi-value visualization, not the native one-value primitive | **Shipped**: native value/min/max/low/high/optimum and label. MeterGroup would be a separate visualization. |
| `Popover` | [Popover](https://base-ui.com/react/components/popover): controlled anchored popup, positioning and accessible relationships | [Popover](https://www.shadcn-vue.com/docs/components/popover): arbitrary trigger/content composition | [Popover](https://primevue.dev/popover/): trigger-controlled generic overlay content | **Shipped**: native light-dismiss popup, controlled state and positioning. The package Blueprint has a fixed button; arbitrary triggers use `usePopover`, framework adapters or ownership instead of a behavior-bearing trigger slot. |
| `Progress` | [Progress](https://base-ui.com/react/components/progress) and native `<progress>` define determinate/indeterminate semantics | [Progress](https://www.shadcn-vue.com/docs/components/progress): value-driven bar | [ProgressBar](https://primevue.dev/progressbar/): determinate/indeterminate bar and optional value label | **Shipped**: native progress plus an accessible label. Decorative value rendering can remain caller/owned markup. |
| `Radio` | [Radio](https://base-ui.com/react/components/radio): exclusive selection, form and validation behavior | [Radio Group](https://www.shadcn-vue.com/docs/components/radio-group): explicit group with repeated items | [RadioButton](https://primevue.dev/radiobutton/): repeated same-name controls | **Shipped**: real radios share one `v-model` and native name, with Fieldset for group labeling. A package RadioGroup is not yet common across the two Vue references. |
| `Select` | [Select](https://base-ui.com/react/components/select): custom popup, keyboard, form and rich item capability | [Native Select](https://www.shadcn-vue.com/docs/components/native-select) and custom [Select](https://www.shadcn-vue.com/docs/components/select) are both offered | [Select](https://primevue.dev/select/): custom popup, filtering, multiple selection and templates | **Shipped / deliberate boundary**: native `<select>/<option>` is the stable path. Cross-library custom rendering is real demand, but rebuilding Select conflicts with Nagi's platform-first contract; use Combobox, ownership or another component library. |
| `Slider` | [Slider](https://base-ui.com/react/components/slider): orientation and multiple thumbs above range-input behavior | [Slider](https://www.shadcn-vue.com/docs/components/slider): one or multiple values | [Slider](https://primevue.dev/slider/): single/range and horizontal/vertical modes | **Shipped + separate Candidate**: native single-thumb Slider is complete. Multi-thumb/range is common evidence but must be a separately tested thick component, not a mode that compromises the native path. |
| `Switch` | [Switch](https://base-ui.com/react/components/switch): boolean setting, focus and form behavior | [Switch](https://www.shadcn-vue.com/docs/components/switch): checked/disabled control | [ToggleSwitch](https://primevue.dev/toggleswitch/): checked/disabled/form states | **Shipped**: native checkbox-backed switch with label, form/reset/validation and forced-colors support. |
| `Tabs` | [Tabs](https://base-ui.com/react/components/tabs): activation modes, orientation, focus and panel relationships | [Tabs](https://www.shadcn-vue.com/docs/components/tabs): list/trigger/content composition | [Tabs](https://primevue.dev/tabs/): value-driven tab list/panels with scrollable/dynamic examples | **Shipped**: flat items, manual/automatic activation, orientation/RTL, disabled/dynamic repair and rich panel content. Compound parts, indicator geometry and PrimeVue-only window-like features remain out. |
| `Toast` | [Toast](https://base-ui.com/react/components/toast): manager, priority, actions, lifecycle and keyboard access | [Toast](https://www.shadcn-vue.com/docs/components/toast) / Sonner: app-level notifications and actions | [Toast](https://primevue.dev/toast/): service-driven severity, summary/detail, groups, position and lifetime | **Shipped**: explicit manager, structured content/action, priority, update/close/promise, limit/timers and F6. Placement is styling/ownership; providers, portals, swipe and stack physics remain out. |
| `Tooltip` | [Tooltip](https://base-ui.com/react/components/tooltip): hover/focus, delay, positioning and disabled handling | [Tooltip](https://www.shadcn-vue.com/docs/components/tooltip): arbitrary trigger/content with provider coordination | [Tooltip](https://primevue.dev/tooltip/): directive on arbitrary targets with position/delay options | **Shipped**: hover/focus union, delays, controlled state, disabled and positioning. Arbitrary package triggers use the composable or ownership; no mandatory provider or trigger slot carrying behavior props. |

Audit result: **22 / 22 shipped Nagi components reviewed through the same
platform/Base UI + shadcn-vue + PrimeVue + Nagi translation rule.**

## Unshipped Base UI baseline

These 19 rows complete the Base UI 1.6.0 catalog audit. Styled-library
agreement changes priority, but never bypasses the architectural translation.

| Capability | Base UI | shadcn-vue | PrimeVue | Nagi decision |
|---|---|---|---|---|
| Accordion | [Accordion](https://base-ui.com/react/components/accordion) | [Accordion](https://www.shadcn-vue.com/docs/components/accordion) | [Accordion](https://primevue.dev/accordion/) | **Candidate**: strong three-source signal. Start with repeated Disclosure/native `<details name>` and a flat package anatomy; no item compound family. |
| Alert Dialog | [Alert Dialog](https://base-ui.com/react/components/alert-dialog) | [Alert Dialog](https://www.shadcn-vue.com/docs/components/alert-dialog) | [ConfirmDialog](https://primevue.dev/confirmdialog/) | **Candidate**: strict native Dialog Blueprint with `role="alertdialog"`, description and explicit actions. Do not overload visual Alert. |
| Autocomplete | [Autocomplete](https://base-ui.com/react/components/autocomplete) | Combobox is the nearest recipe | [AutoComplete](https://primevue.dev/autocomplete/) | **Defer**: distinct free-form `useAutocomplete`; do not add free-form modes to restricted Combobox. |
| Avatar | [Avatar](https://base-ui.com/react/components/avatar) | [Avatar](https://www.shadcn-vue.com/docs/components/avatar) | [Avatar](https://primevue.dev/avatar/) | **Candidate**: strong common signal. Native image, deterministic text/icon fallback and tested load/error transition. |
| Checkbox Group | [Checkbox Group](https://base-ui.com/react/components/checkbox-group) | Repeated Checkbox in Field/Form | Repeated Checkbox values | **Native/recipe**: native names plus Fieldset first; add an items schema only if package repetition proves useful. |
| Context Menu | [Context Menu](https://base-ui.com/react/components/context-menu) | [Context Menu](https://www.shadcn-vue.com/docs/components/context-menu) | [ContextMenu](https://primevue.dev/contextmenu/) | **Defer**: strong common signal but needs a virtual pointer anchor, right-click/long-press policy and mobile browser tests. Reuse menu schema/core. |
| Drawer | [Drawer](https://base-ui.com/react/components/drawer) | [Drawer](https://www.shadcn-vue.com/docs/components/drawer) | [Drawer](https://primevue.dev/drawer/) | **Decline** gesture/snap parity. A static edge panel is positioned Dialog; Vaul-class interrupted gestures should use another library. |
| Field | [Field](https://base-ui.com/react/components/field) | [Field](https://www.shadcn-vue.com/docs/components/field) | FloatLabel/IftaLabel/Form are adjacent products | **Native/recipe**: shipped controls already own label/id. Add a helper only if repeated description/error wiring demonstrably reduces failures; no compound Field family. |
| Form | [Form](https://base-ui.com/react/components/form) | [Form](https://www.shadcn-vue.com/docs/components/form) | PrimeVue Forms add-on | **Native/recipe**: native validation, server errors and `assertNagiDom()` integration. Nagi does not become a schema/form-state framework. |
| Menubar | [Menubar](https://base-ui.com/react/components/menubar) | [Menubar](https://www.shadcn-vue.com/docs/components/menubar) | [Menubar](https://primevue.dev/menubar/) | **Defer**: strong common signal. Add a dedicated horizontal roving-focus coordinator over Menu; never use menu roles for ordinary site navigation. |
| Navigation Menu | [Navigation Menu](https://base-ui.com/react/components/navigation-menu) | [Navigation Menu](https://www.shadcn-vue.com/docs/components/navigation-menu) | Menubar/MegaMenu are adjacent products | **Defer**: native `<nav>` and links first; hover/focus panel coordination is an independent navigation primitive. |
| Number Field | [Number Field](https://base-ui.com/react/components/number-field) | [Number Field](https://www.shadcn-vue.com/docs/components/number-field) | [InputNumber](https://primevue.dev/inputnumber/) | **Candidate**: strong common signal. Begin with native number input and `stepUp()`/`stepDown()` buttons; locale parsing and scrub gestures need separate evidence. |
| OTP Field | [OTP Field](https://base-ui.com/react/components/otp-field) | [Pin Input](https://www.shadcn-vue.com/docs/components/pin-input) | [InputOtp](https://primevue.dev/inputotp/) | **Defer**: strong common signal but mobile paste, password-manager and one-real-input behavior need a focused slice. |
| Preview Card | [Preview Card](https://base-ui.com/react/components/preview-card) | [Hover Card](https://www.shadcn-vue.com/docs/components/hover-card) | Popover/Tooltip are the nearest products | **Candidate**: real link trigger, pointer transit and interactive preview semantics over hint popover positioning. |
| Scroll Area | [Scroll Area](https://base-ui.com/react/components/scroll-area) | [Scroll Area](https://www.shadcn-vue.com/docs/components/scroll-area) | [ScrollArea](https://primevue.dev/scrollarea/) | **Native/recipe** despite strong demand: prefer `overflow: auto`, `scrollbar-*` CSS and platform scrollbars; do not add synchronized custom-thumb behavior for parity alone. |
| Separator | [Separator](https://base-ui.com/react/components/separator) | [Separator](https://www.shadcn-vue.com/docs/components/separator) | [Divider](https://primevue.dev/divider/) | **Candidate**: strong common signal and thin implementation. Use `<hr>` for semantic separation and one clearly documented decorative/oriented form. |
| Toggle | [Toggle](https://base-ui.com/react/components/toggle) | [Toggle](https://www.shadcn-vue.com/docs/components/toggle) | [ToggleButton](https://primevue.dev/togglebutton/) | **Candidate**: strong common signal. Native `<button aria-pressed>` with controlled model, no arbitrary-element rendering. |
| Toggle Group | [Toggle Group](https://base-ui.com/react/components/toggle-group) | [Toggle Group](https://www.shadcn-vue.com/docs/components/toggle-group) | [SelectButton](https://primevue.dev/selectbutton/) | **Candidate**: strong common signal. Flat items schema and pressed buttons; add roving focus only when the selected ARIA pattern requires it. |
| Toolbar | [Toolbar](https://base-ui.com/react/components/toolbar) | No direct Toolbar component | [Toolbar](https://primevue.dev/toolbar/) | **Defer**: attribute-injection `useToolbar` for arbitrary owned controls; avoid a ToolbarButton/ToolbarLink family. |

Base UI catalog result: **37 / 37 represented** (18 direct shipped mappings +
19 unshipped decisions). Nagi's four additional shipped products are Alert,
Badge, Card and standalone Listbox.

## First strengthening result

The first cross-library strengthening slice implemented the three immediate
consequences without expanding the component count:

1. **Card footer:** one `footer` named slot in the existing neutral SFC. No
   compound part or header-action API was added.
2. **Button size:** one `small | default | large` prop. Public `small` maps to
   CSS identity `-compact` so Nagi CSS element vocabulary remains unambiguous.
3. **Alert icon:** one free-markup `icon` slot. No icon-name DSL or dismiss API
   was added.

The same rule also confirms deliberate non-parity:

- custom Select is widespread, but conflicts with Nagi's native stable path;
- multi-thumb Slider is widespread, but must be an independent thick component;
- custom trigger composition for Popover/Dialog/Tooltip remains available at
  the composable or ownership layer instead of recreating `asChild` through a
  behavior-bearing slot;
- rich Combobox/Menu rows remain ownership extensions rather than an expanding
  stable schema.

## Capabilities that do not survive translation

The following remain non-goals even when a benchmark library supports them:

- arbitrary-element `render`, `asChild`, or native-element replacement;
- Portal/Teleport as the standard overlay path;
- custom focus traps or modal Popover above a non-modal platform primitive;
- mandatory provider trees and implicit global state;
- per-event cancellation frameworks that replace the user agent's dismiss
  state machine;
- Motion-style JavaScript exit orchestration as a core contract;
- swipe/snap Drawer behavior and custom synchronized scrollbar thumbs;
- rebuilding native Select solely for cross-browser visual identity;
- PrimeVue-scale pass-through props and speculative named slots.

## Acceptance rule for adopted features

A feature moves from this comparison into the supported Nagi contract only
when all of the following are true:

1. there is product evidence: a platform/accessibility guarantee, agreement
   between shadcn-vue and PrimeVue, or a concrete Nagi scenario;
2. the package API follows CHARTER §3.5 and remains smaller than owning the
   source;
3. common capability is translated rather than copied as compound parts,
   providers, pass-through props or `asChild`;
4. the same SFC remains the package component and `own` source;
5. SSR/native attributes are verified wherever the platform can work before
   hydration;
6. keyboard, focus, form and accessibility behavior has a real-browser
   contract test;
7. owned-source lint and the consumer test recipe cover new wiring;
8. intentionally omitted benchmark capabilities are documented next to the
   component rather than left ambiguous.

Revisit the source snapshot when any benchmark changes its public catalog.
Catalog presence changes review priority; it never silently changes Nagi's
public API.
