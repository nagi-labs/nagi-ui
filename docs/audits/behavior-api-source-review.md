# Behavior API source review

Date: 2026-09-01. Scope: the 36 component-behavior source files plus the
shared native-form adapter, 37 files total.

This is a source-presentation and maintenance review, not a substitute for a
Component Definition. It answers a narrower question:

> Can Nagi show the source as an honest example of Vue-native, ownership-ready
> component behavior without hiding correctness in the Blueprint or in a new
> public behavior framework?

## Decision scale

- **Publishable** — suitable to show as Nagi source; no correctness or
  responsibility-boundary change is required first.
- **Polish** — behavior is supported by evidence, but the source still obscures
  its intent enough to weaken the presentation.
- **Fix** — correctness, isolation, lifecycle, or ownership is not adequately
  implemented.

The review checks six things:

1. the Behavior owns state, interaction, focus, and DOM synchronization while
   the Blueprint owns visible markup and rendering choices;
2. complete binding bundles register their own DOM destinations;
3. single elements use direct callbacks and only dynamic keyed collections use
   the private element registry;
4. non-trivial reactive repair has a local, intention-revealing name;
5. shared helpers represent an actually shared invariant rather than similar
   code shape;
6. Node, browser, Template, binding, and type evidence cover the claimed
   boundary.

## Final result

| Result      | Files |
| ----------- | ----: |
| Publishable |    37 |
| Polish      |     0 |
| Fix         |     0 |

