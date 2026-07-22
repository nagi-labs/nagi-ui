# Expanded Vue component catalog and Nagi UI scope

Status: Research and scope baseline (2026-07-22).

This document supplements the existing comparison, whose population is limited
to Base UI's 37 entries. It is the ledger used to decide what Nagi UI should
cover as a general-purpose Vue UI library based on the full shadcn-vue and
PrimeVue catalogs.

This is not a promise of API parity. External library names are not added
directly to the implementation count. We first normalize equivalent product
requirements into one Nagi slice, then decide whether to adopt each slice.

## Source snapshot

| Source | Raw catalog snapshot | Counting note |
|---|---:|---|
| [Base UI 1.6.0](https://base-ui.com/llms.txt) | 37 | Behavior/accessibility baseline; all 37 entries have already been assessed in the existing comparison. |
| [shadcn-vue components](https://www.shadcn-vue.com/docs/components) | 69 | Top-level entries in the official Components navigation, including some recipe- and block-oriented entries. |
| [PrimeVue 4.5.5](https://primevue.org/) | 80+ | Count stated on the official home page. |
| [PrimeVue UI Kit component navigation](https://primevue.org/uikit/) | 92 names | Form 28, Button 3, Data 10, Panel 11, Overlay 7, File 1, Menu 8, Chart 1, Messages 2, Media 4, Misc 17; also includes directives and utilities. |

Because these catalogs are rolling, the URLs and date above, rather than the
counts alone, are the source of truth for this snapshot.

## New progress denominator

Raw names from external catalogs are not used directly as the denominator. We
normalize them as follows:

- Aliases such as `Message` / `Alert` and `Tag` / `Badge` become one slice.
- Alternative implementations such as `Sonner` / `Toast` become one product requirement.
- Native-control wrappers such as `InputText` and `Native Select` map to existing Nagi components.
- Compound parts, internal subcomponents, and variants do not increase the component count.
- Capabilities adequately covered by HTML/CSS or composition of existing Nagi components are classified as `Native/recipe` and excluded from the implementation denominator.
- Domain products, capabilities that conflict with Nagi's platform-first direction, and capabilities supported by only one library are also excluded from the denominator.

Under these rules, Nagi UI has adopted the following **54** component/behavior
slices:

| State | Slices | Count |
|---|---|---:|
| Shipped | Current package/ownership catalog | 43 |
| Adopted backlog | Candidate/Defer entries in the table below | 11 |
| Total adopted Nagi UI scope | shipped + backlog | 54 |

Progress against the expanded catalog is therefore **43 / 54 = 79.6%**. The
existing **31 / 37 = 83.8%** figure remains the metric for the "Base UI-aligned
scope" and is not presented as progress against the full general UI catalog.

DataTable and TreeTable are not included in this denominator. Both belong to
the **Nagi Grid** product scope; Nagi UI provides only adjacent primitives such
as Button, Input, and Popover.

## Shipped normalized capabilities (43)

The canonical detailed comparison is
[`base-ui-component-comparison.md`](base-ui-component-comparison.md).

`Accordion`, `Alert`, `AlertDialog`, `Avatar`, `Badge`, `Breadcrumb`, `Button`,
`ButtonGroup`, `Card`, `Checkbox`, `Combobox`, `Dialog`, `Disclosure`,
`DropdownMenu`, `EmptyState`, `Fieldset`, `FileInput`, `Input`, `InputGroup`,
`Kbd`, `Listbox`, `Meter`, `NumberField`, `Pagination`, `Popover`, `Progress`,
`PreviewCard`, `Radio`, `RangeSlider`, `Rating`, `Select`,
`Separator`, `Skeleton`, `Slider`, `Spinner`, `Stepper`, `Switch`, `Tabs`, `Textarea`,
`Toast`, `Toggle`, `ToggleGroup`, `Tooltip`.

## Adopted backlog (11)

`Candidate` means a Nagi-shaped implementation is already visible. `Defer`
means demand is recognized, but behavior, browser, or mobile verification must
be completed as an independent slice.

| Normalized slice | shadcn-vue signal | PrimeVue signal | Decision and Nagi boundary |
|---|---|---|---|
| Autocomplete | Similar Combobox recipe | AutoComplete | **Defer**. Separate free-form text from a committed suggestion; do not add a mode to the restricted Combobox. |
| Carousel | Carousel | Carousel / Galleria | **Defer**. Use CSS scroll snap as the foundation and browser-test controls, focus, reduced motion, and announcements. |
| Context Menu | Context Menu | ContextMenu | **Defer**. Reuse the Menu core, then independently validate virtual anchors, right-click, long-press, and mobile policy. |
| Menubar | Menubar | Menubar | **Defer**. This requires a horizontal roving-focus coordinator distinct from Menu. Do not use the menu role for site navigation. |
| Multi Select | Composable from the Combobox recipe | MultiSelect | **Defer**. Validate chips, popup selection, form submission, and removal focus as one thick slice. |
| Navigation Menu | Navigation Menu | MegaMenu / Menubar | **Defer**. Prefer native `nav` and links; evaluate only hover/focus panel coordination as additional value. |
| OTP Field | Input OTP / Pin Input | InputOtp | **Defer**. Validate one-real-input architecture, paste, mobile keyboards, password managers, and screen readers on real devices. |
| Resizable | Resizable | Splitter | **Defer**. Independently validate pointer capture, keyboard resize, min/max constraints, RTL, and nested panels. |
| Tags Input | Tags Input | Similar Chip / MultiSelect | **Defer**. Browser-test text editing, token removal, IME, paste, and duplicate policy together. |
| Toolbar | Recipe only | Toolbar | **Defer**. Inject attributes into arbitrary owned controls. Do not create a ToolbarButton family. |
| Tree | Similar Sidebar/Command recipes | Tree / TreeSelect | **Defer**. Keep the tree keyboard model, lazy children, selection, and expansion out of Listbox. |

### Suggested delivery order

1. **Thin native/presentation slice — shipped (2026-07-22)**: Textarea,
   Skeleton, Spinner, Kbd, Breadcrumb, Empty State, Button Group.
2. **Small interactive slice — shipped (2026-07-22)**: Pagination, Rating,
   File Input.
3. **Anatomy-sensitive slice — shipped (2026-07-22)**: Input Group,
   Number Field, Toggle Group. Preview Card, Range Slider, and Stepper were
   also shipped as an independent follow-up.
4. **Thick behavior slice**: Autocomplete, Multi Select, Tags Input,
   Carousel, Resizable, Tree, Context Menu, Menubar,
   Navigation Menu, OTP Field, Toolbar.

## Native / recipe instead of another package component

| External names normalized together | Nagi answer |
|---|---|
| Aspect Ratio | CSS `aspect-ratio` recipe |
| Calendar / Date Picker / Range Calendar | The stable path is a native date/time input. A custom calendar carries locale, time-zone, range, and mobile differences, so it is not a Nagi UI component. |
| Checkbox Group / Radio Group | Repeated native controls plus `Fieldset`. Add a group items schema only after real demand appears. |
| ColorPicker | Native `input[type=color]`; use a separate product for an advanced picker. |
| Command | `Dialog` + `Combobox` / `Listbox` recipe. Do not create a custom command DSL. |
| DataView | Caller-owned list/grid markup plus Card/pagination recipe. |
| Deferred | Vue async component, `v-if`, and `content-visibility`. |
| Field / Form / Label | Native labels, validation, fieldsets, and the consumer test recipe. Nagi UI does not become a form-state framework. |
| FloatLabel / IftaLabel | CSS label recipe; do not add a mode to Input. |
| Image | Native `img` plus the `nagi-ui setup` image adapter. Framework image components require ownership. |
| Inplace | Composition of Disclosure, Popover, or caller state. |
| Item | A generic list row is caller-owned DOM. Do not create a semantically empty universal Item DSL. |
| MeterGroup | Meter/Progress plus caller-owned visualization. Do not create an API from a single reference. |
| Panel | Card or Disclosure; do not add a Panel mode. |
| PanelMenu | Accordion + Menu composition. |
| Password | Input `type=password` plus a caller action. A strength meter is a Meter recipe. |
| Scroll Area / ScrollPanel | `overflow: auto` plus `scrollbar-*` CSS; do not own custom-thumb synchronization. |
| ScrollTop | Anchor/link plus a `scroll-behavior` recipe. |
| Sheet / static edge Drawer | Positioned native Dialog recipe. Gesture Drawer is listed under Decline below. |
| Sidebar | Application-shell recipe; layout ownership rather than a reusable component. |
| SpeedDial / SplitButton | Button + DropdownMenu composition. |
| Table | Native `table` recipe. Move to Nagi Grid when sorting, filtering, or virtualization is required. |
| Timeline | Semantic list plus CSS recipe. |
| Typography | Nagi CSS typography tokens/prose recipe. |
| VirtualScroller | Evaluate as future collection infrastructure rather than a component. |
| AnimateOnScroll / Fluid / StyleClass | CSS, container queries, and Vue class/style binding. |
| BlockUI | Native `inert` plus a Dialog/Popover and caller-state recipe. |

## Separate products

| External capability | Destination |
|---|---|
| Data Table / Tree Table / advanced Data Grid | **Nagi Grid**. Do not bring its column model, sorting, filtering, virtualization, or editing into Nagi UI. |
| Chart | Adopt **Unovis as the recommended integration**. Nagi UI supplies Card, Tooltip/Popover for adjacent controls, six series theme tokens, and a CSS bridge recipe. Datum tooltips, data, scales, and axes remain Unovis vocabulary; do not create `Chart.vue`. |
| Editor / TextEditor | Dedicated engines such as ProseMirror, Lexical, or Tiptap. Handle only as a separate product. |
| Org Chart / Diagram | Visualization products; do not count them as generic UI components. |
| Advanced Calendar / scheduler / event calendar | Separate date product, distinct from Nagi UI's native date path. |

## Decline or exclude

| External names | Reason |
|---|---|
| Gesture Drawer / Vaul parity | Interrupted gestures, snap points, and physics exceed Nagi's small, contained behavior. A static edge panel is a Dialog recipe. |
| FocusTrap | Owned by the native modal dialog; do not ship a custom trap. |
| DynamicDialog / global dialog service | Hides markup and ownership and creates more cognitive load than typed local state. |
| ConfirmPopup | Do not generalize destructive confirmation into a non-modal anchored overlay. Use AlertDialog. |
| KeyFilter | Likely to break IME, paste, and mobile input. Use `inputmode`, `pattern`, and validation. |
| Knob | Non-standard control with weaker accessibility guarantees than Slider or number input. |
| Dock / Ripple | Visual interaction effects, not Nagi UI behavior components. |
| CascadeSelect | Currently a specialized selector with evidence from only one source. Reassess after Tree/Navigation Menu is implemented. |
| OrderList / PickList | Specialized data-manipulation UI. Keep as an ownership recipe until real use cases appear. |
| ImageCompare | Specialized media widget. Prefer CSS or an owned implementation. |
| Terminal | Domain application block; exclude it from the component catalog. |
| Attachment / Bubble / Marker / chat Message / Message Scroller | Chat product anatomy; application/registry blocks rather than generic Nagi UI primitives. |

## Raw catalog coverage cross-check

### shadcn-vue 69 names

- **Shipped mapping**: Accordion, Alert, Alert Dialog, Avatar, Badge,
  Breadcrumb, Button, Button Group, Card, Checkbox, Collapsible, Combobox,
  Dialog, Dropdown Menu, Empty, Input, Input Group, Kbd, Native Select,
  Number Field, Popover, Progress, Pagination, Select, Separator, Skeleton,
  Slider, Sonner, Spinner, Switch, Tabs, Textarea, Toast, Toggle, Toggle Group,
  Tooltip.
- **Adopted backlog**: Carousel, Context Menu, Input OTP, Menubar,
  Navigation Menu, Pin Input, Resizable, Tags Input.
- **Native/recipe**: Aspect Ratio, Calendar, Command, Date Picker, Field, Form,
  Item, Label, Radio Group, Range Calendar, Scroll Area, Sheet, Sidebar, Table,
  Typography.
- **Separate/excluded**: Attachment, Bubble, Chart, Data Table, Drawer, Marker,
  Message, Message Scroller.

The four groups above account for all 69 official top-level names exactly once.

### PrimeVue 92 navigation names

- **Form (28)**: AutoComplete, CascadeSelect, Checkbox, ColorPicker,
  DatePicker, Editor, FloatLabel, IconField, IftaLabel, InputGroup, InputMask,
  InputNumber, InputOtp, InputText, KeyFilter, Knob, Listbox, MultiSelect,
  Password, RadioButton, Rating, Select, SelectButton, Slider, Textarea,
  ToggleButton, ToggleSwitch, TreeSelect.
- **Button (3)**: Button, SpeedDial, SplitButton.
- **Data (10)**: DataTable, DataView, OrderList, OrgChart, Paginator, PickList,
  Timeline, Tree, TreeTable, VirtualScroller.
- **Panel (11)**: Accordion, Card, Deferred, Divider, Fieldset, Panel,
  ScrollPanel, Splitter, Stepper, Tabs, Toolbar.
- **Overlay (7)**: ConfirmDialog, ConfirmPopup, Dialog, Drawer, DynamicDialog,
  Popover, Tooltip.
- **File (1)**: Upload.
- **Menu (8)**: Breadcrumb, ContextMenu, Dock, Menu, Menubar, MegaMenu,
  PanelMenu, TieredMenu.
- **Chart (1)**: Chart.js.
- **Messages (2)**: Message, Toast.
- **Media (4)**: Carousel, Galleria, Image, ImageCompare.
- **Misc (17)**: AnimateOnScroll, Avatar, Badge, BlockUI, Chip, FocusTrap,
  Fluid, Inplace, MeterGroup, ProgressBar, ProgressSpinner, ScrollTop,
  Skeleton, Ripple, StyleClass, Tag, Terminal.

Each raw PrimeVue name maps to a shipped component, adopted backlog,
Native/recipe, separate product, or explicit decline above. Raw names remain in
this appendix so a future catalog refresh can detect additions and removals
without re-interpreting the current count.

## Metric interpretation

- **79.6%** means Nagi UI has shipped 43 of the 54 normalized component slices
  it has consciously adopted from Base UI + shadcn-vue + PrimeVue evidence.
- It does not mean Nagi has half of PrimeVue's APIs or files.
- `Native/recipe` is a completed design decision, not missing implementation.
- Separate products such as Nagi Grid have their own roadmap and denominator.
- Adding a new external catalog name does not automatically lower progress;
  it lowers progress only after Nagi adopts a distinct slice.
