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

- every component Nagi currently ships: **43 / 43** below (31 Base UI-aligned
  components plus twelve expanded-catalog additions);
- every component in the Base UI 1.6.0 baseline: **37 / 37**, split between
  the 26 direct shipped mappings and 11 unshipped capabilities below.

PrimeVue's 90+ catalog and every shadcn-vue block are not automatic Nagi scope.
Data grids, calendars and other product domains should receive their own
benchmark slice when Nagi chooses to enter that domain.

For component-creation progress, the adopted implementation set is currently
37 slices: 31 shipped components plus 6 unbuilt component slices. This is
**31 / 37 = 83.8%**. `Native/recipe` and `Decline` rows are deliberately not
counted as components to build. This metric tracks Nagi's chosen product, not
API parity with any reference catalog.

This is specifically the Base UI-aligned metric. The expanded normalized scope
across Base UI, shadcn-vue, and PrimeVue is **43 / 54 = 79.6%**; see
[`expanded-vue-component-catalog.md`](expanded-vue-component-catalog.md).

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
| `Title` / `Description` | String props by default; proven rich-content parts may add same-name content-only slots inside owned anatomy wrappers |
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
| `Accordion` | [Accordion](https://base-ui.com/react/components/accordion) plus native `<details name>` define exclusive disclosure and browser-owned keyboard behavior | [Accordion](https://www.shadcn-vue.com/docs/components/accordion): single/multiple groups and rich headers/content | [Accordion](https://primevue.dev/accordion/): repeated panels, multiple mode and rich headers/content | **Shipped**: flat items schema, controlled `openKeys`, single/multiple native details, disabled summaries and content-only summary/panel slots. Generated grouping, toggle ordering and activation suppression stay in a fixed package binding; no item compound family or duplicate ARIA state. |
| `Alert` | Native `status`/`alert`; Base UI has Alert Dialog, not a visual callout | [Alert](https://www.shadcn-vue.com/docs/components/alert): icon, title, description, destructive variant | [Message](https://primevue.dev/message/): severity, icon and optional close behavior | **Shipped**: required title prop with a same-name rich-content slot, body/tone/role and one free-markup `icon` slot cover the common anatomy. The owned heading and status role remain fixed. Dismiss remains non-common. |
| `AlertDialog` | [Alert Dialog](https://base-ui.com/react/components/alert-dialog): modal critical decision, name/description and explicit actions | [Alert Dialog](https://www.shadcn-vue.com/docs/components/alert-dialog): title, description, cancel and action | [ConfirmDialog](https://primevue.dev/confirmdialog/): explicit accept/reject confirmation | **Shipped**: native modal `<dialog role="alertdialog">`, required title/description/action labels, owned Cancel/Action buttons, safe initial Cancel focus and action tone. `closedby="closerequest"` keeps Escape browser-owned without outside light-dismiss; no portal, provider or action slot. |
| `Avatar` | [Avatar](https://base-ui.com/react/components/avatar): image loading and fallback state | [Avatar](https://www.shadcn-vue.com/docs/components/avatar): image plus fallback | [Avatar](https://primevue.dev/avatar/): image, label and icon forms | **Shipped**: native image, stable wrapper accessible name, deterministic text fallback, rich fallback content and tested load/error/source-recovery. Group/stack anatomy remains composition. |
| `Badge` | No behavior primitive required | [Badge](https://www.shadcn-vue.com/docs/components/badge): compact variant label and icon composition | [Tag](https://primevue.dev/tag/): value, severity, icon, template content and rounded presentation | **Shipped**: required label prop with a same-name phrasing-content slot plus tone cover the common status-label core. The outer span retains typography and tone. Size additions need a more precise common contract. |
| `Button` | [Button](https://base-ui.com/react/components/button): native semantics and focusable-disabled behavior | [Button](https://www.shadcn-vue.com/docs/components/button): variants, small/default/large and icon sizes, icon/spinner composition | [Button](https://primevue.dev/button/): severity/variants, sizes, icons and loading | **Shipped**: native button, variants, arbitrary label/icon content, focusable-disabled and the small/default/large enum cover the common contract. Loading remains composable content plus explicit busy semantics until its contract is fixed. |
| `Card` | No direct Base UI Card; semantics should remain caller-owned | [Card](https://www.shadcn-vue.com/docs/components/card): header/title/description/action/content/footer, size and image composition | [Card](https://primevue.dev/card/): header media, title/subtitle, content and footer | **Shipped**: title/description string props with same-name rich-content slots, body and one minimal footer slot cover the common frame without compound parts. Title/description slots replace content only; the SFC retains its header wrappers and typography. The footer wrapper stays a neutral `div`, preserving caller-owned semantics. Header action is shadcn-specific; image/media is common in capability but still needs a prop/integration decision. |
| `Checkbox` | [Checkbox](https://base-ui.com/react/components/checkbox): checked, indeterminate, form and validation behavior | [Checkbox](https://www.shadcn-vue.com/docs/components/checkbox): control composed with caller-owned label | [Checkbox](https://primevue.dev/checkbox/): binary/multiple use, indeterminate and form integration | **Shipped**: real checkbox, label, indeterminate, form/reset and validation. Group state is evaluated separately, not hidden in this component. |
| `Combobox` | [Combobox](https://base-ui.com/react/components/combobox): filtering, keyboard, selection and form guarantees | [Combobox](https://www.shadcn-vue.com/docs/components/combobox): Popover/Command composition and customizable rows | [AutoComplete](https://primevue.dev/autocomplete/): suggestions, templates, multiple mode and virtual scrolling | **Shipped** for restricted single selection, clear/loading/empty/form/reset. Rich rows use ownership; multiple, creatable and virtualization are independent components/slices rather than mode growth. |
| `Dialog` | [Dialog](https://base-ui.com/react/components/dialog): modal/non-modal, controlled state, title/description/close and nested behavior | [Dialog](https://www.shadcn-vue.com/docs/components/dialog): trigger/content/header/title/description/footer/close | [Dialog](https://primevue.dev/dialog/): header/content/footer, modal/close plus draggable, resizable and maximize options | **Shipped**: required title and optional description props have same-name rich-content slots inside their owned `h2` / `p`; native IDREFs, body, actions/footer and close complete the common anatomy. Add nested and scroll-layout tests; PrimeVue-only window-management features are not baseline. |
| `Disclosure` | [Collapsible](https://base-ui.com/react/components/collapsible): controlled panel and disabled state; native `<details>` owns the base behavior | [Collapsible](https://www.shadcn-vue.com/docs/components/collapsible): trigger/content composition | [Accordion](https://primevue.dev/accordion/) exposes rich headers in the nearest repeated-panel product | **Shipped**: summary/body/open/disabled and exclusive native `name`; the required summary prop has a same-name content-only slot while the owned `<summary>` retains behavior. Interactive descendants remain disallowed. Repeated groups are evaluated as Accordion. |
| `DropdownMenu` | [Menu](https://base-ui.com/react/components/menu): action/link/check/radio/group/submenu and keyboard behavior | [Dropdown Menu](https://www.shadcn-vue.com/docs/components/dropdown-menu): the same complete menu family | [TieredMenu](https://primevue.dev/tieredmenu/): item schema, popup/groups/separators and nested menus | **Shipped**: full action/native-link/check/radio/group/separator/submenu schema. Arbitrary item templates and framework component nodes remain ownership/adapters, not schema escape hatches. |
| `Fieldset` | [Fieldset](https://base-ui.com/react/components/fieldset): grouped controls, legend and disabled cascade | No direct Fieldset component; Field/Form composition is the nearest shape | [Fieldset](https://primevue.dev/fieldset/): legend/content with optional toggle behavior | **Shipped**: native fieldset, legend, disabled cascade and body. Collapsing is composed with Disclosure rather than becoming a mode. |
| `Input` | [Input](https://base-ui.com/react/components/input): native input foundation | [Input](https://www.shadcn-vue.com/docs/components/input): styled native input; Input Group is separate | [InputText](https://primevue.dev/inputtext/): styled native input with states/sizes; grouping and labels are separate products | **Shipped**: label, native types/attributes, model, form/reset and validation states. Input groups, adornments and floating labels remain separate anatomy. |
| `Listbox` | Base UI exposes listbox behavior mainly inside Select/Combobox rather than a standalone package component | No standalone Listbox | [Listbox](https://primevue.dev/listbox/): single/multiple selection, filter, groups, templates and virtual scrolling | **Shipped** as Nagi's reusable single/multiple selection foundation. PrimeVue-only product expansion does not enlarge the stable schema without another common signal. |
| `Meter` | [Meter](https://base-ui.com/react/components/meter) and native `<meter>` define scalar-range semantics | No direct Meter | [MeterGroup](https://primevue.dev/metergroup/) is a multi-value visualization, not the native one-value primitive | **Shipped**: native value/min/max/low/high/optimum and label. MeterGroup would be a separate visualization. |
| `NumberField` | [Number Field](https://base-ui.com/react/components/number-field): increment/decrement, min/max/step, form and accessible labeling | [Number Field](https://www.shadcn-vue.com/docs/components/number-field): visible input with step buttons | [InputNumber](https://primevue.dev/inputnumber/): number input, buttons and min/max/step | **Shipped**: a real `input[type=number]`, explicit native step buttons, nullable model and form/reset behavior. Browser parsing and validity remain native; locale formatting, scrub gestures and button-layout modes are intentionally outside this contract. |
| `Popover` | [Popover](https://base-ui.com/react/components/popover): controlled anchored popup, positioning and accessible relationships | [Popover](https://www.shadcn-vue.com/docs/components/popover): arbitrary trigger/content composition | [Popover](https://primevue.dev/popover/): trigger-controlled generic overlay content | **Shipped**: native light-dismiss popup, controlled state and positioning. The package Blueprint has a fixed button; arbitrary triggers use `usePopover`, framework adapters or ownership instead of a behavior-bearing trigger slot. |
| `PreviewCard` | [Preview Card](https://base-ui.com/react/components/preview-card): real link, delayed pointer/focus intent and interactive preview transit | [Hover Card](https://www.shadcn-vue.com/docs/components/hover-card): rich hover/focus preview | Popover/Tooltip are the nearest products | **Shipped**: real `<a href>`, native auto popover, controlled open, anchor positioning and pointer/focus transit. It has no click interception or Tooltip ARIA, touch hover is suppressed, and its inline default slot is explicitly phrasing-content only. |
| `Progress` | [Progress](https://base-ui.com/react/components/progress) and native `<progress>` define determinate/indeterminate semantics | [Progress](https://www.shadcn-vue.com/docs/components/progress): value-driven bar | [ProgressBar](https://primevue.dev/progressbar/): determinate/indeterminate bar and optional value label | **Shipped**: native progress plus an accessible label. Decorative value rendering can remain caller/owned markup. |
| `Radio` | [Radio](https://base-ui.com/react/components/radio): exclusive selection, form and validation behavior | [Radio Group](https://www.shadcn-vue.com/docs/components/radio-group): explicit group with repeated items | [RadioButton](https://primevue.dev/radiobutton/): repeated same-name controls | **Shipped**: real radios share one `v-model` and native name, with Fieldset for group labeling. A package RadioGroup is not yet common across the two Vue references. |
| `Select` | [Select](https://base-ui.com/react/components/select): custom popup, keyboard, form and rich item capability | [Native Select](https://www.shadcn-vue.com/docs/components/native-select) and custom [Select](https://www.shadcn-vue.com/docs/components/select) are both offered | [Select](https://primevue.dev/select/): custom popup, filtering, multiple selection and templates | **Shipped / deliberate boundary**: native `<select>/<option>` is the stable path. Cross-library custom rendering is real demand, but rebuilding Select conflicts with Nagi's platform-first contract; use Combobox, ownership or another component library. |
| `Separator` | [Separator](https://base-ui.com/react/components/separator): semantic/decorative orientation | [Separator](https://www.shadcn-vue.com/docs/components/separator): horizontal/vertical decorative line | [Divider](https://primevue.dev/divider/): horizontal/vertical content divider | **Shipped**: native `<hr>` for horizontal semantic separation, explicit `role="separator"` for vertical, and an `aria-hidden` decorative form. Content-bearing Divider is a different product. |
| `Slider` | [Slider](https://base-ui.com/react/components/slider): orientation and multiple thumbs above range-input behavior | [Slider](https://www.shadcn-vue.com/docs/components/slider): one or multiple values | [Slider](https://primevue.dev/slider/): single/range and horizontal/vertical modes | **Shipped as two components**: Slider preserves the single native path. RangeSlider overlays two real range inputs with a shared physical scale on one visual track, keeps lower/upper labels and constant tab order, exposes dependent effective ARIA bounds, submits two names and restores its tuple on native form reset. |
| `Switch` | [Switch](https://base-ui.com/react/components/switch): boolean setting, focus and form behavior | [Switch](https://www.shadcn-vue.com/docs/components/switch): checked/disabled control | [ToggleSwitch](https://primevue.dev/toggleswitch/): checked/disabled/form states | **Shipped**: native checkbox-backed switch with label, form/reset/validation and forced-colors support. |
| `Tabs` | [Tabs](https://base-ui.com/react/components/tabs): activation modes, orientation, focus and panel relationships | [Tabs](https://www.shadcn-vue.com/docs/components/tabs): list/trigger/content composition | [Tabs](https://primevue.dev/tabs/): value-driven tab list/panels with scrollable/dynamic examples | **Shipped**: flat items, manual/automatic activation, orientation/RTL, disabled/dynamic repair and rich panel content. Compound parts, indicator geometry and PrimeVue-only window-like features remain out. |
| `Toast` | [Toast](https://base-ui.com/react/components/toast): manager, priority, actions, lifecycle and keyboard access | [Toast](https://www.shadcn-vue.com/docs/components/toast) / Sonner: app-level notifications and actions | [Toast](https://primevue.dev/toast/): service-driven severity, summary/detail, groups, position and lifetime | **Shipped**: explicit manager, structured content/action, priority, update/close/promise, limit/timers and F6. Placement is styling/ownership; providers, portals, swipe and stack physics remain out. |
| `Toggle` | [Toggle](https://base-ui.com/react/components/toggle): controlled pressed and disabled semantics | [Toggle](https://www.shadcn-vue.com/docs/components/toggle): pressed button with content | [ToggleButton](https://primevue.dev/togglebutton/): binary pressed control | **Shipped**: native `<button aria-pressed>`, controlled/uncontrolled model, disabled behavior and free label/icon content. No arbitrary-element rendering or custom state vocabulary. |
| `ToggleGroup` | [Toggle Group](https://base-ui.com/react/components/toggle-group): single/multiple pressed selection, disabled items and group labeling | [Toggle Group](https://www.shadcn-vue.com/docs/components/toggle-group): repeated pressed controls | [SelectButton](https://primevue.dev/selectbutton/): single/multiple item selection | **Shipped**: flat items schema, single/multiple controlled value, real `button[aria-pressed]` controls and group/item disabled state. Every button remains a native tab stop; no roving-focus state machine or compound item family is added. |
| `Tooltip` | [Tooltip](https://base-ui.com/react/components/tooltip): hover/focus, delay, positioning and disabled handling | [Tooltip](https://www.shadcn-vue.com/docs/components/tooltip): arbitrary trigger/content with provider coordination | [Tooltip](https://primevue.dev/tooltip/): directive on arbitrary targets with position/delay options | **Shipped**: hover/focus union, delays, controlled state, disabled and positioning. Arbitrary package triggers use the composable or ownership; no mandatory provider or trigger slot carrying behavior props. |

Base UI-aligned shipped audit result: **31 / 31** components reviewed through
the same platform/Base UI + shadcn-vue + PrimeVue + Nagi translation rule.

## Shipped expanded-catalog additions

These twelve components come from repeated shadcn-vue / PrimeVue product signal,
not from additional Base UI baseline rows. They therefore increase the expanded
catalog numerator without changing the Base UI-aligned 31 / 37 metric.

| Nagi component | Platform foundation | Cross-library signal | Nagi decision |
|---|---|---|---|
| `Breadcrumb` | Native named `nav`, ordered list, links and `aria-current` | Both Vue catalogs expose Breadcrumb | **Shipped**: flat link schema, one current item and text separator; router components remain adapter / ownership concerns. |
| `ButtonGroup` | `role="group"` plus caller-owned native buttons | shadcn-vue Button Group; PrimeVue SplitButton is adjacent evidence | **Shipped**: layout, orientation and optional group name only; Button API is not duplicated. |
| `EmptyState` | Presentation and document hierarchy remain caller-owned | shadcn-vue Empty; PrimeVue DataView has empty anatomy | **Shipped**: required title, optional description and one action surface; no page-block DSL or fixed heading level. |
| `FileInput` | Visible native `input[type=file]`, chooser, `FileList`, form submission and reset | shadcn-vue Input recipe; PrimeVue Upload establishes the product demand | **Shipped**: visible native control, label and native attribute forwarding. File state, dropzone, upload transport, progress and storage SDKs remain caller/product concerns. |
| `InputGroup` | Caller-owned native control inside a presentation frame | shadcn-vue Input Group; PrimeVue InputGroup / IconField | **Shipped**: prefix/suffix text with content-only slots, one default control surface and one action surface. Native control props are not duplicated, and explicit slot classes keep Nagi CSS boundaries machine-checkable. |
| `Kbd` | Native `<kbd>` | shadcn-vue Kbd; shortcut display recurs in menu products | **Shipped**: required plain label only; no shortcut registry or keyboard behavior. |
| `Pagination` | Named `nav`, list, real links and native buttons | Both Vue catalogs expose Pagination/Paginator | **Shipped**: flat link/button schema, one controlled current key and a selection event. Links retain navigation; fetching and router-specific nodes stay outside the stable schema. |
| `Rating` | Native same-name radio group inside `fieldset`/`legend` | shadcn-vue Radio Group recipe; PrimeVue Rating | **Shipped**: localized numeric items, keyboard/form/reset behavior and presentational stars. No hover value, half-star, pointer-only model or roving-focus reimplementation. |
| `Skeleton` | Decorative presentation with owner-supplied loading semantics | Both Vue catalogs expose Skeleton | **Shipped**: always `aria-hidden`, token styling and reduced-motion support; it never owns `aria-busy` or live state. |
| `Spinner` | Empty status indicator or decorative presentation | shadcn-vue Spinner and PrimeVue ProgressSpinner | **Shipped**: optional accessible label selects `status` vs `aria-hidden`; determinate progress stays in Progress. |
| `Stepper` | Native named navigation, ordered list and buttons with `aria-current="step"` | Both Vue catalogs expose Stepper | **Shipped**: flat items and one required controlled current key. Wizard panels, validation, routing and linear completion remain application policy. |
| `Textarea` | Native form-associated `<textarea>` | Both Vue catalogs expose Textarea | **Shipped**: label, string model, native attrs, form/reset/validation and no autosize behavior. |

Overall shipped package audit result: **43 / 43** components represented here.

## Unshipped Base UI baseline

These 12 rows complete the Base UI 1.6.0 catalog audit. Styled-library
agreement changes priority, but never bypasses the architectural translation.

| Capability | Base UI | shadcn-vue | PrimeVue | Nagi decision |
|---|---|---|---|---|
| Autocomplete | [Autocomplete](https://base-ui.com/react/components/autocomplete) | Combobox is the nearest recipe | [AutoComplete](https://primevue.dev/autocomplete/) | **Defer**: distinct free-form `useAutocomplete`; do not add free-form modes to restricted Combobox. |
| Checkbox Group | [Checkbox Group](https://base-ui.com/react/components/checkbox-group) | Repeated Checkbox in Field/Form | Repeated Checkbox values | **Native/recipe**: native names plus Fieldset first; add an items schema only if package repetition proves useful. |
| Context Menu | [Context Menu](https://base-ui.com/react/components/context-menu) | [Context Menu](https://www.shadcn-vue.com/docs/components/context-menu) | [ContextMenu](https://primevue.dev/contextmenu/) | **Defer**: strong common signal but needs a virtual pointer anchor, right-click/long-press policy and mobile browser tests. Reuse menu schema/core. |
| Drawer | [Drawer](https://base-ui.com/react/components/drawer) | [Drawer](https://www.shadcn-vue.com/docs/components/drawer) | [Drawer](https://primevue.dev/drawer/) | **Decline** gesture/snap parity. A static edge panel is positioned Dialog; Vaul-class interrupted gestures should use another library. |
| Field | [Field](https://base-ui.com/react/components/field) | [Field](https://www.shadcn-vue.com/docs/components/field) | FloatLabel/IftaLabel/Form are adjacent products | **Native/recipe**: shipped controls already own label/id. Add a helper only if repeated description/error wiring demonstrably reduces failures; no compound Field family. |
| Form | [Form](https://base-ui.com/react/components/form) | [Form](https://www.shadcn-vue.com/docs/components/form) | PrimeVue Forms add-on | **Native/recipe**: native validation, server errors and `assertNagiDom()` integration. Nagi does not become a schema/form-state framework. |
| Menubar | [Menubar](https://base-ui.com/react/components/menubar) | [Menubar](https://www.shadcn-vue.com/docs/components/menubar) | [Menubar](https://primevue.dev/menubar/) | **Defer**: strong common signal. Add a dedicated horizontal roving-focus coordinator over Menu; never use menu roles for ordinary site navigation. |
| Navigation Menu | [Navigation Menu](https://base-ui.com/react/components/navigation-menu) | [Navigation Menu](https://www.shadcn-vue.com/docs/components/navigation-menu) | Menubar/MegaMenu are adjacent products | **Defer**: native `<nav>` and links first; hover/focus panel coordination is an independent navigation primitive. |
| OTP Field | [OTP Field](https://base-ui.com/react/components/otp-field) | [Pin Input](https://www.shadcn-vue.com/docs/components/pin-input) | [InputOtp](https://primevue.dev/inputotp/) | **Defer**: strong common signal but mobile paste, password-manager and one-real-input behavior need a focused slice. |
| Scroll Area | [Scroll Area](https://base-ui.com/react/components/scroll-area) | [Scroll Area](https://www.shadcn-vue.com/docs/components/scroll-area) | [ScrollArea](https://primevue.dev/scrollarea/) | **Native/recipe** despite strong demand: prefer `overflow: auto`, `scrollbar-*` CSS and platform scrollbars; do not add synchronized custom-thumb behavior for parity alone. |
| Toolbar | [Toolbar](https://base-ui.com/react/components/toolbar) | No direct Toolbar component | [Toolbar](https://primevue.dev/toolbar/) | **Defer**: attribute-injection `useToolbar` for arbitrary owned controls; avoid a ToolbarButton/ToolbarLink family. |

Base UI catalog result: **37 / 37 represented** (26 direct shipped mappings +
11 unshipped decisions). Nagi's additional shipped products include Alert,
Badge, Card, standalone Listbox and the cross-library Stepper.

## First strengthening result

The first cross-library strengthening slice implemented the three immediate
consequences without expanding the component count:

1. **Card content anatomy:** one `footer` named slot plus `title` / `description`
   content-only slots in the existing neutral SFC. The latter retain string
   props as fallbacks; no compound part, whole-header slot or header-action API
   was added.
2. **Button size:** one `small | default | large` prop. Public `small` maps to
   CSS identity `-compact` so Nagi CSS element vocabulary remains unambiguous.
3. **Alert icon:** one free-markup `icon` slot. No icon-name DSL or dismiss API
   was added.
4. **Stable rich text parts:** Card and Dialog title/description plus Alert
   title receive same-name content-only slots. Plain strings remain props and
   fallbacks; owned wrappers, ARIA and typography do not cross the boundary.
5. **Compact rich labels:** Disclosure summary and Badge label follow the same
   fallback pattern while keeping native summary behavior and Badge tone in
   their owned wrappers. Their slots are restricted to the wrapper's content
   model and never receive behavior props.

The same rule also confirms deliberate non-parity:

- custom Select is widespread, but conflicts with Nagi's native stable path;
- multi-thumb Slider is shipped as independent RangeSlider rather than a mode
  that compromises the single native Slider;
- custom trigger composition for Popover/Dialog/Tooltip remains available at
  the composable or ownership layer instead of recreating `asChild` through a
  behavior-bearing slot;
- rich Combobox/Menu rows remain ownership extensions rather than an expanding
  stable schema.

## Alignment D2 result

The next thin slice moved three strong common candidates into the shipped
ledger without copying compound APIs: Avatar owns native image/fallback
recovery, Separator owns the minimum semantic/decorative orientation split,
and Toggle owns only a native pressed button model. The package catalog is now
25 components and the adopted implementation set is 67.6% complete.

The same slice separates three naming concerns: public component names and SFC
filenames stay prefix-free (`Button` / `Button.vue`), while Nagi CSS derives the
owned surface exactly from configured namespace plus filename (`.n-button`).
Missing prefixes and unrelated `.n-*` names are lint errors.

## Alignment D3 result

The next native-composite slice moves Accordion and Alert Dialog from Candidate
to Shipped. Accordion renders one flat items schema as real `<details>`
elements, uses a generated native `name` for exclusive mode, omits it for
multiple mode, and exposes one `openKeys` model shape for both. Alert Dialog is
not a visual Alert variant: it is a strict native modal dialog with required
name/description, explicit Cancel/Action buttons and safe Cancel autofocus.

Both SFCs were audited after implementation. Generated names, native toggle
event ordering, disabled-summary suppression and fixed alert-dialog dismiss
policy live in `@nagi-labs/nagi-ui/component-controls`. The SFCs retain the
editable schema mapping, labels, action tone/event, IDREFs, DOM and CSS. The
package catalog was then 27 components. The Base UI-aligned implementation set
was 73.0% complete at that point, while later catalog slices move the current
Base UI-aligned metric to 83.8% and the cross-library set to 79.6%. Full
rationale and browser contracts are recorded in
[`base-ui-alignment-d3-accordion-alert-dialog.md`](base-ui-alignment-d3-accordion-alert-dialog.md).

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
