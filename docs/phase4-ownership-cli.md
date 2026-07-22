# Phase 4 slice 2 - ownership CLI (`nagi-ui own` / `diff`)

Status: Implemented (2026-07-18). The `@nagi-source` metadata format is now
fixed by this implementation under the CHARTER section 3 maintenance contract.

## Commands

```sh
vp exec nagi-ui list
vp exec nagi-ui own dropdown-menu [--dir src/components/nagi] [--force]
vp exec nagi-ui diff [--dir src/components/nagi]
```

`nagi-ui list` prints the available component names and is the machine-readable
source of truth for the installed version. This document deliberately does not
duplicate that growing registry as a static list; package-export/ownership
parity is enforced by `tests/cli.test.ts`.

The binary ships with `@nagi-labs/nagi-ui`. `packages/core/cli/nagi-ui.mjs`
defines the `setup`, `list`, `own`, and `diff` subcommands through `citty`;
ownership and setup logic live in focused sibling modules. Because the package
distributes raw SFC source, `own` copies **the exact files the package itself
consumes**. There is no separate build artifact that can drift from the source,
which preserves the single-source principle. Framework setup is documented
separately in `docs/setup-integrations.md`.

## Fixed metadata format

The first line of every owned file is a machine-readable marker:

```text
<!-- @nagi-source dropdown-menu/DropdownMenu.vue@0.4.0 -->   (.vue)
// @nagi-source dropdown-menu/dropdown-schema.ts@0.4.0       (.ts)
```

Grammar: `@nagi-source <component>/<file>@<version>` - the component name from
the CLI registry, the file within that component, and the installed package
version at copy time. Per-file stamping, rather than one marker per directory,
keeps the marker adjacent to the content it describes and survives file moves.

## `diff` statuses

| Status | Meaning |
|---|---|
| `clean` | owned body is identical to the installed upstream source |
| `modified` | bodies differ and the stamp matches the installed version; the difference is local |
| `drifted` | bodies differ and the installed version moved past the stamp; local and upstream changes may both be present |
| `unknown-source` | the marker names a component or file the installed version does not ship |

`diff` exits nonzero only for `drifted` and `unknown-source`, so it can run in CI
as an "owned sources reconciled after upgrade?" gate. `modified` is the normal
steady state of a customized owned file and does not fail the gate, as learned
in validation experiment C. For content comparison, the command prints a ready-
made `git diff --no-index` invocation against the installed source.

## Commit immediately after `own` to preserve the three-way merge base

The safest way to resolve `drifted` is a three-way merge: base is the upstream
source at ownership time, ours is the owned source, and theirs is the current
upstream source. However, **the marker's version number cannot reconstruct the
base content**. The only general way for a consuming project to preserve the
base is to commit the untouched owned files immediately after `own`; future
merges can then retrieve the base from Git history. Validation experiment C
followed this procedure and merged accurately with `git merge-file`. A CLI-side
mechanism for storing the base should be considered only after demand is
observed.

After `own`, the completion message therefore instructs the consumer not only
to switch imports, but also to commit the unchanged source immediately, apply
the package-shipped [`recipes/testing`](../packages/core/recipes/testing/README.md),
and run `nagi-ui diff` as a CI gate. Ownership is not merely a copy command; it
includes this complete maintenance loop.

## Deliberate limits of this slice

- `own` does not rewrite application imports; it prints the instruction. The
  owned copy keeps importing `@nagi-labs/nagi-ui` for composables and its own
  relative files, so it compiles as copied.
- Owned files keep their fallback-free `var(--nagi-*)` references, so the
  default theme and consumer overrides continue to apply after ownership under
  design principle 5.
- There is no three-way merge command. `drifted` tells consumers that both sides
  moved; resolution is a manual or agent-driven edit informed by the printed
  diff command. A breaking release must ship its version-specific migration
  note; v0 has no prior breaking release to migrate from. A generic migration
  engine and richer merge tooling remain demand-driven follow-up work.

## Verification

- `tests/cli.test.ts` covers marker round trips, byte-identical owned bodies with
  stamps, refusal to overwrite a nonempty target, unknown-component errors, and
  the full clean -> modified -> drifted -> unknown-source status matrix in
  temporary directories. Citty subcommand routing also covers multi-component
  ownership and enum validation.
- A manual in-repository end-to-end run owns `dropdown-menu` into a temporary
  directory and then runs `diff`, which reports four `clean` files and exits 0.
