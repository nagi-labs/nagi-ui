# Combobox and Dialog Definition audit

Audit baseline: 2026-08-31. This file fixes the acceptance boundary before the
Combobox and Dialog Definitions and shared browser contracts are implemented.
The objective is to evaluate the Definition method on popup, dynamic collection,
active-descendant, modal focus, and browser-owned state — not to make two more
green component pages.

Follow-up: Dialog and AlertDialog were migrated to two adoption configurations of the versioned
`nagi/dialog` revision 1 set and marked verified on 2026-09-01. The current
provenance split and additional `:modal`/dismissal probes are recorded in
[`dialog-requirement-set.md`](dialog-requirement-set.md). The original table
below remains the pre-implementation baseline against which that migration was
reviewed.

Dialog Component Contract revision 3 was audited on 2026-09-05. A controlled
fixture now rejects trigger-open and native-close requests, accepts external
open/close state, and verifies that the visible surface and focus repair to the
accepted state in both package and owned implementations. Deep Sea remains on
revision 2 pending the next package update.

Combobox revision 3 was audited on 2026-09-05. Its package and owned fixtures
now execute the same additional disabled, read-only, popup-boundary, IME,
pointer, and controlled-rejection flows. Deep Sea remains on revision 2 until
the next package update, so this follow-up does not claim replacement proof for
those added guarantees yet.

## Method gates

| Gate                    | Pass condition                                                                                                                    | Failure condition                                                                             |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Adopted requirement     | Every statement is classified as an adopted platform/APG requirement, a Nagi policy, or an implementation constraint.             | Current behavior is described as a requirement only because it already exists.                |
| Executable relationship | IDREFs resolve in the component's own rendered scope and are checked while state changes.                                         | Attributes are checked as isolated strings, or lookup relies on the global document.          |
| Time axis               | Open, active, selected, focus, and restored-focus states are observed before and after an action.                                 | A static DOM snapshot is presented as interaction evidence.                                   |
| Dynamic collection      | Removing the active option cannot leave a stale `aria-activedescendant`; committed selection is not silently pruned by filtering. | Only a fixed option list is tested.                                                           |
| Native ownership        | Popover and modal-dialog behavior remains delegated to native HTML where Nagi policy says it is browser-owned.                    | A test passes only because it accepts a custom imitation of native behavior.                  |
| Owned structure         | Package and owned markup run the same Definition anatomy and behavioral contract.                                                 | The owned example is merely a copy of canonical DOM, or the contract locates by a Nagi class. |
| Mutation sensitivity    | A representative break in semantics, state, interaction, focus, and anatomy fails at the intended assertion.                      | Mutations fail for unrelated setup errors or are not rejected.                                |

## Combobox requirements (baseline plus revision follow-ups)

`CMB-STATE-04` was added by revision 3 after the original baseline; the other
rows were fixed before the first implementation audit.

