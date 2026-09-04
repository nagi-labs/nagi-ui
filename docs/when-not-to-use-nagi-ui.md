# When not to use Nagi UI

Status: Phase 4 consumer guidance (2026-07-21).

Nagi UI's standard Blueprints gain a small custom vocabulary and HTML that
works before hydration by delegating behavior to browser standards. That is a
property of the standard Blueprint Implementation, not of the Component
Contract. This guide distinguishes requirements that need another owned
Implementation from requirements that are a poor fit for Nagi's contract and
verification model altogether.

Adopting Nagi UI does not have to be a single app-wide decision. Nagi has no
required provider, portal root, or global state, so **only the components whose
requirements conflict with Nagi need to use another library**. Mixing Nagi with
a fully JavaScript-driven Reka UI/Base UI-style implementation or with a
specialized Vaul/Motion-style runtime is not a failure; it is the result of
choosing the appropriate state machine for each component.

## Decision table

| Requirement | Decision | Recommended boundary |
|---|---|---|
| Theme tokens and small props/schema are sufficient | Use the Nagi package | Continue receiving ordinary package updates. |
| Need to change DOM structure, item layout, or a framework node | Ownership candidate | Own the SFC with `nagi-ui own`, while keeping standard behavior in core. |
| Need a dismiss, top-layer, focus, or gesture state machine different from the UA | Different Implementation | Own the component, replace its state owner as a whole, and run the shared Component Contract plus Implementation evidence. |
| Need identical appearance and behavior across browsers | Different Implementation | Choose a fully JavaScript-driven implementation instead of platform delegation. |
| CSS entry/discrete transitions are sufficient | Default Blueprint fit | Use native state selectors and CSS. |
| Springs or interruptible exits are product requirements | Motion-owned Implementation | Let Motion or another presence runtime own mounting and exit completion; do not layer it over native visibility ownership. |

The key point is that **owning source may change the Implementation,
but changing the Implementation changes the evidence obligation too**. A Motion-owned
Toast is not verified merely because the native Toast Blueprint passed. It must
re-run the portable contract and add evidence for delegated presence,
interrupted exit, and unmount completion.

## Constraints of the standard Blueprint Implementation

| Required capability | Why the default Blueprint does not provide it | Selection guidance |
|---|---|---|
| Per-event dismiss policy, such as "close on outside click but not Escape" | The UA owns light dismiss; Nagi's granularity is `popover="auto/manual/hint"`. Dropping to `manual` and rebuilding the dismiss state machine is forbidden by design. | Use a Reka UI/Base UI-style overlay with event-cancellation APIs. |
| Arbitrary overlay order controlled by `z-index` or app-specific priority | Top-layer order follows open order and cannot be changed with `z-index`. Toast re-promotion is a narrow fix for the known Dialog coexistence case, not a general stack manager. | Delegate the whole overlay group to a library that owns a portal and stack manager. |
| Interactive DOM such as a button, menu, or drag handle inside a backdrop | `::backdrop` is a pseudo-element and cannot contain child DOM. | Use an implementation that renders a real DOM overlay layer. Keep the native backdrop when only click-to-dismiss is needed. |
| Legacy-browser support, library patches for UA bugs, or exactly identical behavior in every browser | Nagi treats UA implementations of Popover, Dialog, Invoker Commands, and related standards as canonical. It targets evergreen browsers and does not override behavioral differences with a custom runtime. | Fix a support matrix and choose a library that owns behavior in JavaScript. |
| Trigger-to-popup id references across separate Shadow Roots | `popovertarget` / `aria-controls` idref wiring does not cross a Shadow Root. Version 1 waits for standards such as Reference Target. | Keep both nodes in the same root, or use an implementation that owns wiring across the shadow boundary. |
| Motion-level orchestration that keeps content mounted through exit, springs, or animations that can reverse midway | Native popover/dialog visibility and an AnimatePresence-style lifecycle do not share the same state owner. | Create a Motion-owned Implementation. Follow Ark/Zag Presence or Radix/Reka `forceMount` practice: separate requested visibility from mounted presence and let one runtime report exit completion. |
| Drawer/bottom sheet with swipe-to-dismiss, interrupted drag, velocity, or snap points | Continuous pointer-gesture state has no native owner and requires a gesture runtime plus custom dismiss coordination. | Use a Vaul/vaul-vue-style sheet for that component. A static side panel can use Nagi Dialog styling. |
| Select with rich options, complex trigger rendering, and identical appearance across engines | Nagi's stable path is native `<select>`. `appearance: base-select` is progressive enhancement, and `<selectedcontent>` is not a stable Blueprint prerequisite. | If native Select conflicts with product requirements, use a Reka UI/Base UI-style Select. For free-form input, also reconsider whether Combobox/Autocomplete semantics are more appropriate than Select. |
| Build or CDN-only environment that cannot compile raw Vue SFCs from dependencies | Nagi package components and ownership sources distribute the same raw `.vue` files. A bundler/plugin that handles Vue SFCs is part of the distribution contract. | Use only core composables with caller-authored DOM, or choose a product that distributes precompiled components. |

