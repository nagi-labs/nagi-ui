# Extending Menubar items

Own this blueprint before adding application-specific popup item kinds. Keep
the extension in the owned `Menubar.vue`; the horizontal coordinator and every
popup must continue to delegate vertical navigation to `useMenu`.

1. Add a discriminated member to the exported action union.
2. Add one explicit native-element branch in the popup template.
3. Bind actions through `menubar.actionProps(...)`; link actions must remain
   real anchors and preserve `href`, `target`, `rel`, `download`, and optional
   framework-neutral `navigate` / `prefetch` callbacks so keyboard, pointer,
   modifier, and router activation agree.
4. Keep labels and separators out of the actionable item collection.
5. Preserve Menu typeahead, Tab/Escape close behavior, RTL horizontal movement,
   disabled semantics, and focus restoration.
6. Add keyboard, pointer, controlled-open rejection, DOM relationship, axe,
   and Nagi CSS checks for the new branch.

Run `vp exec nagi-ui own menubar`, edit the copied files, then use the consumer
testing recipe in `recipes/testing/README.md`.
