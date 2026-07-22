# Phase 4 slice 3 — Early validation experiments for the package-first model

Status: Coding-agent arm complete (2026-07-21). Human arm and repeated runs remain.

Note: the literal-fallback contract in effect during these experiments was
retired on 2026-07-21. The boundary validated by the experiments — that an app
can change its brand through app-side tokens without modifying a Blueprint —
is unchanged. The canonical paths are now `default-theme.css` plus app
overrides, or a checked complete replacement theme.

This document turns the "early validation" section in
`docs/package-ownership-model.md` into an executable protocol. It evaluates
three boundaries of the package-first / own-on-demand model. Each experiment
produces evidence for the warning signs documented there.

## Shared protocol (coding-agent arm)

- Subject: a coding agent with no context from this conversation. It receives
  only the repository and bundled documentation (README, CHARTER, docs, and
  AGENTS.md), matching the information available to a real consumer.
- Tasks are phrased in the consumer's language and **never hint at the expected
  path** (token, own, or recipe). Which path the agent chooses is itself a
  measured result.
- Run each task on a clean `main`, capture the diff afterward, then restore with
  `git checkout . && git clean -fd`. The agent does not commit.
- Measurements: task completion (including green machine verification), changed
  file count and diff line count, whether package/Blueprint source was entered,
  chosen path, and files consulted as self-reported by the agent. Self-reporting
  bias is recorded as a known limitation.
- The browser suite is run by a human because of sandbox constraints.

## Experiment A — Button/theme boundary

**Question**: Can an ordinary brand change be completed using only theme tokens?
(warning sign 3, "the cliff between theme and ownership," and warning sign 6,
"AI friendliness does not differentiate the product").

- Task: "Change the playground UI brand to an amber palette (`#b45309`) and
  make the overall density slightly more compact. The change must appear on
  `/dropdown.html` and `/listbox.html`, and the existing unit tests must pass."
- Success: zero changes under `packages/core/blueprints`; achieved only through
  app-side CSS token overrides (or an equivalent complete theme replacement),
  with a small diff.
- Failure signals: direct Blueprint SFC edits, global literal-color replacement,
  or failure to discover the tokens.

## Experiment B — Dropdown/ownership boundary

