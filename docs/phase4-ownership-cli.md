# Phase 4 slice 2 — ownership CLI (`nagi-ui own` / `diff`)

Status: Implemented (2026-07-18). The `@nagi-source` metadata format is now
fixed by this implementation (CHARTER §3 保守契約).

## Commands

```sh
vp exec nagi-ui list
vp exec nagi-ui own dropdown-menu [--dir src/components/nagi] [--force]
vp exec nagi-ui diff [--dir src/components/nagi]
```

Available component names are `alert`, `badge`, `button`, `card`, `combobox`,
`dialog`, `disclosure`, `dropdown-menu`, `listbox`, `popover`, `toast`, and
`tooltip`. `nagi-ui list` is the machine-readable source of truth for the
installed version.

The binary ships with `@nagi-labs/nagi-ui`. `packages/core/cli/nagi-ui.mjs`
defines the `setup` / `list` / `own` / `diff` subcommands through `citty`;
ownership and setup logic live in focused sibling modules. Because the package
distributes raw SFC source, `own` copies **the exact files the package itself
consumes** — there is no separate build artifact to drift from (single-source
principle). Framework setup is documented separately in
`docs/setup-integrations.md`.

## Fixed metadata format

The first line of every owned file is a machine-readable marker:

```text
<!-- @nagi-source dropdown-menu/DropdownMenu.vue@0.4.0 -->   (.vue)
// @nagi-source dropdown-menu/dropdown-schema.ts@0.4.0       (.ts)
```

Grammar: `@nagi-source <component>/<file>@<version>` — the component name from
the CLI registry, the file within that component, and the installed package
version at copy time. Per-file stamping (not per-directory) keeps the marker
adjacent to the content it describes and survives file moves.

## `diff` statuses

| Status | Meaning |
|---|---|
| `clean` | owned body is identical to the installed upstream source |
| `modified` | bodies differ and the stamp matches the installed version — the difference is local |
| `drifted` | bodies differ and the installed version moved past the stamp — local and upstream changes may both be present |
| `unknown-source` | the marker names a component/file the installed version does not ship |

`diff` exits non-zero only for `drifted` and `unknown-source`, so it can run
in CI as an "owned sources reconciled after upgrade?" gate — `modified` is the
normal steady state of a customized owned file and does not fail the gate
(learned in validation experiment C). For content comparison it prints a
ready-made `git diff --no-index` command against the installed source.

## Own したら即コミットする(3-way merge の base 確保)

`drifted` の解消は 3-way merge(base = own 時点の upstream、ours = owned、
theirs = 現在の upstream)が最も安全だが、**base の内容は marker の version
番号からは復元できない**。消費プロジェクトで base を確保する唯一の一般的手段は
「`own` 直後に owned ファイルをそのままコミットする」ことである(以後 base は
git 履歴から取れる)。validation experiment C はこの手順で `git merge-file` に
よる正確な取り込みに成功した。base を CLI 側で保存する仕組みは、必要が観測
されてから検討する。

## Deliberate limits of this slice

- `own` does not rewrite application imports; it prints the instruction. The
  owned copy keeps importing `@nagi-labs/nagi-ui` (composables) and its own
  relative files, so it compiles as copied.
- Owned files keep their `var(--nagi-*, fallback)` references, so theme.css
  continues to apply after ownership (design principle 5).
- No three-way merge: `drifted` tells you both sides moved; resolving is a
  manual (or agent-driven) edit informed by the printed diff command.
  Migration notes per breaking release belong to a later slice, as does
  richer upgrade tooling.

## Verification

- `tests/cli.test.ts`: marker round-trip, own copies byte-identical bodies
  with stamps, non-empty target refusal, unknown component error, and the
  full clean → modified → drifted → unknown-source status matrix on temp dirs;
  citty subcommand routing also covers multi-component ownership and enum
  validation.
- Manual end-to-end in-repo: `own dropdown-menu` into a temp dir followed by
  `diff` reports 4 × `clean`, exit 0.
