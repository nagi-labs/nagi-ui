import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import preset, {
  nagiUiAnatomyClasses,
  nagiUiComponents,
  nagiUiComponentSlots,
  nagiUiSurfaceRootPrefixes,
  nagiUiThemeTokens,
} from "../packages/core/nagi-css-preset.mjs";
import { requiredNagiThemeTokens } from "../packages/core/src/index.ts";

const repo = path.join(import.meta.dirname, "..");

test("Nagi CSS preset covers every package component export", () => {
  const source = fs.readFileSync(path.join(repo, "packages/core/components.ts"), "utf8");
  const exportedComponents = Array.from(
    source.matchAll(/export \{ default as ([A-Za-z0-9]+) \}/g),
    (match) => match[1] as string,
  ).sort();

  assert.deepEqual([...nagiUiComponents].sort(), exportedComponents);
  assert.equal(preset.anatomyClasses, nagiUiAnatomyClasses);
  assert.ok(nagiUiAnatomyClasses.includes("rail"));
  assert.equal(preset.componentClassPrefix, "n-");
  assert.equal(preset.componentClasses, nagiUiComponents);
  assert.equal(preset.componentSlots, nagiUiComponentSlots);
  assert.deepEqual(nagiUiSurfaceRootPrefixes, ["n-"]);
  assert.equal(nagiUiThemeTokens, requiredNagiThemeTokens);
});

test("declared slot surfaces stay inside their component boundary prefix", () => {
  for (const [component, slots] of Object.entries(nagiUiComponentSlots)) {
    assert.ok(nagiUiComponents.includes(component), `${component} has a component boundary`);
    const owner = `n-${component
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
      .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
      .toLowerCase()}`;
    for (const surface of Object.values(slots)) {
      assert.ok(surface.startsWith(`${owner}-`), `${surface} starts with ${owner}-`);
    }
  }
});