**Question**: Does ownership remain local for a requirement that the schema
cannot express (an account row with an avatar)? (warning sign 2, "guarantees
disappear upon own," and warning sign 4, "owned Blueprints are hard to read").

- Task: "Add an account row at the top of the menu on `/dropdown.html`, showing
  an initial avatar, name, and email (selection sets `lastAction = \"account\"`).
  Do not break the behavior of other items. Unit tests must pass."
- Success: `nagi-ui own dropdown-menu` (or equivalent copy), followed by a local
  diff that follows the extension recipe for the owned union, template branch,
  and CSS. Package source remains unchanged, and wiring (`itemProps`) remains
  in the renderer.
- Failure signals: direct edits to the package Blueprint, replacing the schema
  with a slot, or breaking ARIA wiring (whether lint/tests detect this is also
  measured).

## Experiment C — Combobox/upstream-following boundary

**Question**: Can owned source with behavior changes follow an upstream fix?
(the core of warning sign 2).

- Setup (by the experimenter): own Combobox and add a local change (for example,
  select the entire input after committing a selection while retaining input
  focus). Then make a small upstream change to `Combobox.vue`, bump the package
  version, and create a state in which `nagi-ui diff` reports `drifted`.
- Task: "After updating the package, `nagi-ui diff` reports drifted. Incorporate
  the upstream fix while preserving the local change."
- Success: after integration, diff returns to `modified` (local changes only),
  both changes remain, and unit tests are green.
- Failure signals: loss of the local change, omission of the upstream fix,
  failure to update the stamp, or abandoning ownership because the merge cannot
  be completed.

## Using the results

- A fails: record the missing token vocabulary, including the specific role,
  as an elevation candidate.
- B fails: the extension recipe or lint is insufficient. Escaping into slots is
  evidence that the guardrails in §3.5 are too weak as documentation.
- C fails: the ownership maintenance contract lacks diff/migration tooling.
  Strengthen tooling in a later Phase 4 slice before productization.

## Results

### Experiment A — coding-agent arm, 2026-07-21: **PASS**

- Path: the agent independently found the semantic tokens and completed the
  change with a new `playground/src/brand.css` (13 `:root` token overrides) plus
  imports from both entries.
- **Zero changes under `packages/core`**, mechanically confirmed by `git diff`.
  There were no direct Blueprint edits or global literal replacements.
- Diff size: 6 files, +65 / −62 lines. Most of this was the requested warm-toned
  page chrome and fixture hardcoded colors changed to token references under
  the contract in effect at the time.
- Notable judgment: from the parity test, the agent correctly inferred that
  changing the default theme or Blueprint would break tests and that app-side
  token overrides were intended for brand changes. It also noted custom-property
  inheritance into popovers under the no-Teleport model and handled import order
  correctly so the theme override wins.
- Machine verification: `vp run test`, 96/96. The agent also production-built
  both pages and confirmed that their output CSS included `#b45309`.
- Files consulted (self-reported): approximately 12.
- Warning-sign implication: the "cliff between theme and ownership" was **not
  observed** for this ordinary brand-change task. Against "AI friendliness does
  not differentiate the product," this is one sample in which a context-free
  agent chose the correct path using only bundled documentation and the parity
  test.

### Experiment B — coding-agent arm, 2026-07-21: **PASS**

- Path: the agent independently reached `nagi-ui own dropdown-menu` and extended
  the owned schema according to the recipe (`DropdownMenuAccountNode` union
  member, `accountEntry()`, a `menuEntries()` case, a template branch, and
  `.-account` CSS).
- **It also rejected the alternatives for the correct reasons**: directly
  extending the package schema would violate "speculative node kinds are not
  added to the package API," while a `#item` slot is explicitly prohibited by
  CHARTER §3.5. The written guardrails worked as intended.
- **Locality**: zero changes under `packages/core`. The app-side diff was
  DropdownLab +18/−2 plus four owned files (only schema and Item were edited;
  two remained clean). Only File actions switched to the owned import; RTL and
  Themed continued to use the package version.
- **Wiring preservation**: ARIA/focus wiring remained in the renderer through
  `menu.itemProps(accountEntry(node), …)`. The agent also ran
  `nagi-ui/verified-bindings` lint and `nagi-ui diff` (two files modified, the
  rest clean).
- **Reproducible contract teaching**: the first `nagi-css check` rejected
  `.avatar` as out-of-vocabulary. The agent followed CONTRACT and corrected it
  to the `text -avatar` variant. This demonstrates that the named-error-to-
  convergence loop works for a third-party agent.
- Machine verification: `vp run test`, 96/96; an SSR smoke test confirmed the
  account row's rendering, role, and separator. The browser suite was not run
  because of sandbox constraints and remains part of the human arm.
- Files consulted (self-reported): approximately 15.
- Warning-sign implication: lint, diff, and tests all remained effective
  immediately after own, contrary to "guarantees disappear upon own." Against
  "owned Blueprints are hard to read," the change was confined to two files:
  schema and renderer.

### Experiment C — coding-agent arm, 2026-07-21: **PASS** (with two concrete benefits)

- Setup: own Combobox at `@0.0.0`, add two local changes
  (`spellcheck="false"` and input `font-weight: 650`), then add upstream
  `autocapitalize="none"` and bump to version 0.0.1 so `diff` reports `drifted`.
  **The local and upstream changes were deliberately placed on the same
  `<input>` element so they would conflict.**
- Path: the agent correctly interpreted stamp `@0.0.0` against installed
  0.0.1, obtained the base, and performed a **three-way merge** with
  `git merge-file`. It resolved one conflict by retaining both changes and
  updated the stamp to `@0.0.1`. The final state was `modified` (local changes
  only), with both the upstream fix and local change preserved. `vp run test`
  passed 96/96.
- **Benefit 1 (agent found a bug)**: the CLI test hardcoded version `@0.0.0` and
  could not create a drifted state after a version bump. The agent made it
  version-independent, and that fix has been adopted.
- **Benefit 2 (design issue surfaced)**: `diff` exited 1 even for `modified`,
  but `modified` is the **steady state** of a customized owned file and would
  leave the CI gate permanently red. The gate was corrected to fail only for
  `drifted` and `unknown-source`, with an added test for the exit contract.
- **Documented limitation**: a three-way merge base cannot be reconstructed
  from the marker. In this experiment, the agent was saved by the uncommitted
  version bump, which meant HEAD still represented 0.0.0. The general consumer
  workflow is to **commit immediately after own**. This is now documented in
  `docs/phase4-ownership-cli.md`; storing the base in the CLI is deferred until
  demand is observed.

## Summary (coding-agent arm, one sample per experiment)

All three experiments passed. At the theme, ownership, and upstream-following
boundaries, a context-free agent independently chose the intended path (token
override, own plus extension recipe, and three-way merge plus stamp update).
The guardrail documentation (§3.5 and the prohibition on speculative APIs) and
machine verification (parity, nagi-css, verified-bindings, and diff) all pushed
in the intended direction. There is currently no observation that overturns
the ownership model for warning signs 2, 3, 4, or 6. Each experiment has only
one sample; the human arm and repeated runs remain future work.
