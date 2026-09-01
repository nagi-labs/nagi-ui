# Unovis integration recipe

Unovis is Nagi UI's recommended chart library, not a Nagi component. Install it
in the consuming application and compose its Vue components directly inside a
Nagi `Card`:

```sh
vp add @unovis/ts @unovis/vue
```

```ts
import "@nagi-labs/nagi-ui/default-theme.css"
import "@nagi-labs/nagi-ui/recipes/unovis/theme.css"
```

```vue
<n-card title="Weekly activity" description="Current and previous period">
  <figure class="n-card-content" data-nagi-unovis>
    <VisXYContainer
      class="unovis-xy-container"
      :data="data"
      aria-label="Weekly active users for the current and previous period"
    >
      <VisLine
        class="unovis-line"
        :x="x"
        :y="[current, previous]"
        :color="['var(--vis-color0)', 'var(--vis-color1)']"
      />
      <VisAxis class="unovis-axis" type="x" />
      <VisAxis class="unovis-axis" type="y" />
    </VisXYContainer>
    <figcaption class="figcaption">Current period finishes at 184 users.</figcaption>
  </figure>
</n-card>
```

The chart data, accessors, scales, axes, animation, legend and datum tooltip
remain Unovis or application vocabulary. Do not proxy them through `Chart.vue`
props and do not re-export Unovis types from Nagi UI. Use Nagi `Tooltip` only
for a separate explanatory control; a datum tooltip belongs to Unovis.

## Nagi CSS boundary

The application owns the `figure`, legend, caption and accessible data table.
Unovis owns the DOM below its Vue component roots. Declare those roots in the
consumer's Nagi CSS config and do not descend into their generated SVG/classes:

```js
import nagiUi from "@nagi-labs/nagi-ui/nagi-css-preset"

export default {
  semantic: {
    ...nagiUi,
    componentClasses: {
      ...nagiUi.componentClasses,
      VisXYContainer: "unovis-xy-container",
      VisLine: "unovis-line",
      VisAxis: "unovis-axis",
    },
    libraryBoundaryPrefixes: ["unovis-"],
  },
}
```

The bridge stylesheet uses Unovis's public CSS custom properties. Prefer that
contract, then Unovis props, over selectors aimed at generated descendants.

## Accessibility and dark themes

Color is not the only series identifier. Keep visible labels and a native data
table or equivalent summary; for multiple lines, add dash/marker differences.
The six token names are mode-independent. A complete dark replacement theme
should override them together with the rest of the Nagi tokens, for example:

```css
[data-nagi-theme="dark"] {
  --nagi-color-series-1: #5fc7dd;
  --nagi-color-series-2: #e49abc;
  --nagi-color-series-3: #e0b555;
  --nagi-color-series-4: #8fca7e;
  --nagi-color-series-5: #aaa2f5;
  --nagi-color-series-6: #f1937f;
}
```

These values are a reference palette, not a partial dark theme. Validate the
complete replacement theme with `nagi-ui theme check` and the rendered chart
with the application's real-browser accessibility suite.
