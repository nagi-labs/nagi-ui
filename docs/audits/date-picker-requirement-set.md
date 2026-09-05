# `nagi/calendar@1` — DatePicker adoption audit

Audit date: 2026-09-01. DatePicker is a non-modal native Popover containing a
calendar grid. It is not an implementation of APG's modal Date Picker Dialog
example as a whole.

## Adopted boundary

`nagi/calendar@1` contains only the observable grid contract that matches the
Nagi implementation:

| Requirement | Adopted guarantee                                                          |
| ----------- | -------------------------------------------------------------------------- |
| `SEM-01`    | A named `grid` contains `gridcell` elements with explicit selection state. |
| `SEM-02`    | Selectable dates are accessible native buttons.                            |
| `INT-01`    | Arrow, Home/End, and page navigation operate roving date focus.            |
| `FOCUS-01`  | At most one enabled date button participates in sequential focus.          |

The set records WAI-ARIA 1.2, the APG Grid Pattern, and the APG Date Picker
Dialog Example as sources reviewed on 2026-09-01. The example is evidence for
the calendar interaction, not authority for Nagi's popup modality.

## Nagi differences

| Concern     | Nagi policy                                                                                                             |
| ----------- | ----------------------------------------------------------------------------------------------------------------------- |
| Surface     | Native `popover` with `role="dialog"`; no `aria-modal`.                                                                 |
| Field       | Locale-ordered spinbutton segments plus one native ISO date form control.                                               |
| State       | Controlled date/open models remain authoritative.                                                                       |
| Focus       | Opening enters the calendar; selection and Escape restore the local invoker; light dismissal does not steal focus back. |
| Constraints | Field, calendar, and native form validity share min/max/unavailable policy.                                             |

`nagi/popup@1` supplies the native surface, model synchronization, Escape, and
light-dismiss guarantees. Its model synchronization statement is explicitly a
versioned Nagi policy inside the shared set rather than being attributed to the
HTML Standard.

## Evidence boundary

`nagi/date-picker@2` executes the same 15 Component Contract flows against the
package Blueprint and an owned `useDatePicker` template. Browser evidence now
includes segmented increment feeding the shared accepted value, provisional
Arrow/Home/End/PageUp/PageDown navigation that neither commits nor closes,
selection and Escape restoration, non-stealing light dismissal,
disabled external updates, read-only inspection, rejected controlled date/open
requests, external form association, constraints, and authored validation.

The package Implementation suite separately verifies native Popover, native
button/date-input choices, executable anatomy, and forced-colors focus. Node
tests retain lower-level arithmetic and repair coverage. The ShadowRoot fixture
verifies that calendar lookup and invoker restoration remain inside the local
root. Contract tests do not require replacement Implementations to use those
native mechanisms.

Repository verification on 2026-09-05 passed 482 Node tests and 290 Chromium
browser tests, including seven targeted DatePicker mutation probes added for
the revision 2 flows. Lint, typecheck, integration checks, Definition catalog
generation, and source audits also pass.
