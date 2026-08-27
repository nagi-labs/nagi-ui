# Nagi UI contributor instructions

Read `CHARTER.md` before changing public behavior or component structure.
Preserve the native-first, visible-DOM, package-first/own-on-demand boundaries.

Use `vp` for Node, package-manager, script, and package-binary commands. Do
not invoke pnpm directly.

Before finishing a code change, run the relevant subset of:

```sh
vp run lint
vp run test:integration
vp run test
vp run typecheck:vue
vp run test:browser
```

Blueprints must conform to Nagi CSS. Keep package and owned-source behavior in
the same canonical SFC. Update public documentation when commands, APIs,
security boundaries, or operational behavior change.
