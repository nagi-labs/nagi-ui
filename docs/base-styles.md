# Base styles

Nagi UI provides an opt-in native-element baseline alongside its component
theme. For the complete default appearance, import the combined entry:

```ts
import "@nagi-labs/nagi-ui/styles.css"
```

`styles.css` loads `default-theme.css` followed by `base.css`. The base layer
provides border-box sizing, a restrained system-font body, predictable heading
and paragraph margins, inherited form-control typography, accessible native
links, responsive media defaults, and selection styling.

The layer intentionally does not erase native control appearance, remove link
underlines, impose layout utilities, or style application-specific surfaces.
Nagi UI Blueprints continue to own their component appearance.

## Separate imports

Applications may opt into the layers independently:

```ts
import "@nagi-labs/nagi-ui/default-theme.css"
import "@nagi-labs/nagi-ui/base.css"
```

Import the theme before the base layer. `base.css` consumes the public Nagi UI
tokens and does not contain fallback values. A replacement theme must therefore
define the complete token contract before the base layer is used.

Import only `default-theme.css` when an application already owns its normalize
and native-element baseline. Importing `base.css` is always explicit; installing
or importing a Nagi UI component does not mutate global element styles.

The default font stack prefers Inter and falls back to the platform UI sans
font. Nagi UI does not fetch fonts from a third party. Applications that require
consistent Inter metrics should self-host it or load it explicitly; the Nagi UI
documentation site loads the same Inter and JetBrains Mono families used by the
Nagi CSS documentation site.
