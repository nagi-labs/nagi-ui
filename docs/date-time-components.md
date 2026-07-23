# Date and time component slice

Status: Shipped (2026-07-23).

This slice covers `Calendar`, `RangeCalendar`, `DateField`, `DatePicker`,
`DateRangePicker`, and `TimeField`. It does not replace the native stable path:
applications that only need a simple date or time value should continue to use
`input[type=date]`, `input[type=time]`, or `input[type=datetime-local]`.

## Product boundary

- Component models and submitted form values use platform-shaped ISO strings:
  `YYYY-MM-DD` for dates and `HH:mm[:ss]` for times.
- `@internationalized/date` owns calendar arithmetic and conversions. Nagi does
  not implement leap years, calendar systems, date overflow, or time-zone math.
- Calendar grids, segmented editing, range preview/commit, and popup
  coordination are thick behavior because native controls do not expose these
  capabilities as styleable owned DOM.
- Picker popup surfaces reuse the native Popover API and the existing Nagi
  synchronization/positioning path. No Teleport, Portal, custom focus trap, or
  second overlay runtime is permitted.
- Each package component remains one ownable SFC containing plain HTML. Picker
  Blueprints may reuse core mechanisms, but must not wire behavior through a
  public family of `Root`, `Field`, `Calendar`, `Cell`, or `Popover` component
  tags.
- Scheduler resources, appointments, recurrence, event layout, and timeline
  views remain a separate product domain.

## Delivery order

1. `Calendar`: single-date grid, locale/week structure, unavailable dates,
   roving focus, month navigation, controlled ISO value, and form integration.
2. `RangeCalendar`: range anchor/extent behavior, unavailable-span rejection,
   range announcements, keyboard traversal, and two submitted values.
3. `DateField` and `TimeField`: localized segmented editing, keyboard movement,
   typing, validation, disabled/read-only behavior, and native form/reset.
4. `DatePicker`: one Blueprint reusing DateField/Calendar core mechanisms and
   native Popover, including Escape/dismiss and focus return.
5. `DateRangePicker`: one Blueprint reusing range-field/RangeCalendar core
   mechanisms, with explicit range validation and form encoding.

## Shipped API and ownership form

- `useCalendar` and `useRangeCalendar` expose grid/cell/navigation attribute
  objects, six-week locale grids, controlled ISO models, constraints, and
  native form channels. Range selection keeps its provisional anchor separate
  from the committed model and rejects unavailable spans.
- `useDateField` and `useTimeField` expose localized segment arrays plus
  spinbutton props. Date values are `YYYY-MM-DD`; time values are `HH:mm` or
  `HH:mm:ss`. The component overloads hide fixed prop forwarding while the
  complete options form remains available to owned renderers.
- `useDatePicker` and `useDateRangePicker` coordinate those mechanisms with
  `usePopover`; the package SFCs still contain only plain owned HTML rather
  than public Calendar/Field/Popover child tags.
- Picker component overloads remain two-argument APIs. Their second model
  argument groups the controlled ISO value and native-popover open refs, so
  there is no third configuration path prohibited by `CHARTER.md` section 3.5.
- All six SFCs are exported from `/components`, registered by `nagi-ui own`,
  and declared in the consumer Nagi CSS preset.

The calendar grid currently uses Gregorian `CalendarDate` values and localized
labels/week starts. Alternate-era editing and non-Gregorian model calendars are
not claimed by this slice. Time zones affect date formatting/today boundaries;
these components do not represent zoned date-times.

## Required behavior checks

### Semantics and keyboard

- Calendar cells expose standard grid semantics and selection through ARIA;
  disabled/unavailable dates cannot be committed.
- Arrow keys move by day/week as documented, Home/End stay within the week,
  and month/year paging keeps a valid focused date.
- RangeCalendar distinguishes the committed range from a provisional endpoint
  without introducing a duplicate `data-state` vocabulary.
- Field segments expose their unit, current value, bounds, and accessible name;
  Left/Right changes segment, Up/Down changes value, numeric typing replaces a
  segment, and separators are not focus targets.
- Picker opening, Escape, outside dismissal, selection, and focus return are
  exercised through real browser behavior rather than imperative test-only
  closing.

### Values, forms, and validation

