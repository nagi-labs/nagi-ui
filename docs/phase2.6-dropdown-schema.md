# Phase 2.6 — Dropdown items schema Blueprint

Status: Complete. Unit / type / SSR / `nagi-css check` verified; browser
suite (`vp run test:browser`) passed 10/10, including the new spec for items
recompute while the tree is open and dynamic submenu registration/removal.

## Hypothesis (CHARTER §3.5 / Phase 2.6)

A blueprint-local recursive items schema keeps the behavior guarantees and
Nagi CSS conformance of the explicit-DOM Dropdown while reducing caller-side
cognitive load and wiring mistakes. The schema is Blueprint-local and owned
together with its renderer — it is not a core composable API and must not be
promoted into the composable layer. Under the package-first model (CHARTER
§3), the union doubles as the package component's minimal props API,
versioned with the component; the extension recipe below applies after
`own`, and speculative node kinds are not added to the package API.

## Files

| File | Role |
| --- | --- |
| `packages/core/blueprints/menu/dropdown-schema.ts` | `DropdownMenuNode` union + `menuEntries()` flatten + entry builders |
| `packages/core/blueprints/menu/DropdownMenu.vue` | Public entry: trigger + root list; `useMenu` over flattened entries |
| `packages/core/blueprints/menu/DropdownMenuItem.vue` | One node per instance; self-recursive for `group` |
| `packages/core/blueprints/menu/DropdownSubmenu.vue` | One `useSubmenu` per submenu node; mutual recursion with the item SFC |
| `playground/src/DropdownFixture.vue` | The former hardcoded blueprint, demoted to the full-feature fixture |
| `playground/src/DropdownLab.vue` | Schema consumer (LTR / RTL) beside the explicit-DOM fixture |

Consumers pass data only:

```vue
<DropdownMenu label="File actions" :items="items" />
```

`items` is a `computed<readonly DropdownMenuNode[]>` in the caller. State such
as `checked` and `value` is written as plain values; reactivity comes from the
computed rebuilding the array. Core keys every piece of menu state through
`getKey` and reads items via `toValue()`, so identity churn on recompute is
safe (`packages/core/src/menu.ts`).

## Node vocabulary (seven kinds)

`action` (`variant?: "danger"`, `shortcut?`, `closeOnSelect?`), `link`
(a real `<a href>` with keyboard navigation under `aria-activedescendant` and
optional framework-neutral `navigate` / `prefetch` callbacks), `checkbox`
(plain `checked: boolean | "mixed"`), `radio-group` (expands to one selectable
entry per radio item), `group` (owns its label; groups do not nest),
`separator`, `submenu` (recursive `items`).

Deliberately excluded: avatar / the Vue Router `<RouterLink>` or Nuxt
`<NuxtLink>` component itself / description / permission visibility.
Visibility is caller-side array filtering; structural changes belong to the
extension recipe below. The shipped `link` node does not accept `to` objects,
router props, or a component escape hatch. `nagi-ui setup` instead translates a
router location at the application boundary into the node's real `href` and
framework-neutral `navigate` / `prefetch` callbacks; see
`docs/setup-integrations.md`.

## Why the renderer recurses through components

`useSubmenu()` must run in a setup context, so each submenu node mounts
`DropdownSubmenu.vue`, which registers itself into the parent controller and
unregisters on unmount (`registerChild` / `unregisterChild` +
`onBeforeUnmount` in core). Dynamic submenu nodes therefore work without core
changes. The ESM import cycle DropdownMenuItem ↔ DropdownSubmenu resolves at
render time and was exercised by SSR-rendering the lab page.

## Contract learnings (validated against `nagi-css check`)

1. **Each internal SFC is its own surface.** A template root carrying only an
   element class (`item`) cannot anchor top-level CSS
   (`top-level-surface-only`). The root must carry exactly one base class,
   named from the file (`dropdown-menu-item`, `dropdown-submenu`), replacing
   the element class (`single-base-identity`, `surface-root-name`).
