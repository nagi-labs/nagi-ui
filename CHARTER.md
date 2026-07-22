# Nagi UI — Concept & Architecture Charter

> **Purpose of this document**: This charter fixes Nagi UI's design decisions. Implementation agents must not propose or implement structures that contradict it—such as compound components, Teleport, or duplicated custom state machines—as "improvements." When uncertain, return to the Decision Principles in this document.
>
> **The canonical source is this repository's `CHARTER.md`.** When implementation findings change a design decision, revise the affected section and add a reasoned entry to the Revision History at the end. Do not consult copies outside the repository, such as the original `NAGI_UI_CONCEPT.md` draft.

---

## 0. One-sentence definition

**Nagi UI is a Vue UI system that delegates behavior to browser standards instead of reenacting it in JavaScript, normally consumed as a themeable package and available as ownable SFCs when needed.**
An attribute-injection headless core is its internal foundation. The Nagi CSS Contract (the separate `CONTRACT.md`) is its styling foundation, and the system provides its reference implementation as the single source for package components and Blueprints.

## 1. Decision Principles (the basis for every design decision)

These four principles are ordered by priority. A lower principle applies only when it does not conflict with a higher one.

1. **Platform vocabulary first** — Library output should use the vocabulary of HTML standards (`popovertarget`, `commandfor`, `aria-*`, `<dialog>`) wherever possible. Nagi is not machinery that reenacts ARIA patterns in JavaScript, as Radix, Base UI, and Reka do; it is a layer that delegates to standard attributes.
2. **User owns the DOM** — Only the user's plain HTML elements remain in the template. The library adds no tags. Wrapper tags (`Root` / `Trigger` / `Popup`) are forbidden.
3. **Conformance to the Nagi CSS Contract determines structure** — Use the form—attribute injection—that incurs no penalty under the contract's owned-DOM and mandatory-`>` rules. This is not a styling preference; it is a structural constraint imposed by the contract.
4. **Asymmetric investment** — Keep areas already handled by native behavior (Dialog/Popover/Tooltip) extremely thin, and invest substantial JavaScript only where there is no native substitute (Combobox/Menu/Listbox).

## 2. Why we do not use compound components (background summary)

The rationale is explicit so that implementation agents do not revert the structure after deciding that a Radix-style design is more conventional.

- **Why Root is unnecessary**: A Radix-style `Root` hosts a state machine that stores open state, the focus-return target, and ids. It compensates for React's lack of a `document`-like global state host. With the Popover API, **the browser itself** owns the state machine (`:popover-open`, top-layer management, light dismiss, and focus handling are UA implementations). No wrapper tag is therefore needed to hold state.
- **Why wrapper tags are a React-specific constraint**: JSX has no attribute-level extension mechanism, so the only way to inject behavior into an element is to wrap it in a component. Vue can inject without wrapping through `v-bind` object spread, directives, and `getSSRProps`. Do not import React's design constraints into Vue.
- **Difference in penalty under the Nagi CSS Contract**: In compound form, library components become boundary classes, and styling the library's own dialog internals requires a slot sub-surface declaration plus a descendant step. A Teleport implementation additionally requires a `detachedSlotSurfaces` declaration. With attribute injection, the entire region remains owned DOM, so the Element Class Table and `>` chain work directly.
- **Why Teleport is unnecessary (important)**: A native popover's top layer is **a rendering concept, not a DOM move**. The popover element stays in place in the DOM tree. The contract's `>` chain therefore remains intact, and the popover is not clipped by ancestors with `overflow: hidden`, `z-index`, or `transform`. **Introducing Teleport or a portal into the implementation removes the reason this project exists. It is forbidden.**

## 3. Product structure (package-first / own-on-demand)

| Layer | Distribution | Contents | Styling |
|---|---|---|---|
| **core** | npm package | Composables plus directive sugar. Injects native attributes and ARIA. Fully typed | Contains no CSS |
| **components / blueprints** | npm components + on-demand copy-in | The same Nagi CSS-conformant SFCs. Normally imported directly; only components that require structural changes are copied into the consumer's repository | Readable CSS conforming to the Nagi CSS Contract. **No Tailwind** |
| **theme** | `@nagi-labs/nagi-ui/default-theme.css` + Nagi CSS Contract | Tokens for color, spacing, radius, typography, shadow, control size, and state appearance | Does not change DOM or behavior |
| **contract preset** | npm (linter side) | Nagi UI preset configuration for the Nagi CSS linter (only where settings such as `componentSlots` are needed) | — |

- The normal adoption experience follows the PrimeVue model (package import + theme tokens) and **does not require copying every SFC up front**. Only components that exceed the package API move to ownership through a workflow equivalent to `nagi-ui own <component>`.
- Framework integration is selected through `nagi-ui setup`. Vue Router and Nuxt Link are converted to `navigate` / `prefetch` callbacks while preserving a real `<a href>`, and Nuxt Image is converted to a URL for a standard `<img>`. Framework components and their prop DSLs never enter Blueprint schemas, preserving one SFC for both package and owned use. See `docs/setup-integrations.md`.
- What Nagi inherits from shadcn is **the ability to transfer source ownership when needed**. It does not adopt Tailwind or utility classes. Copied code has deterministic names under the contract, so it passes the consumer's linter from the start.
- Component names and SFC filenames omit the library name: `Button` / `Button.vue`.
  Only Nagi CSS surfaces live in a strict namespace. `.n-button` is derived from
  `surfaceRootPrefixes: ["n-"]` and the kebab-cased filename. A missing prefix or
  a filename mismatch such as `.n-control` is a lint error; merely matching the
  prefix with `startsWith` is not sufficient.
- The real product is the contract, and Nagi UI is its demonstration—the reference implementation. Differentiation comes from the integrated "contract + linter + library," not from the library's feature set alone (established competitors can absorb feature differences within two or three years).

### Single-source principle (required)

The package component and the source copied by the `own` command **must not be separate implementations**. Use the same `blueprints/<component>/*.vue` SFC for both the package build and source ownership. A package fix that leaves the copy source stale—or the reverse—is a shipping defect.

### Customization ladder

1. Theme token
2. Small props / items schema
3. A small number of declared slots
4. Source ownership for anything beyond that

Do not write literal fallbacks in Blueprint token references. Centralize defaults in
`default-theme.css`; normally import it and override only the needed tokens later in
the cascade. A complete replacement theme must use `nagi-ui theme check` as a CI gate,
and missing values in the actual cascade are detected by an opt-in development diagnostic.
Fallbacks that merely make a missing value look acceptable are forbidden because they hide
defects in the theme contract. The old `theme.css` export is a compatibility alias only.

Do not create a PrimeVue-style, enormous pass-through-prop or slot surface. "Own the source when the API cannot express the requirement" is the boundary that keeps the package API small. Conversely, if needs as modest as an avatar, router-link, or description always require ownership, there is a cliff between Theme and ownership. Adjust the boundary using §3.5's priority order and real usage data; do not add speculative APIs.

### Maintenance contract after ownership

"Ownable" must not be another way to say "forked and abandoned." Owned source records its source component and version in machine-readable form, so upstream diffs and migrations, Nagi UI lint, and integration tests can track accessibility and browser fixes. The `own` / `diff` commands and metadata format were fixed in Phase 4 (`docs/phase4-ownership-cli.md`).

`docs/package-ownership-model.md` is the canonical source for this model's success criteria, failure modes, and validation experiments.

## 3.5 Choosing a Blueprint form (owned DOM / props / items schema / slot)

Choose the mechanism that exposes each part of a Blueprint using the following priority order. Do not use a mechanism from a lower row when a higher row can express the requirement.

| Nature of content | Mechanism | Examples |
|---|---|---|
| Fixed structure | owned DOM (written directly in the template) | menu list skeleton, card frame |
| Expressible as a string, boolean, or enum | props | plain title, image src, `variant` |
| Repeated homogeneous items | items schema (Blueprint-local) | menu items, select options, toast |
| Truly unrestricted markup | slot (declared sub-surface) | card body, rich title content, dialog body |

### Role of items schemas