- Controlled model writes and user edits remain bidirectionally synchronized.
- If a controlled parent rejects a field or range write, optimistic segments
  and drafts roll back after the Vue update flush so visible text, the model,
  and the hidden native form value cannot diverge.
- Required, disabled, read-only, min/max, unavailable dates, and invalid ranges
  have visible and accessible behavior.
- Component form-control bindings mirror custom constraints into native
  `setCustomValidity()`, preventing unavailable dates, unavailable spans, and
  reversed ranges from reaching a normal form submit handler.
- Real `FormData` contains the documented ISO string values; disabled controls
  are omitted and native form reset restores the initial model.
- SSR produces stable labels, IDs, roles, segment values, selected dates, and
  native popover relationships before hydration.

### Internationalization and devices

- Locale-specific field order, separators, month/week labels, first day of
  week, 12/24-hour cycles, RTL movement, and the explicit Gregorian model
  contract are covered without baking English or hand-written date arithmetic
  into core behavior.
- Mobile pointer input, touch screen readers, IME, paste, and responsive popup
  behavior are explicit browser-test subjects. Unsupported claims must be
  documented rather than inferred from desktop tests.

Implemented automated coverage includes locale field order, 12/24-hour cycles,
RTL segment arrows, `beforeinput`, ISO paste, desktop pointer input, Chromium
keyboard/focus, native FormData/reset, and open-state axe checks. Physical
iOS/Android virtual keyboards, VoiceOver/TalkBack, IME composition matrices,
and non-Gregorian era editing remain device/manual follow-up checks and are not
claimed from the desktop suite.

The public ISO model and grid are explicitly Gregorian. Locale controls number,
month, weekday, separator, direction, and first-day-of-week presentation, while
`Intl.DateTimeFormat` is pinned to the Gregorian calendar so accessible labels
cannot describe a different calendar than the value. Supporting a
non-Gregorian model remains a future, separate capability.

## Styling state contract

The family uses native/ARIA state wherever it exists: `aria-selected`,
`aria-disabled`, `aria-current`, `:focus-visible`, and `:popover-open`.
Calendar-only visual distinctions with no equivalent standard state use the
following documented attributes on owned grid cells:

- `data-outside-month` — a leading/trailing date outside the visible month;
- `data-preview` — a provisional range between its current anchor and pointer;
- `data-range-start` / `data-range-end` — committed range endpoints.

No `data-state` umbrella or selected/disabled state class is exposed.

## Package and ownership checks

Every shipped component in this slice must satisfy all of the following:

1. the public core entry exports its composable and types;
2. `/components` exports the same SFC used by `nagi-ui own`;
3. the ownership registry and Nagi CSS consumer preset contain the component;
4. SSR and type tests cover the public package API;
5. verified-bindings checks every behavior-prop application that owns native or
   ARIA attributes;
6. Blueprint CSS uses the filename-derived `n-` surface, approved anatomy,
   required theme tokens without fallbacks, and no literal colors;
7. package and owned fixtures pass keyboard/focus/form assertions and axe with
   no excluded rules.

## Release gate

Run the repository-wide checks after the component-specific tests:

```sh
vp run test
vp run typecheck
vp run test:integration
vp run test:browser
vp node ../nagi-css/packages/cli/src/cli.mjs check --config .sandbox/nagi.config.mjs --cwd .
vp node ../nagi-css/packages/cli/src/cli.mjs check --config .sandbox/nagi.consumer.config.mjs --cwd .
```

The independent review must also inspect the final SFCs against `CHARTER.md`,
`docs/blueprint-wiring-audit.md`, and the consumer contracts in
`packages/core/recipes/testing/README.md`; a green unit suite alone is not the
completion criterion.

## Release verification

The 2026-07-23 shipping revision passed 310 repository unit/SSR/source tests,
97 Chromium keyboard/focus/form/axe tests, TypeScript 7 typechecking,
verified-bindings integration lint, and both the owned and consumer Nagi CSS
checks. The independent review found and drove fixes for native custom
validity, initial-null segment reset, controlled-update rollback, atomic
range-model synchronization, picker focus return, unavailable-value roving
focus, Gregorian label alignment, keyboard range announcements, the
two-argument overload boundary, missing date/time verified-bindings contracts,
blackout-month and min/max paging, dynamic focus recovery, provisional-range
submission, constraint-relaxation validity, read-only form controls, and
in-place controlled range updates before granting final approval with no
remaining blocking or high findings.
