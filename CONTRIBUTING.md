# Contributing to Nagi UI

Thank you for helping improve Nagi UI.

## Development

Requirements:

- Node.js 22.18 or newer
- `vp`
- APM 0.28.0 (the setup command installs the pinned version when needed)

Restore the generated configuration used by Claude Code, Codex, and Copilot:

```sh
vp run agents:setup
```

APM reads `apm.yml` and `apm.lock.yaml`, installs the pinned Nagi CSS Skill,
and compiles the target-specific files. These generated files and
`apm_modules/` are intentionally ignored; edit `.apm/` sources instead. Check
the installed files and lockfile with `vp run agents:audit`.

Install dependencies and run the checks:

```sh
vp install
vp run lint
vp run typecheck
vp run test
vp run test:integration
vp run test:browser
```

Keep changes focused, add tests for behavior changes, and update public
documentation when an API or workflow changes. Generated files and local
dependency stores must not be committed.

Before changing public behavior or component structure, read
[CONCEPT.md](CONCEPT.md), [CHARTER.md](CHARTER.md), and the
[implementation guidelines](docs/implementation-guidelines.md). The
[component layer audit](docs/component-layer-audit.md) records the evidence
behind the current architecture boundaries, and
[Component Definitions](docs/component-definitions.md) covers how a component's
guarantees and functional anatomy are declared and verified.

## Pull requests

Describe the problem, the chosen approach, and any compatibility or
accessibility impact. By contributing, you agree that your work is licensed
under the repository's MIT License.
