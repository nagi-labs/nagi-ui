# Phase 3 (slice 3) — Select delegation decision

Status: Complete (2026-07-18). This slice is an architecture decision, not a
new behavior implementation.

## Decision

Nagi UI delegates Select behavior to the native `<select>` element.

- The stable path is ordinary `<select>` / `<option>` markup. The browser owns
  keyboard interaction, focus, screen-reader semantics, form submission,
  validation, and `input` / `change` events.
- Nagi UI does not add `useSelect` and does not derive Select from
  `useCombobox`. Reimplementing native Select for visual parity would duplicate
  the exact state machine this project is designed to delegate.
- `appearance: base-select` may be used as progressive enhancement. A browser
  that does not support it must retain a functional native Select.
- `<selectedcontent>`, a first-child `<button>`, and rich descendants inside
  `<option>` are not part of a stable Nagi Blueprint yet.

This separates three different maturity levels that must not be collapsed
into one "customizable Select supported" claim:

1. native Select behavior — stable and adopted;
2. `appearance: base-select` styling — optional enhancement;
3. `<selectedcontent>` and rich option DOM — monitored, not adopted.

## Evidence

### Platform status

`<selectedcontent>` is present in the WHATWG HTML Living Standard, and
`appearance: base-select` is specified in CSS UI Level 4. Chrome shipped the
customizable Select work in Chrome 135. WebKit has a supportive standards
position and Safari 27 beta implements the feature.

That does not make the complete surface interoperable yet. Firefox landed
partial `base-select` support behind preferences; picker styling remains
incomplete. Mozilla is positive about customizable Select as a direction but
neutral on `<selectedcontent>` specifically. Its concern is the DOM-cloning
model: one parsed `<option>` can result in an additional cloned option subtree,
weakening normal parse/serialize round-trip assumptions.

The likely durable direction is therefore native customizable Select. The
specific `<selectedcontent>` contract still has meaningful change risk.

### Vue SFC status

The repository currently resolves Vue 3.5.39. A direct compiler probe found
that a raw `<selectedcontent>` template node is compiled as a Vue component,
not a native element. Vue also warns that `<button>` cannot be a child of
`<select>` and that rich descendants cannot be children of `<option>`.

`compilerOptions.isCustomElement` can force the element classification, but it
does not update the nesting validation and would require every copy-in consumer
to change global build configuration. That is not an acceptable Blueprint
contract. Vue has open issues and an open compiler PR for this support; Nagi
must wait for a released framework fix rather than embed a local workaround.

### Local browser probe

A temporary Playwright probe against Chromium 149 verified the browser-side
model independently of Vue template compilation:

- `appearance: base-select`, `::picker(select)`, `::picker-icon`,
  `::checkmark`, `:open`, and `HTMLSelectedContentElement` were exposed;
- Space opened the picker and ArrowDown + Enter committed an option;
- `input` and `change` fired, FormData reflected the value, and `required`
  validity changed correctly;
- `<selectedcontent>` cloned the selected option content;
- hand-authored render-function SSR hydrated without a Vue mismatch and the
  selected content continued updating.

The platform behavior is viable. The current blockers are framework-native SFC
support and cross-engine rollout, not a need for a Nagi state machine.

## Graduation gates for `<selectedcontent>`

All of the following must be true before a stable Blueprint uses it:

1. A released Vue compiler recognizes `<selectedcontent>` as native and accepts
   the current customizable Select nesting without consumer configuration.
2. Blink, WebKit, and Gecko expose the required behavior in stable releases,
   without user preferences.
3. Browser coverage verifies keyboard selection, focus, form reset/submission,
   validation, disabled options, long labels, RTL, forced colors, and mobile
   picker behavior.
4. Vue SSR and hydration coverage uses an actual SFC, including reactive option
   replacement and selected-value updates.
5. Unsupported or older browsers still receive a functional native Select.

Until then, a Blueprint that is needed for product coverage should render
text-only native options. Styling may enhance the control under
`@supports (appearance: base-select)`, but correctness and content must not
depend on the enhanced picker.

## Primary references

- [WHATWG HTML — `selectedcontent`](https://html.spec.whatwg.org/multipage/form-elements.html#the-selectedcontent-element)
- [CSS UI Level 4 — `appearance: base-select`](https://drafts.csswg.org/css-ui-4/#valdef-appearance-base-select)
- [Chrome 135 customizable Select shipping article](https://developer.chrome.com/blog/a-customizable-select)
- [WebKit standards position](https://github.com/WebKit/standards-positions/issues/386)
- [Safari 27 beta implementation](https://webkit.org/blog/17967/news-from-wwdc26-webkit-in-safari-27-beta/)
- [Mozilla position on customizable Select](https://github.com/mozilla/standards-positions/issues/1060)
- [Mozilla position on `selectedcontent`](https://github.com/mozilla/standards-positions/issues/1142)
- [Vue issue: customizable Select elements not supported](https://github.com/vuejs/core/issues/13778)
- [Vue compiler support PR](https://github.com/vuejs/core/pull/13779)
