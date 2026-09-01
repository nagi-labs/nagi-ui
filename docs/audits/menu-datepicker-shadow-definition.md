# Menu, DatePicker, and ShadowRoot Definition pre-audit

Status: requirements fixed before implementation. Results are appended only
after the contracts and negative probes have run.

This audit is the final stress slice before deciding whether Component
Definitions can be produced for the remaining catalog in batches. It adds two
component shapes that the Button, Carousel, Combobox, and Dialog pilots do not
cover:

- a nested popup tree whose focus owner moves between parent and child menus;
- a composed field, popup, and dynamic grid that also participates in a native
  form.

ShadowRoot is a cross-cutting environment test, not a separate component
Definition. It checks whether complete binding bundles really establish local
element ownership or merely hide document-global rediscovery.

## Acceptance rule

Do not weaken a requirement, add a global selector, or freeze optional layout
to make a fixture pass. A failed probe must be classified as one of:

1. an implementation defect;
2. a missing but generally useful Definition primitive;
3. a product boundary that Nagi does not support.

Menu, DatePicker, and their contracts may use IDs for ARIA relationships, but
behavior must act on registered elements or descendants of a registered local
container. CSS classes and accessible-name strings are never anatomy locators.

## DropdownMenu requirements fixed before implementation

| ID | Classification | Observable requirement | Planned evidence |
|---|---|---|---|
| MNU-SEM-01 | conformant | A native button names and controls the root `menu`, exposes `aria-haspopup="menu"`, and reflects native popup visibility through `aria-expanded`. | shared browser contract; Node behavior tests |
| MNU-SEM-02 | conformant | The menu is labelled by its invoker and contains `menuitem`, `menuitemcheckbox`, or `menuitemradio` choices with their declared disabled/checked states. | shared browser contract; existing menu tests |
| MNU-SEM-03 | conformant | Every submenu trigger exposes `aria-haspopup`, controls exactly one child menu, and keeps `aria-expanded` synchronized with that child. | shared browser contract; rejection probe |
| MNU-STATE-01 | conformant | Dynamic item removal or disabling cannot leave an inoperable active item; an open menu repairs its focus owner locally. | Node behavior tests |
| MNU-STATE-02 | intentional-extension | If a controlled owner rejects a submenu close, the visible child remains open and retains a valid focus owner. | existing browser and Node tests |
| MNU-INT-01 | conformant | Pointer, Enter, Space, and optional ArrowUp/ArrowDown opening paths enter the root menu at the declared boundary. | shared browser contract; existing tests |
| MNU-INT-02 | conformant | ArrowUp/ArrowDown, Home/End, and typeahead move through the current menu without activating disabled items. | shared browser contract; Node tests |
| MNU-INT-03 | conformant | The logical inline-end arrow opens a child menu; the opposite arrow and Escape close only that child. RTL reverses the arrows. | shared browser contract; existing browser tests |
| MNU-INT-04 | intentional-extension | An action closes the complete tree, while checkbox and radio actions default to keeping it open. | shared browser contract; existing browser tests |
| MNU-FOCUS-01 | conformant | DOM focus is placed on actual menu items, not represented only by a state attribute on the menu container. | shared browser contract; rejection probe |
| MNU-FOCUS-02 | conformant | Closing a child restores its parent item; closing the tree after action or Escape restores the root invoker. | shared browser contract; ShadowRoot contract |
| MNU-ANAT-01 | implementation-constraint | The owned root contains one root invoker and root menu; repeated submenu invokers and child menus remain inside that scope, without requiring a fixed wrapper depth. | executable anatomy; package/owned fixtures |
| MNU-STYLE-01 | intentional-extension | Focused, expanded, checked, and disabled states remain visibly distinguishable, including forced colors. | package browser contract |

## DatePicker requirements fixed before implementation

Nagi's DatePicker is deliberately a non-modal native Popover with a
`role="dialog"` calendar, not the modal APG example. The Definition must state
that difference rather than claiming modal focus containment.

| ID | Classification | Observable requirement | Planned evidence |
|---|---|---|---|
| DTP-SEM-01 | conformant | A labelled segmented field exposes date segments as spinbuttons and submits one native ISO date form value. | shared browser contract; existing Node tests |
| DTP-SEM-02 | intentional-extension | A native button controls a named non-modal native Popover whose surface has `role="dialog"`. | shared browser contract |
| DTP-SEM-03 | conformant | The popup contains a labelled calendar grid whose cells expose selected, disabled, and unavailable date policy through native buttons and ARIA. | shared browser contract; existing calendar tests |
| DTP-STATE-01 | intentional-extension | Controlled date and open models remain authoritative; accepted calendar selection updates the ISO value and closes the popup. | shared browser contract; existing tests |
| DTP-STATE-02 | conformant | Min, max, unavailable, required, and explicit invalid inputs remain consistent across segmented field, calendar, and native form validity. | existing Node/browser tests |
| DTP-INT-01 | conformant | Segment editing preserves locale order and ordinary text-entry behavior while producing an ISO model. | existing Node/browser tests |
| DTP-INT-02 | conformant | The trigger opens the popup; calendar arrows, Home/End, PageUp/PageDown, and month buttons operate the grid without a second focus model. | shared browser contract; existing calendar tests |
| DTP-INT-03 | conformant | Activating an available day selects it and closes the popup; Escape closes without changing the accepted date. | shared browser contract; rejection probe |
| DTP-FOCUS-01 | conformant | Opening places focus on the selected date or the calendar's declared fallback date. | shared browser contract |
| DTP-FOCUS-02 | conformant | Selection or Escape restores the invoking button, while light dismissal to another control does not steal focus back. | shared browser contract; ShadowRoot contract; rejection probe |
| DTP-ANAT-01 | implementation-constraint | The owned root scopes one segmented field, trigger, native form control, popup dialog, calendar grid, and repeated day controls; optional layout wrappers do not change those relationships. | executable anatomy; package/owned fixtures |
| DTP-STYLE-01 | intentional-extension | Segment focus, grid focus, selected dates, invalid state, and forced-colors indicators remain visible. | package browser contract |

## ShadowRoot requirements fixed before implementation

| ID | Observable requirement |
|---|---|
| SHD-01 | Combobox `aria-controls` and `aria-activedescendant` resolve inside its own ShadowRoot, and navigation never selects an option from another root. |
| SHD-02 | Dialog opens, contains focus, closes, and restores its invoker inside the same ShadowRoot. |
| SHD-03 | A nested menu enters and exits a child popup and restores both parent-item and root-trigger focus without a document-global lookup. |
| SHD-04 | DatePicker opens on its selected date and restores its own trigger after selection or Escape without stealing focus after light dismissal. |
| SHD-05 | Equivalent components in separate roots may coexist without cross-root behavior even when their visible labels are similar. |

## Pre-implementation findings

The pre-audit found real document-global dependencies before adding the new
contracts:

- `menu.ts` resolves an active item through `menuElement.ownerDocument` and the
  root invoker through global `document` ID lookup;
- `date-picker.ts` resolves its popup by global ID and scans every
  `[popovertarget]` in `document` after close.

These are implementation defects under the acceptance rule. `usePopover`
already receives complete Vue ref bindings for its trigger and surface, so the
least-general repair is to expose local focus restoration from that registered
pair and to resolve Menu items only below the registered menu element.

## Results

Pending implementation and negative probes.