| ID               | Classification            | Requirement                                                                                                                                            | Intended evidence                         |
| ---------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| CMB-LBX-SEM-01   | conformant                | Adopted `nagi/listbox` revision 1: suggestions are exposed by an accessibly named listbox containing options.                                          | shared browser + Node                     |
| CMB-LBX-SEM-02   | conformant                | Adopted `nagi/listbox` revision 1: each selectable option explicitly exposes the popup listbox's accessibility selection state.                        | shared browser + Node                     |
| CMB-LBX-STATE-01 | conformant                | Adopted `nagi/listbox` revision 1: the single-select popup omits `aria-multiselectable`.                                                               | shared browser + Node                     |
| CMB-POP-SEM-01   | conformant                | Adopted `nagi/popup` revision 1: suggestions render in a native auto-popover surface.                                                                  | shared browser                            |
| CMB-POP-STATE-01 | intentional-extension     | Adopted `nagi/popup` revision 1: native visibility and the open model remain synchronized through the locally registered surface.                      | browser                                   |
| CMB-POP-INT-01   | conformant                | Adopted `nagi/popup` revision 1: Escape and light dismissal use native auto-popover behavior.                                                          | browser                                   |
| CMB-SEM-01       | conformant                | A labelled editable native input exposes `role="combobox"` and `aria-autocomplete="list"`.                                                             | shared browser + Node                     |
| CMB-SEM-02       | conformant                | `aria-expanded` follows the native Popover, and `aria-controls` resolves to the component's listbox.                                                   | shared browser                            |
| CMB-SEM-03       | conformant                | Disabled suggestions expose `aria-disabled` and cannot become active or committed.                                                                     | shared browser + Node                     |
| CMB-SEM-04       | conformant                | While an option is active, `aria-activedescendant` resolves to that option inside the controlled listbox; otherwise it is absent.                      | shared browser + mutation                 |
| CMB-STATE-01     | intentional-extension     | Editable text, provisional active option, and committed selection are distinct states. Filtering or navigation does not commit.                        | shared browser + Node                     |
| CMB-STATE-02     | conformant                | When a dynamic collection removes the active option, the active reference clears; filtering does not remove a committed selection.                     | shared browser + Node + mutation          |
| CMB-STATE-03     | conformant                | Native disabled blocks interaction; read-only remains inspectable but cannot edit, clear, or commit.                                                   | shared browser + Node                     |
| CMB-STATE-04     | intentional-extension     | Rejected controlled input or selection writes repair rendered state to the externally accepted values.                                                | shared browser                            |
| CMB-INT-01       | conformant                | Typing filters and opens suggestions without intercepting standard single-line editing or IME keys.                                                    | shared browser + Node                     |
| CMB-INT-02       | conformant                | Arrow keys move provisional activity through enabled options, with boundary and optional loop policy.                                                  | shared browser + Node                     |
| CMB-INT-03       | conformant                | Enter and pointer commit; Escape dismisses without committing provisional navigation.                                                                  | shared browser + Node                     |
| CMB-INT-04       | intentional-extension     | Suggestions use native Popover and browser-owned light dismissal; no Teleport is required.                                                             | shared browser + static source            |
| CMB-FOCUS-01     | conformant                | DOM focus remains on the input while `aria-activedescendant` identifies the active option; pointer selection does not first move focus into the popup. | shared browser + mutation                 |
| CMB-ANAT-01      | implementation-constraint | The scoped root contains input and popup; popup contains listbox; listbox contains repeated options. Intermediate layout wrappers are allowed.         | Definition anatomy on package + owned DOM |
| CMB-STYLE-01     | intentional-extension     | Active, disabled, popup, and forced-colors focus states remain visibly distinguishable.                                                                | shared browser + existing browser         |

## Dialog requirements fixed before implementation

| ID           | Classification            | Requirement                                                                                                                                                                                   | Intended evidence                         |
| ------------ | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| DLG-SEM-01   | conformant                | The surface is a native `<dialog>` with an accessible name supplied by its visible title.                                                                                                     | shared browser + SSR                      |
| DLG-SEM-02   | conformant                | A simple description, when present, is connected with `aria-describedby`.                                                                                                                     | shared browser                            |
| DLG-SEM-03   | intentional-extension     | Trigger and close actions are native buttons wired to the same dialog through Invoker Commands where supported and a local fallback otherwise.                                                | shared browser + Node                     |
| DLG-STATE-01 | intentional-extension     | The reactive model is the source of truth; native close/toggle transitions mirror back without echoing imperative writes.                                                                     | Node + shared browser                     |
| DLG-STATE-02 | conformant                | Modal is the default; explicit non-modal mode uses `show()` and omits invalid `show-modal` command wiring.                                                                                    | Node                                      |
| DLG-INT-01   | conformant                | The trigger opens the native surface; Escape, declared `closedby` policy, and the close action use native dialog transitions.                                                                 | shared browser + Node                     |
| DLG-FOCUS-01 | conformant                | Opening a modal places focus inside it and sequential focus cannot escape while open.                                                                                                         | shared browser                            |
| DLG-FOCUS-02 | conformant                | Closing by Escape or the close action restores focus to the invoking button.                                                                                                                  | shared browser + mutation                 |
| DLG-ANAT-01  | implementation-constraint | The scoped root contains trigger and native surface; surface contains title and close action, and may contain an optional description. Content order and intermediate wrappers are not fixed. | Definition anatomy on package + owned DOM |
| DLG-STYLE-01 | intentional-extension     | The modal surface has a visible backdrop, viewport-bounded width, and forced-colors-visible focus indicators.                                                                                 | shared browser                            |

## Pre-implementation findings

