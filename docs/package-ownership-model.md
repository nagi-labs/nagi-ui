# Package-first / own-on-demand distribution model

Status: Architecture decision (2026-07-18).

## One-sentence definition

The final form of Nagi UI combines PrimeVue's installation experience with
shadcn's source ownership.

Use components from the themeable npm package by default, with theme tokens and
a small API. Move only the components that outgrow those mechanisms into source
ownership.

```ts
import { DropdownMenu, Listbox } from "@nagi-labs/nagi-ui/components"
import "@nagi-labs/nagi-ui/default-theme.css"
```

```sh
vp exec nagi-ui own dropdown-menu
```

Conceptually, the latter copies a complete source set like this into the
consumer repository:

```text
src/components/nagi/dropdown-menu/
  DropdownMenu.vue
  DropdownMenuItem.vue
  DropdownSubmenu.vue
  dropdown-schema.ts
```

The consumer then switches to a local import, and both the consumer and coding
agents edit the SFC directly.

## Why a hybrid model

A copy-first model makes ownership explicit, but requires the majority of users
who never customize a component to manage its source, increasing installation
and update costs. A package-only model makes updates easy, but must continually
expose deep customization requirements through props, slots, render props, and
pass-through APIs.

Nagi fixes the boundary between these approaches in this order:

1. **Theme tokens** - color, spacing, radius, typography, shadow, control size,
   and state appearance
2. **Small props / item schemas** - strings, booleans, enums, and homogeneous
   items
3. **A few declared slots** - only for genuinely free-form markup
4. **Source ownership** - changes to DOM structure, specialized elements, or
   behavior integration

The package API can remain small because it does not need to keep adding avatar,
router-link, specialized layout, and similar concerns to a stable DSL. Beyond
that boundary, consumers own the source.

## Single-source principle

The package and ownership versions must not be separate implementations.

```text
packages/core/blueprints/menu/DropdownMenu.vue
                 |-- package component build
                 `-- own command copy source
```

Behavior, accessibility, browser workarounds, markup, and default styling are
always fixed in the same SFC. Allowing duplicate implementations creates the
worst possible fork: the package version is fixed while the copy source remains
broken.

## Boundary of Nagi's guarantees

While using package components, styling is limited to theme tokens and the
component's public API: props and declared slots. A package component root is a
UI library boundary class under the Nagi CSS contract. Consumer CSS that reaches
internal DOM requires a declared descendant step across that boundary, making
the contract explicit that the internal DOM is not consumer-owned. Wanting to
style internal markup or selectors directly marks either a request for a new
theme token or the transition to source ownership.

Package consumers receive fixes through normal version updates. After ownership,
local source takes precedence and is not updated automatically. This reversal is
risky because the most complex components, where fixes matter most, are also the
most likely to be owned.

The ownership feature therefore includes at least this complete set:

- metadata in every source file recording the source component and version
- a `diff` workflow for comparing owned and installed/upstream source
- a migration note for each breaking release that requires version-specific
  action
- Nagi CSS lint and Nagi UI behavior lint
- keyboard, focus, form, and accessibility integration-test recipes

Do not build a generic migration engine in advance. Ship the migration note
required by each release that introduces a breaking change. There are no past
breaking releases to migrate from in v0. Routine upstream tracking is detected
through `diff` and consumer tests; add version-specific instructions to the
maintenance contract only when such instructions become necessary.

The metadata format was **fixed** after implementation validation in Phase 4,
slice 2 (see `docs/phase4-ownership-cli.md`):

```html
<!-- @nagi-source dropdown-menu/DropdownMenu.vue@0.4.0 -->
```

`nagi-ui own` stamps this marker when copying. `nagi-ui diff` reports `clean`,
`modified`, `drifted`, or `unknown-source` and returns an exit code suitable for
a CI gate.

## Deferred design: `vue` / `all` ownership layers

Status: **Design fixed, implementation deferred** (2026-07-22). Component-catalog
expansion takes priority. Do not start this as the next slice until concrete
demand for composable ownership is observed.

Composables for fixed behavior remain package imports and are not copied by the
normal `own <component>` command. Schema and renderer modules imported by an SFC
through relative paths are editable source dependencies and are copied with the
component. CLI tests inspect the transitive closure of relative imports across
Vue and TypeScript files and reject omissions from the registry.

Current canonical SFCs use a public `useX(props, model)` overload to map stable,
standard schemas and props to headless composables. Common stable settings
belong in named props. Owning the complete schema or interaction algorithm uses
the single-argument `useX({...})` form. Do not add a third argument to the
component overload, a generic `:options` prop, a separate `useXControl` alias,
or a Nagi-specific override DSL. A thin consumer wrapper SFC with fixed named
props handles ordinary default changes.

Only fixed mechanisms such as native synchronization are imported from
`@nagi-labs/nagi-ui/component-controls`. This subpath is an implementation
boundary for package components and owned SFCs and is not copied by ordinary
`own`. Even after full expansion, reset, focus, and DOM-model synchronization
helpers remain package dependencies.

Small composables may hide behavior while still allowing owners to select only
the layer they need. The initial surface is limited to the two most commonly
needed levels. Do not ship `composable-only` ownership until real demand is
observed.

- `own <component> --layer vue`: copy the SFC and component-local schema and
  styles; continue using package behavior
- `own <component> --layer all`: copy the above plus the component's behavior
  dependency closure

Promotion must not mechanically rewrite imports in an edited owned SFC. At the
time of `vue` ownership, the SFC imports only a generated component-local
routing module, such as `behavior.ts`. Initially, `behavior.ts` is a one-line
re-export of the package composable. When promoting from `vue` to `all`, replace
its contents with re-exports of owned composables. The user's edited `.vue` file
is therefore untouched; only generated files change.

Do not treat the canonical SFC/composable and the routing module as the same
provenance unit. The former is subject to upstream diffing; the latter is an
adapter that can be regenerated deterministically from the layer. A sidecar
`nagi.lock.json` records at least the component, layer, package version, source
path, and SHA-256 for each source file. A hash can verify what was copied, but
cannot reconstruct the base text for a three-way merge. Until exact package
source retrieval or a separate base snapshot is designed, the existing
requirement to commit immediately after `own` and use Git history as the base
remains mandatory.

This structure does not prevent adding `composable-only` ownership later. A
consumer who writes their own DOM but accepts standard behavior can import the
package composable directly, so there is no reason to add a third layer and
expand the CLI, dependency closure, and test matrix prematurely.

### Surface namespace for owned source

A canonical SFC keeps the library name out of the filename, for example
`Button.vue`, and uses `.n-button` as its root class. Nagi CSS does not treat a
prefix as a simple `startsWith` escape hatch. It validates the exact combination
of `surfaceRootPrefixes` and the kebab-cased filename. Consequently, bare
`.button` and mismatched `.n-control` are both invalid in `Button.vue`.

Consumers using package components need only the consumer preset's boundary
classes. Consumers who run Nagi CSS against owned SFCs add
`nagiUiSurfaceRootPrefixes` to their external configuration alongside their own
surface prefix.

```js
import nagiUi, {
  nagiUiSurfaceRootPrefixes,
} from "@nagi-labs/nagi-ui/nagi-css-preset"

