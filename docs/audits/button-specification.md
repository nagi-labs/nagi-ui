# Button specification audit

Audit baseline: 2026-08-31. This matrix defines the Button contract applied to
its Definition, Behavior API, visible Blueprint, and executable evidence.

## Adopted foundation

Button Definition 2.0 is authored from Nagi's immutable `nagi/button` revision 1
Requirement set plus Button-specific Nagi policies. The set is Nagi-owned; the
external documents below are reviewed provenance and are never fetched or
synchronized at runtime.

| Source | Upstream revision | Reviewed | Role in Button |
| --- | --- | --- | --- |
| [HTML Living Standard — The button element](https://html.spec.whatwg.org/multipage/form-elements.html#the-button-element) | Living Standard snapshot | 2026-08-31 | Native element, disabled state, and browser activation foundation |
| [Accessible Name and Description Computation 1.1](https://www.w3.org/TR/2018/REC-accname-1.1-20181218/) | W3C Recommendation 1.1, 2018-12-18 | 2026-08-31 | Accessible-name computation foundation |
| [WAI-ARIA APG Button Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/) | Rolling guidance snapshot | 2026-08-31 | Expected Enter and Space interaction guidance |

The adopted profile fixes `element: button`, native accessible naming, native
disabled behavior, and browser-owned activation. `BTN-SEM-01`, `BTN-STATE-01`,
and `BTN-INT-01` are expanded from that set. Every other matrix entry is a Nagi
policy or implementation constraint. A future upstream change requires a
review, new evidence where necessary, and a new local Requirement-set version;
it does not mutate this Definition automatically.

## Responsibility boundary

Button uses the native HTML button as its platform implementation. Nagi does
not replace native activation or focus behavior.

| Layer | Responsibility |
| --- | --- |
| Definition | Observable semantics, state, interaction, focus, anatomy, and style requirements. |
| Behavior API (`useButton`) | The mutually consistent native-disabled and focusable-disabled representations, including capture-phase activation suppression. |
| Blueprint | The native `button`, binding destination, explicit `type`, consumer-attribute/event composition, default slot, part attributes, and CSS consumption of compiled style-axis variables. |
| Style compiler | Validate finite CSS-axis keywords and expand each literal declaration into its owned private variables without changing DOM. |
| Web platform | Enabled activation, native disabled behavior, keyboard focus, form submission/reset, and implicit button semantics. |

`buttonProps` is the complete behavior binding for its one destination. Button
needs no element registration, so unlike Carousel its bundle has no Vue ref.
The Blueprint may merge the bundle with consumer attributes and its explicit
native type, but it must not restate `disabled`, `aria-disabled`, or the capture
handler as separate template bindings.

## Acceptance matrix

| ID | Classification | Requirement or policy | Implementation target | Evidence |
| --- | --- | --- | --- | --- |
| BTN-SEM-01 | conformant | Render one native button with implicit role and a content- or attribute-derived accessible name. | Blueprint root and slot | SSR and browser anatomy/name tests |
| BTN-SEM-02 | intentional-extension | Always emit an explicit native button type, defaulting to `button`. | Blueprint prop default and protected merge | SSR and source wiring tests |
| BTN-STATE-01 | conformant | Ordinary disabled state uses native `disabled`. | `buttonProps.disabled` | Node and SSR tests |
| BTN-STATE-02 | intentional-extension | Focusable-disabled state omits native `disabled`, emits `aria-disabled="true"`, remains reachable, and does not activate. | `buttonProps`; `useFocusableDisabled` | Node and browser tests |
| BTN-INT-01 | conformant | Enabled pointer, Enter, and Space activation remain native. | no authored activation state machine | Node and browser tests |
| BTN-INT-02 | intentional-extension | Focusable-disabled activation is canceled in the capture phase before consumer handlers. | `onClickCapture` | Node and browser tests |
| BTN-INT-03 | intentional-extension | Behavior props, consumer attributes, explicit type, and declared events reach the same native destination without overriding behavior invariants. | `mergeElementProps`; Blueprint emits | source and SSR tests |
| BTN-FOCUS-01 | intentional-extension | Nagi chooses not to move, trap, or restore focus; `focusableWhenDisabled` deliberately remains reachable. | no authored focus movement | browser test |
| BTN-ANAT-01 | implementation-constraint | The native behavior destination is explicitly identified by `data-scope="button" data-part="root"`; no internal part is required. | Blueprint and `buttonDefinition.anatomy` | anatomy, SSR, and source wiring tests |
| BTN-STYLE-01 | intentional-extension | Four independent CSS axes form the visual contract: tone (`neutral`, `accent`, `danger`), appearance (`outlined`, `solid`, `ghost`), shape (`square`, `rounded`, `pill`), and size (`small`, `medium`, `large`). Defaults are `neutral`, `outlined`, `rounded`, and `medium`. | `nagiStyleAxes`; Blueprint CSS | compiler and browser computed-style tests |
| BTN-STYLE-02 | intentional-extension | Forced-colors mode retains a visible system-color focus indicator. | Blueprint forced-colors rule | browser computed-style test |
| BTN-STYLE-03 | implementation-constraint | A literal public axis declaration is preserved and expanded at build time. Each axis writes only its declared private variables, so axes compose without a cross-product, DOM style attributes, variant attributes, or generated modifier classes. Dynamic or inherited values that cannot be resolved at build time are outside this fallback contract. | `nagiStyleCompiler`; Button consumer CSS | compiler, SSR, and source tests |
| BTN-STYLE-04 | implementation-constraint | Public axes and generated private outputs are non-inheriting. Axis declarations target the package `.n-button` boundary or an owned `[data-scope="button"][data-part="root"]`, never an ancestor. | `style-axes.css`; Button consumer CSS | compiler rejection and browser inheritance tests |

## Style-axis ownership

| Public axis | Default | Accepted values | Private variables owned by the axis |
| --- | --- | --- | --- |
| `--button-tone` | `neutral` | `neutral`, `accent`, `danger` | `--_button-tone-color`, `--_button-tone-border`, `--_button-tone-surface`, `--_button-tone-contrast` |
| `--button-appearance` | `outlined` | `outlined`, `solid`, `ghost` | `--_button-background`, `--_button-border-color`, `--_button-color`, `--_button-hover-background` |
| `--button-shape` | `rounded` | `square`, `rounded`, `pill` | `--_button-radius` |
| `--button-size` | `medium` | `small`, `medium`, `large` | `--_button-min-block-size`, `--_button-padding`, `--_button-font-size` |

Tone supplies palette values. Appearance consumes those palette values. Shape
and size own disjoint geometry values. An axis must not start writing another
axis's private variables; this is the rule that keeps combinations composable.

## Completion rule

The contract passes only when every non-anatomy matrix ID appears in the typed
Definition with named evidence, Anatomy resolves the scoped root part, every
style axis and private-variable owner agrees with `nagiStyleAxes`, the
Blueprint exposes one merged binding destination without inline behavior
reimplementation, and Node, browser, type, lint, integration, and static-site
checks pass.
