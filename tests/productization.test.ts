import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repo = path.join(import.meta.dirname, "..");
const packageRoot = path.join(repo, "packages/core");
const recipeRoot = path.join(packageRoot, "recipes/testing");
const unovisRecipeRoot = path.join(packageRoot, "recipes/unovis");

const recipeFiles = [
  "README.md",
  "ConsumerNagiHarness.example.vue",
  "playwright.config.example.ts",
  "playwright.example.spec.ts",
  "vitest.browser.config.example.ts",
  "vitest-browser.example.test.ts",
] as const;

test("the npm package includes copyable consumer browser-test recipes", () => {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(packageRoot, "package.json"), "utf8"),
  ) as { files?: string[]; exports?: Record<string, string> };

  assert.ok(manifest.files?.includes("recipes"), "package files include recipes");
  assert.equal(
    manifest.exports?.["./recipes/control-expansion.md"],
    "./recipes/control-expansion.md",
  );
  assert.ok(fs.existsSync(path.join(packageRoot, "recipes/control-expansion.md")));
  assert.equal(
    manifest.exports?.["./recipes/unovis/theme.css"],
    "./recipes/unovis/theme.css",
  );
  assert.equal(
    manifest.exports?.["./recipes/unovis/README.md"],
    "./recipes/unovis/README.md",
  );
  assert.ok(fs.existsSync(path.join(unovisRecipeRoot, "theme.css")));
  assert.ok(fs.existsSync(path.join(unovisRecipeRoot, "README.md")));
  for (const file of recipeFiles) {
    assert.ok(fs.existsSync(path.join(recipeRoot, file)), `testing recipe ships ${file}`);
  }
});

test("consumer recipes use public package entrypoints, not repository internals", () => {
  const sources = recipeFiles.map((file) => [
    file,
    fs.readFileSync(path.join(recipeRoot, file), "utf8"),
  ] as const);

  for (const [file, source] of sources) {
    assert.doesNotMatch(source, /\/@fs|packages\/core|playground\//, `${file} is consumer-local`);
  }

  const harness = fs.readFileSync(
    path.join(recipeRoot, "ConsumerNagiHarness.example.vue"),
    "utf8",
  );
  const browserTest = fs.readFileSync(
    path.join(recipeRoot, "vitest-browser.example.test.ts"),
    "utf8",
  );
  const playwrightTest = fs.readFileSync(
    path.join(recipeRoot, "playwright.example.spec.ts"),
    "utf8",
  );
  const vitestConfig = fs.readFileSync(
    path.join(recipeRoot, "vitest.browser.config.example.ts"),
    "utf8",
  );
  assert.match(harness, /from "@nagi-labs\/nagi-ui\/components"/);
  assert.match(browserTest, /from "@nagi-labs\/nagi-ui"/);
  assert.match(browserTest, /from "axe-core"/);
  assert.match(browserTest, /assertNagiDom/);
  assert.doesNotMatch(browserTest, /disableRules|\.exclude\(/);
  assert.match(playwrightTest, /from "@axe-core\/playwright"/);
  assert.doesNotMatch(playwrightTest, /disableRules|\.exclude\(/);
  assert.match(vitestConfig, /provider: playwright\(\)/);
});

test("consumer guidance is discoverable from the repository entrypoint", () => {
  const readme = fs.readFileSync(path.join(repo, "README.md"), "utf8");
  const charter = fs.readFileSync(path.join(repo, "CHARTER.md"), "utf8");

  assert.match(readme, /docs\/when-not-to-use-nagi-ui\.md/);
  assert.match(readme, /docs\/package-ownership-model\.md/);
  assert.match(readme, /CONTRIBUTING\.md/);
  assert.match(charter, /Package first, own on demand/);
});
