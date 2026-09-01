# Owned component conformance

Nagi UI's source-ownership model permits applications to change a Blueprint's
visible DOM. A snapshot of the canonical DOM therefore cannot say whether an
owned component still behaves like a Dialog or Tabs. The experimental
`@nagi-labs/nagi-ui/test` entrypoint registers browser tests for
observable semantics, keyboard interaction, state, and focus.

```ts
import { alertDialogContract, dialogContract, tabsContract } from "@nagi-labs/nagi-ui/test"
import { dialogDefinition } from "./owned/dialog.definition.ts"
import { alertDialogDefinition } from "./owned/alert-dialog.definition.ts"

dialogContract({
  definition: dialogDefinition,
  url: "/account/profile",
  triggerName: "Edit profile",
  dialogName: "Profile",
  closeName: "Cancel",
})

alertDialogContract({
  definition: alertDialogDefinition,
  url: "/account/delete",
  triggerName: "Review account deletion",
  dialogName: "Delete account?",
  description: "This action cannot be undone.",
  closeName: "Keep account",
  actionName: "Delete account",
  initialFocusName: "Keep account",
})

tabsContract({
  url: "/account",
  name: "Account sections",
  activation: "automatic",
})
```

Definition-aware contracts consume the typed value owned with the component.
This lets the browser contract execute the same anatomy rules and prevents a
test title from claiming an undeclared requirement ID:

```ts
import { carouselContract } from "@nagi-labs/nagi-ui/test"
import { carouselDefinition } from "./owned/carousel.definition.ts"

carouselContract({
  definition: carouselDefinition,
  url: "/carousel-contract",
  name: "Release highlights",
  slidesName: "Release slides",
  slides: [
    { label: "First release", position: "1 / 3" },
    { label: "Second release", position: "2 / 3" },
    { label: "Third release", position: "3 / 3" },
  ],
  modelStatusName: "Carousel model",
  secondAnnouncement: "2 / 3",
  disabled: {
    name: "Disabled highlights",
    slidesName: "Disabled slides",
    modelStatusName: "Disabled model",
    externalUpdateName: "Set disabled carousel to second",
    expectedExternalIndex: "1",
  },
})
```

The invocation stays in the application; the implementation stays in the
installed package. An upgrade can add newly learned invariants without copying
test logic into every owned source. Names and capability flags are the thin
adapter between an application's fixture and the shared suite.

## Existing architecture

This layer complements, rather than replaces, Nagi UI's existing boundaries:

- Blueprints own canonical Vue, native HTML, and Nagi CSS.
- Narrow composables such as `useDialog` and `useTabs` own reusable behavior
  and attribute wiring.
- `nagi-ui/verified-bindings` statically detects dropped or overridden behavior
  bindings in edited Blueprints.
- `assertNagiDom` and `observeNagiDom` validate runtime ID and ARIA references.
- Nagi CSS validates class identity, selector ownership, structure, and state
  representation.
- component-specific unit and browser tests retain implementation details that
  are not universal conformance requirements.

The missing boundary was a reusable behavioral suite that can be run against a
consumer-owned component without importing its DOM hierarchy into the contract.

## Contract guarantees

`dialogContract` discovers a trigger and surface by accessible role and name.
It checks the native surface, actual `:modal` state, optional accessible
description, opening focus, Escape and light dismissal, sequential focus
containment, close actions, model synchronization, and focus restoration. It
does not require a header/body/footer order or any Nagi class.

`alertDialogContract` runs the same native modal boundary with the stricter
AlertDialog profile. It requires an exposed warning description, cancel-first
focus, resistance to backdrop light dismissal, and explicit cancel and primary
actions. Package and owned fixtures share the assertions while keeping their
DOM order independent.

`tabsContract` discovers a named tablist by role. It checks one selected tab and
one roving tab stop, reciprocal `aria-controls`/`aria-labelledby` relationships,
orientation- and direction-aware arrows, automatic or manual activation,
disabled-tab skipping, Home/End, and looping or bounded edges. It does not
require panels to follow the tablist in the DOM.

The repository runs suites against both canonical package components and owned
fixtures. The owned Carousel puts controls after the viewport and inserts extra
layout wrappers; its accessible-name punctuation also differs from the package
rendering. Those differences pass because they are outside the Definition. A
missing viewport part, broken model update, or removed scroll snap fails.

The shared browser suite is not the complete evidence set. Controlled-model
normalization, loop modulo, compiler keyword tables, and source-binding
composition remain Node, compiler, or static checks where a browser fixture
would provide weaker evidence.

## Research decisions

React Aria test-utils demonstrates semantic discovery and user-level operations
through Testing Library roles, names, states, and ARIA relationships. Its
testers are useful operation APIs; Nagi adds an opinionated invariant suite on
top so consumers do not have to author every assertion.

Akaza's flat Vue APIs reinforce Nagi's existing direction: `v-model`, items,
named slots, scoped actions, and IDs passed through slot data. Nagi keeps its
canonical styled structure and native primitives rather than adopting Akaza's
renderless styling model.

Vuetify 0 demonstrates that flat public components can sit on typed internal
composables, registries, selection models, and lifecycle cleanup. Nagi should
adopt those internal techniques only when a component has a real collection or
coordination problem. A public compound-component graph or general registry is
not needed for Dialog or Tabs and would obscure owned source.

## Select and ComboBox validation

The same architecture extends to Select without sharing its exact suite with
Tabs: discover the trigger by role/name; assert `aria-expanded` and popup
relationships; exercise open, option navigation, disabled options, selection,
Escape, and focus restoration. Native-select and custom-listbox modes need
separate capability profiles because both are valid.

ComboBox needs a component-specific contract with explicit capabilities, for
example `editable`, `selection: "automatic" | "manual"`, and
`popup: "listbox" | "grid" | "tree"`. The shared core can cover accessible
input naming, expanded/controls state, active-descendant validity, arrow and
Escape behavior, disabled options, selection, and focus. Filtering algorithms,
async loading, virtualization, custom ranking, announcements, and visual
layout remain component-specific tests. A capability matrix must describe real
Nagi modes; it must not become a framework for every ARIA-permitted variation.

## Maintenance boundary

Conformance should be added per interaction family, not mechanically per
component. At 50–100 components, roughly 15–25 focused suites can cover native
controls, disclosure, dialog, tabs, listbox/select, combobox, menu, tree,
toolbar/roving-focus, sliders, and date grids. Presentational components should
usually keep only semantic and axe coverage. Each suite needs browser fixtures,
capability documentation, and upstream-spec review, so adding a contract where
no meaningful keyboard/state behavior exists costs more than it protects.

This PoC intentionally exports a package subpath with Playwright as an optional
peer. If consumer validation proves the API stable, a separate test package may
provide cleaner dependency and versioning boundaries. Until then, keeping the
surface experimental avoids prematurely creating another package or behavior
abstraction.