- Provide them as **editable types** inside a Blueprint. Do not promote them into the public core API (the core product is its composables; putting schemas in core immediately creates compatibility debt for a stable DSL).
- As a consequence of package-first distribution (§3), the union is exposed as the **component's props API** while the package component is in use. Node kinds are therefore a minimal stable API tied to the component version, so the discipline of "do not grow a DSL" applies **more strongly** than it did under copy-first distribution. The answer to a requirement the union cannot express is source ownership, not another property.
- This applies to menu families (Dropdown / ContextMenu / Menubar). Menu items are homogeneous icon + label + shortcut rows, and platforms such as NSMenu, Electron, and VS Code have consistently defined this UI as data. **This decision is an exception based on the nature of menus, not the default policy.**
- Ship documentation for the schema extension procedure with the Blueprint (add union member → add template branch → add CSS → run `nagi-css check`). **Shipping this extension recipe is a success criterion for adoption**; without it, users escape to slots and break CSS ownership.
- Do not provide escape hatches such as injected slots or a `component` field. Three exits are sufficient: (1) edit the renderer after owning its source, (2) extend the owned union, or (3) drop down to `useMenu` / `useSubmenu`.

### Role of slots

Slots are a legitimate mechanism. The compound prohibition in §2 prohibits **shipping a behavior state machine distributed across multiple library tags**; it does not prohibit slots in a single-source SFC used for both package and owned distribution. Nagi CSS prices the boundary as a slot sub-surface (declaration + descendant step), so declaring and paying that cost does not violate the contract. Conditions:

