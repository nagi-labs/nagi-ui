import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { nagiThemeTokens } from "../packages/core/theme/tokens.mjs";

const repo = path.join(import.meta.dirname, "..");
const themePath = path.join(repo, "packages/core/theme/default-theme.css");
const blueprintRoot = path.join(repo, "packages/core/blueprints");
const unovisBridgePath = path.join(
  repo,
  "packages/core/recipes/unovis/theme.css",
);

function themeTokens(): Map<string, string> {
  const source = fs.readFileSync(themePath, "utf8");
  const tokens = new Map<string, string>();
  for (const match of source.matchAll(/(--n(?:agi)?-[a-z0-9-]+):\s*([^;]+);/g)) {
    tokens.set(match[1] as string, (match[2] as string).replace(/\s+/g, " ").trim());
  }
  return tokens;
}

function shippedTokenUses(): { file: string; token: string }[] {
  const uses: { file: string; token: string }[] = [];
  const files = fs
    .readdirSync(blueprintRoot, { recursive: true })
    .map(String)
    .filter((file) => file.endsWith(".vue"))
    .map((file) => path.join(blueprintRoot, file));
  files.push(unovisBridgePath);
  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    for (const match of source.matchAll(/var\((--n(?:agi)?-[a-z0-9-]+)\s*\)/g)) {
      uses.push({
        file: path.relative(repo, file),
        token: match[1] as string,
      });
    }
  }
  return uses;
}

test("default theme, public manifest, and shipped token-consumer vocabulary stay identical", () => {
  const tokens = themeTokens();
  assert.ok(tokens.size > 0);
  assert.deepEqual([...tokens.keys()].sort(), [...nagiThemeTokens].sort());
  const uses = shippedTokenUses();
  const used = new Set(uses.map((use) => use.token));
  for (const token of nagiThemeTokens.filter((name) => name.startsWith("--nagi-"))) {
    assert.ok(used.has(token), `theme token ${token} has no shipped consumer`);
  }
  for (const use of uses) {
    assert.ok(tokens.has(use.token), `${use.file}: unknown token ${use.token}`);
  }
});

test("the Unovis bridge exposes every series token without hiding missing values", () => {
  const source = fs.readFileSync(unovisBridgePath, "utf8");
  for (let index = 0; index < 6; index += 1) {
    assert.match(
      source,
      new RegExp(`--vis-color${index}:\\s*var\\(--nagi-color-series-${index + 1}\\)`),
    );
  }
  assert.doesNotMatch(source, /var\(--nagi-[^,)]+,/u);
  assert.doesNotMatch(source, /#[\da-f]{3,8}\b|\brgba?\(|\bhsla?\(/iu);
});

test("Blueprint token references never embed fallback values", () => {
  const files = fs
    .readdirSync(blueprintRoot, { recursive: true })
    .map(String)
    .filter((file) => file.endsWith(".vue"));
  for (const file of files) {
    const source = fs.readFileSync(path.join(blueprintRoot, file), "utf8");
    for (const match of source.matchAll(/var\((--n(?:agi)?-[a-z0-9-]+)\s*,/g)) {
      assert.fail(`${file}: ${match[1]} embeds a fallback instead of exposing a missing token`);
    }
  }
});

test("Blueprint styling never embeds literal colors", () => {
  const files = fs
    .readdirSync(blueprintRoot, { recursive: true })
    .map(String)
    .filter((file) => file.endsWith(".vue"));
  for (const file of files) {
    const source = fs.readFileSync(path.join(blueprintRoot, file), "utf8");
    assert.doesNotMatch(
      source,
      /#[\da-f]{3,8}\b|\brgba?\(|\bhsla?\(/iu,
      `${file}: use a required theme token instead of a literal color`,
    );
  }
});

test("retired zone anatomy does not return to shipped Blueprints", () => {
  const files = fs
    .readdirSync(blueprintRoot, { recursive: true })
    .map(String)
    .filter((file) => file.endsWith(".vue"));
  for (const file of files) {
    const source = fs.readFileSync(path.join(blueprintRoot, file), "utf8");
    assert.doesNotMatch(
      source,
      /class="[^"]*\bzone\b|\.zone\b/u,
      `${file}: use the current .unit anatomy class`,
    );
  }
});
