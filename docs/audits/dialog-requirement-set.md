# Dialog Requirement-set audit

Audit baseline: 2026-09-01; modal-profile review: 2026-09-02. This audit records
why Dialog and AlertDialog adopt different fixed choices from the native
`nagi/dialog` Requirement set revision 2. Revision 1 remains the historical
configurable snapshot. The Requirement set belongs to their native Implementations; it is not the
   portable `nagi/dialog@2` Component Contract identity.

## Adopted sources

| Source                                         | Local revision                               | Used for                                                                                         |
| ---------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| HTML Living Standard, `dialog`                 | Living Standard snapshot reviewed 2026-09-01 | native surface, `showModal()`/`show()`, Invoker Commands, close requests, focus restoration      |
| WAI-ARIA APG Dialog (Modal) Pattern            | rolling snapshot reviewed 2026-09-01         | naming, optional concise description, modal focus entry/containment, Escape, invoker restoration |
| WAI-ARIA APG Alert and Message Dialogs Pattern | rolling snapshot reviewed 2026-09-01         | the stricter role and required-message choices reserved for AlertDialog                          |

The sources are review provenance, not runtime dependencies. Revision 1 remains
unchanged until Nagi deliberately reviews and publishes a later local revision.

## Implementation boundary

Dialog adopts:

```text
role: dialog
modality: modal-only
description: optional-simple
dismissal: light-dismiss-any
```

AlertDialog adopts the same platform boundary with:

```text
role: alertdialog
modality: modal-only
description: required-message
dismissal: close-request-only
```

Both shipped Blueprints are modal-only. Dialog fixes native `closedby="any"`,
while AlertDialog fixes close-request-only dismissal. Non-modal `show()` and
other dismissal policies remain capabilities of the low-level `useDialog`
Behavior API; they are not claims made by either Blueprint Definition.

The second choice set supplies the shared platform boundary. AlertDialog layers
its destructive-decision actions and least-destructive initial focus above it
as component-specific Nagi policies.

## Provenance split

| Requirements                                                                             | Origin                             | Reason                                                                                                 |
| ---------------------------------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `DLG-SEM-01`, `DLG-SEM-02`, `DLG-STATE-02`, `DLG-INT-01`, `DLG-FOCUS-01`, `DLG-FOCUS-02` | adopted standards                  | observable native and APG dialog boundary                                                              |
| `DLG-SEM-03`                                                                             | `native-dialog-local-invocation@1` | Nagi chooses Invoker Commands plus a same-root fallback instead of document-global rediscovery         |
| `DLG-STATE-01`                                                                           | `native-dialog-model-sync@1`       | Vue model synchronization is Nagi integration policy, not an HTML or APG requirement                   |
| `DLG-ANAT-01`                                                                            | executable anatomy                 | owned root contains the registered invoker and surface without freezing wrapper depth or content order |
| `DLG-STYLE-01`                                                                           | `dialog-functional-presentation@1` | backdrop, viewport bounds, and forced-colors focus are Nagi presentation guarantees                    |

AlertDialog resolves the shared rows as `ALD-DIALOG-*`, then adds
`ALD-INT-01`, `ALD-FOCUS-01`, `ALD-ANAT-01`, and `ALD-STYLE-01`. This keeps the
platform guarantees visibly shared while preserving the critical-decision
differences.

## Executable result

The shared browser contract runs against both the package Blueprint and a
structurally reordered owned implementation. It verifies:

- a named native `HTMLDialogElement` and executable anatomy;
- actual `:modal` state rather than only the `open` attribute;
- model synchronization after native transitions;
- modal focus entry and sequential focus containment;
- Escape, visible close action, and `closedby="any"` light dismissal;
- invoker restoration after every declared close path;
- visible backdrop, viewport bounds, and forced-colors focus for the package;
- restoration inside a ShadowRoot;
- rejection of a role-equivalent non-native surface and redirected restoration.

Node tests separately verify the low-level Behavior API's non-modal `show()`
capability, Invoker Command fallback, same-root close lookup, and idempotent
model application. Those tests do not add non-modal behavior to the shipped
Blueprint Contract.

The AlertDialog adoption runs the same native Requirement set against package and owned DOM.
It additionally verifies its required description, cancel-first focus,
close-request-only resistance to backdrop clicks, and both explicit actions. A
mutation removing `aria-describedby` is rejected even though the visible
warning text remains in the DOM.
