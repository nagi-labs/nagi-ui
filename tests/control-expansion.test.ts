import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repo = path.join(import.meta.dirname, "..");
const blueprintRoot = path.join(repo, "packages/core/blueprints");
const recipe = fs.readFileSync(
  path.join(repo, "packages/core/recipes/control-expansion.md"),
  "utf8",
);

test("expandable default controls ship one discoverable low-level recipe", () => {
  const controls = {
    "listbox/Listbox.vue": ["useListbox(props, selected)", "useListbox<ListboxOption>"],
    "tabs/Tabs.vue": ["useTabs(props, selectedModel)", "useTabs<TabsItem>"],
    "combobox/Combobox.vue": [
      "useCombobox(props, inputElement, inputValue, selected)",
      "useCombobox<ComboboxOption>",
    ],
  } as const;

  for (const [file, [defaultCall, expansionCall]] of Object.entries(controls)) {
    const source = fs.readFileSync(path.join(blueprintRoot, file), "utf8");
    assert.ok(source.includes(defaultCall), `${file} must use its component overload`);
    assert.ok(recipe.includes(expansionCall), `${file} must have a copyable public expansion`);
  }

  assert.doesNotMatch(
    fs.readFileSync(path.join(blueprintRoot, "listbox/Listbox.vue"), "utf8"),
    /useListbox\(props, selected, \{/,
  );
  assert.match(recipe, /no third\s+override argument/);
  assert.match(recipe, /useNativeCombobox/);
  assert.match(recipe, /nagi-ui diff.*not the implementation of imported\s+composables/s);
});
