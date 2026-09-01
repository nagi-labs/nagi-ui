# Nagi CSS cognitive-load audit of the Nagi UI documentation site

Date: 2026-08-30

Repository: this repository

Reproduction scripts:

- `scripts/audits/css-cognitive-load-audit.mjs`
- `scripts/audits/semantic-erasure-audit.mjs`

## Purpose

This audit measures how often Nagi CSS lets an author or coding agent derive a
class identity instead of inventing one. It also tests a counterfactual: if an
agent ignored HTML semantics and used visually equivalent `div` or `span`
elements, how much additional variant vocabulary would be required to preserve
the site's current styling distinctions?

The audit distinguishes:

1. identities completely derived from the file, route, component, native HTML
   element, role, or structural position;
2. identities selected from Nagi CSS's bounded anatomy vocabulary;
3. open-ended variants whose stems must be chosen by the author.

## Scope and method

- Audited `site/**/*.vue`: 29 SFCs.
- Excluded `.nuxt`, `.output`, generated files, and package Blueprints.
- Parsed Vue templates with `vue-eslint-parser`.
- Counted class tokens written in templates, not repeated CSS selector uses.
- Found no dynamic `:class` expressions in scope, so static class coverage is
  complete.
- Loaded component and slot identities from the Nagi UI Nagi CSS preset.
- Counted implicit identities supplied by Nagi UI components separately from
  explicit class tokens.

## Baseline

| Metric | Count |
|---|---:|
| Vue SFCs | 29 |
| Template AST elements, including each SFC's template wrapper | 766 |
| Actual rendered/template-owned elements, excluding those wrappers | 737 |
| Elements with an explicit class | 413 |
| Explicit class tokens | 489 |
| Unique explicit class tokens | 107 |
| Base identity tokens | 412 |
| Variant occurrences | 77 |
| Unique variant stems | 48 |
| Nagi UI component usages | 171 |
| Distinct Nagi UI component tags | 64 |

## Explicit class-token classification

| Category | Occurrences | Decision model |
|---|---:|---|
| HTML element mapping | 131 | fully derived |
| HTML self-mapping | 139 | fully derived |
| STN | 70 | derived after the structural position is known |
| Surface root | 23 | fully derived from file or route |
| Nagi UI slot surface | 18 | fully derived from component and slot |
| ARIA role identity | 1 | fully derived from `role` |
| Anatomy | 29 | bounded semantic choice |
| Variant | 77 | open-ended author choice |
| Unclassified | 1 | likely contract mismatch |
| Total | 489 | |

There are 382 fully derived explicit tokens:

```text
382 / 489 = 78.1%
```

Among base identities only, 382 of 412 are completely derived:

```text
382 / 412 = 92.7%
```

The 29 anatomy occurrences use only three existing words: `actions`, `icon`,
and `value`. Including bounded anatomy selection, 411 of 412 explicit base
identities require no new word:

```text
411 / 412 = 99.8%
```

Nagi UI component elements add 171 implicit, fully derived component identities.
Including those events gives:

```text
fully derived base identities: 553 / 583 = 94.9%
no-new-word base identities:   582 / 583 = 99.8%
```

## Where naming judgment remains

The site contains 77 variant occurrences across 48 unique stems. Thirty-four
stems occur only once and fourteen are reused. The most frequent variants are:

| Variant | Occurrences |
|---|---:|
| `-wide` | 6 |
| `-controls` | 4 |
| `-description` | 4 |
| `-eyebrow` | 4 |
| `-subsection` | 4 |
| `-behavior` | 3 |
| `-metrics` | 3 |
| `-preview` | 3 |

Open-ended vocabulary is therefore concentrated in variants. Nagi CSS closes
almost all base-identity vocabulary while deliberately leaving stable visual or
design distinctions to the author.

## Existing `div` and `span` use

| Metric | Count |
|---|---:|
| All `div`/`span` elements | 138 |
| Styled `div`/`span` elements | 135 |
| Share of all template AST elements | 18.0% |
| Share of styled elements | 32.7% |

Of the 135 styled `div`/`span` elements, 105 (77.8%) have a completely derived
base identity. Seventy use STN, including 38 wrappers in the component-preview
harness. No `div` or `span` in scope acts as a pseudo-button or pseudo-link via
click handlers, keyboard handlers, or `tabindex`.

Two semantic-review candidates were found:

- `site/components/previews/DateNavigationPreview.vue:167` uses `span.text`,
  although `text` is reserved for a paragraph mapping.
- `site/pages/index.vue:36` gives a generic `div.unit.-preview` an accessible
  name. If it represents an independently named region, `section` or `figure`
  may be more appropriate.

## Counterfactual semantic-erasure experiment

The initial audit described the current DOM but did not answer whether a
div-heavy DOM causes variant growth. This experiment addresses that question.

### Preventing visual breakage from contaminating the result

Only native elements whose ordinary browser formatting is effectively
equivalent to `div` or `span` were eligible. The site does not target these tags
with type selectors.

