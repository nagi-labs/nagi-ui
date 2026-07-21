# Blueprint wiring exposure audit

Status: Reviewed (2026-07-21).

This audit applies the CHARTER §3.5 rule that Blueprint source should expose
what an owner is likely to change, not every browser/Vue synchronization
mechanism used to uphold the package contract. All components exported from
`@nagi-labs/nagi-ui/components` were reviewed; historical, unexported phase
fixtures were excluded.

## Extract now

Native form reset synchronization was repeated across Input, Select, Slider,
Checkbox, Switch and Radio. Its event timing, canceled-reset handling, form
owner rebinding, initial model capture and DOM-property repair are fixed
mechanisms rather than ownership customization surfaces. Small semantic
helpers now hide those mappings; Combobox keeps its explicit reset policy
because it coordinates two models, popup state and a next-tick text repair.

These helpers deliberately do not accept a `kind` option, conversion callbacks
or a generic config schema. A special reset policy is implemented by removing
the helper after ownership.

## Follow-up candidate

Tabs contains a local bridge between `defineModel` and the synchronously
writable selection passed to `useTabs`. This is a Vue model-proxy workaround,
not a likely customization surface. It should eventually move behind the Tabs
core contract, but not through a generic `useModelBridge`: changing it affects
controlled identity, SSR canonicalization and dynamic focus repair and should
be evaluated as its own tested slice.

## Keep visible

- Dropdown renderer functions translate Blueprint-local schema nodes into Menu
  options. Owners change these functions when extending the node union, so the
  mapping belongs beside the renderer.
- Toast item-removal focus repair queries the renderer's item/button DOM. An
  owner changing that DOM must see and update the dependency; hiding selectors
  in core would make ownership less safe.
- Combobox reset and custom validity coordinate the selected key, deliberately
  non-canonical input text, popup state and application-facing validation
  message. Those are component policy and common form-library integration
  change points.
- Button's focusable-disabled guard directly implements its public prop in a
  few lines. A helper would replace familiar event code with more Nagi-specific
  vocabulary without removing meaningful wiring.
- Generated ids, `defineExpose`, schema-to-class functions and straightforward
  composable option objects remain visible because they describe component
  anatomy or public policy rather than browser repair work.

## Styling is a separate boundary

Blueprint CSS uses `var(--nagi-color-focus-ring)` without a literal fallback.
Defaults live only in `default-theme.css`, so an omitted or incomplete theme is
detectable instead of silently receiving a plausible color. The public token
manifest, default theme and Blueprint references must remain identical; a
replacement theme is checked by `nagi-ui theme check`, and consumers may opt
into the computed-cascade development warning.

Direct literals have a different rule. A visual role becomes a public theme
token only after it repeats across at least two Blueprints; one-component
details remain local ownership surfaces. Historical unexported fixtures are
not part of the package theme contract.
