# Contributing to Nagi UI

Thank you for helping improve Nagi UI.

## Development

Requirements:

- Node.js 22.18 or newer
- `vp`

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

## Pull requests

Describe the problem, the chosen approach, and any compatibility or
accessibility impact. By contributing, you agree that your work is licensed
under the repository's MIT License.