- block to `div`: `article`, `aside`, `footer`, `header`, `main`, `nav`,
  `section`, and `figcaption`;
- inline to `span`: `time`.

The following were excluded because replacement changes default layout,
typography, markers, replaced-element behavior, or interaction:

- headings, `p`, `pre`, `strong`, `small`, and `code`;
- lists, description lists, and table elements;
- links, form controls, `details`, and `summary`;
- `figure`, `img`, and `svg`.

This is a conservative static equivalence check rather than a pixel screenshot
comparison.

### Population

| Metric | Count |
|---|---:|
| Visually safe semantic elements | 67 |
| Surface roots whose class identity would not change | 10 |
| Elements that would lose a native-derived identity | 57 |
| Styled semantic elements excluded to avoid visual/behavioral changes | 213 |

The 57 affected identities comprise 26 `section`, 18 `header`, 7 `article`, 2
`nav`, and one each of `footer`, `main`, `figcaption`, and `time`.

### Collision model

Each erased native identity was assigned an STN identity according to the
existing ordered structural rules (`unit → seg → fr → g`) and its nearest STN
ancestor. A new distinction was counted when all of the following held:

1. two nodes ended at the same file-local structural selector;
2. they had the same existing variant set;
3. they previously had different native identities.

Such a collision merges visual roles that are independently targetable in the
current stylesheet. Under the Nagi CSS identity model, preserving those roles
requires at least one additional variant. Structural pseudo-classes could be
imagined as an alternative, but are not counted as identity-preserving Nagi CSS.

Partial-erasure levels use 200 deterministic seeded samples each.

| Semantic erasure | Mean replacements | Added variant occurrences | Added unique stems | Collision groups |
|---:|---:|---:|---:|---:|
| 0% | 0 | 0 | 0 | 0 |
| 25% | 14.5 | 0.1 | 0.1 | 0.1 |
| 50% | 28.8 | 0.3 | 0.3 | 0.3 |
| 75% | 43.6 | 0.6 | 0.6 | 0.6 |
| 100% | 57 | 1 | 1 | 1 |

At full erasure, the only collision is in
`site/components/CustomerDirectory.vue`: the direct-child `header.header` at
line 63 and `footer.footer` at line 134 both become `div.unit`. Their different
layouts require at least one new variant if the current visual distinction is
to remain independently targetable.

Against the current 77 occurrences and 48 unique stems, the minimum
style-preserving bound is:

```text
variant occurrences: 77 -> 78  (+1.3%)
unique stems:        48 -> 49  (+2.1%)
pressure per erased native identity: 1 / 57 = 1.8%
```

### Minimum and explicit-role bounds

Erasing 57 native identities does not automatically require 57 variants. STN
absorbs most differences that remain distinguishable through structural
position.

If, however, every erased semantic role must remain explicit in the CSS
identity, all 57 occurrences need a distinction. The population contains eight
native identity types:

```text
variant occurrences: 77 -> 134 (+74.0%)
unique stems:        48 -> 56  (+16.7%)
```

Nagi CSS also prohibits variants such as `-header` and `-section` because they
shadow reserved native vocabulary. An agent that discarded the native elements
would therefore need to understand the lost roles and invent non-shadowing
synonyms. This is an explicit-role upper bound, not the minimum needed merely to
preserve the current pixels.

## Assessment

- Nagi CSS derives 92.7% of explicit base identities and 94.9% when implicit
  Nagi UI component identities are included.
- Including bounded anatomy choices, 99.8% of base-identity events require no
  new word.
- Of 67 semantic elements that can be visually erased safely, 57 lose a
  native-derived class identity.
- STN absorbs almost all minimum visual-style pressure: full erasure adds only
  one variant occurrence and one stem in this site.
- Re-expressing every lost semantic role as a class distinction is much more
  expensive: 57 occurrences and eight stems.
- Variant growth is therefore driven not by the raw number of `div` elements,
  but by the number of distinct visual roles collapsed into the same structural
  position.
- STN limits naming explosion in a div-heavy DOM, but it cannot restore HTML
  semantics, accessible landmarks, document outline, or native behavior.

The hypothesis that ignoring semantics increases variant naming is strongly
supported when CSS identities must compensate for the lost roles. For the
narrower task of preserving this site's current styling, however, the measured
increase is only 1.3%, because STN absorbs otherwise unnamed structural nodes as
intended.

## Interpretation limits

1. Nagi CSS does not choose DOM elements. A derivable class is not evidence that
   the chosen HTML semantics are correct.
2. The safe-replacement filter is conservative and static; it does not replace
   browser screenshot regression testing.
3. Preview harnesses account for many STN wrappers and are documentation/test
   fixtures rather than representative product UI.
4. The audit counts template identity decisions, not repeated CSS selector
   references.
5. Implicit Nagi UI component identities are reported separately so their
   denominator remains explicit.