export default {
  semantic: {
    ...nagiUi,
    surfaceRootPrefixes: ["app-", ...nagiUiSurfaceRootPrefixes],
  },
}
```

Multiple prefixes support checking distinct owned namespaces in one repository;
they do not permit arbitrary suffixes. Every candidate still has to match its
filename exactly.

## Failure modes

### 1. Neither package consumers nor copy consumers choose Nagi

Nagi may end up in an undesirable middle ground: fewer components, slots, and
less design polish than PrimeVue as a package, but fewer examples and less
familiar vocabulary than shadcn-vue or Reka UI for source ownership.

The mitigation is a one-sentence answer to why Nagi exists instead of another
library. The current candidate is: "Usually hidden, but fully ownable as a
Web-standard SFC the moment you need it."

### 2. Guarantees disappear as soon as a component is owned

This is the most fundamental risk. Complex components such as Dropdown,
Combobox, and Dialog still need accessibility and browser fixes after ownership.
Without practical diff, migration, lint, and integration testing, ownership is
an unmaintainable fork.

### 3. A cliff between theme customization and ownership

Requiring ownership of an entire SFC for an avatar, trigger replacement,
router-link, or option description is too heavy. Conversely, exposing every
case in the public API creates a PrimeVue-style surface.

Observe request frequency and promote only a small number of common requirements
to props, schemas, or slots. Do not add escape hatches for hypothetical future
requirements.

### 4. Owned Blueprints are not actually readable

The value of keeping the browser output close to the SFC diminishes if a change
requires traversing many files for a recursive renderer, schema conversion,
composable, submenu coordination, CSS contract, and lint rules.

Measure how many files must be read and how large the change diff is for each
ownership task. Evaluate internal file boundaries by whether consumers and
agents can make local changes, not by runtime convenience.

### 5. Product requirements defeat delegation to Web standards

If fine-grained dismiss policies, arbitrary top-layer ordering, or identical
desktop/mobile behavior are primary requirements, users will perceive Nagi's
delegation as missing functionality rather than design intent. Recommend a
fully JavaScript-driven library such as Reka or Base UI for that market; do not
reimplement it inside Nagi.

### 6. "Easy for AI" is not a differentiator

AI models have seen large amounts of Radix, React Aria, and shadcn code. Nagi's
schema, CSS contract, ownership workflow, and dedicated lint rules are also new
vocabulary. Validate the claim with comparative experiments instead of relying
on the impression that the design looks simple.

## Early validation

Validate the whole model with three representative components.

| Component | Boundary under test |
|---|---|
| Button | Can theme tokens complete an ordinary brand change? |
| Dropdown | Is ownership local when adding an avatar or router-link? |
| Combobox | Can an owned behavior change continue tracking upstream guarantees? |

Measure the following for both humans and coding agents with no Nagi-specific
knowledge:

- task completion rate and behavior regression count
- number of files read, number of files changed, and changed lines
- percentage of mistakes detected by Nagi lint and browser tests
- percentage of requirements met without adding package API
- time needed to incorporate an upstream update into owned source

## Warning signs

- almost every consumer uses `own` for their first practical customization
- owned source cannot keep up with core or browser fixes
- requests for package props, slots, and pass-through APIs keep growing
- agents modify Reka UI code more accurately than Blueprints
- theme tokens keep multiplying into a proprietary CSS language
- package consumption and ownership copy sources diverge

Nagi succeeds not merely when source can be copied, but when:

> Consumers usually do not need ownership, and ownership never leaves them
> stranded with broken source.
