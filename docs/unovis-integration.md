# Unovis integration

Status: Shipped recipe (2026-07-22).

## Decision

**Unovis** is the recommended library when a Nagi UI application needs charts.
This does not mean shipping `Chart.vue` as a Nagi component.

- `@unovis/ts` and `@unovis/vue` are consumer-app dependencies, not Nagi core dependencies or peer dependencies.
- Data, accessors, scales, axes, legends, animation, and datum tooltips remain Unovis/app vocabulary.
- Nagi supplies the Card frame, Tooltip/Popover for adjacent controls, series tokens, and a CSS-custom-property bridge.
- Chart does not increase component progress beyond 43/54 and remains under `Separate products / integration`.

The Vue edition of Unovis uses an API that places `VisLine`, `VisAxis`, and
other components directly inside `VisXYContainer`, and installs both
`@unovis/ts` and `@unovis/vue`. Proxying that API through Nagi props would turn
the entire fast-changing chart configuration into a stable Nagi DSL, destroying
the small API boundary required by CHARTER §3.5.

- [Unovis installation](https://unovis.dev/docs/intro/)
- [Unovis Vue quick start](https://unovis.dev/docs/quick-start/)
- [Unovis theming](https://unovis.dev/docs/guides/theming/)

## Theme contract

The following six public tokens were added:

```css
--nagi-color-series-1
--nagi-color-series-2
--nagi-color-series-3
--nagi-color-series-4
--nagi-color-series-5
--nagi-color-series-6
```

They are named `series`, rather than `chart`, so they are not coupled to an
engine or visualization type. The package recipe maps them one-to-one to
Unovis's `--vis-color0` through `--vis-color5`. Axis text and grid colors are
also bridged to existing text/border tokens; no selectors descend into
Unovis-generated classes.

The default theme supplies a light palette. Because token names are mode-
independent, a complete dark theme overrides the same six names alongside the
other Nagi tokens. `/chart.html` demonstrates switching between light and dark
reference values. A palette alone is not considered "accessible" for color
vision or contrast: series labels, dashes/markers, and a native table or
equivalent summary are mandatory parts of the composition contract.

## Nagi CSS ownership boundary

The app owns the Card slot surface, `figure`, legend, caption, and table. The
DOM below each Unovis Vue component root is non-owned. In consumer config,
register every component actually used in the Library Component Class Table and
declare `libraryBoundaryPrefixes: ["unovis-"]`.

```js
componentClasses: {
  VisXYContainer: "unovis-xy-container",
  VisLine: "unovis-line",
  VisAxis: "unovis-axis",
},
libraryBoundaryPrefixes: ["unovis-"],
```

For internal customization, follow the Nagi CSS CONTRACT Appendix order:
Unovis props, then public CSS custom properties, and only then a documented
selector if necessary. Do not treat generated SVG Emotion classes as owned DOM
or traverse them with `>`.

## Tooltip boundary

Nagi Tooltip is a static hint attached to an explanatory button, not the
hover/focus surface for chart data. Delegate datum tooltips to `VisTooltip` /
`VisCrosshair`. Nagi Popover can be used as an adjacent control when a chart
filter or display-settings panel is explicitly opened from a button. This
boundary avoids an adapter that translates the Unovis event model into Nagi.

## Distribution and verification

- Copyable recipe: `packages/core/recipes/unovis/`
- Live sample: `playground/chart.html` (`/chart.html`)
- Root dev dependencies: `@unovis/ts`, `@unovis/vue`
- Browser contract: SVG rendering, series-token bridge, dashed legend, native table, dark override, axe
- Package contract: recipe CSS and README included in the tarball

The core package manifest does not include Unovis dependencies, so consumers
that do not use the recipe do not receive a chart runtime.

The complete release gate passed with **269 / 269 unit tests** and **91 / 91
browser + axe tests**, including the chart's SVG output, token bridge, dark-theme
override, non-color series cues, native data table, and Nagi CSS boundary.
