# Button specification audit

Audit baseline: 2026-08-31. This matrix defines the Button contract applied to
its Definition, Behavior API, visible Blueprint, and executable evidence.

This matrix is an authoring audit and component-level reference, not a second
source of truth beside the tests. During the test-catalog migration, its rows
become Component Contract or Implementation test registrations and the site Definition is
generated from those registrations. The external source revisions below
document this audit's historical review; they are not repeated on every test.

## Adopted foundation

Button Definition 3.0 resolves Nagi's renderer-independent `nagi/button`
revision 2 Component Contract with the `nagi/blueprint/button` revision 1
platform-first Implementation. The Requirement set is Nagi-owned; the
external documents below are reviewed provenance and are never fetched or
synchronized at runtime.

| Source                                                                                                                    | Upstream revision                  | Reviewed   | Role in Button                                    |
| ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ---------- | ------------------------------------------------- |
| [HTML Living Standard — The button element](https://html.spec.whatwg.org/multipage/form-elements.html#the-button-element) | Living Standard snapshot           | 2026-09-02 | Default Blueprint's native implementation choice  |
| [Accessible Name and Description Computation 1.1](https://www.w3.org/TR/2018/REC-accname-1.1-20181218/)                   | W3C Recommendation 1.1, 2018-12-18 | 2026-09-02 | Portable accessible-name foundation               |
| [WAI-ARIA APG Button Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/)                                           | Rolling guidance snapshot          | 2026-09-02 | Portable Button semantics and activation guidance |

The adopted Requirement-set choices fix button semantics, accessible naming,
perceivable inoperability, and click/Enter/Space activation without fixing the
renderer. `BTN-SEM-01`, `BTN-STATE-01`, and `BTN-INT-01` are expanded from that
set. The Implementation separately fixes `element: button`,
browser-owned activation, native disabled by default, and persistent presence.
A future upstream change requires review and a new local Requirement-set
version; it does not mutate this Definition automatically.

## Responsibility boundary

Button uses the native HTML button as its platform implementation. Nagi does
not replace native activation or focus behavior.

| Layer                      | Responsibility                                                                                                                                                                        |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Definition                 | Observable semantics, state, interaction, focus, anatomy, and style requirements.                                                                                                     |
| Behavior API (`useButton`) | The mutually consistent native-disabled and focusable-disabled representations, including capture-phase activation suppression.                                                       |
| Blueprint                  | The native `button`, binding destination, explicit `type`, consumer-attribute/event composition, default slot, part attributes, and CSS consumption of compiled style-axis variables. |
| Style compiler             | Validate finite CSS-axis keywords and expand each literal declaration into its owned private variables without changing DOM.                                                          |
| Web platform               | Enabled activation, native disabled behavior, keyboard focus, form submission/reset, and implicit button semantics.                                                                   |

`buttonProps` is the complete behavior binding for its one destination. Button
needs no element registration, so unlike Carousel its bundle has no Vue ref.
The Blueprint may merge the bundle with consumer attributes and its explicit
native type, but it must not restate `disabled`, `aria-disabled`, or the capture
handler as separate template bindings.

## Acceptance matrix

| ID           | Classification            | Requirement or policy                                                                                                                                                                                                                                                                                                                                    | Implementation target                         | Evidence                                         |
| ------------ | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------ |
| BTN-SEM-01   | conformant                | Expose button semantics with a content- or attribute-derived accessible name.                                                                                                                                                                                                                                                                            | Portable contract                             | SSR and browser anatomy/name tests               |
| BTN-SEM-02   | implementation-constraint | The default Blueprint renders a native button and emits an explicit type, defaulting to `button`.                                                                                                                                                                                                                                                        | Blueprint prop default and protected merge    | SSR and source wiring tests                      |
| BTN-STATE-01 | conformant                | Disabled state remains perceivable and unavailable for activation.                                                                                                                                                                                                                                                                                       | Portable contract                             | Node and SSR tests                               |
| BTN-STATE-02 | intentional-extension     | Focusable-disabled state omits native `disabled`, emits `aria-disabled="true"`, remains reachable, and does not activate.                                                                                                                                                                                                                                | `useButton().buttonProps`                     | Node and browser tests                           |
| BTN-INT-01   | conformant                | Enabled pointer, Enter, and Space activate the Button.                                                                                                                                                                                                                                                                                                   | Portable contract                             | Node and browser tests                           |
| BTN-INT-02   | intentional-extension     | Focusable-disabled activation is canceled before consumer handlers run.                                                                                                                                                                                                                                                                                  | `onClickCapture` in the native Implementation | Node and browser tests                           |
| BTN-INT-03   | implementation-constraint | The default Blueprint's behavior props, consumer attributes, explicit type, and events reach the same native destination.                                                                                                                                                                                                                                | `mergeElementProps`; Blueprint emits          | source and SSR tests                             |
| BTN-FOCUS-01 | intentional-extension     | Nagi chooses not to move, trap, or restore focus; `focusableWhenDisabled` deliberately remains reachable.                                                                                                                                                                                                                                                | no authored focus movement                    | browser test                                     |
| BTN-ANAT-01  | implementation-constraint | The native behavior destination is explicitly identified by `data-scope="button" data-part="root"`; no internal part is required.                                                                                                                                                                                                                        | Blueprint and `buttonDefinition.anatomy`      | anatomy, SSR, and source wiring tests            |
| BTN-STYLE-01 | intentional-extension     | Four independent CSS axes form the visual contract: tone (`neutral`, `accent`, `danger`), appearance (`outlined`, `solid`, `ghost`), shape (`square`, `rounded`, `pill`), and size (`small`, `medium`, `large`). Defaults are `neutral`, `outlined`, `rounded`, and `medium`.                                                                            | `nagiStyleAxes`; Blueprint CSS                | compiler and browser computed-style tests        |
| BTN-STYLE-02 | intentional-extension     | Forced-colors mode retains a visible system-color focus indicator.                                                                                                                                                                                                                                                                                       | Blueprint forced-colors rule                  | browser computed-style test                      |
| BTN-STYLE-03 | implementation-constraint | A literal public axis declaration is preserved and expanded at build time. Each axis writes only its declared private variables, so axes compose without a cross-product, DOM style attributes, variant attributes, or generated modifier classes. Dynamic or inherited values that cannot be resolved at build time are outside this fallback contract. | `nagiStyleCompiler`; Button consumer CSS      | compiler, SSR, and source tests                  |
| BTN-STYLE-04 | implementation-constraint | Public axes and generated private outputs are non-inheriting. Axis declarations target the package `.n-button` boundary or an owned `[data-scope="button"][data-part="root"]`, never an ancestor.                                                                                                                                                        | `style-axes.css`; Button consumer CSS         | compiler rejection and browser inheritance tests |

## Style-axis ownership

| Public axis           | Default    | Accepted values               | Private variables owned by the axis                                                                  |
| --------------------- | ---------- | ----------------------------- | ---------------------------------------------------------------------------------------------------- |
| `--button-tone`       | `neutral`  | `neutral`, `accent`, `danger` | `--_button-tone-color`, `--_button-tone-border`, `--_button-tone-surface`, `--_button-tone-contrast` |
| `--button-appearance` | `outlined` | `outlined`, `solid`, `ghost`  | `--_button-background`, `--_button-border-color`, `--_button-color`, `--_button-hover-background`    |
| `--button-shape`      | `rounded`  | `square`, `rounded`, `pill`   | `--_button-radius`                                                                                   |
| `--button-size`       | `medium`   | `small`, `medium`, `large`    | `--_button-min-block-size`, `--_button-padding`, `--_button-font-size`                               |

Tone supplies palette values. Appearance consumes those palette values. Shape
and size own disjoint geometry values. An axis must not start writing another
axis's private variables; this is the rule that keeps combinations composable.

## Completion rule

The contract passes only when every matrix guarantee has a registered
assertion, Anatomy resolves the scoped root part, every style axis and
private-variable owner agrees with `nagiStyleAxes`, the Blueprint exposes one
merged binding destination without inline behavior reimplementation, and Node,
browser, type, lint, integration, and static-site checks pass. A compatibility
Definition entry or evidence path alone does not satisfy the row.