2. **A surface does not own its external layout.** Separator spacing as
   `margin` on the surface root is rejected (`surface-external-layout`); it is
   expressed inside the surface as padding + `background-clip: content-box`.
3. **Do not declare blueprint-internal SFCs as `componentClasses`.** That
   marks them as opaque library boundaries and forbids `>` inside their own
   stylesheets. Parents must not reach into a child surface at all; each
   surface styles its own subtree, and recursion is what styles arbitrary
   depth for free.

The external check config (uncommitted, `.sandbox/nagi.config.mjs`) only needed
`packages/core/blueprints/menu/*.vue` plus the playground files in its file lists —
`semantic: {}` remains empty.

## Extension recipe (the deliverable that makes owned schema work)

To add a node kind — e.g. an account row with an avatar — every step is a
local diff in code you own:

1. **Union member** in `dropdown-schema.ts`:

   ```ts
   export interface DropdownMenuAccountNode {
     type: "account";
     key: string;
     name: string;
     email: string;
     avatarSrc: string;
     onSelect: () => void;
   }
   // add to DropdownMenuGroupChildNode, and to menuEntries() as a selectable
   // entry (kind: "action"-like activation via itemProps).
   ```

2. **Template branch** in `DropdownMenuItem.vue` — bind
   `menu.itemProps(entry, options)` exactly like the action branch; the ARIA
   and focus wiring stays inside the renderer:

   ```vue
   <li v-else-if="node.type === 'account'" class="n-dropdown-menu-item" role="none">
     <button class="button" type="button" v-bind="menu.itemProps(accountEntry(node), ...)">
       <img class="image -avatar" :src="node.avatarSrc" alt="" />
       <span class="text">{{ node.name }}</span>
       <span class="text -detail">{{ node.email }}</span>
     </button>
   </li>
   ```

3. **CSS block** under `.n-dropdown-menu-item` in the same file.
4. **Run `nagi-css check`**, `vp run test`, `vp run typecheck`.

Native URL links ship as the `link` node. Vue Router and Nuxt client navigation
normally use the setup-generated callback adapter while preserving real anchor
semantics and the `menu.itemProps()` wiring. Rendering the actual
`<RouterLink>` / `<NuxtLink>` component (custom slot, active-state markup, or a
router-specific link policy) remains an ownership recipe.

Do **not** add an `#item` slot instead: passing `itemProps` through a slot for
callers to bind is behavior wiring through a slot boundary — the violation
named in CHARTER §3.5 — and reopens the per-usage wiring-mistake surface this
schema exists to close.

## Verification

- **Unit** (`tests/dropdown-schema.test.ts`): flatten order, radio expansion,
  separator/group handling, submenu children isolation, disabled defaults —
  `vp run test`, 55 pass.
- **Types** (`tests/types/dropdown-schema.ts`): full valid tree compiles;
  `@ts-expect-error` fixtures pin that misspelled discriminants, missing
  handlers, wrong `checked` payloads, nested groups, and unknown variants
  error at the mutated property — `vp run typecheck` clean.
- **SSR execution**: `DropdownLab.vue` renders through Vite `ssrLoadModule` +
  `renderToString` with all roles/ids/popover wiring present (also proves the
  component cycle and per-level `useSubmenu` registration execute).
- **`nagi-css check`**: clean over `packages/core/blueprints/menu/*.vue`,
  `DropdownLab.vue`, and `DropdownFixture.vue`.
- **Browser** (`tests/browser/dropdown.spec.ts`): the pre-existing five specs
  run against the schema-driven blueprint unchanged; a sixth spec covers
  items recompute while the tree is open (checkbox toggle inside an open
  submenu) and dynamic submenu registration/removal ("Show advanced").
  `vp run test:browser`: 10 passed.

## Relationship to the explicit-DOM form

The explicit form remains the escape path — `playground/src/DropdownFixture.vue`
is the working example, and `useMenu` / `useSubmenu` stay the supported
low-level API. The schema renderer is the shipped default because menus are
data-shaped UI; this is a menu-specific judgment (CHARTER §3.5), not a general
blueprint policy.
