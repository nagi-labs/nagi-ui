import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import preset, {
  nagiUiComponentClasses,
  nagiUiComponentSlots,
} from "../packages/core/nagi-css-preset.mjs";

const repo = path.join(import.meta.dirname, "..");

test("Nagi CSS preset covers every package component export", () => {
  const source = fs.readFileSync(path.join(repo, "packages/core/components.ts"), "utf8");
  const exportedComponents = Array.from(
    source.matchAll(/export \{ default as ([A-Za-z0-9]+) \}/g),
    (match) => match[1] as string,
  ).sort();

  assert.deepEqual(Object.keys(nagiUiComponentClasses).sort(), exportedComponents);
  assert.equal(preset.componentClasses, nagiUiComponentClasses);
  assert.equal(preset.componentSlots, nagiUiComponentSlots);
});

test("declared slot surfaces stay inside their component boundary prefix", () => {
  for (const [component, slots] of Object.entries(nagiUiComponentSlots)) {
    const owner = nagiUiComponentClasses[component as keyof typeof nagiUiComponentClasses];
    assert.ok(owner, `${component} has a component boundary`);
    for (const surface of Object.values(slots)) {
      assert.ok(surface.startsWith(`${owner}-`), `${surface} starts with ${owner}-`);
    }
  }
});