| Source                                                             | Main behavior                    | Result      | Review conclusion                                                                                                                                                                       |
| ------------------------------------------------------------------ | -------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`accordion.ts`](../../packages/core/src/accordion.ts)             | Accordion                        | Publishable | Owns exclusive/multiple open-key coordination only; each item delegates native `details` and disabled-summary behavior to the composed Disclosure component.                            |
| [`autocomplete.ts`](../../packages/core/src/autocomplete.ts)       | Autocomplete                     | Publishable | Adds only free-text settlement and selection reconciliation to Combobox rather than cloning its popup behavior.                                                                         |
| [`avatar.ts`](../../packages/core/src/avatar.ts)                   | Avatar                           | Publishable | Owns image failure races, fallback derivation, and the complete root semantics/attrs binding; rendered image/fallback anatomy remains visible.                                           |
| [`button.ts`](../../packages/core/src/button.ts)                   | Button                           | Publishable | Returns the complete native-root binding while keeping ordinary activation browser-owned and Nagi's focusable-disabled policy in one component control.                                 |
| [`calendar.ts`](../../packages/core/src/calendar.ts)               | Calendar, RangeCalendar          | Publishable | Date navigation and range policy remain component-local; keyed cell registration solves only dynamic DOM focus.                                                                         |
| [`carousel.ts`](../../packages/core/src/carousel.ts)               | Carousel                         | Publishable | Geometry is scoped to the registered viewport and semantic parts; wrappers are supported without document rediscovery.                                                                  |
| [`combobox.ts`](../../packages/core/src/combobox.ts)               | Combobox                         | Publishable | Provisional selection, active descendant, popup, and form policy are explicit; input and listbox bindings own their elements.                                                           |
| [`context-menu.ts`](../../packages/core/src/context-menu.ts)       | ContextMenu                      | Publishable | Pointer, long-press, virtual-anchor, and link activation sessions stay ContextMenu-specific; the Blueprint binds their complete destinations without local orchestration.               |
| [`date-field.ts`](../../packages/core/src/date-field.ts)           | DateField                        | Publishable | Date segment policy stays local while locale digits and timed digit buffering are the only extracted mechanisms.                                                                        |
| [`date-picker.ts`](../../packages/core/src/date-picker.ts)         | DatePicker, DateRangePicker      | Publishable | Composes field, calendar, native popup, form, and focus policy without introducing a generic picker engine.                                                                             |
| [`dialog.ts`](../../packages/core/src/dialog.ts)                   | Dialog, AlertDialog control      | Publishable | Native dialog owns modality and focus containment; the adapter owns model synchronization and local surface registration.                                                               |
| [`disclosure.ts`](../../packages/core/src/disclosure.ts)           | Disclosure                       | Publishable | A direct registered `details` element is sufficient; native toggle behavior is not reimplemented.                                                                                       |
| [`listbox.ts`](../../packages/core/src/listbox.ts)                 | Listbox                          | Publishable | Selection and typeahead remain Listbox policy; dynamic option focus uses the private keyed registry with cleanup.                                                                       |
| [`menu.ts`](../../packages/core/src/menu.ts)                       | Menu, Submenu                    | Publishable | The large controller is justified by one menu-tree focus owner; collection repair is named and nested policy stays local.                                                               |
| [`menubar.ts`](../../packages/core/src/menubar.ts)                 | Menubar                          | Publishable | Roving top-level ownership composes Menu without merging their keyboard contracts, while link actions expose one complete interaction binding.                                          |
| [`multi-select.ts`](../../packages/core/src/multi-select.ts)       | MultiSelect                      | Publishable | Filtering, chips, selection, validity, and popup policy remain local; only option registration is shared.                                                                               |
| [`navigation-menu.ts`](../../packages/core/src/navigation-menu.ts) | NavigationMenu                   | Publishable | Hover, focus, activation, and post-navigation popup closure remain explicit product policy exposed through destination-specific bindings.                                               |
| [`native-form.ts`](../../packages/core/src/native-form.ts)         | Native form adapters             | Publishable | Shares only browser reset, validity, and native-control synchronization invariants used by multiple components.                                                                         |
| [`number-field.ts`](../../packages/core/src/number-field.ts)       | NumberField                      | Publishable | Delegates parsing constraints and stepping to the native number input, synchronizes the nullable model, and returns the complete native-control binding.                                |
| [`otp-field.ts`](../../packages/core/src/otp-field.ts)             | OTPField                         | Publishable | One native input owns editing and normalization; decorative cell count remains visible in the template and its layout is CSS-derived.                                                   |
| [`pagination.ts`](../../packages/core/src/pagination.ts)           | Pagination                       | Publishable | Keeps native link navigation distinct from controlled button selection with a deliberately small API.                                                                                   |
| [`popover.ts`](../../packages/core/src/popover.ts)                 | Popover                          | Publishable | Trigger and surface are registered directly; native Popover transitions and controlled repair are stated explicitly.                                                                    |
| [`preview-card.ts`](../../packages/core/src/preview-card.ts)       | PreviewCard                      | Publishable | Preserves real-link activation while locally coordinating hover/focus intent and interactive preview transit.                                                                           |
| [`range-slider.ts`](../../packages/core/src/range-slider.ts)       | RangeSlider                      | Publishable | Two native range inputs remain visible while their complete reactive bindings, fieldset binding, rail interaction, and ordered-model repair stay component-specific.                    |
| [`resizable.ts`](../../packages/core/src/resizable.ts)             | Resizable                        | Publishable | Separator keyboard/pointer behavior and measurable parent geometry are explicit; only the controlled primary basis crosses into CSS and the complementary panel consumes the remainder. |
| [`select.ts`](../../packages/core/src/select.ts)                   | Select                           | Publishable | Reads browser-selected fallback and reset state; its component overload owns the complete select/label binding plus ordered change notification without a second renderer composable.   |
| [`slider.ts`](../../packages/core/src/slider.ts)                   | Slider                           | Publishable | Reads browser range sanitization after DOM updates and returns the complete input/label/output binding without adding a speculative slider state machine.                               |
| [`stepper.ts`](../../packages/core/src/stepper.ts)                 | Stepper                          | Publishable | Contains only disabled/current selection policy; navigation markup remains ordinary buttons and lists.                                                                                  |
| [`tabs.ts`](../../packages/core/src/tabs.ts)                       | Tabs                             | Publishable | Roving focus, activation mode, controlled repair, and dynamic registration are named independently of panel markup.                                                                     |
| [`tags-input.ts`](../../packages/core/src/tags-input.ts)           | TagsInput                        | Publishable | Token editing, paste, IME, validity, and reset policy remain local; it is not forced into MultiSelect.                                                                                  |
| [`time-field.ts`](../../packages/core/src/time-field.ts)           | TimeField                        | Publishable | Time-specific ranges, day period, granularity, and model repair remain local while only true segment mechanisms are shared.                                                             |
| [`toast.ts`](../../packages/core/src/toast.ts)                     | Toast manager and public binding | Publishable | Data/timers, document coordination, live-region text, action identity, and renderer focus repair are separated without a generic coordinator.                                           |
| [`toggle-group.ts`](../../packages/core/src/toggle-group.ts)       | ToggleGroup                      | Publishable | Owns only single/multiple pressed transitions and deliberately leaves every native button in the tab order.                                                                             |
| [`toggle.ts`](../../packages/core/src/toggle.ts)                   | Toggle                           | Publishable | Keeps native button activation and exposes one complete button binding for controlled pressed/disabled synchronization and consumer attrs.                                              |
| [`toolbar.ts`](../../packages/core/src/toolbar.ts)                 | Toolbar                          | Publishable | Dynamic roving focus uses keyed registration; collection repair and directional navigation remain Toolbar-local.                                                                        |
| [`tooltip.ts`](../../packages/core/src/tooltip.ts)                 | Tooltip                          | Publishable | Trigger and hint use direct local bindings; hover/focus timing and disabled repair are named and self-contained.                                                                        |
| [`tree.ts`](../../packages/core/src/tree.ts)                       | Tree                             | Publishable | Recursive visibility, active descendant, expansion, selection, and dynamic focus repair remain one coherent tree policy.                                                                |

## What this result does not claim

- It does not mean all 64 components have a verified Component Definition.
- It does not claim every source file should be short. Calendar, Menu, and the
  segmented fields are large because their component policy is genuinely
  large; they were not split merely to lower line counts.
- It does not claim every widget has an individual ShadowRoot fixture. The
  review rejects ambient rediscovery and relies on the existing representative
  isolation suite; broader environment coverage remains future hardening.
- It does not make private helpers public API. The keyed registry and segmented
  field helpers remain implementation mechanisms.

The machine audit checks that this table still covers the exact 37 source files
and that none is silently downgraded or omitted. The judgment itself remains a
review decision backed by the repository test suites, not something source
matching can prove automatically.
