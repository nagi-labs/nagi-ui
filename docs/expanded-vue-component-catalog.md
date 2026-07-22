# Expanded Vue component catalog and Nagi UI scope

Status: Research and scope baseline (2026-07-22).

この文書は、Base UI 37項目だけを母集団にした既存比較を補い、
shadcn-vueとPrimeVueのカタログ全体から「一般的なVue UIライブラリとして
Nagi UIが持つべき範囲」を決めるためのledgerである。

これはAPI parityの約束ではない。外部ライブラリの名前をそのまま実装数へ
足さず、同じ製品要求を1つのNagi sliceへ正規化してから採否を決める。

## Source snapshot

| Source | Raw catalog snapshot | Counting note |
|---|---:|---|
| [Base UI 1.6.0](https://base-ui.com/llms.txt) | 37 | behavior / accessibility baseline。既存比較表で37 / 37判定済み |
| [shadcn-vue components](https://www.shadcn-vue.com/docs/components) | 69 | 公式Componentsナビゲーションのトップレベル項目。recipe、block寄りの項目も含む |
| [PrimeVue 4.5.5](https://primevue.org/) | 80+ | 公式トップページの表記 |
| [PrimeVue UI Kit component navigation](https://primevue.org/uikit/) | 92 names | Form 28、Button 3、Data 10、Panel 11、Overlay 7、File 1、Menu 8、Chart 1、Messages 2、Media 4、Misc 17。directive / utilityも含む |

カタログはrollingなので、件数ではなく上記URLと日付をsnapshotの正本とする。

## New progress denominator

外部カタログのraw nameをそのまま分母にしない。次を正規化する。

- `Message` / `Alert`、`Tag` / `Badge`のようなaliasは1 sliceへまとめる。
- `Sonner` / `Toast`のような実装選択肢は1製品要求へまとめる。
- `InputText`、`Native Select`のようなnative control wrapperは既存Nagi componentへ対応させる。
- compound part、内部subcomponent、variantはcomponent数へ足さない。
- HTML/CSSまたは既存Nagi componentのcompositionで十分なものは`Native/recipe`とし、実装分母から除く。
- domain product、Nagiのplatform-first方針と衝突するもの、単独ライブラリにしか根拠がないものも分母から除く。

この規則で、Nagi UIが採用するcomponent / behavior sliceは次の **54**。

| State | Slices | Count |
|---|---|---:|
| Shipped | 現在のpackage / ownership catalog | 37 |
| Adopted backlog | 下表のCandidate / Defer | 17 |
| Total adopted Nagi UI scope | shipped + backlog | 54 |

したがって拡張カタログ基準の進捗は **37 / 54 = 68.5%**。
既存の **27 / 37 = 73.0%** は「Base UI aligned scope」の指標として残し、
一般UIカタログ全体の進捗とは呼ばない。

DataTableとTreeTableはこの分母に含めない。両者は
**Nagi Grid** のproduct scopeであり、Nagi UIはButton、Input、
Popover等の周辺primitiveだけを提供する。

## Shipped normalized capabilities (37)

正本の詳細比較は
[`base-ui-component-comparison.md`](base-ui-component-comparison.md)に置く。

`Accordion`, `Alert`, `AlertDialog`, `Avatar`, `Badge`, `Breadcrumb`, `Button`,
`ButtonGroup`, `Card`, `Checkbox`, `Combobox`, `Dialog`, `Disclosure`,
`DropdownMenu`, `EmptyState`, `Fieldset`, `FileInput`, `Input`, `Kbd`, `Listbox`,
`Meter`, `Pagination`, `Popover`, `Progress`, `Radio`, `Rating`, `Select`,
`Separator`, `Skeleton`, `Slider`, `Spinner`, `Switch`, `Tabs`, `Textarea`,
`Toast`, `Toggle`, `Tooltip`。

## Adopted backlog (17)

`Candidate`はNagiらしい形がすでに見えるもの、`Defer`は需要を認めるが
behavior / browser / mobile検証を独立sliceとして必要とするもの。

| Normalized slice | shadcn-vue signal | PrimeVue signal | Decision and Nagi boundary |
|---|---|---|---|
| Autocomplete | Combobox recipeが近い | AutoComplete | **Defer**。free-form textとcommitted suggestionを分離し、restricted Comboboxへmode追加しない |
| Carousel | Carousel | Carousel / Galleria | **Defer**。CSS scroll snapを基礎にし、controls、focus、reduced motion、announcementをbrowser testする |
| Context Menu | Context Menu | ContextMenu | **Defer**。Menu coreを再利用し、virtual anchor、right-click、long-press、mobile policyを独立検証 |
| Input Group | Input Group | InputGroup / IconField | **Candidate**。native control attributesの送付先を壊さず、prefix/suffix/actionの最小anatomyを設計 |
| Menubar | Menubar | Menubar | **Defer**。Menuとは別のhorizontal roving-focus coordinator。site navigationへmenu roleを使わない |
| Multi Select | Combobox recipeで構成可能 | MultiSelect | **Defer**。chips、popup selection、form submission、remove focusを1つの厚いsliceとして検証 |
| Navigation Menu | Navigation Menu | MegaMenu / Menubar | **Defer**。native `nav` / links優先。hover/focus panel coordinationだけを追加価値として評価 |
| Number Field | Number Field | InputNumber | **Candidate**。native number input + `stepUp()` / `stepDown()`。locale parsing / scrub gestureは別判断 |
| OTP Field | Input OTP / Pin Input | InputOtp | **Defer**。one-real-input、paste、mobile keyboard、password manager、screen readerを実機検証 |
| Preview Card | Hover Card | Popover / Tooltipが近い | **Candidate**。real link trigger、pointer transit、interactive preview。generic hover popoverへしない |
| Range Slider | Slider | Slider range | **Candidate**。single native Sliderを複雑化せず、multi-thumbを独立componentとして実装 |
| Resizable | Resizable | Splitter | **Defer**。pointer capture、keyboard resize、min/max、RTL、nested panelsを独立検証 |
| Stepper | Stepper | Stepper | **Defer**。progress表示、navigation、form wizardを混同せず、まずflat items + current stepを定義 |
| Tags Input | Tags Input | Chip / MultiSelectが近い | **Defer**。text editing、token removal、IME、paste、duplicate policyをまとめてbrowser test |
| Toggle Group | Toggle Group | SelectButton | **Candidate**。flat items + pressed buttons。selected semanticsに必要な場合だけroving focusを追加 |
| Toolbar | recipeのみ | Toolbar | **Defer**。arbitrary owned controlsへattribute injection。ToolbarButton familyは作らない |
| Tree | Sidebar/Command recipesが近い | Tree / TreeSelect | **Defer**。tree keyboard model、lazy children、selectionとexpansionをListboxへ混ぜない |

### Suggested delivery order

1. **Thin native/presentation slice — shipped (2026-07-22)**: Textarea,
   Skeleton, Spinner, Kbd, Breadcrumb, Empty State, Button Group。
2. **Small interactive slice — shipped (2026-07-22)**: Pagination, Rating,
   File Input。
3. **Anatomy-sensitive slice**: Input Group, Number Field, Toggle Group,
   Preview Card, Stepper。
4. **Thick behavior slice**: Autocomplete, Multi Select, Tags Input,
   Range Slider, Carousel, Resizable, Tree, Context Menu, Menubar,
   Navigation Menu, OTP Field, Toolbar。

## Native / recipe instead of another package component

| External names normalized together | Nagi answer |
|---|---|
| Aspect Ratio | CSS `aspect-ratio` recipe |
| Calendar / Date Picker / Range Calendar | stable pathはnative date/time input。custom calendarはlocale、timezone、range、mobile差異を持つためNagi UI componentにしない |
| Checkbox Group / Radio Group | repeated native controls + `Fieldset`。group items schemaは実需要が出てから |
| ColorPicker | native `input[type=color]`。advanced pickerは別製品を利用 |
| Command | `Dialog` + `Combobox` / `Listbox` recipe。独自command DSLは作らない |
| DataView | caller-owned list/grid markup + Card / pagination recipe |
| Deferred | Vue async component、`v-if`、`content-visibility` |
| Field / Form / Label | native label、validation、fieldsetとconsumer test recipe。form-state frameworkにはならない |
| FloatLabel / IftaLabel | CSS label recipe。Inputのmodeにしない |
| Image | native `img` + `nagi-ui setup` image adapter。framework image componentはownership |
| Inplace | Disclosure、Popoverまたはcaller stateのcomposition |
| Item | generic list rowはcaller-owned DOM。意味のない万能Item DSLを作らない |
| MeterGroup | Meter / Progressとcaller-owned visualization。単一referenceなのでAPI化しない |
| Panel | CardまたはDisclosure。Panel modeを増やさない |
| PanelMenu | Accordion + Menu composition |
| Password | Input `type=password` + caller action。strength meterはMeter recipe |
| Scroll Area / ScrollPanel | `overflow: auto` + `scrollbar-*` CSS。custom thumb同期を持たない |
| ScrollTop | anchor/link + `scroll-behavior` recipe |
| Sheet / static edge Drawer | positioned native Dialog recipe。gesture Drawerは下のDecline |
| Sidebar | application shell recipe。再利用componentではなくlayout ownership |
| SpeedDial / SplitButton | Button + DropdownMenu composition |
| Table | native `table` recipe。sorting/filtering/virtualizationへ進んだらNagi Grid |
| Timeline | semantic list + CSS recipe |
| Typography | Nagi CSS typography tokens / prose recipe |
| VirtualScroller | componentではなく将来のcollection infrastructureとして評価 |
| AnimateOnScroll / Fluid / StyleClass | CSS、container queries、Vue class/style binding |
| BlockUI | native `inert`、Dialog / Popoverとcaller stateのrecipe |

## Separate products

| External capability | Destination |
|---|---|
| Data Table / Tree Table / advanced Data Grid | **Nagi Grid**。column model、sorting、filtering、virtualization、editingをNagi UIへ持ち込まない |
| Chart | charting library / 将来の別product。Nagi UIはCard、Tooltip、theme tokenを提供 |
| Editor / TextEditor | ProseMirror / Lexical / Tiptap等の専用engine。別product以外では扱わない |
| Org Chart / Diagram | visualization product。generic UI componentとして数えない |
| advanced Calendar / scheduler / event calendar | date productとして独立させる。Nagi UIのnative date pathとは分離 |

## Decline or exclude

| External names | Reason |
|---|---|
| gesture Drawer / Vaul parity | interrupted gesture、snap point、physicsはNagiのsmall contained behaviorを超える。static edge panelはDialog recipe |
| FocusTrap | native modal dialogが所有する。custom trapは出荷しない |
| DynamicDialog / global dialog service | markupとownershipを隠し、typed local stateより認知負荷が高い |
| ConfirmPopup | destructive confirmationをnon-modal anchored overlayへ一般化しない。AlertDialogを使う |
| KeyFilter | IME、paste、mobile inputを壊しやすい。`inputmode`、`pattern`、validationを使う |
| Knob | non-standard control。Slider / number inputよりアクセシビリティ保証が弱い |
| Dock / Ripple | visual interaction effectであり、Nagi UIのbehavior componentではない |
| CascadeSelect | 現時点では単一referenceのspecialized selector。Tree / Navigation Menu実装後に再評価 |
| OrderList / PickList | specialized data manipulation UI。実利用例が出るまでownership recipe |
| ImageCompare | specialized media widget。CSS/owned implementationを優先 |
| Terminal | domain application block。component catalogから除外 |
| Attachment / Bubble / Marker / chat Message / Message Scroller | chat product anatomy。汎用Nagi UI primitiveではなくapplication / registry block |

## Raw catalog coverage cross-check

### shadcn-vue 69 names

- **Shipped mapping**: Accordion, Alert, Alert Dialog, Avatar, Badge,
  Breadcrumb, Button, Button Group, Card, Checkbox, Collapsible, Combobox,
  Dialog, Dropdown Menu, Empty, Input, Kbd, Native Select, Popover, Progress,
  Pagination, Select, Separator, Skeleton, Slider, Sonner, Spinner, Switch,
  Tabs, Textarea, Toast, Toggle, Tooltip。
- **Adopted backlog**: Carousel, Context Menu, Hover Card, Input Group,
  Input OTP, Menubar, Navigation Menu, Number Field, Pin Input, Resizable,
  Stepper, Tags Input, Toggle Group。
- **Native/recipe**: Aspect Ratio, Calendar, Command, Date Picker, Field, Form,
  Item, Label, Radio Group, Range Calendar, Scroll Area, Sheet, Sidebar, Table,
  Typography。
- **Separate/excluded**: Attachment, Bubble, Chart, Data Table, Drawer, Marker,
  Message, Message Scroller。

The four groups above account for all 69 official top-level names exactly once.

### PrimeVue 92 navigation names

- **Form (28)**: AutoComplete, CascadeSelect, Checkbox, ColorPicker,
  DatePicker, Editor, FloatLabel, IconField, IftaLabel, InputGroup, InputMask,
  InputNumber, InputOtp, InputText, KeyFilter, Knob, Listbox, MultiSelect,
  Password, RadioButton, Rating, Select, SelectButton, Slider, Textarea,
  ToggleButton, ToggleSwitch, TreeSelect。
- **Button (3)**: Button, SpeedDial, SplitButton。
- **Data (10)**: DataTable, DataView, OrderList, OrgChart, Paginator, PickList,
  Timeline, Tree, TreeTable, VirtualScroller。
- **Panel (11)**: Accordion, Card, Deferred, Divider, Fieldset, Panel,
  ScrollPanel, Splitter, Stepper, Tabs, Toolbar。
- **Overlay (7)**: ConfirmDialog, ConfirmPopup, Dialog, Drawer, DynamicDialog,
  Popover, Tooltip。
- **File (1)**: Upload。
- **Menu (8)**: Breadcrumb, ContextMenu, Dock, Menu, Menubar, MegaMenu,
  PanelMenu, TieredMenu。
- **Chart (1)**: Chart.js。
- **Messages (2)**: Message, Toast。
- **Media (4)**: Carousel, Galleria, Image, ImageCompare。
- **Misc (17)**: AnimateOnScroll, Avatar, Badge, BlockUI, Chip, FocusTrap,
  Fluid, Inplace, MeterGroup, ProgressBar, ProgressSpinner, ScrollTop,
  Skeleton, Ripple, StyleClass, Tag, Terminal。

Each raw PrimeVue name maps to a shipped component, adopted backlog,
Native/recipe, separate product, or explicit decline above. Raw names remain in
this appendix so a future catalog refresh can detect additions and removals
without re-interpreting the current count.

## Metric interpretation

- **68.5%** means Nagi UI has shipped 37 of the 54 normalized component slices
  it has consciously adopted from Base UI + shadcn-vue + PrimeVue evidence.
- It does not mean Nagi has half of PrimeVue's APIs or files.
- `Native/recipe` is a completed design decision, not missing implementation。
- Separate products such as Nagi Grid have their own roadmap and denominator。
- Adding a new external catalog name does not automatically lower progress;
  it lowers progress only after Nagi adopts a distinct slice。
