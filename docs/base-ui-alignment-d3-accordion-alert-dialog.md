# Base UI alignment D3 — Accordion and Alert Dialog

Status: Complete (2026-07-22).

## Scope

This slice moves two strong three-reference candidates into the package and
ownership catalog without importing their compound APIs:

- Accordion becomes a flat items renderer over native `<details>`.
- Alert Dialog becomes a strict native modal Dialog Blueprint, not a visual
  Alert mode.

Both use the same canonical SFC for package consumption and `nagi-ui own`.

## Accordion contract

`AccordionItem` contains `key`, plain `summary`, optional plain `content`, and
optional `disabled`. Rich content replaces only the content of the owned
`<summary>` and panel wrappers through `summary` / `panel` slots; no behavior
props cross either slot.

`v-model:open-keys` is always a string array. Exclusive mode normalizes it to
at most one key and gives every native `<details>` the same generated `name`.
Multiple mode keeps the same model shape and omits `name`, allowing the browser
to keep several items open. `default-open-keys` initializes the uncontrolled
path. The component adds no `role="button"`, `aria-expanded`, Arrow-key state
machine, compound item family, or custom state attribute.

The summary slot must contain phrasing or heading content and must not add an
interactive descendant. A disabled summary remains focusable but suppresses
click, Enter, and Space activation.

## Alert Dialog contract

AlertDialog requires trigger, title, description, and action labels. The SFC
owns two explicit buttons: Cancel and Action. It exposes `action` and `cancel`
events plus `v-model:open`; `actionTone` is the small visible policy enum.
Title and description have same-name content-only slots inside the owned `h2`
and `p` wrappers.

The native `<dialog role="alertdialog">` is always modal and uses
`closedby="closerequest"`: Escape remains UA-owned while outside light dismiss
is rejected where the platform supports the attribute. Cancel receives
`autofocus`, so the destructive action is not the initial focus target. Both
buttons use native Invoker Commands with the existing fallback. A neutral
`footer` is used instead of `form method="dialog"`, avoiding invalid nested
forms when the consumer renders AlertDialog inside a form.

## Post-implementation SFC wiring audit

The deciding question was whether a source owner should normally edit each
line, not whether the line was short.

| Concern | Location | Reason |
|---|---|---|
| generated Accordion group name | package binding | collision avoidance is fixed mechanism |
| exclusive/multiple toggle ordering and model writes | package binding | UA event ordering is not product policy |
| disabled summary click/key suppression | package binding | fixed native interaction invariant |
| AlertDialog modal/dismiss options | package binding | component semantics are fixed, not an option mapping exercise |
| item key/disabled mapping and text fallbacks | SFC | owners extend the local schema and renderer together |
| action tone and action/cancel events | SFC | public component contract and visible policy |
| title/description IDREFs | SFC | visible markup relationships edited with the anatomy |
| DOM, slots and CSS | SFC | intended ownership surface |

The fixed bindings live in `@nagi-labs/nagi-ui/component-controls` and are not
copied by ordinary `own`. No new theme token was necessary; both components use
the existing 28-token contract without literal fallbacks.

## Verification contract

Unit and SSR coverage checks package exports, ownership registration, native
anatomy, one normalized exclusive initial item, multiple initial items, valid
alertdialog IDREFs, explicit close commands, slot wrappers, and verified
details/summary bindings.

Real-browser coverage checks:

- opening one exclusive item closes its peer without losing the new model key;
- multiple items remain independently open;
- disabled summaries remain focusable and ignore click/Enter;
- AlertDialog initially focuses Cancel;
- Cancel and Action close, update the model, fire once, and return focus;
- Escape closes through the UA without pretending to be a Cancel button event;
- the catalog remains axe-clean with Accordion open and AlertDialog modal;
- rendering AlertDialog inside a consumer form creates no nested form.

The resulting catalog has 27 shipped components: 27 / 37 (73.0%) in the Base
UI-aligned scope and 27 / 54 (50.0%) in the expanded cross-library scope.
