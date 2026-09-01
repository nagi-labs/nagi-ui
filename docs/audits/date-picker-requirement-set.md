# `nagi/calendar@1` — DatePicker adoption audit

Audit date: 2026-09-01. DatePicker is a non-modal native Popover containing a
calendar grid. It is not an implementation of APG's modal Date Picker Dialog
example as a whole.

## Adopted boundary

`nagi/calendar@1` contains only the observable grid contract that matches the
Nagi implementation:

| Requirement | Adopted guarantee |
| --- | --- |
| `SEM-01` | A named `grid` contains `gridcell` elements with explicit selection state. |
| `SEM-02` | Selectable dates are accessible native buttons. |
| `INT-01` | Arrow, Home/End, and page navigation operate roving date focus. |
| `FOCUS-01` | At most one enabled date button participates in sequential focus. |

The set records WAI-ARIA 1.2, the APG Grid Pattern, and the APG Date Picker
Dialog Example as sources reviewed on 2026-09-01. The example is evidence for
the calendar interaction, not authority for Nagi's popup modality.

## Nagi differences

| Concern | Nagi policy |
| --- | --- |
| Surface | Native `popover` with `role="dialog"`; no `aria-modal`. |
| Field | Locale-ordered spinbutton segments plus one native ISO date form control. |
| State | Controlled date/open models remain authoritative. |
| Focus | Opening enters the calendar; selection and Escape restore the local invoker; light dismissal does not steal focus back. |
| Constraints | Field, calendar, and native form validity share min/max/unavailable policy. |

`nagi/popup@1` supplies the native surface, model synchronization, Escape, and
light-dismiss guarantees. Its model synchronization statement is explicitly a
versioned Nagi policy inside the shared set rather than being attributed to the
HTML Standard.

## Evidence boundary

The browser contract verifies package DatePicker semantics, all declared
anatomy parts, non-modal state, calendar focus entry, selection/Escape
restoration, open-model synchronization, and forced-colors focus visibility.
Node tests cover segmented editing, controlled rejection, constraint repair,
Home/End, and page navigation. The ShadowRoot fixture verifies that calendar
lookup and invoker restoration remain inside the local root.
