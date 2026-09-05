# Naming derivation evaluation on Nagi UI

Measurement date: 2026-09-06 UTC  
Measurement commit: `23f409238fed4656ed1ffbf390971c46afc0e21c`

Run the committed evaluation and verify its machine-readable snapshots with:

```sh
vp run evaluate:naming
```

The snapshots are
[`naming-derivation.json`](naming-derivation.json) and
[`semantic-erasure.json`](semantic-erasure.json). The command fails when the
current source produces different results, so a source change requires an
intentional remeasurement and documentation update.

## What this evaluates

This evaluation measures how often an explicit class identity in Nagi UI's
site can be obtained from the Nagi CSS contract without inventing a new word.
It keeps three exclusive decisions separate:

1. **Fully derived identity**: the class follows from the route or file
   surface, component boundary or slot, ARIA role, STN position, or native
   element mapping.
2. **Bounded anatomy choice**: the class is selected from the finite anatomy
   vocabulary supplied by the Nagi UI preset. It requires a choice and is not
   counted as fully derived.
3. **Open-ended variant**: a `-variant` stem is named by the author.

The `no new vocabulary` measure combines the first two categories but always
reports them separately first. The evaluation does not measure a person's
cognitive load or the time required to maintain the code.

## Scope and method

- Scope: the 31 Vue SFCs under `site/**/*.vue`, including documentation,
  examples, preview fixtures, and application-style pages.
- Exclusions: `.nuxt`, `.output`, `node_modules`, package Blueprints, and
  files outside `site/`.
- Parser: `vue-eslint-parser` over each SFC template AST.
- Template-owned element count: every authored element below an SFC's outer
  `<template>` wrapper, including structural `<template>` nodes used for
  loops and slots.
- Explicit class denominator: whitespace-separated tokens in literal `class`
  attributes. Dynamic class bindings are outside this denominator and are
  counted separately; there are none in this source state.
- Base identity denominator: every explicit token that is not prefixed with
  `-`. Each styled element in scope has one such token.
- Surface identity: the file-derived surface or a routed `site-*` surface.
- Component identities and slots: values loaded from
  `packages/core/nagi-css-preset.mjs`.
- Nagi CSS contract: element mappings, anatomy, STN tiers, component
  boundaries, component slots, and valid file-derived surface roots are loaded
  from `@nagi-labs/nagi-css-core` 0.4.0 using the site's current preset.
- Native element mapping is evaluated before anatomy. A mapped token is fully
  derived even when the same word also appears in the anatomy vocabulary.

## Population

| Metric | Result |
| --- | ---: |
| Vue SFCs | 31 |
| Template AST elements, including outer SFC wrappers | 921 |
| Rendered/template-owned elements, excluding outer wrappers | 890 |
| Elements with an explicit class | 555 |
| Explicit class tokens | 702 |
| Unique explicit class tokens | 159 |
| Base identity tokens | 555 |
| Variant occurrences | 147 |
| Unique variant stems | 81 |
| Nagi UI component usages | 176 |
| Distinct Nagi UI component tags | 64 |
| Elements with dynamic class bindings | 0 |

## Identity classification

| Category | Occurrences | Classification |
| --- | ---: | --- |
| Surface root | 26 | fully derived |
| Component boundary | 31 | fully derived |
| Component slot | 19 | fully derived |
| ARIA role | 1 | fully derived |
| STN position | 74 | fully derived after structural position is known |
| Native element map | 115 | fully derived |
| Native self-map | 160 | fully derived |
| Bounded anatomy | 129 | selected from four preset words |
| Open-ended variant | 147 | author-named |
| Unclassified | 0 | neither derived nor declared vocabulary |
| Total | 702 | |

The fully derived categories contain 426 explicit class tokens:

```text
Fully derived explicit tokens: 426 / 702 = 60.7%
```

For base identities, where variants are excluded from the denominator:

