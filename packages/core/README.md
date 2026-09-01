# Nagi UI

Nagi UI is a native-first Vue component system designed to become application
source. Use the package for evaluation and light use, or copy the canonical Vue
components into your repository with the ownership CLI.

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

Owned files carry `@nagi-source` provenance markers. Components with a verified
Definition also copy that maintenance contract beside the Vue source.

- [Documentation and application showcase](https://nagi-labs.github.io/nagi-ui/)
- [Concept](https://github.com/nagi-labs/nagi-ui/blob/main/CONCEPT.md)
- [Ownership model](https://github.com/nagi-labs/nagi-ui/blob/main/docs/package-ownership-model.md)
- [Component Definitions](https://github.com/nagi-labs/nagi-ui/blob/main/docs/component-definitions.md)
- [Source repository](https://github.com/nagi-labs/nagi-ui)

Nagi UI requires Vue 3.5 or newer. Its CLI and repository tooling require
Node.js 22.18 or newer.
