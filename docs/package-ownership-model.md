# Ownership model

Nagi UI supports two adoption tiers. See [CONCEPT.md](../CONCEPT.md) for the
full product concept.

## Light use: the package

Install and use the canonical components directly:

```ts
import { NDropdownMenu } from "@nagi-labs/nagi-ui/components"
import "@nagi-labs/nagi-ui/styles.css"
```

The package is a convenience for evaluation and for products that do not need
structural customization. Within package use, customization follows:

1. semantic theme tokens;
2. stable component props and item schemas;
3. declared content-only slots.

The package API is deliberately small. Nagi UI does not grow compound
component families, render props, or a rendering DSL to express structures the
API was not designed for. When the API is no longer the right boundary, the
intended path is ownership, not a broader API.

## Full adoption: own the source

Owning the component source is Nagi UI's primary model. The current CLI copies
a canonical Blueprint and its registered companions into the application:

```sh
vp exec nagi-ui own dropdown-menu
```

The package component and the owned source come from the same implementation —
the Blueprint is a reference implementation in the literal sense. The planned
workspace workflow (`nagi-ui init` / `add`, bundling each component's source
with its definition, tests, and scenarios) is described in
[CONCEPT.md](../CONCEPT.md); the `own` command is today's mechanism for the
source-copy step.

## Maintaining owned source

Owned files carry `@nagi-source` provenance metadata recording the component
and version they are based on. After ownership, the local repository is the
source of truth. Nagi UI deliberately does not centrally track downstream
divergence or automate upstream synchronization. Divergence is managed with:

- provenance metadata plus git history as the baseline for comparison;
- release notes reviewed against the recorded upstream version;
- executable verification that the component still satisfies its guarantees.

Verification is the load-bearing part. Structural changes are expected; the
question is whether the component still behaves like the component it claims
to be. The experimental shared [conformance contracts](conformance-contracts.md)
keep the reusable minimum behavior and accessibility invariants upstream while
allowing the owned DOM to change. Owned Blueprints also remain covered by
`verified-bindings`, Nagi CSS checks, and the application's own keyboard,
focus, form, and integration tests.

Behavior composables (`useDialog`, `useTabs`, and the
`component-controls` entrypoint) remain stable package dependencies of owned
Blueprints. Every dependency referenced by an ownable Blueprint must be either
a stable public export or part of the ownership bundle. A behavior dependency
can change through a package upgrade even when the owned SFC is textually
unchanged — that is exactly what the conformance contracts are for.

Attribute destinations in owned Blueprints follow the
[attribute forwarding policy](attribute-forwarding.md).

Copying source is an explicit maintenance tradeoff, not an automatic migration
stage. The goal is not to prevent divergence; it is to make divergence explicit
and testable.
