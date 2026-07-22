# Expanded catalog interaction slice 2

Status: Shipped (2026-07-22).

This slice adds PreviewCard, RangeSlider, and Stepper as components 41–43.
They close three visually familiar requests without turning Popover, Slider, or
Tabs into multi-mode APIs. The package now ships 43 of the 54 adopted slices
(79.6%).

## Product contracts

| Component | Public shape | Browser-owned behavior | Deliberately excluded |
|---|---|---|---|
| `PreviewCard` | real-link `href` / `label`, title, optional description, hover/focus delays, positioning, controlled open, phrasing-content default slot | link navigation, native auto-popover dismiss and top-layer rendering | Tooltip semantics, click interception, touch-only disclosure, arbitrary trigger component, essential or unique information |
| `RangeSlider` | one label, distinct lower/upper labels and names, tuple model, min/max/step/form/disabled | two native range inputs, keyboard focus and activation, form submission and fieldset-disabled cascade | a custom ARIA slider, thumb reordering, arbitrary thumb renderer, vertical mode, collision DSL |
| `Stepper` | named navigation, flat items `{ key, label, description?, disabled? }`, required controlled current key | ordered-list semantics, native button focus/activation and disabled behavior | form wizard, validation, panels, linear-completion policy, tablist/progressbar roles |

## PreviewCard: an intent preview, not a Tooltip

The trigger remains an actual `<a href>`. `usePreviewCard(props, open)` owns
only delayed pointer/focus intent, trigger-to-popup transit, controlled/native
popover synchronization and anchor fallback. It never installs a click handler,
`role="tooltip"`, or `aria-describedby`; the preview must not contain information
that is unique or required to understand the destination.

The package SFC stays inline so its link can appear in prose. Consequently the
default slot is intentionally restricted to **phrasing content** such as links,
buttons, images and styled spans. The owned title and description cover the
common block anatomy. A preview that needs sections, lists, forms or other flow
content has crossed the package boundary and should be owned rather than placed
as invalid children of the inline wrapper.

The default 600 ms open and 300 ms close delays follow the published
[Base UI Preview Card](https://base-ui.com/react/components/preview-card)
defaults. Touch pointer entry does not synthesize a hover-only disclosure;
touch users must be able to follow the real link without a hidden interaction
mode.

## RangeSlider: two real controls, one visual track

RangeSlider is separate from the existing single native Slider. Its constant
DOM and tab order are lower input then upper input. The lower input's native
maximum follows the upper value, while the upper input's native minimum follows
the lower value. This keeps `lower <= upper` without allowing the thumbs to swap
their accessible names or focus order, matching the invariant described by the
[WAI-ARIA multi-thumb slider pattern](https://www.w3.org/WAI/ARIA/apg/patterns/slider-multithumb/).

Both inputs are visually overlaid on one owned track. The fixed binding gives
the full-height rail a pointer target, selects the nearest thumb, uses pointer
capture while dragging, and resolves a collision by direction (below the shared
value selects lower; above selects upper). This avoids a 16 px thumb-only hit
area and lets either thumb recover after both values meet. Keyboard behavior
remains native, and the selected segment is a presentation-only fill derived
beside the DOM. `useRangeSlider` also hides native sanitization, tuple/DOM
syncing and reset ordering, but has no configurable behavior object. Labels,
dependent bounds, names, form ownership, track structure and styling remain
visible in the SFC.

Because the shared rail is a custom pointer surface, it also reproduces the
native event contract at the real input boundary: changed pointer positions
emit bubbling `input` from the selected input, and a normally completed gesture
emits one `change`. `pointercancel` keeps already emitted `input` events but does
not claim a committed `change`. Keyboard events remain entirely browser-owned.

As with every slider pattern, touch assistive-technology support depends on the
browser/AT combination. Nagi avoids making that risk worse by retaining real
range inputs instead of replacing them with `div[role=slider]`, but applications
with high-stakes mobile requirements must still verify their target devices.

## Stepper: navigation only

Stepper is not a wizard controller. It renders `nav > ol > li > button`, marks
exactly the controlled item with `aria-current="step"`, and emits only the
model update produced by native button activation. An invalid controlled key
does not invent a current step. A disabled current item remains structurally
current while disabled styling takes visual precedence.

Panels, validation, completion, route synchronization and linear progression
belong to the application. Adding them here would couple unrelated policies to
an otherwise readable flat renderer.

## Package, ownership, and SFC exposure audit

- The same three SFCs back package imports and `nagi-ui own`.
- `/components`, the ownership registry and the Nagi CSS consumer preset cover
  all three names.
- PreviewCard's timer, native-toggle and anchor mechanism is in the public
  `usePreviewCard` composable; its real link and content policy stay in the SFC.
- RangeSlider's reset/sanitization bridge remains a package dependency from
  `component-controls`; ordinary ownership still does not copy composables.
- Stepper needs no composable because native buttons already own its complete
  interaction contract.
- No SFC adds `watch`, lifecycle hooks, global DOM access, Teleport, literal
  colors, token fallbacks, retired `.zone` anatomy, or a Nagi-specific state
  attribute.

## Browser contracts

The Catalog lab verifies PreviewCard pointer transit, keyboard-only focus
transit, Escape dismiss and real-link navigation. It also verifies Stepper
Space activation, retained native focus, one current step and disabled state.

The Forms lab verifies that both RangeSlider thumbs are pointer-draggable and
keyboard-focusable in constant order, cannot cross, submit distinct FormData
entries, restore their initial tuple after native reset, and retain system focus
indicators in forced colors. Existing page-level axe scans include all three.

The release gate is:

```sh
vp run test
vp run typecheck
vp run test:integration
vp run test:browser
vp node ../nagi-css/packages/cli/src/cli.mjs check --config .sandbox/nagi.config.mjs --cwd .
vp node ../nagi-css/packages/cli/src/cli.mjs check --config .sandbox/nagi.consumer.config.mjs --cwd .
```

After this slice, expanded catalog progress is **43 / 54 (79.6%)**. PreviewCard
and RangeSlider also move the independent Base UI-aligned implementation metric
to **31 / 37 (83.8%)**; Stepper belongs to the cross-library expanded scope.
The complete release gate passed with **268 / 268 unit tests** and **91 / 91
browser + axe tests**, plus TypeScript 7, verified-bindings integration lint,
both owned and consumer Nagi CSS checks, and package-tarball inspection.
