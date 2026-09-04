# Nagi UI

Nagi UI provides readable Vue components together with the executable tests
that explain how to change them safely. Its standard Blueprints are
platform-first, but Nagi itself is not tied to one renderer: Component Contract
tests describe what compatible implementations preserve and Implementation tests
describe how one concrete source provides it.

Use the package for evaluation and light use, or copy the canonical Vue source
and its maintenance knowledge into your repository with the ownership CLI.

```sh
vp add @nagi-labs/nagi-ui
```

```ts
import { NButton, NDialog } from "@nagi-labs/nagi-ui/components"
import "@nagi-labs/nagi-ui/styles.css"
```

Own the exact component source shipped by the installed version:

```sh
vp exec nagi-ui own button dialog
```

Owned files carry `@nagi-source` provenance markers. Components with migrated
Definitions keep their immutable Component Contract identity with the source.
The shared runner remains available from the package's development-only
`@nagi-labs/nagi-ui/test` entrypoint, while owned or Motion implementations
supply their own Implementation evidence.

- [Documentation and application showcase](https://nagi-labs.github.io/nagi-ui/)
- [Concept](https://github.com/nagi-labs/nagi-ui/blob/main/CONCEPT.md)
- [Ownership model](https://github.com/nagi-labs/nagi-ui/blob/main/docs/package-ownership-model.md)
- [Component Definitions](https://github.com/nagi-labs/nagi-ui/blob/main/docs/component-definitions.md)
- [Source repository](https://github.com/nagi-labs/nagi-ui)

Nagi UI requires Vue 3.5 or newer. Its CLI and repository tooling require
Node.js 22.18 or newer.