- **Keep boundaries minimal.** Splitting into a family of tags such as `CardHeader` / `CardContent` / `CardFooter` is forbidden. Keep the frame anatomy in owned DOM and open holes with the default slot, adding named slots only when needed.
- **Do not use slots as behavior-wiring conduits.** Coupling slot content to parent state through provide/inject reimplements compound components. Behavior flows only through composables and props. A menu item slot that passes `itemProps` into `#item` for consumers to bind is a violation; customize items by extending the owned renderer's union.
- **Do not make slots the only primary path** for parts expressible as data, such as titles or images (follow the table's priority order). Use props for plain text. However, when multiple product references establish a stable visible part as needing rich content, a content-only slot of the same name may be added with a prop fallback while preserving the owned wrapper. The slot takes precedence when provided, but does not receive the whole header or behavior wiring. Canonical examples are Card `title` / `description`, Alert `title`, Dialog `title` / `description`, Disclosure `summary`, and Badge `label`. Slot content follows the wrapper's HTML content model: phrasing content only inside `h2`, `p`, or Badge's `span`; phrasing or heading content inside `summary`. Do not place another interactive control inside `summary`. A required prop that guarantees an accessible name or baseline text remains required and is passed to the slot as the same string rather than becoming optional.
- **Do not ship speculative named slots.** Users can cheaply add a slot to an owned copy later, but once shipped, consumers depend on it and it cannot be removed. Ship only slots that are part of the component's reason to exist, such as Card or Dialog body content. Add reserve openings like `#header-extra` only after a real requirement appears.

### Meaning of "User owns the DOM"

The final DOM, state selectors, and CSS ownership must be traceable through **code the user can own** when needed. The entire DOM does not need to appear in the consumer's SFC while using the package. After ownership, the same source SFC as the package moves into the consumer's hands, and even a schema-based menu has traceable DOM in the owned `DropdownMenu.vue`.

### Criteria for leaving wiring in a Blueprint

Leave **policy and markup** that users are expected to modify after ownership in the Blueprint. Hide **mechanisms** users should not normally modify—such as native-event ordering, synchronization between a Vue model and DOM properties, and browser-difference handling—behind small helpers. Decide based not on whether something can be changed, but on whether users should normally change it. Do not base helper adoption on call count. `docs/blueprint-wiring-audit.md` is the canonical audit ledger.

- Do not create generic helpers with universal config objects, control-kind branches, or collections of transformation callbacks. Name one fixed meaning, as in `useNativeRadioReset(input, model)`.
- If using a helper requires redeclaring the same mapping or DOM rules in the Blueprint, the abstraction has failed; return to the explicit implementation.
- A composable options object is not automatically policy. One-to-one forwarding such as `openDelay: props.openDelay`, getter conversion such as `disabled: () => props.disabled`, and API-shape conversions that merely wrap `area` / `offset` in `anchor` are not user editing points, so hide them in a component overload of the same public `useX`. Isolate only fixed, non-extensible mechanisms—native reset, focus repair, DOM/model synchronization, and similar behavior—in `@nagi-labs/nagi-ui/component-controls`. Keep prop definitions and defaults in the SFC.
- A default mapping from the package component's stable standard schema, such as `{ key, label, disabled }`, to the headless API may be hidden in a component overload of the same public `useX`. The canonical SFC uses `useX(props, model)`, and broadly useful settings with stable meanings become named props. Drop down to the complete single-argument `useX({...})` only when owning the schema or interaction algorithm itself. Do not add a third argument to the component overload or a generic `:options` prop: those create different configuration paths for model, form, ARIA, and renderer, so reading the SFC no longer determines final behavior.
- Keep actual renderer policy—union-node branching, recursive flattening, schema-to-renderer transformations that change with the DOM, and conversion to public events—in the SFC or a renderer module owned with it. If renderer callbacks or recursive transformations are passed into the component overload and moved away from the DOM, hiding has failed; return to the explicit implementation.
- Treat `watch` / `watchEffect` in a shipped SFC not as forbidden, but as **a review signal**. First ask whether derived state can eliminate it, then whether a component-specific helper or composable with a fixed meaning can absorb it. Leave only observation of user-editable policy in the SFC.
- Keep processing that must change alongside the renderer's DOM structure—such as converting schema nodes to menu options—in the Blueprint even when it resembles mechanism. Focus repair fixed as an immutable accessibility invariant may instead be hidden in a component-specific composable whose DOM contract is locked by browser tests.
- Distinguish component overloads from fixed mechanisms. The former can be expanded into the same public `useX` full options. The latter—native reset ordering, focus repair, DOM/model synchronization, and similar concerns—remain narrow helpers even after full expansion. Remove a fixed mechanism for a special requirement only when changing the component identity or native contract; do not add speculative hooks or options to helpers.

### Styling-only Blueprints

Blueprints without behavior (a core composable), such as Card, Alert, and Badge, are outside Nagi UI's composable validation sequence (the phases in §10). They **may be added independently of phase progress** as Nagi CSS-conformant package components and ownable SFCs. As usual, one-off or page-specific structures may also be written inline rather than turned into components.

### Component benchmark adoption criteria

Do not select component capabilities from a single catalog. Use Base UI as the comparison for behavior, accessibility, keyboard, and focus guarantees; shadcn-vue for practical Vue anatomy and source ownership; and PrimeVue for props, slots, and polish expected of package-first, themeable components. Web-platform vocabulary and this CHARTER always take precedence.

- When both shadcn-vue and PrimeVue expose the same visible part or small enum, treat that agreement itself as product evidence and promote the capability to review even without an additional Nagi-specific use case. The discipline against speculative APIs does not mean ignoring anatomy established across multiple representative product libraries.
- Commonality is evidence for a capability, not a mandate for an API shape. Do not copy compound parts, `asChild`, or pass-through props; translate the capability into this section's sequence of owned DOM → props → items schema → minimal slots → ownership.
- Wait for a real requirement before adopting a feature found in only one styled library. Even when several libraries share a feature, explicitly decline it or assess it as a separate component when it conflicts with native ownership—for example custom Select, gesture Drawer, or a portal/focus-trap runtime.
- `docs/base-ui-component-comparison.md` is the canonical ledger comparing shipped components with the Base UI baseline and recording adoption decisions.

## 4. Core API design

### 4.1 Three-layer API: composables are the core; directives are sugar

```
composable (usePopover / useDialog / ...)    ← Design core. Fully typed and tested
    ↓ sugar
directive (v-popover-trigger / ...)          ← Concise surface. SSR via getSSRProps
    ↓ output
native attributes (popovertarget, aria-*, id) ← Final output always uses standard vocabulary
```

Rationale: Directives are not checked by template type checking (`vue-tsc`), and modifiers have no type representation. Users who want types can choose composables; users who want concision can choose directives. **Never create a capability available only through a directive**; an equivalent composable must always exist.

Evidence for the composable form: the thin side, which only returns attribute objects, poses no risk. On the thick side, such as Combobox, React Aria hooks prove that a WAI-ARIA-conformant implementation can exist in composable form. The Vue-template ergonomics of distributing attributes to `v-for` items through an `itemProps(item)`-style API were validated with `useMenu` + the ActionMenu Blueprint in §10 Phase 2. `docs/phase2-menu.md` is the canonical source for results and comparisons.

### 4.2 Canonical form (Dialog/Popover example)

```vue
<script setup>
const { triggerProps, popoverProps } = usePopover()
</script>

<template>
  <div class="confirm-dialog">
    <button class="button -trigger" v-bind="triggerProps">Delete</button>
    <div class="panel" popover v-bind="popoverProps">
      <header class="header"><h2 class="title">Confirm</h2></header>
      <footer class="footer -actions">…</footer>
    </div>
  </div>
</template>

<style scoped>
.confirm-dialog {
  > .panel {
    &:popover-open { … }
  }
}
</style>
```

Checklist:
- There is **not a single library-defined tag** in the template.
- `triggerProps` contains **standard attributes themselves**, such as `popovertarget="<useId>"`.
- The state selector is the native `:popover-open`, not `data-state`.

### 4.3 Wiring topology

- Wire relationships through **id references** (`popovertarget` / `commandfor` / `aria-controls`). Do not use nested scope (provide/inject) as the primary wiring mechanism.
- Generate ids with `useId()` to prevent collisions. Ids occupy a global namespace. Document the known constraint that they cannot cross Shadow DOM boundaries; v1 does not support that case.
- Use provide/inject **as an internal implementation detail** only when composables must share state, such as inside Combobox. Do not expose a Root equivalent in the public API.

### 4.4 Controlled mode (required; must not be deferred)

Although the browser (UA) owns open state, a controlled mode (`v-model:open`) that treats an application store as the single source of truth is **required for the product to be viable**. Closing a dialog after asynchronous work or opening a popover from store state appears in most real use cases; a library that makes these awkward will not be adopted regardless of its philosophy.

- Implementation: **bidirectional mirror synchronization** — mirror UA-originated transitions into the model through the `toggle` event, and apply model writes to the UA imperatively with `showPopover()` / `hidePopover()` / `showModal()` / `close()`. Make the apply function idempotent (a no-op when the current state already matches) to break echo loops. Synchronize with a sync flush; a post flush collapses a true→false round trip in the same tick into "no change" and desynchronizes the UA.
  - The original draft specified "`beforetoggle` `preventDefault` + imperative synchronization," but the Popover API makes **the hide-direction `beforetoggle` non-cancelable** to prevent popovers from becoming impossible to close, so that design cannot be implemented literally. Mirror synchronization fulfills §4.4's goals: intuitive `v-model:open`, closing after asynchronous completion, and containing dual-state management internally. (Revised 2026-07-15.)
- **Contain all complexity of dual state—conflicts with light dismiss and event-order edge cases—inside the composable so users experience straightforward `v-model:open`.** The library implementer pays this complexity cost; it must not leak to users.
- Design both uncontrolled (default) and controlled modes from the start. Adding controlled mode later breaks the API.

### 4.5 SSR / zero hydration (a structural differentiator)

- Attributes must be **written directly** into server-rendered HTML. Directives must implement `getSSRProps`.
- Consequently, `popovertarget`-based UI **works before hydration and before JavaScript arrives**. Existing headless libraries built around context (a JavaScript runtime) cannot provide this structurally. Operation under Nuxt delayed hydration and islands architectures is a first-class requirement.
- **Acceptance criterion**: a Popover-based Dropdown opens and closes in a browser with JavaScript disabled.

## 5. Native dependencies and policy

| Feature | Purpose | Policy |
|---|---|---|
| Popover API (`popover`, `popovertarget`, `:popover-open`) | Popover/Tooltip/Menu surface | Supported by all major browsers. Fully adopted as the foundation |
| `<dialog>` (`showModal`, `[open]`, `::backdrop`) | Modals; focus trapping delegated to the UA | Fully adopted. Do not implement a custom focus trap |
| Invoker Commands (`command` / `commandfor`) | Declarative trigger wiring | Chrome 135+ / Firefox 138+. Feature-detect support; in unsupported environments, the composable falls back to equivalent event wiring |
| CSS `@starting-style` / `transition-behavior: allow-discrete` / `overlay` | Open/close animation | Used in Blueprint CSS. Do not add a JavaScript animation library to core. Unsupported environments degrade to immediate opening and closing (progressive enhancement) |
| CSS Anchor Positioning | Popover/Tooltip positioning | Implemented in Chromium; Safari and Firefox are following. Use a two-stage strategy: **native in supported environments, Floating UI fallback otherwise**. Isolate the Floating UI dependency in the positioning module so it can be removed after Anchor Positioning becomes ubiquitous |

Animation note: implement fades, slides, and scales entirely in CSS. Spring physics, gesture coupling, and exit orchestration are **out of scope**; consumers may add their own JavaScript when needed. Do not provide Radix-style attribute hooks such as `data-starting-style`; native `@starting-style` is the model.

## 6. State representation rules (fully conforming to the Nagi CSS State Rule)

Strictly follow this priority order. **Never duplicate at a lower level a state that can be expressed at a higher one.**

1. **Native**: `:popover-open`, `[open]`, `:disabled`, `:checked`
2. **ARIA** (injected by the library): `aria-expanded`, `aria-selected`, `aria-invalid`, `aria-activedescendant`
3. **`data-*`**: only for states with no native or ARIA equivalent. Example: `data-active` for visual focus independent of selection in Menu / Listbox. A Combobox popup follows the APG selection-follows-focus model and can represent its active option with `aria-selected`, so do not layer `data-active` on top. List every used `data-*` **in documentation as part of the public styling contract**.

Forbidden example: adding `data-state="open"` for popover state, which duplicates `:popover-open`.

## 7. Investment map by component

| Component | Implementation weight | Contents |
|---|---|---|
| Popover / Tooltip / Dialog | **Thin** (attribute injection + positioning only) | `popovertarget` wiring, anchor positioning, delegation to `<dialog>` |
| Toast | Medium (more traps than its appearance suggests) | Explicit `createToastManager()` owns queues/timers; `useToast` separately owns DOM/top-layer/F6 wiring. No Provider or singleton. Popovers stack in open order and ignore `z-index`; furthermore, `showModal()` force-closes open popovers, so **re-show based on the presence of live toast models**. Announce only title/description through polite/assertive live nodes outside the top layer, and pause timers during hover, focus, or `document.hidden`. See `docs/base-ui-alignment-c.md`. |
| Disclosure / Accordion | Thin | `<details>` base + animation CSS |
| Tabs | Medium | `useTabs` owns roving tabindex, manual/automatic activation, orientation/RTL, disabled handling, and dynamic fallback because there is no native substitute. The Blueprint uses native buttons and owned tabpanels, a flat items schema, and a content-only `panel` slot; it has no compound parts or Indicator geometry runtime. See `docs/base-ui-alignment-d-tabs.md`. |
| Menu / Listbox / Combobox | **Thick** (the main JavaScript investment of this project) | Typeahead, focus management, and selection models. Menu uses `aria-activedescendant` and never mixes it with roving tabindex. Delegate the floating surface to popover while implementing only the interaction model ourselves. |
| Select | **Thin** (native stable path) | Delegate behavior, form integration, validation, and accessibility to ordinary `<select>` / `<option>`. `appearance: base-select` may be used only as progressive enhancement. Do not include `<selectedcontent>` in a stable Blueprint until Vue and all three engines meet the shipping criteria. |

Expect 70% of accessibility implementation effort to concentrate in the Menu/Listbox/Combobox family. Do not design under the misconception that native delegation makes everything thin.

## 8. Known constraints and severity triage

These constraints were identified by comparison with all-JavaScript implementations such as Base UI. **Some must not be "solved" by implementation agents, while others must be solved.** Treat constraints that follow directly from giving authority to the UA as contract conditions, not bugs.

### 8.1 Fundamentally impossible (the cost of delegation; do not solve in implementation)

| Constraint | Description | Treatment |
|---|---|---|
| Fine-grained dismiss policy customization | Light dismiss lives inside the UA state machine. The only available granularity is `popover="auto/manual/hint"`; policies such as "close on outside click but not Escape" are impossible | Dropping to `manual` and reimplementing behavior recreates Base UI and is **forbidden**. Feature-detect platform extensions such as `<dialog>`'s `closedby` attribute. Document this explicitly as a "when not to use Nagi" case |
| Top-layer stacking control | Order is fixed by opening order; `z-index` has no effect | Handle only Toast internally with the re-promotion logic in §7. Provide no arbitrary ordering for anything else |
| Interaction and announcements for Toast outside a modal | Native modals make everything outside the dialog inert. Even if an outside Toast is re-promoted and visible, actions and focus cannot leave the modal, and an outside live node may leave the accessibility tree | `F6` must not move focus outside the active modal. If interaction or AT announcements are required during a modal, place another renderer for the same explicit manager inside the dialog. Do not use Teleport or remove inertness |
| Real DOM inside `::backdrop` | A pseudo-element cannot host an interactive overlay | Document only as a constraint; it is a rare requirement |
| Patching UA differences or UA bugs ourselves | Behavior is implemented by the UA, so a library patch cannot make implementations identical | State the evergreen-browser prerequisite. Minimum support follows the platform |
| Idref wiring across Shadow DOM | `popovertarget` / `aria-controls` cannot cross a shadow root | Unsupported in v1. Monitor standardization of Reference Target |

### 8.2 Possible but difficult (assign the cost explicitly)

| Constraint | Severity | Treatment |
|---|---|---|
| Controlled mode | **High — the product is nonviable if unresolved** | Contain it within the composable as specified in §4.4. Include it in §10's vertical-slice acceptance criteria |
| Toast × Dialog stacking order | **High — visible within 30 seconds of a demo** | Build re-promotion logic into `useToast`. Prove coexistence proactively in the demo (§10) |
| JavaScript animation integration | Medium | Popovers and dialogs are not unmounted when closed; their display changes. This does not integrate well with Motion-style systems or exit orchestration built around `v-if`. Treat the CSS-capable range in §5 as correct and document requirements beyond it as "when not to use Nagi" |
| Gesture-driven, interruptible closing (a Vaul-style bottom sheet) | Medium | Explicitly out of scope. Because there are no wrapper tags, providers, or global state, individual components can coexist with another library; document that recommendation |
| Test environments (incomplete dialog/popover support in jsdom) | Medium | Ship a Vitest Browser Mode / Playwright-based test recipe with the Blueprints |
| Maintaining the Invoker Commands fallback | Low | Maintain feature-detected dual paths until adoption is complete, as defined in §5 |

### 8.3 Structures that absorb the damage (notes for agents)

- **Self-selection**: Users aligned with Nagi CSS and users who prioritize spring physics and gesture UI are nearly disjoint groups. Nagi need not win in every direction.
- **Mixing is possible**: With no wrapper tags, providers, or global state, Nagi can coexist with Reka and similar libraries component by component. Adoption is not all-or-nothing.
- **Shared vocabulary with AI**: Blueprints commit fully to pre-trained vocabulary—standards-based HTML, CSS, ARIA, and Vue SFCs—and avoid adding Nagi-specific abstractions. Restrict new vocabulary to the Nagi CSS Contract, and mechanically inspect only that vocabulary with `nagi-css check`. This lets agents map DOM to rendering and edit it with minimal additional knowledge.
- **Boundary with specialist libraries**: Use established libraries directly, component by component, for specialist domains such as charts. Unovis is the recommended chart library. Nagi provides only Card, surrounding controls, mode-independent series tokens, and a recipe that bridges CSS custom properties. Do not create a `Chart.vue` that proxies data, scale, axis, or datum-tooltip APIs through Nagi props. Treat generated DOM as a Nagi CSS library boundary.
- **Time is on our side**: `closedby`, anchor positioning, and Invoker Commands show the platform continuing to close gaps. A delegation layer gains capability without new code as soon as a gap closes. In an all-JavaScript implementation, native adoption instead turns custom implementations into debt. Do not treat feature differences as static defects that must be filled.

## 9. Anti-goals (must not be implemented)

- ❌ A public compound-component API such as `<NagiRoot>` / `<NagiTrigger>`. The prohibition covers library-shipped families of tags that distribute behavior; slots in an SFC owned by the user are outside it (§3.5).
- ❌ `asChild` / `render` prop patterns; the assumption that wrapping is required is itself unnecessary.
- ❌ Teleport / portals; the top layer replaces them. See §2.
- ❌ Custom focus traps; delegate to `<dialog>.showModal()`.
- ❌ Dropping to `popover="manual"` and implementing light dismiss or dismiss policy ourselves (§8.1).
- ❌ `data-state` that duplicates native or ARIA state.
- ❌ Bundling CSS into the core package, utility classes, or Tailwind dependencies.
- ❌ Embedding a JavaScript animation runtime such as spring physics in core.
- ❌ Creating elements with `document.createElement` inside directives; arrows and similar elements belong in Blueprint markup/CSS.

## 10. Validation roadmap (follow this order)

Each phase has an assigned hypothesis. **Do not advance until the phase's completion criteria are satisfied.** Do not reorder the phases. In particular, do not defer Phase 2 and mass-produce thin components, because Phase 2 contains the final unvalidated aspect of the composable form.

### Phase 0 — vertical slice (minimum proof)

**Hypothesis**: The contract selects the form, native delegation makes that form possible, and the two critical issues—controlled mode and Toast stacking order—can be solved.

**All four points must hold simultaneously for completion.** Do not proceed while any point is missing.

1. `usePopover` + `v-popover-trigger`, including `getSSRProps` — supports **both uncontrolled and controlled (`v-model:open`) modes**. Closing after asynchronous work must be straightforward through `v-model` (§4.4).
2. Dropdown Blueprint: a Nagi CSS-conformant SFC with `:popover-open` + `@starting-style` animation and Anchor Positioning + Floating UI fallback.
3. Demo A: under Nuxt delayed hydration, opening and closing work **before JavaScript arrives**, and the same SFC passes the Nagi CSS linter.
4. Demo B: **Dialog + Toast coexistence demo** — fire a toast while a modal dialog is open, and show the toast at the top rather than beneath the backdrop, proving §7's re-promotion logic.

Points 1 and 4 are difficult but mandatory pressure points. If the design fails here, stop implementation and return to revising this document.

### Phase 1 — extending the thin side

**Status: Complete (2026-07-16)**

**Hypothesis**: The Phase 0 pattern—attribute injection + native state—can be copied directly to other thin components.

- `useDialog` (delegates to `<dialog>` / `showModal`, supports both controlled modes, feature-detects `closedby`)
- `useTooltip` (hover/focus delay, `popover="hint"`, anchor positioning)
- `useDisclosure` (`<details>` based)

This phase validates implementation effort, not design. Any new design decision exposes a defect in the Phase 0 pattern and must be moved back into core.

### Phase 2 — DX validation for list composables (the final unvalidated aspect of the form)

**Status: Complete (2026-07-17)**

**Hypothesis**: Distributing attributes to `v-for` items through an `itemProps(item)`-style API is no more painful than wrapper tags.

- Target `useMenu`: typeahead, disabled skipping, keyboard selection, and focus restoration. Delegate the floating surface to the Phase 0 popover and implement only the interaction model anew.
- Among the alternatives in the WAI-ARIA APG, the chosen focus strategy is `aria-activedescendant`. DOM focus remains on the `role="menu"` container and items use `tabindex="-1"`. Do not mix this with roving tabindex.
- React Aria hooks already prove that a thick component can exist in composable form. **This phase validates Vue-template ergonomics, not possibility.**
- Completion criterion: compare the Menu Blueprint template side by side with its Reka UI equivalent. It must not be worse in line count, readability, or linter conformance. If it is worse, assess whether directive sugar (`v-menu-item`) can absorb the difference before proceeding.

### Phase 2.5 — validating the complete Dropdown form

**Status: Complete (2026-07-17)**

**Hypothesis**: The explicit DOM + attribute-injection form established with action items in Phase 2 remains easier to understand than compound components after adding the full Dropdown Menu feature set.

- Display-only parts: group, label, separator, and shortcut. Express them as semantic HTML and Blueprint anatomy rather than more dedicated components.
- Stateful items: checkbox item, radio group / radio item, indeterminate state, and policy for closing or retaining the menu after selection.
- Submenus: design a menu-tree model that shares open path, active item, focus owner, close depth, RTL, and pointer grace instead of nesting independent `useMenu` instances.
- Use nested Popover and Anchor Positioning, delegating overlay top-layer and collision handling to the platform wherever possible.
- Keyboard: handle Enter / Space, ArrowRight / ArrowLeft, Escape, Tab, and typeahead per hierarchy level; child-menu events must not be processed twice by their parent.
- Present both the complete Dropdown Menu SFC and a consuming SFC. Prioritize traceability of final DOM, state selectors, and CSS ownership from a single SFC.
- Completion criterion: compare against the same capability boundary as the Reka UI / shadcn-vue Dropdown Menu suite. Nagi's SFC must remain locally editable with submenu, checkbox, and radio included, and browser, keyboard, and focus tests must pass.

This phase does not pursue feature parity itself. It is the complete-form validation of whether the design—**hide behavior in core while exposing structure and integration**—survives a fully complex Dropdown.

**Verdict: it survives.** `useSubmenu(parent, triggerItem, options)` contains the menu tree's open path, focus owner, close depth, RTL, and pointer grace in core. The SFC directly shows native group, label, separator, shortcut, and prop application to each item. Close policy for action, checkbox, and radio items is also explicit per prop. The complete form, consuming SFC, comparisons, invariants, and validation results are recorded in `docs/phase2.5-dropdown.md`.

### Phase 2.6 — Dropdown items-schema Blueprint

**Status: Complete (2026-07-17)** — unit, type, SSR, `nagi-css check`, and browser tests all passed, including 10 Playwright tests for item recomputation and dynamic submenus. Findings—a nested SFC uses a surface-root class derived from the configured namespace + filename instead of an element class, and a surface does not own its margin—are recorded in `docs/phase2.6-dropdown-schema.md`.

**Hypothesis**: A Blueprint-local recursive items schema (§3.5) reduces consumer cognitive load and wiring mistakes while preserving the explicit-DOM version's behavior guarantees and Nagi CSS conformance.

This phase validates a Blueprint **distribution form** and is independent of the core-composable validation sequence. It may proceed in parallel with Phase 3.

- The schema is Blueprint-local (§3.5). Its seven node kinds are `action` / `link` / `checkbox` / `radio-group` / `group` / `separator` / `submenu`. `link` accepts a URL and emits a real `<a href>` as a basic web-standard item; it is not an escape hatch that accepts framework components. `label` is not an independent node; it is integrated into `group`, matching `role="group"` + `aria-labelledby`. `action` has `variant?: "danger"`. `checked` is a plain value, not `MaybeRefOrGetter`; the parent regenerates the complete items array as a computed value, and state remains intact because core identifies items with `getKey` and reads `toValue(items)`.
- Render submenus recursively with a self-referencing component inside the Blueprint because `useSubmenu` requires setup context. Core already supports dynamic registration/unregistration and needs no change.
- Do **not** put avatars, the Vue Router `<RouterLink>` component, the Nuxt `<NuxtLink>` component, descriptions, or permission control in the schema. Filter with a computed value for visibility control, and treat structural changes as extension-recipe subjects. Standard URL navigation always uses a `link` node with a real `<a href>`. A local adapter generated by `nagi-ui setup` converts a router-specific `to` object at the boundary into `href` plus framework-neutral `navigate` / `prefetch` callbacks before passing the node. Extend through ownership when a custom link component or active-class rendering is required.
- Demote the current hardcoded `DropdownMenu.vue` to a full-feature playground fixture. Keep the explicit-DOM style in documentation as an example escape path to composables.
- Completion criteria:
  1. The recursive renderer passes `nagi-css check`; otherwise reconsider the proposal itself.
  2. Browser tests lock in preservation of open path, active item, and focus owner when items are recomputed while the menu is open.
  3. Dynamic insertion and removal of submenu nodes do not leak registration/unregistration.
  4. Deliberately breaking the schema produces a TypeScript error at the changed location, an AI-agent-oriented metric.
  5. Ship an extension-recipe document and prove that requirements outside the schema, such as avatar or router-link, can be added as a local diff by following the recipe.

### Phase 3 — the core of the thick side

**Hypothesis**: The Phase 2 item-distribution pattern remains sound when combined with a selection model and input-driven filtering.

**Status: Complete (2026-07-18)** — Building on `useListbox`'s no-prune selection, `useCombobox` separates input value, committed selection, and the active option among candidates. Unit, type, SSR, `nagi-css check`, and browser tests validated `aria-activedescendant` with DOM focus retained on the input, filtering, disabled skipping, Enter/click commit, lossless Escape, and native Popover + Anchor Positioning. The stable path for Select delegates to native `<select>`; Nagi will not create its own `useSelect` or a Combobox-derived fallback. See `docs/phase3-listbox.md`, `docs/phase3-combobox.md`, and `docs/phase3-select-decision.md`.

- Implement `useListbox` (single/multiple selection) before `useCombobox` (input + filtering + activedescendant).
- Select's stable surface is ordinary `<select>` / `<option>`. Treat `appearance: base-select` as progressive enhancement that falls back to native rendering in unsupported environments; do not assume rich option DOM or `<selectedcontent>`.
- Although `<selectedcontent>` exists in the HTML Standard, defer adoption until the Vue compiler supports its native tag and nesting, Blink, WebKit, and Gecko ship stable implementations, and SSR/hydration plus keyboard/form interoperability are validated. Do not reimplement Select from Combobox merely for visual uniformity.

### Phase 3.5 — Verified integration

**Status: Complete (2026-07-18)** — Implemented `mergeNagiProps()`, template-only `eslint-plugin-nagi-ui/verified-bindings`, a final-DOM relationship verifier, and axe-core checks of open Blueprint states. The browser suite passed 28/28, including valid and corrupted DOM graphs and keyboard/focus contracts. See `docs/phase3.5-verified-integration.md`.

Mechanically protect the integration contract after a user or coding agent modifies a Blueprint, separately from behavior tests of the shipped core.

- `mergeNagiProps()` — Merge events, classes, styles, and token-list ARIA attributes. Throw a semantic-conflict exception when any other duplicated values differ. Do not freeze reactive getters.
- `eslint-plugin-nagi-ui` — Validate from the Vue template AST where `triggerProps`, `menuProps`, `itemProps(item)`, and similar objects are applied, required native attributes, direct overrides, multiple object bindings, and `v-for` keys. Until a parser supports TypeScript 7, use the official `parser: false` template-only pass, and validate script data flow and parent-child relationships across component boundaries at runtime.
- Runtime DOM verification — `verifyNagiDom()` / `assertNagiDom()` and explicitly development-enabled `observeNagiDom()` inspect dynamic ID references, active descendants, duplicate ids, native popover targets, and trigger/popup relationships in the real DOM. Do not introduce an implicit production observer.
- Rendered accessibility checks — Run axe-core WCAG 2.1 AA checks with Action Menu, complete Dropdown + submenu, Listbox, Combobox, Dialog, and Tooltip open, alongside Playwright keyboard/focus contract tests. Do not exclude rules.
- Nagi CSS owns the owned-DOM/selector contract; Nagi UI lint owns behavior wiring. Do not mix their responsibilities.

This phase comes later to avoid fixing lint rules before the Menu/Listbox/Combobox prop contracts stabilize and then paying for duplicate revisions.

### Phase 4 — productization

**Status: Complete (2026-07-21)** — Shipped normal package-first / own-on-demand use,
source ownership, upstream tracking, the v0 catalog, self-selection around constraints, and
a consumer-side real-browser regression contract as one continuous product path. The links below
are the canonical sources for each slice.

**Hypothesis**: package-first / own-on-demand (§3) works in implementation: normal use requires only a package import + theme tokens, and owned source remains maintainable. Do not call it a product until the implementation catches up to §0's one-sentence definition.

Slice order:

1. **Package realization** — **Complete (2026-07-18; theme contract revised 2026-07-21)**. Moved Blueprints to `packages/core/blueprints/` and exported raw SFCs through `/components`. Semantic tokens are managed through fallback-free Blueprint references, `default-theme.css`, coverage checks, and replacement-theme diagnostics. The playground proves both the package-consumption path and token-only brand customization. Design and implementation results: `docs/phase4-package-design.md`.
2. **Fix the `own` / `diff` CLI and `@nagi-source` metadata format** — **Complete (2026-07-18)**. Implemented `nagi-ui own/diff/list` as package-bundled binaries and fixed metadata as a per-file `@nagi-source <component>/<file>@<version>` stamp. `diff` classifies clean / modified / drifted / unknown-source and can serve as a CI gate. See `docs/phase4-ownership-cli.md`.
3. **Early validation experiments** — **Coding-agent arm complete (2026-07-21)**. Across all three boundaries—Button (theme), Dropdown (ownership), and Combobox (upstream tracking)—an agent without context independently chose the intended path without prompting: token override, own + extension recipe, or three-way merge + stamp update. All passed. Byproducts: a CLI-test bug fix; restricting the `diff` gate to `drifted` / `unknown-source`; and a procedure to secure a merge base by committing immediately after `own`. Recorded in `docs/phase4-validation-experiments.md`. A human arm and repeated runs remain future work.
4. **Expand Blueprints** — **Complete (2026-07-21)**. Added Popover, Dialog, Tooltip, Disclosure, and Toast to close gaps with the public behavior core, and fixed the styling-only baseline as Button, Card, Alert, and Badge. Shipped all 12 components as package and ownable raw SFCs, with a consumer Nagi CSS preset. Validated unit 103/103, SSR, ownership, verified bindings, theme parity, owned/consumer Nagi CSS, and browser + axe 37/37. Future styling-only additions proceed independently of phases and from real requirements; do not reopen this slice. See `docs/phase4-blueprint-catalog.md`.
5. **Consumer guidance / test recipe** — **Complete (2026-07-21)**. Translated §8 into consumer-facing [`docs/when-not-to-use-nagi-ui.md`](docs/when-not-to-use-nagi-ui.md), explicitly assigning fine-grained dismiss policy, arbitrary stacking, interactive backdrops, gesture sheets, Motion-level animation, custom Select, and similar requirements to other libraries component by component. Shipped copyable Vitest Browser Mode / Playwright contracts in the npm package under `packages/core/recipes/testing/`. Fixed keyboard, focus, dismiss, form, `assertNagiDom`, axe, SSR/zero-JavaScript selection criteria, and the update loop: immediate commit after `own` → `diff` → merge → real-browser test. Validated unit 116/116, TypeScript 7, verified bindings, owned/consumer Nagi CSS, browser + axe 41/41, and inclusion of six recipe files in the package tarball.

---

## Revision History

- **2026-07-22** Added PreviewCard, RangeSlider, and Stepper as expanded-catalog interaction slice 2, moving general-UI progress to 43/54 = 79.6% and Base UI alignment to 31/37 = 83.8%. PreviewCard preserves a real link while its composable owns only delayed pointer/focus intent and native-popover synchronization. RangeSlider retains two real range inputs, constant lower/upper tab order, native form/reset behavior, and native `input`/`change` events behind one shared pointer rail. Stepper remains flat navigation with native buttons and `aria-current="step"`; wizard panels, validation, routing, and linear progression stay in the application. The final SFC audit leaves editable markup and policy visible while hiding timer, browser synchronization, sanitization, and reset mechanisms. Canonical source: `docs/expanded-catalog-interaction-slice-2.md`.
- **2026-07-22** Fixed Unovis as the recommended chart integration. Added no chart API to the core runtime, components, or ownership registry. Added six mode-independent series tokens, a bridge to Unovis's public CSS custom properties, a package recipe that composes Unovis directly inside Card, and the `/chart.html` playground. Unovis-generated DOM is a library boundary for consumer Nagi CSS; datum tooltip, data, scale, and axis stay in Unovis vocabulary. Fixed a contract that combines dash, labels, and a native table rather than relying on color alone.
- **2026-07-22** Added InputGroup, NumberField, and ToggleGroup as expanded-catalog anatomy slice 1. InputGroup combines only caller-owned native controls and explicit Nagi CSS slot surfaces without duplicating the Input API. NumberField preserves a real `input[type=number]` and native stepping, hiding only step/reset synchronization in a fixed two-argument adapter. ToggleGroup renders a flat schema as real pressed buttons and does not add roving focus. Re-audited SFC exposure and validated FormData/reset/keyboard/forced-colors plus package/ownership/preset/tarball paths. Updated progress to expanded 40/54 = 74.1% and Base UI aligned 29/37 = 78.4%. Confirmed unit 221/221, browser + axe 80/80, TypeScript 7, integration lint, and owned/consumer Nagi CSS. Canonical source: `docs/expanded-catalog-anatomy-slice-1.md`.
- **2026-07-22** Added FileInput, Pagination, and Rating as the expanded-catalog small-interactive slice, updating general-UI progress to 37/54 = 68.5%. FileInput delegates the chooser, FileList, form integration, and reset to a visible native control. Pagination renders a flat schema as real links/native buttons and owns neither routing nor data fetching. Rating is limited to a native radio group and a fixed two-argument reset helper. Audited final exposure across every SFC and validated forced colors, keyboard, FormData, reset, and package/ownership/preset/tarball paths. Also fixed borderline shortcut contrast in the themed Dropdown, found by the full browser gate, through a theme-token override. Confirmed unit 208/208, browser + axe 78/78, TypeScript 7, integration lint, and owned/consumer Nagi CSS. Canonical source: `docs/expanded-catalog-small-interactive-slice.md`.
- **2026-07-22** Removed the third argument from every component overload. Broadly useful, stable changes use named props; schema or interaction-algorithm changes use the complete single-argument `useX({...})`. No path lets model, form, ARIA, and renderer observe different settings. Added `orientation` / `dir` / `loop` props to Listbox, and standardized all components on a boundary with neither a generic `:options` prop nor a Nagi-specific override DSL.
- **2026-07-22** Added Breadcrumb, ButtonGroup, EmptyState, Kbd, Skeleton, Spinner, and Textarea as the expanded-catalog thin slice, updating general-UI progress to 34/54 = 63.0%. Limited the slice to boundaries achievable with native behavior/presentation, adding no router node, duplicated Button API, shortcut registry, loading state machine, or autosize behavior. Connected package exports, ownership, consumer preset, and catalog to the same SFCs. Removed the hand-written component-class map from the Nagi CSS preset and standardized convention derivation from `componentClassPrefix: "n-"` + component name. Confirmed unit 198/198, browser + axe 75/75, TypeScript 7, owned/consumer Nagi CSS, and tarball inclusion. Canonical source: `docs/expanded-catalog-thin-slice.md`.
- **2026-07-22** Normalized the full Base UI + shadcn-vue + PrimeVue catalogs into Nagi slices and expanded the adopted general-UI scope to 54 components (27 shipped + 27 backlog). Overall progress became 27/54 = 50.0%, while the former 27/37 = 73.0% remains alongside it as the Base UI-aligned metric. Separate products such as Nagi Grid, Native/recipe items, and Declines are excluded from the denominator. Canonical source: `docs/expanded-vue-component-catalog.md`.
- **2026-07-22** Migrated `.zone` to `.unit` across shipped Blueprints, the playground, and automated tests to match Nagi CSS's STN-anatomy vocabulary change. Kept no backward-compatible alias, and standardized old Blueprint color literals found during the same audit on existing theme tokens. Moved the Phase 0 zero-JavaScript Dropdown that had leaked into the package to `demos/NativePopoverDropdown.vue`, making the schema-driven version the single package/ownership source. Unit tests prohibit reintroduction of the old anatomy and color literals; both canonical and consumer cross-repository lint passed.
- **2026-07-22** Added Accordion and AlertDialog as Base UI alignment D3, updating Base UI-aligned progress to 27 shipped out of 37 adopted slices = 73.0%. Accordion renders a flat items schema into native `<details name>`, with controlled `openKeys` shared by single/multiple modes, disabled summaries, and content-only summary/panel slots. AlertDialog is separate from visual Alert and fixed to native modal `<dialog role="alertdialog">`, a required description, explicit Cancel/Action, and autofocus on Cancel. The post-implementation SFC-wiring audit hid generated names, native toggle ordering, disabled activation, and fixed dismiss policy in `/component-controls`, leaving only schema interpretation, public events, IDREF, DOM, and CSS in the SFC. Canonical source: `docs/base-ui-alignment-d3-accordion-alert-dialog.md`.
- **2026-07-22** Reclassified composable option objects in Blueprints. One-to-one prop forwarding, getter conversion, and stable flat-schema mappings are hidden in a component overload of the same public `useX`, which can expand to complete single-argument options when changing the entire schema/algorithm. Removed every `useXControl` alias and aligned fixed bindings such as Select and Slider with component-named `useSelect` / `useSlider`. `component-controls` retains only fixed mechanisms such as native reset and focus repair; recursive Menu schemas, DOM branches, and public-event conversion stay in the owned renderer. Decision table and recipe: `docs/blueprint-wiring-audit.md` and `packages/core/recipes/control-expansion.md`.
- **2026-07-22** Audited wiring in every shipped Blueprint by asking whether users should modify it. Hid Toast lifecycle/focus repair, Avatar image races, Combobox's native form channel, Tabs's model bridge, and Button's disabled activation in package composables; moved Dropdown node-to-option conversion to an editable renderer module. Simplified `useAttrs()` in Input/Checkbox/Switch/Slider to template `$attrs`; Combobox also safely merges additional attributes with behavior props onto the native input. A normal `own` does not copy composables; unit tests guarantee only the relative dependency closure for schema/renderer files. Added §3.5 criteria treating `watch` and similar APIs as review signals for mechanism leakage rather than prohibitions. Current shipped SFC counts for watch/lifecycle/direct DOM globals/useAttrs are all zero. Canonical source: `docs/blueprint-wiring-audit.md`.
- **2026-07-22** Added Avatar, Separator, and Toggle as Base UI alignment D2, updating component progress to 25 shipped out of 37 adopted slices = 67.6%. Avatar uses a native image, deterministic fallback, and error/src recovery; Separator uses horizontal `<hr>`, vertical ARIA, and decorative modes; Toggle is limited to native `<button aria-pressed>` + a controlled model. No compound, asChild, or custom-state vocabulary was introduced. At the same time, removed the `Nagi` prefix from every SFC filename and standardized every Blueprint surface on Nagi CSS's strict `n-` + filename contract.
- **2026-07-22** Retained only the design for composable-download ownership layers (`vue` / `all`) and deferred implementation in favor of expanding the component catalog. This is separate from hiding mechanisms inside package composables; do not resume until real demand for composable ownership is observed.
- **2026-07-21** Extended Card `title` / `description`, Alert `title`, Dialog `title` / `description`, Disclosure `summary`, and Badge `label` with content-only slots of the same names while retaining plain-text prop fallbacks. §3.5 now states that props and slots are not an exclusive choice: a minimal slot that preserves its owned wrapper may accompany a prop only when demand for rich content in a stable visible part is established. The SFC retains required text props, ARIA IDREF, native summary behavior, header anatomy, and default typography/tone. Whole-header slots, passing behavior props through slots, and compound parts remain declined.
- **2026-07-21** Completed the first strengthening slice of the cross-library benchmark. Added a free-markup `icon` slot to Alert, a `small | default | large` enum to Button, and a `footer` slot that preserves Card's neutral wrapper. Added no compound parts, icon-name DSL, loading behavior, header action, or media API. The public `small` maps to CSS identity `-compact` to avoid collision with Nagi CSS's HTML vocabulary. Card internals retain STN wrappers without inventing native landmarks. Component progress became 22 shipped of 37 adopted slices = 59.5%; Native/recipe and Decline are excluded from the denominator.
- **2026-07-21** Revised component benchmarking from a single Base UI catalog comparison to triangulation across Base UI (behavior/accessibility), shadcn-vue (Vue anatomy/ownership), and PrimeVue (package-first expectations). Visible anatomy shared by shadcn-vue and PrimeVue counts as product evidence, while APIs are translated through §3.5's priority order. Common features that conflict with native-first may be declined or assessed as separate slices. The ledger for all 22 shipped components + 37 Base UI entries is `docs/base-ui-component-comparison.md`.
- **2026-07-21** Revised the Theme contract to be fallback-free. Removed literal fallbacks from Blueprint `var(--nagi-*)` references and centralized defaults for 28 tokens in `default-theme.css`. Manifest/default/Blueprint-vocabulary parity, `nagi-ui theme check`, and opt-in computed-cascade warnings expose omissions; old `theme.css` remains only as a compatibility alias. Fixed the ownership-layer design in `docs/package-ownership-model.md` as routing modules that never rewrite imports in edited SFCs, an initial `vue` / `all` surface, and version/path/hash sidecars, but deferred its implementation order.
- **2026-07-21** Added Blueprint wiring-exposure criteria to §3.5. Policy/markup intended for post-ownership changes stays in the SFC; mechanisms not intended to change, such as native-event ordering or Vue-model/DOM-property synchronization, are hidden in small fixed-meaning helpers regardless of reuse count. Do not create universal helpers or config DSLs. Keep processing that must change with renderer DOM visible.
- **2026-07-21** Completed Tabs as Base UI alignment D1. Implemented independent `useTabs` with manual/automatic activation, roving tabindex, horizontal/vertical + RTL, disabled skipping, controlled canonicalization, dynamic fallback, and DOM-focus repair. The single package/ownable SFC handles rich markup with a flat items schema + content-only `panel` slot that passes no behavior, and declines compound parts, Indicator geometry runtime, and lazy automatic panels. A local bridge fixed a real browser-specific bug where rereading fallback before the parent prop reflected `defineModel` caused incorrect focus, plus a controlled-SSR mismatch that hid every panel. Selection and focus remain distinct in forced colors. Confirmed unit 155/155, browser + axe 69/69, TypeScript 7, SSR, verified bindings/runtime IDREF verifier, owned/consumer Nagi CSS, and real tarball inclusion. Canonical source: `docs/base-ui-alignment-d-tabs.md`.
- **2026-07-21** Completed Base UI alignment C. Split Toast into explicit `createToastManager()` and a single Blueprint. Added structured title/description/tone/action, polite/assertive announcements, explicit-id upsert, limits, update/close-all/promise, timer pause/resume, and F6 focus return cycling through multiple regions. Declined Provider, Portal, singleton, swipe, and stack physics. F6 never leaves a native modal for an outside renderer, and live-node inert boundaries are fixed. Confirmed unit 137/137, browser + axe 59/59, TypeScript 7, verified bindings, owned/consumer Nagi CSS, and real tarball inclusion. Canonical source: `docs/base-ui-alignment-c.md`.
- **2026-07-21** Completed Base UI alignment B. Added Input, Checkbox, Radio, Switch, Select, Fieldset, Progress, Meter, and single-thumb Slider as native-first package/ownership Blueprints. Added disabled/read-only/required, selected-key submission, clear, empty/loading, and reset to Combobox, while separating popup and listbox in ARIA. Core contains only a small bridge that keeps DOM, Vue model, and FormData aligned after native reset. Declined compound Field, `useField()`, custom Select, and multi-thumb Slider. Confirmed unit 124/124, browser + axe 51/51, TypeScript 7, verified bindings, owned/consumer Nagi CSS, and real tarball inclusion. Canonical source: `docs/base-ui-alignment-b.md`.
- **2026-07-21** Completed Phase 4. Published consumer guidance for product requirements incompatible with web-standard delegation and for per-component mixing decisions. Bundled Vitest Browser Mode / Playwright recipes usable by package and owned components in the npm package. After `own`, the CLI also directs users to commit immediately, use the test recipe, and gate with `diff`, connecting "owned without being abandoned" to an executable consumer contract. Confirmed unit 116/116, browser + axe 41/41, and real tarball inclusion.
- **2026-07-21** Added framework-integration setup. `nagi-ui setup` selects Vue/Nuxt, native/Vue Router/Nuxt Link, and native image/Nuxt Image, then generates a local adapter. Dropdown schemas accept neither a router DSL nor framework components; they add only optional `navigate` / `prefetch` callbacks to a real `<a href>`. Nuxt Image's `useImage` also produces a stable URL for standard `<img>` attributes, preserving one package/owned SFC.
- **2026-07-21** Base UI alignment A1. Added a `link` node owning a standard `<a href>` to the Dropdown schema, separating it from framework-specific router-link/component escape hatches. Also added focusable-disabled Button, disabled Disclosure/Tooltip, Popover/Tooltip positioning props, Dialog description/actions, and neutral Card anatomy within existing native-first/small-API discipline. Confirmed unit 108/108, browser + axe 40/40, TypeScript 7, verified bindings, and owned/consumer Nagi CSS.
- **2026-07-21** Completed Phase 4 slice 4. Fixed the styling-only baseline to Button, Card, Alert, and Badge as specified by CHARTER §3.5, and registered a 12-component v0 catalog—these four plus eight behavior-backed components—across package, ownership, and preset paths. Promoted six positive/warning tone tokens proven across two components, Alert + Badge. In Nagi CSS, separated public prop `success` from CSS identity `-positive`. Confirmed unit 103/103 and browser + axe 37/37.
- **2026-07-21** Completed the Phase 4 slice 4 behavior catalog. Added package/ownable SFCs for Popover, Dialog, Tooltip, Disclosure, and Toast, closing gaps between the public behavior core and component catalog. Bundled a Nagi CSS preset defining package-component boundaries and slot sub-surfaces, separating owned-source checks from consumer checks. Confirmed unit 102/102, browser + axe 36/36, TypeScript 7, verified bindings, theme parity, and Nagi CSS.
- **2026-07-18** Completed Phase 4 slices 1–2. Implemented the package as a real artifact—raw SFC distribution, `/components` + `theme.css` exports, 22 semantic tokens + parity tests—and the ownership CLI (`nagi-ui own/diff/list`). Fixed `@nagi-source <component>/<file>@<version>` as the §3 maintenance contract's definitive metadata format.
- **2026-07-18** Redefined Phase 4 around the remaining package-first work. Explicitly recorded the slice order—package realization → own/diff CLI → early validation experiments → Blueprint expansion → document when not to use Nagi—and its validation hypotheses. Made `docs/phase4-package-design.md` the canonical design source for slice 1.
- **2026-07-18** Cleaned up remaining consequences of the package-first revision (§3). Updated copy-in assumptions in §3.5 and elsewhere to own-on-demand terminology. Documented the consequence that an items schema is exposed during package use as the component's minimal props API, tied to its component version, and strengthened the corresponding "do not grow a DSL" discipline. Corrected §8.2's basis for coexistence from copy-in distribution to the absence of wrapper tags, providers, and global state. Added the consumer-styling boundary during package use to `docs/package-ownership-model.md`.
- **2026-07-18** Completed Phase 3.5. Added `verifyNagiDom()` / `assertNagiDom()` / opt-in `observeNagiDom()` to inspect final-DOM IDREF, active-descendant, and native-popover relationships, plus axe-core checks of every major open Blueprint state. Fixed secondary-text contrast in Dropdown, Listbox, and Combobox found by axe without excluding rules. Confirmed browser 28/28.
- **2026-07-18** Began Phase 3.5 slice 1. `mergeNagiProps()` validates class/style/event/token-list ARIA composition, semantic conflicts, and live getters. `eslint-plugin-nagi-ui/verified-bindings` inspects all shipped Blueprints for application targets of behavior props, native attributes, direct overrides, multiple bindings, and keys. Because TypeScript ESLint cannot read TS7, adopted vue-eslint-parser's official template-only mode rather than `skipLibCheck` or a TypeScript downgrade.
- **2026-07-18** Revised the distribution model from copy-first to package-first / own-on-demand. Normal use consumes themeable package components; only deep changes own the same SFC. Fixed in §3 the package-build/copy-source single source, Theme → small API → few slots → ownership ladder, and owned-source version/diff/lint/integration maintenance contract. Success criteria and failure modes are recorded in `docs/package-ownership-model.md`.
- **2026-07-18** Completed Phase 3. Chose native `<select>` as Select's stable path, `appearance: base-select` as progressive enhancement, and deferred `<selectedcontent>`. Separated the standardization strength of customizable Select as a whole from `<selectedcontent>` alone, and fixed promotion criteria as Vue-compiler support, stable implementation in all three engines, and interoperability validation. Do not create a Combobox-derived Select fallback.
- **2026-07-17** Completed the Phase 3 Listbox + Combobox slice. Combobox separates input value, committed selection, and provisional active option, and filtering never prunes committed selection. Following the APG, candidate focus for popup options is represented with `aria-selected`; therefore corrected §6's `data-active` example to Menu/Listbox.
- **2026-07-17** Added §3.5, "Choosing a Blueprint form," with the owned DOM / props / items schema / slot priority order. Clarified that the compound prohibition covers library-shipped families of behavior-distributing tags, and justified slots in copy-in SFCs as declared boundaries; also updated §9. Fixed "User owns the DOM" to mean that the DOM is traceable through code the user owns. Added menu items schemas as Phase 2.6, Blueprint-local, not promoted to core, and able to run in parallel with Phase 3. Styling-only Blueprints may be added independently of phase progress.
- **2026-07-17** Completed Phase 2.5. Implemented checkbox/radio/mixed state, an arbitrarily deep `useSubmenu` menu tree, LTR/RTL keyboard behavior, pointer grace, and nested Popover + Anchor Positioning. The complete Dropdown Blueprint and consumer SFC passed Nagi CSS plus unit/type/browser tests, so the explicit DOM + attribute-injection form continues into Phase 3.
- **2026-07-17** Added complete-form validation of Dropdown Menu to Phase 2.5. Do not conclude from action-menu success alone; verify SFC readability through checkbox, radio, submenu, and menu-tree coordination before proceeding to Listbox. Also added Phase 3.5, which implements `mergeNagiProps`, Nagi UI-specific lint, and development assertions after the props contract stabilizes.
- **2026-07-16** Completed Phase 1. Because no standard command exists for non-modal Dialog opening, use a `show()` fallback while keeping native `cancel` preventable. Tooltip uses the union of trigger hover, tooltip hover, and focus.
- **2026-07-17** Completed Phase 2. Validated Vue-template DX with `useMenu<Item>()`'s `itemProps(item)` and the ActionMenu Blueprint. Fixed Menu's focus strategy to `aria-activedescendant` and forbade mixing it with roving tabindex. Rationale, comparison, and invariants are recorded in `docs/phase2-menu.md`.

- **2026-07-15** Made the repository's `CHARTER.md` canonical. Revised §4.4's controlled-mode implementation from "prevent `beforetoggle`" to "bidirectional mirror synchronization (sync flush + idempotent application)," because the Popover API makes hide-direction `beforetoggle` non-cancelable. The three goals in §4.4 are unchanged.
- **2026-07-15** Corrected §7's Toast re-promotion mechanism: `showModal()` force-closes every open popover per the HTML specification, so "hide then show if already open" cannot work. Re-promotion now depends on `useToast`'s own model—the presence of live toasts—rather than the region's DOM state, and re-shows when a top-layer peer toggles open. This was detected and fixed as a real implementation bug.
