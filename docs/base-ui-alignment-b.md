# Base UI alignment B — native form controls

Status: Complete (2026-07-21).

## Outcome

Alignment B adopts Base UI's ordinary form guarantees without adopting its
compound anatomy. Nagi now ships nine native-first Blueprints plus a stronger
single-select Combobox:

| Blueprint | Browser-owned source | Nagi-owned bridge |
|---|---|---|
| `Input` | native input/editing/validation/FormData | label, theme, string model, reset sync |
| `Checkbox` | native checkbox/submission | boolean model and DOM-only `indeterminate` sync |
| `Radio` | native same-name exclusivity and keyboard | string-key model and reset sync |
| `Switch` | native checkbox | `role="switch"` and visual treatment |
| `Select` | native select/options | flat string-key schema and reset sync |
| `Fieldset` | native fieldset/legend/disabled cascade | declared content slot and theme |
| `Progress` | native progress | label; omitted value means indeterminate |
| `Meter` | native meter thresholds | label and theme |
| `Slider` | native single-thumb range/keyboard | numeric model, output and reset sync |
| `Combobox` | form owner and constraint validation | restricted key selection and popup behavior |

Every SFC is the single source for package import and `nagi-ui own`.

## Form contract

- values use platform vocabulary: Input and Select/Radio keys are strings;
- checkbox/switch unchecked values and every disabled control are absent from
  `FormData`;
- each external `form` attribute is placed on the real form-associated
  control;
- a native reset restores both the DOM and its controlled Vue model;
- required/disabled/read-only validity remains browser-owned where HTML has
  that state;
- Checkbox `indeterminate` is visual state only and never changes the browser's
  checked/submission semantics;
- Fieldset intentionally has no `form` prop: associating the fieldset itself
  would not associate controls passed through its slot.

The reset bridge is `useNativeFormReset()`. It runs only after the browser has
performed `form.reset()`, then restores both the component's initial model and
the real control property. The explicit property write is required even when
the model was already at its initial value and Vue has no reason to render.
The bridge does not create dirty/touched state or replace a form library.

## Combobox contract

The editable string and committed key stay separate. The visible input has no
`name`; a hidden form control submits only the committed key. Typing a new,
uncommitted string therefore does not silently change the submitted value.

- `disabled` blocks interaction and submission;
- `readOnly` permits inspection but not editing, clearing or commit;
- `required` exposes `aria-required` and custom validity on the visible input,
  so it validates committed selection rather than arbitrary input text;
- clear empties both models and returns focus to the input;
- reset restores the initial text and key;
- loading and empty status are siblings of the inner listbox, so the listbox
  owns only options;
- Enter with no active option remains browser-owned and can submit/validate a
  form.

Separating `popupProps` and `listboxProps` is intentional. The native popover
owns top-layer state; the inner `<ul role="listbox">` owns ARIA options.

## Deliberate omissions

Alignment is a guarantee comparison, not API parity. This slice does not add:

- compound Field, RadioGroup, Select or Slider part families;
- `useField()` before repeated description/error wiring proves a need;
- dirty/touched/filled/server-error form state;
- non-native checkbox/radio/switch read-only state machines;
- custom Select popup, rich options, multi-select or `<selectedcontent>`;
- multi-thumb Slider, collision policy or custom track runtime;
- custom Progress/Meter track DOM;
- Combobox multiple/chips, creatable values or virtualization;
- Base UI `render`/`asChild` or copied `data-*` state.

These boundaries preserve readable SFCs and browser behavior. A requirement
crossing one of them is evaluated as a separate thick slice or handled after
source ownership.

## Verification

The acceptance suite covers SSR-native markup, TypeScript 7, ownership
registry, verified bindings, theme parity, owned/consumer Nagi CSS, native
FormData/validation/reset/keyboard behavior, Combobox loading/empty/clear and
opened-state axe checks. The interactive specimen is `/forms.html`.

Final evidence: unit 124/124, browser + axe 51/51, TypeScript 7, verified
bindings, owned/consumer Nagi CSS and package tarball contents are green.
