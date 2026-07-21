# Base UI component comparison and Nagi UI coverage policy

Status: Research baseline (2026-07-21). This document is a decision ledger,
not an API-compatibility promise or an implementation backlog by itself.

## Purpose and source snapshot

Base UI is used here as a **behavior and accessibility benchmark**. Nagi does
not copy Base UI's React API, compound-component anatomy, portal model, render
props, or provider graph. For each Base UI component, this document asks:

1. Does the capability represent a common product requirement or an important
   accessibility guarantee?
2. Can the browser own it through native HTML/CSS?
3. If not, can one contained Nagi composable own it without leaking a hidden
   component hierarchy into the public API?
4. Can the package Blueprint remain small, readable, Nagi CSS compliant, and
   transferable through `nagi-ui own`?
5. If adopting the capability would erase those properties, should Nagi
   explicitly decline it or recommend another library for that component?

The source inventory is Base UI 1.6.0, whose official catalog listed 37
components on 2026-07-21:

- [Base UI machine-readable documentation index](https://base-ui.com/llms.txt)
- [Base UI 1.6.0 release notes](https://base-ui.com/react/overview/releases/v1-6-0)
- [Base UI component documentation](https://base-ui.com/react/overview/quick-start)

Revisit this table when Base UI adds or removes a component. A new Base UI
name is an input to review, not an automatic requirement for Nagi.

## Decision vocabulary

| Decision | Meaning |
|---|---|
| **Shipped** | Nagi already ships the corresponding component capability. |
| **Strengthen** | The component exists; selected Base UI guarantees should be added without changing Nagi's public shape. |
| **Candidate** | A new Nagi component/composable is justified and compatible with the charter. |
| **Native/recipe** | HTML/CSS already provides the right primitive; prefer documentation or a very thin Blueprint over a new state machine. |
| **Defer** | Valuable but thick. Design and test it as an independent slice instead of inflating an existing component. |
| **Decline** | The defining capability conflicts with Nagi's platform-first or ownership model. Recommend composition or another library. |

## Architectural translation, not API translation

| Base UI concept | Nagi translation |
|---|---|
| `Root` state owner | `useX()` composable or a native element's state |
| `Trigger` / `Item` / `Popup` parts | Standard attributes and event props applied to owned DOM |
| `Portal` | Native top layer; no Teleport/portal |
| `Positioner` | CSS Anchor Positioning with an isolated Floating UI fallback |
| `Backdrop` | Native `::backdrop` when the platform provides it |
| `Title` / `Description` parts | Small string props, fixed owned DOM, or a justified content slot |
| `Close` part | Native invoker command, `popovertargetaction`, dialog command, or a small returned prop set |
| `render` / `asChild` | Not translated; use native markup in a composable or own the Blueprint |
| Provider/context coordination | Explicit manager object or local composable only when coordination is the product requirement |
| `data-*` state hooks | Native pseudo-class/ARIA first, then Nagi CSS state suffix only when no higher vocabulary exists |

## Complete Base UI catalog comparison

| Base UI component | Main capability benchmark | Nagi mapping and current state | Decision | Proposed Nagi scope / boundary |
|---|---|---|---|---|
| [Accordion](https://base-ui.com/react/components/accordion) | A set of headed collapsible panels, single or multiple expansion, keyboard and disabled state | Repeated `Disclosure`; native `<details name>` already provides exclusive groups | **Native/recipe** | Document a repeated-Disclosure recipe first. Add a package `Accordion` only after a real package-level anatomy repeats; do not publish an `AccordionItem` compound family. |
| [Alert Dialog](https://base-ui.com/react/components/alert-dialog) | Modal interruption that requires an explicit response | `Dialog` + native `closedby="none"`; no dedicated Blueprint | **Candidate** | A separate strict Blueprint may own `role="alertdialog"`, title, description and explicit actions. Do not overload visual `Alert`. |
| [Autocomplete](https://base-ui.com/react/components/autocomplete) | Free-form text with filtered suggestions | `Combobox` currently restricts commit to predefined keys | **Defer** | Build a distinct `useAutocomplete`; do not add free-form semantics as a mode maze inside `useCombobox`. |
| [Avatar](https://base-ui.com/react/components/avatar) | Image with load/error fallback | No Nagi equivalent | **Candidate** | Native `<img>` first; add deterministic fallback text and load/error handling. Keep the Blueprint styling-only except for image status. |
| [Button](https://base-ui.com/react/components/button) | Button semantics, disabled handling, focus retention during loading | `Button` ships native `type`, `disabled`, variants, a label slot and `focusableWhenDisabled` | **Shipped** | Keep the real button element and suppress activation with `aria-disabled` only when focus retention is requested. Decline arbitrary-tag `render`; links styled as buttons remain native `<a>`. |
| [Checkbox](https://base-ui.com/react/components/checkbox) | Checked/unchecked/indeterminate state with form semantics | Native `Checkbox` ships checked/indeterminate models, form attributes, validation and reset synchronization | **Shipped** | Keep the real `<input type="checkbox">`; `indeterminate` is mirrored only to its required DOM property. Unchecked values remain absent from FormData. |
| [Checkbox Group](https://base-ui.com/react/components/checkbox-group) | Shared array state, group label and validation | No Nagi equivalent | **Candidate** | Native checkbox names + `<fieldset>` where possible. An items schema is acceptable for repeated homogeneous options; no hidden provider. |
| [Collapsible](https://base-ui.com/react/components/collapsible) | Controlled/uncontrolled panel with disabled state | `Disclosure` ships controlled native `<details>`, exclusive-group `name`, and a focusable `aria-disabled` summary contract | **Shipped** | Keep `<summary>` and `<details>` visible instead of copying Root/Trigger/Panel. Programmatic controlled updates remain possible while user activation is disabled. |
| [Combobox](https://base-ui.com/react/components/combobox) | Restricted selection, filtering, form integration, multiple values, groups, async/creatable/virtualized variants | Single-select `Combobox` ships separate text/committed-key models, disabled/read-only/required, selected-key submission, reset, clear and accessible empty/loading states | **Shipped** | Preserve the single-select restricted-selection boundary. Multiple/chips, creatable and virtualization remain separate later slices or Blueprints. |
| [Context Menu](https://base-ui.com/react/components/context-menu) | Menu at pointer coordinates on right click or long press | `useMenu` has item behavior, but no virtual pointer anchor or trigger policy | **Defer** | Reuse menu items/schema; add a contained context-trigger and virtual-anchor layer. Long-press behavior requires real mobile browser tests. |
| [Dialog](https://base-ui.com/react/components/dialog) | Modal/non-modal dialog, controlled state, nested dialogs, title/description/close, multiple opening patterns | Native `Dialog` ships modal/non-modal, controlled state, `closedby`, labelled title, describedby text, body/action slots and close button | **Strengthen** | Description and justified action/footer content are complete. Add nested-dialog and scroll-layout tests. Detached/multiple triggers remain a composable-level use case. |
| [Drawer](https://base-ui.com/react/components/drawer) | Edge panel with swipe-to-dismiss gestures and snap behavior | A non-gesture edge panel can be styled `Dialog`; interrupted gestures have no native owner | **Decline** | Document positioned Dialog for static side panels. For Vaul-class gesture sheets, recommend another library rather than adding a second interaction runtime. |
| [Field](https://base-ui.com/react/components/field) | Label, control, description and error relationships | Each shipped control owns its label/id; relationship verifier covers caller-owned ARIA wiring | **Native/recipe** | Do not add `useField()` until repeated description/error wiring proves it reduces failures. Avoid a compound Field family and behavior wired through slots. |
| [Fieldset](https://base-ui.com/react/components/fieldset) | Grouped controls with legend and disabled grouping | Native `Fieldset` ships `<fieldset>` + first-child `<legend>`, disabled cascade and a declared content slot | **Shipped** | Browser owns group disabling and semantics. `form` is intentionally absent because it would not associate slotted child controls. |
| [Form](https://base-ui.com/react/components/form) | Consolidated client/server errors and submission handling | Nagi relies on native forms; no form framework | **Native/recipe** | Document native validation, server errors and `assertNagiDom()` integration. Do not become a schema/form-state library without separate evidence. |
| [Input](https://base-ui.com/react/components/input) | Styled native input foundation | Native `Input` ships label, attribute/event fallthrough, string `v-model`, form/reset/validation and disabled/read-only states | **Shipped** | Keep native input types and browser editing behavior; no replacement input state machine. |
| [Menu](https://base-ui.com/react/components/menu) | Action/link/check/radio items, groups, submenus, close policy and keyboard navigation | `DropdownMenu` ships action/native-link/check/radio/group/submenu items; `useMenu` owns typeahead, loop, RTL and submenu coordination | **Shipped** | The link node owns a real `<a href>` and preserves pointer/keyboard navigation. Vue Router/Nuxt component APIs, hover-open and multi-trigger handles are not required for Dropdown. |
| [Menubar](https://base-ui.com/react/components/menubar) | Persistent horizontal collection of coordinated menus | No Blueprint; `useMenu` only covers the child menu behavior | **Defer** | Add a dedicated horizontal roving-focus coordinator over `useMenu`. Do not fake a menubar by assigning menu roles to site navigation. |
| [Meter](https://base-ui.com/react/components/meter) | Scalar value within a known range | Native `Meter` ships value/min/max/low/high/optimum with an explicit label | **Shipped** | Keep native `<meter>` and no JS measurement state. Do not use it for task progress. |
| [Navigation Menu](https://base-ui.com/react/components/navigation-menu) | Website links with coordinated preview/dropdown panels | No Nagi equivalent | **Defer** | Use native `<nav>` and links; add hover/focus panel coordination only as a separately tested navigation primitive. Never reuse application-menu roles. |
| [Number Field](https://base-ui.com/react/components/number-field) | Numeric input, locale-aware stepping, increment/decrement and scrub interaction | No Nagi equivalent | **Candidate** | Start with native number input and `stepUp()`/`stepDown()` buttons. Omit scrub gestures and custom locale parsing until native behavior proves insufficient. |
| [OTP Field](https://base-ui.com/react/components/otp-field) | Verification-code entry, paste distribution and completion | No Nagi equivalent | **Defer** | Start from `autocomplete="one-time-code"` and one real input. A segmented visual Blueprint needs focused mobile, paste and password-manager testing. |
| [Popover](https://base-ui.com/react/components/popover) | Anchored popup, controlled state, placement, optional hover/modal behavior, close/title/description | Native `Popover` ships controlled state, light dismiss, anchor fallback and public `area`/`offset` | **Strengthen** | Positioning is complete. Consider optional accessible title/description/close anatomy from real usage. Decline modal/trap-focus popovers and multi-trigger handles. |
| [Preview Card](https://base-ui.com/react/components/preview-card) | Hover/focus preview attached to a link | No dedicated component; Tooltip and Popover provide most mechanics | **Candidate** | Build on hint popover + anchor positioning with interactive content semantics. Keep the trigger as a real link and test pointer transit. |
| [Progress](https://base-ui.com/react/components/progress) | Determinate/indeterminate task progress | Native `Progress` ships a textual label; omitted `value` preserves indeterminate semantics | **Shipped** | Browser owns value semantics; no custom track state machine. |
| [Radio](https://base-ui.com/react/components/radio) | Exclusive checked state with form semantics | Native `Radio` ships string-key selection, form/reset/validation and real same-name radio behavior | **Shipped** | Group related radios inside `Fieldset`; keep browser-owned exclusivity and Arrow behavior. |
| [Scroll Area](https://base-ui.com/react/components/scroll-area) | Native scrolling with custom scrollbar UI | No Nagi equivalent | **Native/recipe** | Prefer `overflow: auto`, `scrollbar-*` CSS and platform scrollbars. Do not ship a synchronized custom-thumb state machine merely for visual parity. |
| [Select](https://base-ui.com/react/components/select) | Choosing one predefined value from a popup list with form/a11y behavior | Native `Select` ships a flat string-key options schema, form/reset/validation and disabled options | **Shipped** | Keep `<select>/<option>` as the stable path. Do not rebuild Select from Combobox or depend on `<selectedcontent>` yet. |
| [Separator](https://base-ui.com/react/components/separator) | Semantic or decorative visual division, including orientation | Menu-owned separators exist; no standalone component | **Candidate** | Use `<hr>` when content separation is semantic. A standalone decorative variant may use `role="separator"`; do not allow ambiguous duplicate separator forms without guidance. |
| [Slider](https://base-ui.com/react/components/slider) | Range selection, orientation and potentially multiple thumbs | Native single-thumb `Slider` ships range keyboard behavior, form/reset and a separately labelled output | **Shipped** | Multi-thumb collision logic is a separate thick component, not a prop on the native path. |
| [Switch](https://base-ui.com/react/components/switch) | Boolean setting with switch semantics and form behavior | Native checkbox-backed `Switch` ships `role="switch"`, label, form/reset and forced-colors fallback | **Shipped** | Keep native checkbox focus/disabled/checked semantics. Do not invent non-native read-only behavior. |
| [Tabs](https://base-ui.com/react/components/tabs) | Automatic/manual activation, orientation, roving focus and related panels | Listed in the Nagi investment map but not implemented | **Defer** | Implement `useTabs` as the behavior source. Validate an owned-DOM or small-schema Blueprint without publishing a Root/List/Trigger/Panel family. |
| [Toast](https://base-ui.com/react/components/toast) | Managed notifications, structured content, action, priority, limit, update/close/promise, keyboard access and gestures | `Toast` ships message/duration/dismiss and top-layer re-promotion only | **Strengthen** | Add an explicit manager object, structured title/description/tone/action, priority, limit, update, close-all, promise and keyboard access. Defer swipe, anchored toasts and stack physics. |
| [Toggle](https://base-ui.com/react/components/toggle) | Two-state pressed button | No Nagi equivalent | **Candidate** | Native `<button aria-pressed>` with controlled `v-model`; small styling Blueprint and no custom element rendering. |
| [Toggle Group](https://base-ui.com/react/components/toggle-group) | Coordinated single/multiple toggle selection | No Nagi equivalent | **Candidate** | Items schema + native pressed buttons is reasonable. Add roving focus only when the chosen ARIA pattern requires it. |
| [Toolbar](https://base-ui.com/react/components/toolbar) | Labeled horizontal/vertical control group with keyboard navigation | No Nagi equivalent | **Defer** | Implement an attribute-injection `useToolbar` for arbitrary owned buttons/controls. Avoid a ToolbarButton/ToolbarLink component family. |
| [Tooltip](https://base-ui.com/react/components/tooltip) | Hover/focus hint, delay coordination, positioning, disabled state and optional interactive hover | `Tooltip` ships per-instance delay, controlled state, disabled suppression, hover/focus, pointer transit and public `area`/`offset` with native/fallback anchoring | **Shipped** | Shared instant-delay coordination is optional and must not require a mandatory provider; cursor tracking and multi-trigger payloads are out. |

Catalog audit: **37 / 37 Base UI components represented**.

## Nagi components without a direct Base UI component

Base UI is behavior-oriented and does not provide a direct public equivalent
for every styled Nagi Blueprint. These remain valid Nagi products and should
use other styled libraries only as product-shape references.

| Nagi component | Current state | Benchmark policy |
|---|---|---|
| `Alert` | Shipped styling-only status/alert frame | Compare semantics with native live-region guidance and visual anatomy with PrimeVue/shadcn. Do not confuse it with Base UI Alert Dialog. |
| `Badge` | Shipped styling-only inline label | Compare tone/size anatomy with styled libraries; no behavior primitive is needed. |
| `Card` | Shipped with optional title/description, a neutral `<div>` frame and body slot | Keep semantics caller-owned through normal attributes or source ownership. Add media/action/footer only after repeated product examples; avoid compound parts. |
| `Listbox` | Shipped single/multiple selection primitive | Keep it as Nagi's reusable selection foundation even though Base UI exposes listbox behavior mainly through Select/Combobox rather than a standalone component. |

## Existing-component alignment priorities

The first alignment work should improve guarantees already promised by Nagi,
not expand the catalog immediately.

### Alignment A — small, local improvements

Completed in A1 (2026-07-21):

- `Button`: focusable disabled behavior without activation.
- `Disclosure`: focusable disabled summary contract.
- `Popover` / `Tooltip`: public `area` and `offset`; Tooltip disabled state.
- `Dialog`: describedby text and a declared action slot.
- `DropdownMenu`: native `<a href>` item plus lint coverage.
- `Card`: optional, semantically neutral anatomy.

Still evidence-gated: Popover title/description/close anatomy, Dialog nested and
scroll-layout tests, and Card media/action/footer anatomy. These should not be
added merely to make the table look complete.

### Alignment B — finish ordinary form behavior

Completed (2026-07-21):

- `Combobox` now covers disabled, read-only, required, selected-key form
  submission, clear, empty/loading status, external form ownership and reset.
- Input, Checkbox, Radio, Switch, Select, Fieldset, Progress, Meter and
  single-thumb Slider ship as native-first package/ownership Blueprints.
- All controlled native inputs use the same small reset bridge so native DOM,
  Vue models and FormData return to the same initial value.
- `useField()` was not added: each fixed Blueprint already owns label/id
  wiring, so a new public vocabulary did not materially reduce failures.

The shipped contract and deliberate Base UI omissions are recorded in
[`base-ui-alignment-b.md`](base-ui-alignment-b.md).

### Alignment C — strengthen Toast as infrastructure

- Explicit `createToastManager()`; no mandatory provider or hidden singleton.
- Structured title/description/tone/action and polite/assertive priority.
- `add`, `update`, `close`, close-all, deduplication and `promise`.
- Limit and keyboard/focus contract before swipe or visual stack physics.

### Alignment D — independent thick components

Autocomplete, Context Menu, Menubar, Navigation Menu, OTP Field, Preview Card,
Tabs and Toolbar each require a separate vertical slice with browser tests.
They must not be implemented as modes that inflate Combobox, Menu, Popover or
Disclosure.

## Capabilities that do not survive translation

The following Base UI capabilities are not default Nagi goals even when they
are useful in Base UI:

- arbitrary-element `render`, `asChild`, or native-element replacement;
- Portal/Teleport as the standard overlay path;
- custom focus traps or modal Popover built above a non-modal platform
  primitive;
- mandatory provider trees and implicit global state;
- detached/multiple-trigger handles with payload render functions;
- per-event cancellation frameworks that require Nagi to replace the user
  agent's dismiss state machine;
- Motion-style JS exit orchestration as a core contract;
- swipe/snap Drawer behavior and custom scrollbar thumbs;
- rebuilding native Select solely for cross-browser visual identity.

These are deliberate product boundaries, not missing checklist items. When a
component's defining requirement is on this list, Nagi should document the
boundary and allow another library to own that component.

## Acceptance rule for adopted features

A feature moves from this comparison into the supported Nagi contract only
when all of the following exist:

1. a concrete user-facing scenario, not only parity with Base UI;
2. a package API that follows CHARTER §3.5 and stays smaller than owning the
   source;
3. the same SFC remains the package component and `own` source;
4. SSR/native attributes are verified where the platform can work before
   hydration;
5. keyboard, focus, form and accessibility behavior has a real-browser
   contract test;
6. owned-source lint and the consumer test recipe cover the new wiring;
7. any intentionally omitted Base UI capability is documented next to the
   component rather than left ambiguous.

The comparison is therefore a coverage compass: aim for Base UI's practical
guarantees, preserve Nagi's platform vocabulary and source ownership, and
decline features whose implementation would turn Nagi into a second Base UI.
