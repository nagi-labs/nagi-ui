# Nagi UI

Read `CHARTER.md` before designing or implementing anything. It is the
canonical architecture charter and it constrains implementation choices:

- No compound components (`Root`/`Trigger`/`Popup` wrapper tags), no
  `asChild`/render props, no Teleport/portal, no custom focus traps, no
  `data-state` duplicating native state, no CSS or animation runtimes in core.
- Behavior is delegated to the platform (Popover API, `<dialog>`, Invoker
  Commands); the library injects standard attributes via composables and
  directive sugar.
- Do not propose these forbidden structures as "improvements". When in doubt,
  follow the Decision Principles in CHARTER §1.

When an implementation discovery forces a design change, update CHARTER.md
(the affected section plus the Revision History at the bottom) in the same change.

The styling foundation is the Nagi CSS contract, developed in the sibling
repository `../nagi-css` (see its `CONTRACT.md`). Blueprints must pass
`nagi-css check`.

Follow the phase order in CHARTER §10; do not skip ahead of an unfinished
phase's completion criteria.

Use Vite+ for every Node/package task; do not invoke `pnpm` directly. Run unit
tests with `vp run test`, TypeScript 7 checks with `vp run typecheck`, and
browser keyboard/focus tests with `vp run test:browser`. Runtime tests use
Node's type stripping, so test files must keep erasable syntax only (no
enums/namespaces).