Adding these capabilities as modes in one standard Blueprint would put platform
delegation and a custom state machine in the same implementation. Every branch
multiplies the combinations of keyboard, focus, dismiss, and SSR behavior,
removing the benefit of a small platform-first reference. The decision is
therefore not "can this be coded?" but "which Implementation owns the lifecycle, and
which evidence proves it?"

## Possible but high-cost requirements

The following requirements are not necessarily impossible, but adding them to
the standard package API is likely to erode Nagi's identity. Use ownership for
a one-off requirement. Consider a dedicated component or another library for
behavior repeated across products.

| Requirement | Try first | Exit condition |
|---|---|---|
| Normalize fine-grained browser-specific differences | Feature detection and progressive enhancement; fall back to native rendering when unsupported. | Use another library when fallback requires rebuilding a custom widget. |
| Coordinate complex overlays with custom priorities | Check whether native top-layer open order satisfies the requirement. | It is outside Nagi's scope if a global overlay manager or portal root is required. |
| Add advanced animation to only part of a component | Express it through `:popover-open`, `[open]`, `@starting-style`, and discrete transitions. | Delegate to Motion when JavaScript becomes the source of truth for visibility and mount lifecycle. |
| Deeply restyle native Select | Determine what is acceptable with native `<select>` plus progressive enhancement. | Use a custom Select when rich DOM and cross-engine pixel identity are mandatory. |
| Put a framework-specific renderer inside a Blueprint | First check whether the standard `<a href>` / `<img>` adapter from `nagi-ui setup` is sufficient. | Use ownership or caller markup when an actual component is required, such as a `<RouterLink>` custom slot or `<NuxtPicture>` art direction. |

Do not generalize high-cost requirements into package props, slots, or a
pass-through API. Consider elevating one to public API only after it has been
observed repeatedly in real use and can still be expressed in platform
vocabulary.

## When ownership is appropriate

Ownership is appropriate for structure and integration changes. It may also
host a different state-machine or presence strategy, but that is a new
implementation—not a cosmetic edit to the verified native Blueprint.

- Add an avatar, description, or permission indicator to a Dropdown item.
- Locally add an app-specific node to an items schema.
- Use a `<RouterLink>` / `<NuxtLink>` custom slot or active-class rendering.
- Use `<NuxtImg>` / `<NuxtPicture>` placeholders or art direction.
- Adapt Card/Dialog anatomy, markup, or declared slots to a specific product.
- Change component-specific CSS beyond the semantic theme-token layer.

When retaining the platform-first Implementation, continue passing standard props to
`usePopover`, `useMenu`, and related composables. When replacing it, do not keep
those native bindings as a second hidden state owner: adopt the external
runtime at the component boundary and write matching Implementation tests.
In both cases keep running Nagi UI lint, Nagi CSS lint, portable conformance
Component Contract tests, Implementation-specific browser tests, and visual review. See the
[ownership model](./package-ownership-model.md).

## Rules for mixing libraries

1. **One state owner per surface.** Do not wire Nagi and another library's open,
   focus, or dismiss props to the same popup.
2. **Split at component boundaries.** For example: Nagi Dropdown, a Vaul-style
   gesture Drawer, and a Reka UI-style rich Select.
3. **Unify appearance through tokens.** State machines need not be unified by
   moving every component to one library. Map the other component's theme to
   Nagi semantic tokens.
4. **Test mixed overlay stacks.** Open native top-layer and portal overlays
   together in a real browser and verify visual order, focus return, Escape,
   and screen-reader names.
5. **Do not combine ownership with an external component on the same surface.**
   When adopting an external runtime, do not retain a Nagi Blueprint as a
   wrapper. Let that library own both DOM and behavior consistently.

## Final checklist

Do not use the **standard Blueprint Implementation** for a component if any of these is mandatory:

- A dismiss/focus/stack state machine different from the UA.
- Interactive backdrop or a portal-dependent DOM layer.
- Interrupted gestures, springs, or an exit lifecycle as functional requirements.
- Legacy-browser patches or completely identical behavior and appearance across engines.
- Idref wiring across Shadow Roots.
- A stable path for rich Select options/triggers that native Select cannot express.

If requirements are limited to DOM structure, item presentation, framework
integration, or component-specific CSS, choose source ownership before
discarding Nagi. The boundary is not "how deep is the customization?" but
**whether the thing being changed is the DOM or the state machine**.
