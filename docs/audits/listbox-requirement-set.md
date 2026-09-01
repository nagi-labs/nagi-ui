# Listbox Requirement-set audit

Audit date: 2026-09-01. Scope: the standalone Listbox and the popup listbox
inside Combobox.

## Result

`nagi/listbox` revision 1 contains only the observable ARIA semantics that both
components implement:

| Requirement | Shared guarantee |
| --- | --- |
| `SEM-01` | An accessibly named `listbox` contains `option` elements. |
| `SEM-02` | Every selectable option explicitly exposes its accessibility selection state with `aria-selected`. |
| `STATE-01` | `aria-multiselectable="true"` is present exactly for multiple selection. |

The set fixes reviewed provenance for WAI-ARIA 1.2 and the rolling APG Listbox
Pattern. It does not download or synchronize upstream prose at runtime.

## Deliberately not shared

Interaction and focus are not part of revision 1 because the two adopters make
different observable choices.

| Concern | Standalone Listbox | Combobox popup |
| --- | --- | --- |
| DOM focus | Remains on the listbox. | Remains on the editable input. |
| Active descendant owner | Listbox | Combobox input |
| Arrow navigation | May select in single mode according to Nagi's selection-follows-focus policy. | Moves a provisional suggestion without committing selection. |
| Commit | Selection follows the standalone Listbox mode. | Enter or pointer commits the provisional suggestion. |
| Popup | None | Native Popover with light dismissal. |

Moving these differences into one shared statement would produce conditional
prose rather than a concrete guarantee. They therefore remain in each final
Component Definition.

## Verification

The standalone Listbox Definition is `verified`: every statement and its
functional anatomy have repository evidence, and `vp run audit:definitions`
checks the paths and Requirement markers. Node and Playwright suites exercise
single and multiple selection, active descendant, dynamic collection, logical
orientation, and owned anatomy.

Combobox adopts the same revision with a `combobox-popup`/`single` profile. Its
existing contract now checks the popup listbox's accessible name, explicit
option selection states, and absence of `aria-multiselectable`, in addition to
Combobox-specific provisional selection and input-focus behavior. Combobox is
also `verified`: shared listbox semantics retain their Requirement-set origin,
component-specific APG/ARIA/HTML sources are pinned directly on the Definition,
and Nagi's optional interaction choices remain explicit versioned policies.
