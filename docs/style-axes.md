# CSS style axes

Nagi Button keeps visual choices in CSS instead of Vue appearance props,
`data-variant` attributes, or generated component modifier classes. Authors set
finite custom-property axes on the component's Nagi CSS boundary class and a
static context variant:

```css
.app-delete-confirmation {
  > .actions > .n-button.-destructive {
    --button-tone: danger;
    --button-appearance: outlined;
    --button-shape: rounded;
    --button-size: small;
  }
}
```

```vue
<main class="app-delete-confirmation">
  <div class="actions">
    <n-button class="n-button -destructive">Delete workspace</n-button>
  </div>
</main>
```

`n-button` is the fixed boundary class supplied by the Nagi UI preset.
`-destructive` belongs to the application and describes this static context.
Do not put `button` on `<n-button>`: Nagi CSS reserves that class for a native
`<button>`. Nagi does not require a generated modifier such as
`n-button--danger`.

## Button contract

| Axis | Default | Values | Responsibility |
| --- | --- | --- | --- |
| `--button-tone` | `neutral` | `neutral`, `accent`, `danger` | Supplies the semantic palette. |
| `--button-appearance` | `outlined` | `outlined`, `solid`, `ghost` | Uses the palette for background, border, foreground, and hover. |
| `--button-shape` | `rounded` | `square`, `rounded`, `pill` | Sets only corner geometry. |
| `--button-size` | `medium` | `small`, `medium`, `large` | Sets control height, padding, and font size. |

The axes own disjoint outputs. Tone does not set radius or dimensions;
appearance does not select a tone; shape and size do not set color. Therefore
`danger + outlined + rounded` is ordinary composition, not a separately
registered compound variant.

## Component-local axes do not inherit

Button axes belong to the Button element itself. They are registered with the
CSS Properties and Values API using `inherits: false`, as are the private
properties emitted by the compiler:

```css
@property --button-tone {
  syntax: "neutral | accent | danger";
  inherits: false;
  initial-value: neutral;
}
```

Consequently, this is invalid Nagi authoring and does not theme descendant
Buttons:

```css
.n-dialog {
  --button-tone: accent;
}
```

Target the owner instead:

```css
.n-dialog .actions.-primary > .n-button {
  --button-tone: accent;
}
```

An assembly context may select nested Buttons when that relationship is
intentional, but the declaration still belongs to each matched Button rather
than being inherited from the context:

```css
.compact-controls .n-button {
  --button-size: small;
}
```

`nagiStyleCompiler` rejects a finite Button axis unless every selector targets
either the package `.n-button` boundary or an owned
`[data-scope="button"][data-part="root"]` boundary. A context class may still
describe why the value changes, but the final selector must reach the Button.

Nagi currently defines no inheriting style-context axes. A future axis intended
to propagate through a subtree, such as form density, must be declared and
named as a separate context contract; component axes must not acquire that
behavior accidentally. The registration rules follow the
[CSS Properties and Values API](https://drafts.css-houdini.org/css-properties-values-api-1/#at-property-rule).

The combined `@nagi-labs/nagi-ui/styles.css` entry includes these registrations.
Projects that assemble CSS entrypoints manually must import
`@nagi-labs/nagi-ui/style-axes.css` as well.

## Build-time expansion

Current cross-browser CSS cannot derive a declaration bundle from an enum-like
custom property without runtime work. `nagiStyleCompiler` performs a deliberately
narrow PostCSS transform. It validates literal axis values, preserves the
public declaration, and inserts the concrete private variables consumed by the
Blueprint:

```css
/* authored */
.app-delete-confirmation > .actions > .n-button.-destructive {
  --button-tone: danger;
  --button-appearance: outlined;
}

/* relevant part of the generated fallback */
.app-delete-confirmation > .actions > .n-button.-destructive {
  --_button-tone-color: var(--nagi-color-danger);
  --_button-tone-border: var(--nagi-color-danger);
  --_button-tone-surface: var(--nagi-color-surface-danger);
  --_button-tone-contrast: var(--nagi-color-surface);
  --button-tone: danger;
  --_button-background: var(--nagi-color-surface);
  --_button-border-color: var(--_button-tone-border, var(--nagi-color-border));
  --_button-color: var(--_button-tone-color, var(--nagi-color-text));
  --_button-hover-background: var(--_button-tone-surface, var(--nagi-color-surface-active));
  --button-appearance: outlined;
}
```

The underscore-prefixed variables are generated implementation details. Do not
author them directly.

For Vite, add the compiler to the CSS pipeline:

```ts
import { nagiStyleCompiler } from "@nagi-labs/nagi-ui/style-compiler"
import vue from "@vitejs/plugin-vue"
import { defineConfig } from "vite"

export default defineConfig({
  css: { postcss: { plugins: [nagiStyleCompiler()] } },
  plugins: [vue()],
})
```

Nuxt accepts the same `css.postcss.plugins` entry under its `vite` option.
The Nagi documentation site and Playground use this exact integration.

## Deliberate limitation

The fallback compiler accepts literal values because it runs before the page
exists. Values such as `--button-tone: var(--current-tone)` and runtime changes
to `--button-tone` cannot be expanded faithfully and fail the build instead of
silently rendering the wrong appearance. Ancestor declarations are also
rejected: component axes are not a cascading context API.

This is a static compiler, not a complete CSS `if(style())` polyfill. The
public properties are retained so the author-facing API can remain unchanged
when same-element style conditions become a dependable project baseline.
