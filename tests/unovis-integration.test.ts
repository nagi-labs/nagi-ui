import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repo = path.join(import.meta.dirname, "..");
const rootManifest = JSON.parse(
  fs.readFileSync(path.join(repo, "package.json"), "utf8"),
) as { devDependencies?: Record<string, string> };
const coreManifest = JSON.parse(
  fs.readFileSync(path.join(repo, "packages/core/package.json"), "utf8"),
) as {
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};
const chartSource = fs.readFileSync(
  path.join(repo, "playground/src/ChartLab.vue"),
  "utf8",
);
const recipe = fs.readFileSync(
  path.join(repo, "packages/core/recipes/unovis/README.md"),
  "utf8",
);

test("Unovis stays a playground and consumer dependency rather than a core runtime", () => {
  assert.match(rootManifest.devDependencies?.["@unovis/ts"] ?? "", /^\^1\./u);
  assert.match(rootManifest.devDependencies?.["@unovis/vue"] ?? "", /^\^1\./u);
  assert.equal(coreManifest.dependencies?.["@unovis/ts"], undefined);
  assert.equal(coreManifest.dependencies?.["@unovis/vue"], undefined);
  assert.equal(coreManifest.peerDependencies?.["@unovis/ts"], undefined);
  assert.equal(coreManifest.peerDependencies?.["@unovis/vue"], undefined);
});

test("the live playground composes Card and Unovis without a Chart proxy", () => {
  assert.match(chartSource, /from "@unovis\/vue"/u);
  assert.match(chartSource, /\{ NButton, NCard \} from "@nagi-labs\/nagi-ui\/components"/u);
  assert.match(chartSource, /<n-card[\s\S]*<VisXYContainer[\s\S]*<VisLine/u);
  assert.match(chartSource, /data-nagi-unovis/u);
  assert.match(chartSource, /aria-label="Weekly active users:/u);
  assert.match(chartSource, /<table class="table">[\s\S]*<caption class="caption">/u);
  assert.match(chartSource, /lineDashArray/u);
  assert.doesNotMatch(chartSource, /<Chart\b|useChart\b/u);
});

test("the shipped recipe fixes the non-owned boundary and rejects pass-through API growth", () => {
  assert.match(recipe, /VisXYContainer: "unovis-xy-container"/u);
  assert.match(recipe, /libraryBoundaryPrefixes: \["unovis-"\]/u);
  assert.match(recipe, /Do not proxy them through `Chart\.vue`/u);
  assert.match(recipe, /data\s+table or equivalent summary/u);
  assert.match(recipe, /dark replacement theme/u);
});
