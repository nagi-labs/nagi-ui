# Expanded catalog small interactive slice

Status: Complete (2026-07-22).

This slice moves FileInput, Pagination and Rating from the adopted backlog into
the package/ownership catalog. It intentionally uses native controls and links
instead of adding an upload engine, router abstraction, pointer-only rating
widget or another focus state machine. The package now ships 37 of the 54
adopted slices (68.5%). The independent Base UI-aligned metric remains
27 / 37 (73.0%).

## Shipped components

| Component | Public contract | Deliberate boundary |
|---|---|---|
| `FileInput` | required label plus native `name`, `form`, `accept`, `multiple`, `disabled`, `required` and inner-control attributes | the visible native `input[type=file]` owns chooser state, `FileList`, submission, reset and same-file policy; no dropzone, upload transport, progress or storage SDK |
| `Pagination` | readonly flat items (`key`, `label`, optional `href` / `disabled`), required controlled `currentKey`, accessible label and `select` event | real links retain navigation; button items change the model; disabled links become inert text; fetching, URL construction and router components remain caller/adapter concerns |
| `Rating` | required localized numeric items, label/name, optional native form flags and `number \| null` model | same-name native radios own keyboard, focus, validation and submission; stars are presentation; no hover value, half-star, clear mode or custom roving focus |

## Native and controlled-state decisions

- FileInput has no Vue file model. `FileList` cannot be safely synthesized as a
  general two-way value and the browser already resets the control correctly.
  Consumer attributes and listeners visibly target the real input through
  `inheritAttrs: false` plus `v-bind="$attrs"`.
- Pagination does not infer page numbers or fetch data. An enabled `href` item
  is an anchor and its click is never prevented. An item without `href` is a
  native button and updates `currentKey`. An unknown controlled key displays no
  false `aria-current` state rather than silently repairing the caller model.
- Rating does not recreate radio keyboard behavior. The only bridge is
  `useNativeRadioGroupReset(inputs, model)`, a fixed two-argument helper that
  waits for native reset ordering and then restores the initial numeric model
  and checked member.
- In forced-colors mode Rating exposes the native radios and removes the star
  presentation, so selected and focused state remain platform-visible.

## SFC boundary audit

The final SFC review follows
[`blueprint-wiring-audit.md`](blueprint-wiring-audit.md): leave visible product
policy and DOM mapping in the owned SFC; hide only fixed browser/Vue mechanism.

- FileInput contains only props, native markup, attribute targeting and CSS.
- Pagination keeps its schema branches, current-item semantics and public event
  transformation visible because an owner may change navigation anatomy.
- Rating keeps its item loop, labels, radio markup and presentation visible.
  Reset event timing stays in the shared native helper.
- The three SFCs contain no watcher, lifecycle hook, direct DOM global,
  provider, Teleport, compound family, custom state vocabulary, color literal
  or theme-token fallback.

## Package and ownership integration

Every component is:

1. exported from `@nagi-labs/nagi-ui/components`;
2. registered in `nagi-ui own/list/diff` with the same SFC as its copy source;
3. declared as an opaque `n-<component-kebab>` boundary in the Nagi CSS
   consumer preset;
4. exercised through package imports at `/catalog.html` or `/forms.html`; and
5. covered by dedicated SSR/source tests, package-facade tests and real-browser
   behavior tests.

## Quality gates

The slice is accepted only after all of the following pass:

- dedicated SSR/source tests and native reset helper tests;
- package facade, ownership registry and preset parity tests;
- TypeScript 7 typecheck and repository integration lint;
- canonical Blueprint and opaque-consumer Nagi CSS checks;
- Chromium keyboard, FormData, reset, forced-colors and no-exclusion axe tests;
- package tarball inspection proving all three source SFCs are shipped; and
- a final diff audit for SFC mechanism leakage, literal colors and token
  fallback.

Final verification: unit/SSR/source **208 / 208**, Chromium behavior + axe
**78 / 78**, TypeScript 7, repository integration lint, canonical and consumer
Nagi CSS, and package tarball inspection are all green. During the full-browser
gate, the themed Dropdown demo also exposed a pre-existing borderline shortcut
contrast state; its local theme now supplies a matching muted-text token and
the affected axe case passes three consecutive runs.
