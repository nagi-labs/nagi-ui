# Package-first, own-on-demand

Use Nagi UI components from the package by default:

```ts
import { DropdownMenu } from "@nagi-labs/nagi-ui/components"
import "@nagi-labs/nagi-ui/default-theme.css"
```

Customization follows four levels:

1. semantic theme tokens;
2. stable component props and item schemas;
3. declared content-only slots;
4. local source ownership.

Own a component when the application needs to change its DOM structure,
specialized elements, or behavior integration:

```sh
vp exec nagi-ui own dropdown-menu
```

The command copies the canonical SFC and its relative source dependencies. The
package component and owned source come from the same implementation.

Owned files contain `@nagi-source` metadata. Compare them with the installed
package version using:

```sh
vp exec nagi-ui diff dropdown-menu
```

The CLI reports `clean`, `modified`, `drifted`, or `unknown-source`.
Local modifications are expected; drift means the installed upstream source
changed and should be reviewed.

Package and owned components may coexist, and the same theme applies to both.
After ownership, the application is responsible for merging upstream changes
and running keyboard, focus, form, accessibility, Nagi CSS, and integration
tests. Copying source is an explicit maintenance tradeoff, not an automatic
migration stage.
