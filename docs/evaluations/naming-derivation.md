# Naming derivation evaluation on Nagi UI

Measurement date: 2026-09-06 UTC
Measurement source: `ee31ac2dcef2e5a8a6893e979c71ac0c7d6caf74`

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

1. **Contract-determined identity**: once the structure is known, the class
   follows from the route or file surface, component boundary or slot, ARIA
   role, STN position, or native element mapping. The machine-readable result
   retains `fullyDerived` in its field names for compatibility.
2. **Bounded anatomy choice**: the class is selected from the finite anatomy
   vocabulary supplied by the Nagi UI preset. It requires a choice and is not
   counted as contract-determined.
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
| Explicit class tokens | 670 |
| Unique explicit class tokens | 142 |
| Base identity tokens | 555 |
| Variant occurrences | 115 |
| Unique variant stems | 64 |
| Nagi UI component usages | 176 |
| Distinct Nagi UI component tags | 64 |
| Elements with dynamic class bindings | 0 |

## Identity classification

| Category | Occurrences | Classification |
| --- | ---: | --- |
| Surface root | 26 | contract-determined |
| Component boundary | 31 | contract-determined |
| Component slot | 19 | contract-determined |
| ARIA role | 1 | contract-determined |
| STN position | 74 | contract-determined after structural position is known |
| Native element map | 115 | contract-determined |
| Native self-map | 160 | contract-determined |
| Bounded anatomy | 129 | selected from four preset words |
| Open-ended variant | 115 | author-named |
| Unclassified | 0 | neither derived nor declared vocabulary |
| Total | 670 | |

Every explicit token in this population falls into a category recognized by the
contract: 670 / 670 (100.0%). This means the linter can apply the mechanical
checks for that category. It does not mean every token's word is derived, prove
that every class is necessary, or turn an author-named variant into a bounded
vocabulary choice.

Using all explicit class tokens as the denominator makes the remaining naming
boundary visible:

```text
Determined or bounded base identities: 555 / 670 = 82.8%
Author-named variant occurrences:       115 / 670 = 17.2%
```

For base identities, where variants are excluded from the denominator:

```text
Contract-determined base identities:        426 / 555 = 76.8%
Bounded anatomy base identities:            129 / 555 = 23.2%
Base identities requiring no new vocabulary: 555 / 555 = 100.0%
```

The bounded anatomy occurrences select from `actions`, `icon`, `text`, and
`value`. They are not counted as contract-determined.

## Reading the variant result

The 17.2% result is not a failure or an unlinted remainder. Nagi CSS checks each
variant's static form, ordering, placement, base-identity relationship, and peer
requirements. What remains open-ended is the word chosen for a local distinction,
such as `-primary`, `-compact`, `-preview`, or `-status`.

The 115 occurrences use 64 distinct stems across the repository. Counting the
same stem separately in each file produces 77 file-local names. These numbers
answer different questions:

- 115 occurrences describe how often authored distinctions appear in markup.
- 64 repository-wide stems describe the resulting global vocabulary.
- 77 file-local names are a closer approximation of where a component author
  encounters a naming choice; reusing the same spelling in another surface does
  not necessarily make it the same local design decision.

Occurrence count should therefore not be presented as 115 independent inventions,
and the 64-stem count should not be presented as proof that only 64 decisions were
made. The durable result is narrower: about one class token in six carries a local,
author-chosen distinction, while the other 82.8% uses a determined or bounded base
identity.

Variants refine these base-identity categories:

| Base identity category | Variant occurrences | Share of variants |
| --- | ---: | ---: |
| Component boundary | 4 | 3.5% |
| Component slot | 5 | 4.3% |
| STN position | 37 | 32.2% |
| Native element map | 12 | 10.4% |
| Native self-map | 21 | 18.3% |
| Bounded anatomy | 36 | 31.3% |
| Total | 115 | 100.0% |

The source population is not homogeneous. Definition pages and preview fixtures
need many local labels because they display several examples or evidence groups in
one surface:

| Source group | SFCs | Explicit tokens | Variant occurrences | Variant rate |
| --- | ---: | ---: | ---: | ---: |
| Shared site components and app shells | 11 | 77 | 9 | 11.7% |
| Definition and documentation components | 9 | 214 | 42 | 19.6% |
| Preview fixtures | 3 | 192 | 36 | 18.8% |
| Pages | 8 | 187 | 28 | 15.0% |

This distribution is why 17.2% should not be generalized as a universal Nagi CSS
rate. It describes this documentation-heavy site. Package Blueprints are outside
the measured population.

Nagi UI component elements contribute 176 implicit component identities.
Keeping those identities in a separate, expanded denominator gives:

```text
Contract-determined identities including implicit components: 602 / 731 = 82.4%
No-new-word identities including implicit components:          731 / 731 = 100.0%
```

## `div` and `span`

| Metric | Result |
| --- | ---: |
| `div` elements | 115 |
| `span` elements | 126 |
| Total `div` / `span` elements | 241 |
| With an explicit class | 241 |
| Variant occurrences on `div` / `span` | 78 |

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
excluded. Configured Nagi UI component tags are also excluded because their
rendered HTML is outside this template-level counterfactual. Surface roots are
counted separately because their surface identity does not change.

| Population metric | Result |
| --- | ---: |
| Rendered/template-owned elements | 890 |
| Visually comparable semantic elements | 83 |
| Surface roots with no naming change | 5 |
| Eligible styled semantic elements | 78 |
| Excluded styled semantic elements | 197 |

The 78 targets comprise 8 `article`, 1 `figcaption`, 1 `footer`, 27 `header`,
1 `main`, 2 `nav`, 37 `section`, and 1 `time` element. Partial levels use 200
deterministically seeded samples.

| Semantic erasure | Mean replacements | Added variant occurrences | Added unique stems | Collision groups |
| ---: | ---: | ---: | ---: | ---: |
| 0% | 0 | 0 | 0 | 0 |
| 25% | 19.5 | 0.4 | 0.4 | 0.4 |
| 50% | 39.3 | 1.1 | 1.1 | 1.1 |
| 75% | 59.6 | 2 | 2 | 2 |
| 100% | 78 | 3 | 3 | 3 |

At full replacement, three file-local selector groups collide. The first is
`header.header` and `footer.footer` in
`site/components/customer-directory.vue`. The second is `header.header` and two
`section.section` elements in
`site/components/docs/component-definition-section.vue`. The third is the page
header and five sections in `site/pages/concept.vue`. Together they contain 11
occurrences and require at least three added variant occurrences and three added
stems under this model.

Against 115 baseline variant occurrences and 64 unique stems, the minimum
style-preserving result is:

```text
Added variant occurrences: 3 / 115 = 2.6%
Added unique stems:         3 / 64  = 4.7%
```

If every erased semantic role instead receives an explicit class distinction,
the upper bound is 78 added occurrences (67.8%) and eight added stems (12.5%).
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