```text
Fully derived base identities:              426 / 555 = 76.8%
Bounded anatomy base identities:            129 / 555 = 23.2%
Base identities requiring no new vocabulary: 555 / 555 = 100.0%
```

The bounded anatomy occurrences select from `actions`, `icon`, `text`, and
`value`. They are not counted as fully derived. Open-ended author vocabulary
is concentrated in the 147 variant occurrences across 81 stems.

Nagi UI component elements contribute 176 implicit component identities.
Keeping those identities in a separate, expanded denominator gives:

```text
Fully derived identities including implicit components: 602 / 731 = 82.4%
No-new-word identities including implicit components:    731 / 731 = 100.0%
```

## `div` and `span`

| Metric | Result |
| --- | ---: |
| `div` elements | 115 |
| `span` elements | 126 |
| Total `div` / `span` elements | 241 |
| With an explicit class | 241 |
| Variant occurrences on `div` / `span` | 87 |

Their base identities comprise 18 surface roots, 19 component slots, one role,
74 STN identities, and 129 bounded anatomy choices. This table describes the
current classification; it does not determine whether the chosen HTML element
is semantically correct.

## Semantic-erasure evaluation

The second script tests a deterministic counterfactual: replace selected
semantic elements with visually comparable `div` or `span` elements, assign an
STN base identity, and count where an additional variant is needed to preserve
independently targetable style roles.

Eligible block elements are `article`, `aside`, `footer`, `header`, `main`,
`nav`, `section`, and `figcaption`; `time` is the eligible inline element.
Elements whose replacement changes default typography, markers, table layout,
form behavior, links, disclosure behavior, or replaced-element behavior are
excluded. Surface roots are counted separately because their surface identity
does not change.

| Population metric | Result |
| --- | ---: |
| Rendered/template-owned elements | 890 |
| Visually comparable semantic elements | 83 |
| Surface roots with no naming change | 5 |
| Eligible styled semantic elements | 78 |
| Excluded styled semantic elements | 228 |

The 78 targets comprise 8 `article`, 1 `figcaption`, 1 `footer`, 27 `header`,
1 `main`, 2 `nav`, 37 `section`, and 1 `time` element. Partial levels use 200
deterministically seeded samples.

| Semantic erasure | Mean replacements | Added variant occurrences | Added unique stems | Collision groups |
| ---: | ---: | ---: | ---: | ---: |
| 0% | 0 | 0 | 0 | 0 |
| 25% | 19.5 | 0.2 | 0.2 | 0.2 |
| 50% | 39.3 | 0.7 | 0.7 | 0.7 |
| 75% | 59.6 | 1.2 | 1.2 | 1.2 |
| 100% | 78 | 2 | 2 | 2 |

At full replacement, two file-local selector groups collide. The first is
`header.header` and `footer.footer` in
`site/components/CustomerDirectory.vue`. The second is `header.header` and two
`section.section` elements in
`site/components/docs/ComponentDefinitionSection.vue`. Together they contain
five occurrences and require at least two added variant occurrences and two
added stems under this model.

Against 147 baseline variant occurrences and 81 unique stems, the minimum
style-preserving result is:

```text
Added variant occurrences: 2 / 147 = 1.4%
Added unique stems:         2 / 81  = 2.5%
```

If every erased semantic role instead receives an explicit class distinction,
the upper bound is 78 added occurrences (53.1%) and eight added stems (9.9%).
This is an explicit-role bound, not the minimum needed to preserve the current
style distinctions.

## Interpretation limits

- Nagi UI is designed around Nagi CSS, so this is a self-hosted evaluation.
  Its percentages do not generalize to an unrelated third-party codebase.
- Naming derivation rates measure class-identity decisions, not maintenance
  time or human cognitive load.
- A derivable class identity does not guarantee correct HTML semantics or
  accessibility.
- Static analysis does not establish visual correctness or runtime behavior.
- Documentation examples and test/preview fixtures are part of the measured
  population and are not representative of every product interface.
- The semantic-erasure filter is a conservative static model, not a browser
  visual-regression test.
