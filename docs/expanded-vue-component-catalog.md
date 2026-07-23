# Expanded Vue component catalog and Nagi UI scope

Status: Adopted catalog complete and shipped (revised 2026-07-23).

This document supplements the existing comparison, whose population is limited
to Base UI's 37 entries. It is the ledger used to decide what Nagi UI should
cover as a general-purpose Vue UI library based on the full shadcn-vue and
PrimeVue catalogs, with React Aria as a focused reference for the adopted
date/time family.

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
| [React Aria date/time components](https://react-aria.adobe.com/getting-started) | 6 adopted slices | Focused behavior, accessibility, internationalization, and API reference for Calendar, RangeCalendar, DateField, DatePicker, DateRangePicker, and TimeField; this is not a raw-catalog parity denominator. |

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
- Domain products, capabilities that conflict with Nagi's platform-first direction, and capabilities supported by only one library are excluded by default. An explicit product requirement may adopt a reviewed slice, as with the date/time family below.

Under these rules, Nagi UI has adopted the following **60** component/behavior
slices:

| State | Slices | Count |
|---|---|---:|
| Shipped | Current release catalog | 60 |
| Adopted candidates | None | 0 |
| Total adopted Nagi UI scope | shipped | 60 |

Current shipped progress is therefore **60 / 60 = 100%**. The corresponding
Base UI-aligned shipped implementation metric is **37 / 37 = 100%**.

DataTable and TreeTable are not included in this denominator. Both belong to
the **Nagi Grid** product scope; Nagi UI provides only adjacent primitives such
as Button, Input, and Popover.

## Shipped normalized capabilities (60)

The canonical detailed comparison is
[`base-ui-component-comparison.md`](base-ui-component-comparison.md).

`Accordion`, `Alert`, `AlertDialog`, `Autocomplete`, `Avatar`, `Badge`,
`Breadcrumb`, `Button`, `ButtonGroup`, `Calendar`, `Card`, `Carousel`,
`Checkbox`, `Combobox`, `ContextMenu`, `DateField`, `DatePicker`,
`DateRangePicker`, `Dialog`, `Disclosure`, `DropdownMenu`, `EmptyState`,
`Fieldset`, `FileInput`, `Input`, `InputGroup`, `Kbd`, `Listbox`, `Menubar`,
`Meter`, `MultiSelect`, `NavigationMenu`, `NumberField`, `OTPField`,
`Pagination`, `Popover`, `Progress`, `PreviewCard`, `Radio`, `RangeCalendar`,
`RangeSlider`, `Rating`, `Resizable`, `Select`, `Separator`, `Skeleton`,
`Slider`, `Spinner`, `Stepper`, `Switch`, `Tabs`, `TagsInput`, `Textarea`,
`TimeField`, `Toolbar`, `Toast`, `Toggle`, `ToggleGroup`, `Tooltip`, `Tree`.

## Final behavior slice (11, shipped)

All entries below passed the full release gate and fourth independent audit in
[`expanded-catalog-completion.md`](expanded-catalog-completion.md).

| Normalized slice | shadcn-vue signal | PrimeVue signal | Decision and Nagi boundary |
|---|---|---|---|
| Autocomplete | Similar Combobox recipe | AutoComplete | **Shipped**. Free-form text stays distinct from optional suggestion commit. |
| Carousel | Carousel | Carousel / Galleria | **Shipped**. Ordinary overflow and CSS scroll snap remain the movement foundation. |
| Context Menu | Context Menu | ContextMenu | **Shipped**. Menu is reused with per-session coordinates and right-click/long-press ordering. |
| Menubar | Menubar | Menubar | **Shipped**. A horizontal coordinator remains distinct from each popup Menu. |
| Multi Select | Composable from the Combobox recipe | MultiSelect | **Shipped**. Key collection, chips, repeated form values, and reset are one contract. |
| Navigation Menu | Navigation Menu | MegaMenu / Menubar | **Shipped**. Native `nav` and links own site navigation; optional panels add no menu roles. |
| OTP Field | Input OTP / Pin Input | InputOtp | **Shipped**. One real input owns paste, keyboard, password-manager, and form behavior. |
| Resizable | Resizable | Splitter | **Shipped**. A standard separator owns bounded pointer and keyboard resizing. |
| Tags Input | Tags Input | Similar Chip / MultiSelect | **Shipped**. Arbitrary strings retain IME, paste, duplicate, removal, and repeated-form policy. |
| Toolbar | Recipe only | Toolbar | **Shipped**. Attribute injection roves direct owned controls without a ToolbarButton family. |
| Tree | Similar Sidebar/Command recipes | Tree / TreeSelect | **Shipped**. Hierarchical DOM, keyboard, expansion, selection, and lazy state remain separate from Listbox. |

### Suggested delivery order

1. **Thin native/presentation slice — shipped (2026-07-22)**: Textarea,
   Skeleton, Spinner, Kbd, Breadcrumb, Empty State, Button Group.
2. **Small interactive slice — shipped (2026-07-22)**: Pagination, Rating,
   File Input.
3. **Anatomy-sensitive slice — shipped (2026-07-22)**: Input Group,
   Number Field, Toggle Group. Preview Card, Range Slider, and Stepper were
   also shipped as an independent follow-up.
4. **Date/time behavior slice — shipped (2026-07-23)**: Calendar, RangeCalendar, DateField, TimeField,
   DatePicker, then DateRangePicker. Native date/time inputs remain supported
   throughout; popup products reuse Popover and add no Portal runtime. The
   acceptance contract is [`date-time-components.md`](date-time-components.md).
5. **Thick behavior slice — shipped (2026-07-23)**: Autocomplete, Multi
   Select, Tags Input, Carousel, Resizable, Tree, Context Menu, Menubar,
   Navigation Menu, OTP Field, Toolbar.

## Native / recipe instead of another package component

Native `input[type=date]`, `input[type=time]`, and `input[type=datetime-local]`
remain the stable path for simple values. The shipped advanced components add
advanced behavior; they do not deprecate or wrap away those controls.

| External names normalized together | Nagi answer |
|---|---|
| Aspect Ratio | CSS `aspect-ratio` recipe |
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
| Scheduler / event calendar | Separate date product. Availability orchestration, resources, events, recurrence, and timeline layout remain outside the six adopted date/time input and selection primitives. |

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
- **Shipped mapping** additionally includes Calendar, Date Picker, Range Calendar,
  Carousel, Context Menu, Input OTP/Pin Input, Menubar, Navigation Menu,
  Resizable, and Tags Input.
- **Native/recipe**: Aspect Ratio, Command, Field, Form, Item, Label,
  Radio Group, Scroll Area, Sheet, Sidebar, Table, Typography.
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

Each raw PrimeVue name maps to a shipped component, Native/recipe, separate
product, or explicit decline above. Raw names remain in
this appendix so a future catalog refresh can detect additions and removals
without re-interpreting the current count.

## Metric interpretation

- **100%** means Nagi UI has shipped all 60 normalized component slices
  it has consciously adopted from Base UI + shadcn-vue + PrimeVue evidence and
  the focused React Aria date/time benchmark.
- It does not mean Nagi has half of PrimeVue's APIs or files.
- `Native/recipe` is a completed design decision, not missing implementation.
- Separate products such as Nagi Grid have their own roadmap and denominator.
- Adding a new external catalog name does not automatically lower progress;
  it lowers progress only after Nagi adopts a distinct slice.