1. Combobox scroll reconciliation uses `document.getElementById` for the active
   option. It is globally scoped even though the behavior already owns a
   listbox, so it is not a valid basis for the scoped relationship requirement.
2. Dialog resolves its surface and fallback close target through `document`.
   The complete `dialogProps` bundle does not currently register the surface,
   so owned or ShadowRoot placement is unnecessarily fragile.
3. The package Dialog's public `id` is placed on its wrapper, while the Behavior
   API generates a separate native-surface ID. This initially looks like a
   duplicate-ID risk and must be verified before changing either destination.
4. Existing Dialog browser contracts exercise real timing and focus, but have
   no Definition, requirement-ID validation, or executable anatomy. Existing
   Combobox browser tests cover package behavior only.

These are audit findings, not accepted exceptions. Implementation changes and
the final result matrix are appended only after the probes run.

## Results

| Probe                                                 | Result                                                                         | Finding                                                                                                          |
| ----------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Package and structurally reordered owned Combobox     | accepted by one Definition and shared contract                                 | Layout depth is editable; scoped relationships and behavior remain fixed.                                        |
| Active option removed from the reactive collection    | accepted only after active IDREF clears                                        | Dynamic collection state is observable rather than inferred from a static snapshot.                              |
| Active IDREF deliberately points to a removed option  | rejected at `toHaveCount(1)` inside the controlled listbox                     | Global ID existence is not treated as sufficient.                                                                |
| DOM focus deliberately moved into an option           | rejected at the input-focus assertion                                          | The contract distinguishes active descendant from roving focus.                                                  |
| Package and reordered owned native Dialog             | accepted by one Definition and shared contract                                 | Content order is not frozen; native surface, naming, focus, and restoration are.                                 |
| Native Dialog replaced by `div role="dialog"`         | rejected at `instanceof HTMLDialogElement`                                     | ARIA cannot substitute for the adopted native platform mechanism.                                                |
| Close action deliberately restores a different target | rejected at the invoker-focus assertion                                        | The contract includes the close transition and its aftermath.                                                    |
| Rejected controlled Dialog open and native close      | keeps the accepted model authoritative and repairs the surface/focus           | `nagi/dialog@3` verifies both directions of the controlled visibility boundary against package and owned DOM.    |
| Package Dialog receives an explicit `id`              | one occurrence on the public root; native surface keeps a separate internal ID | The suspected duplicate-ID defect was disproved; changing the existing destination would have been a regression. |
| Combobox, Dialog, and Popover global rediscovery      | removed from their behavior paths                                              | Complete binding bundles register local input/listbox, trigger/surface, and native popup elements.               |
| Disabled package and owned Comboboxes                  | block user interaction but accept external state                               | Disabled is an interaction policy, not a prohibition on owner-controlled state updates.                          |
| Read-only package and owned Comboboxes                 | allow option inspection without editing or commit                              | Read-only differs observably from disabled while preserving the accepted value and selection.                    |
| IME composition in package and owned Comboboxes        | defers filtering and navigation until composition ends                         | Browser-owned composition is preserved by both Blueprint and owned wiring.                                       |
| Pointer activation of disabled and enabled options     | ignores disabled options, commits enabled options, and retains input focus      | Pointer handling preserves the active-descendant focus model.                                                     |
| Rejected controlled input and selection writes        | repairs both rendered implementations to their accepted owner state            | Controlled rejection is now part of `nagi/combobox@3`, rather than an inferred Vue implementation detail.        |

The original focused browser run contained 52 passing contracts and mutations,
including package and owned instances. The revision 3 Combobox runner now adds
six flows to both fixtures: its focused run passes 21 Component Contract and
Implementation tests. Repository verification on 2026-09-05 passed 481 Node
tests and 271 Chromium browser tests, plus lint, typecheck, Blueprint
integration lint, Definition generation, and source audits.

## Evaluation

The framework survived both new axes, but only because the audit forced it to
observe relationships and transitions rather than treating Definition prose as
proof. It found real global-scope and duplicate-ID defects. It also accepted
owned wrapper/order changes that did not violate a declared requirement.

The useful boundary is therefore still the whole vertical slice: audited
requirement IDs, a typed Definition, executable anatomy, relationship-aware
Node/browser assertions, and mutations. A Definition without those probes is a
manifest, not a guarantee.
