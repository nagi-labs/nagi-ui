# Naming derivation evaluation on Nagi UI

Measurement date: 2026-09-06 UTC  
Measurement commit: `12769048fd49f4942336188b965d357f2f68b1f2`

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
- Native element mapping is evaluated before anatomy. A token such as
  `p.text` is therefore fully derived from the native-element map even when
  `text` is also present in the anatomy vocabulary.

## Population

| Metric | Result |
| --- | ---: |
| Vue SFCs | 31 |
| Template AST elements, including outer SFC wrappers | 925 |
| Rendered/template-owned elements, excluding outer wrappers | 894 |
| Elements with an explicit class | 559 |
| Explicit class tokens | 717 |
| Unique explicit class tokens | 162 |
| Base identity tokens | 559 |
| Variant occurrences | 158 |
| Unique variant stems | 84 |
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
| STN position | 81 | fully derived after structural position is known |
| Native element map | 176 | fully derived |
| Native self-map | 157 | fully derived |
| Bounded anatomy | 68 | selected from four preset words |
| Open-ended variant | 158 | author-named |
| Unclassified | 0 | neither derived nor declared vocabulary |
| Total | 717 | |

The fully derived categories contain 491 explicit class tokens:

```text
Fully derived explicit tokens: 491 / 717 = 68.5%
```

For base identities, where variants are excluded from the denominator:

```text
Fully derived base identities:              491 / 559 = 87.8%
Bounded anatomy base identities:              68 / 559 = 12.2%
Base identities requiring no new vocabulary: 559 / 559 = 100.0%
```

The bounded anatomy occurrences select from `actions`, `icon`, `text`, and
`value`. They are not counted as fully derived. Open-ended author vocabulary
is concentrated in the 158 variant occurrences across 84 stems.

Nagi UI component elements contribute 176 implicit component identities.
Keeping those identities in a separate, expanded denominator gives:

```text
Fully derived identities including implicit components: 667 / 735 = 90.7%
No-new-word identities including implicit components:    735 / 735 = 100.0%
```

## `div` and `span`

| Metric | Result |
| --- | ---: |
| `div` elements | 122 |
| `span` elements | 65 |
| Total `div` / `span` elements | 187 |
| With an explicit class | 187 |
| Variant occurrences on `div` / `span` | 83 |

Their base identities comprise 18 surface roots, 19 component slots, one role,
81 STN identities, and 68 bounded anatomy choices. This table describes the
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
| Rendered/template-owned elements | 894 |
| Visually comparable semantic elements | 80 |
| Surface roots with no naming change | 5 |
| Eligible styled semantic elements | 75 |
| Excluded styled semantic elements | 289 |

The 75 targets comprise 8 `article`, 1 `figcaption`, 1 `footer`, 26 `header`,
1 `main`, 2 `nav`, 35 `section`, and 1 `time` element. Partial levels use 200
deterministically seeded samples.

| Semantic erasure | Mean replacements | Added variant occurrences | Added unique stems | Collision groups |
| ---: | ---: | ---: | ---: | ---: |
| 0% | 0 | 0 | 0 | 0 |
| 25% | 18.8 | 0.1 | 0.1 | 0.1 |
| 50% | 37.8 | 0.3 | 0.3 | 0.3 |
| 75% | 57.3 | 0.6 | 0.6 | 0.6 |
| 100% | 75 | 1 | 1 | 1 |

At full replacement, `header.header` and `footer.footer` in
`site/components/CustomerDirectory.vue` converge on the same file-local
`div.unit` selector. That one collision group contains two occurrences and
requires at least one added variant occurrence and one added stem under this
model.

Against 158 baseline variant occurrences and 84 unique stems, the minimum
style-preserving result is:

```text
Added variant occurrences: 1 / 158 = 0.6%
Added unique stems:         1 / 84  = 1.2%
```

If every erased semantic role instead receives an explicit class distinction,
the upper bound is 75 added occurrences (47.5%) and eight added stems (9.5%).
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
