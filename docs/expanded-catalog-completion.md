# Expanded catalog completion slice

Status: Shipped (2026-07-23).

The initial implementation failed independent review because overlay state,
controlled-model settlement, and link activation had accumulated local race
repairs. `expanded-overlay-state-machines.md` is now the required design gate.
The redesign implementation and focused transition/browser suites are now in
place. The full repository gates and fourth independent audit approved this
exact eleven-slice source state for shipment.

This slice covers the eleven adopted backlog entries: `Autocomplete`,
`Carousel`, `ContextMenu`, `Menubar`, `MultiSelect`, `NavigationMenu`,
`OTPField`, `Resizable`, `TagsInput`, `Toolbar`, and `Tree`.

## Architecture boundaries

- Every package component is one ownable source unit with plain owned HTML.
  Tree's unit includes its private recursive `TreeBranch.vue` helper so nested
  `treeitem > group > treeitem` ownership stays real; the helper is not a
  public compound part. There are no compound part tags, Teleports,
  render-prop wiring slots, or CSS runtimes.
- Popups remain native popovers. Context menus add only pointer coordinates,
  long-press policy, and Menu keyboard behavior; Menubar reuses Menu behavior
  for each popup while owning a distinct horizontal coordinator.
- Menu popups focus their actual `tabindex="-1"` buttons and anchors. A native
  link's Enter event is never canceled or reproduced by core, so modifier
  state, ancestor cancellation, router handlers, analytics, `target`, `rel`,
  and `download` stay on one trusted browser click. Empty/all-skipped menus
  alone fall back to the menu container.
- NavigationMenu remains native `nav` plus links. It must not use menu roles or
  menu keyboard behavior for site navigation.
- Carousel delegates movement to an ordinary overflow scroller and CSS scroll
  snap. JavaScript coordinates labeled controls, current-slide announcement,
  and focus-safe index synchronization only.
- OTPField uses one real form-associated input. Visual cells are `aria-hidden`;
  paste, password-manager integration, and virtual-keyboard ownership are not
  split across synthetic inputs.
- Resizable uses a standard separator with pointer capture and keyboard value
  changes. It owns a two-panel layout, not a nested layout engine.
- Autocomplete owns free-form text and treats suggestions as optional commits.
  MultiSelect owns a key collection and repeated native form values. TagsInput
  owns arbitrary strings and does not share either component's model contract.
- Toolbar coordinates roving focus across its direct controls without a
  `ToolbarButton` component family. Tree keeps recursive expansion, selection,
  lazy state, and tree keyboard behavior separate from Listbox.
- MultiSelect exposes `data-active` on the option addressed by
  `aria-activedescendant`. This is the public styling hook for provisional
  keyboard focus; `aria-selected` continues to represent committed membership.
- Tree exposes the same `data-active` styling hook on the `treeitem` addressed
  by its owner’s `aria-activedescendant`; `aria-selected` remains the committed
  selection state.

## Required checks

1. Controlled models remain the source of truth, including rejected writes,
   in-place collection updates, reset, disabled, and read-only transitions.
2. Keyboard and focus contracts are exercised in Chromium with role/name
   locators: listbox suggestion movement, chip/tag removal, carousel controls,
   separator keys, toolbar roving focus, tree navigation, and all menu paths.
3. Native forms assert repeated MultiSelect/TagsInput values, one OTP value,
   required validation, disabled omission, and reset.
4. Pointer checks cover carousel scrolling, separator capture, contextmenu
   coordinates, outside dismissal, and touch long-press cancellation.
5. RTL, IME composition, paste, reduced motion, forced colors, narrow layouts,
   dynamic item removal, and focus repair are covered or explicitly recorded
   as manual-only risk.
6. Open and interactive states pass axe without excluded rules, plus final-DOM
   relationship verification where IDREF or popover wiring is present.
7. Public exports, type tests, SSR, ownership, consumer preset, verified
   bindings, owned Nagi CSS, and consumer Nagi CSS all pass.

## Release gate

```sh
vp run test
vp run typecheck
vp run test:integration
vp run test:browser
(cd ../nagi-css && vp run check check --config ../nagi-ui/.sandbox/nagi.config.mjs --cwd ../nagi-ui)
(cd ../nagi-css && vp run check check --config ../nagi-ui/.sandbox/nagi.consumer.config.mjs --cwd ../nagi-ui)
```

An independent read-only review must inspect the final implementation against
this document, `CHARTER.md`, `docs/blueprint-wiring-audit.md`, and the consumer
testing recipe before the backlog can be marked shipped.

## Current validation evidence

The shipped post-redesign implementation gates are green as of 2026-07-23:

- unit/SSR: 349/349;
- TypeScript 7 typecheck: pass;
- verified-bindings integration lint: pass;
- Chromium browser + axe: 120/120;
- owned Nagi CSS: pass;
- consumer Nagi CSS: pass;
- `git diff --check`: pass.

The same independent reviewer that rejected the previous revisions re-audited
this exact source state, including actual-item Menu focus, controlled close
rejection, disabled focus ownership, dynamic fallback promotion, Tree disabled
navigation, and OTP length normalization. The fourth audit reported
`APPROVE Shipped` with no Blocking, High, or Medium findings.
