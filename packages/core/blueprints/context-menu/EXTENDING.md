# Extending ContextMenu items

Own this blueprint before adding application-specific item kinds. Keep the
extension in the owned `ContextMenu.vue`; do not add a hidden compound item
component.

1. Add a discriminated member to the exported `ContextMenuItem` union.
2. Add one explicit template branch with the appropriate native element.
3. Bind every actionable branch through `context.menu.itemProps(...)` so Menu
   owns disabled behavior, managed native-item focus, typeahead, activation, and
   close/focus restoration. Link branches must remain real anchors and pass
   `{ nativeLink: true }`; preserve `href`, `target`, `rel`, `download`, and
   optional framework-neutral `navigate` / `prefetch` callbacks.
4. Keep separators and headings non-actionable with `role="separator"` or
   presentation markup; do not register them as Menu items.
5. Add styles inside this owned surface and preserve the forced-colors active
   indicator.
6. Add keyboard, pointer, controlled-open rejection, DOM relationship, axe,
   and Nagi CSS checks for the new branch.

Run `vp exec nagi-ui own context-menu`, edit the copied files, then use the
consumer testing recipe in `recipes/testing/README.md`.
