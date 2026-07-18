import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repo = path.join(import.meta.dirname, "..");
const themePath = path.join(repo, "packages/core/theme/theme.css");
const blueprintRoot = path.join(repo, "packages/core/blueprints");

function themeTokens(): Map<string, string> {
  const source = fs.readFileSync(themePath, "utf8");
  const tokens = new Map<string, string>();
  for (const match of source.matchAll(/(--nagi-[a-z0-9-]+):\s*([^;]+);/g)) {
    tokens.set(match[1] as string, (match[2] as string).replace(/\s+/g, " ").trim());
  }
  return tokens;
}

interface TokenUse {
  file: string;
  token: string;
  fallback: string;
}

function blueprintTokenUses(): TokenUse[] {
  const uses: TokenUse[] = [];
  const files = fs
    .readdirSync(blueprintRoot, { recursive: true })
    .map(String)
    .filter((file) => file.endsWith(".vue"));
  for (const file of files) {
    const source = fs.readFileSync(path.join(blueprintRoot, file), "utf8");
    // one nesting level is enough for rgb() fallbacks
    for (const match of source.matchAll(
      /var\((--nagi-[a-z0-9-]+),\s*((?:[^()]|\([^()]*\))*)\)/g,
    )) {
      uses.push({
        file,
        token: match[1] as string,
        fallback: (match[2] as string).replace(/\s+/g, " ").trim(),
      });
    }
  }
  return uses;
}

test("theme.css defines at least one token and every token is used by a blueprint", () => {
  const tokens = themeTokens();
  assert.ok(tokens.size > 0);
  const used = new Set(blueprintTokenUses().map((use) => use.token));
  for (const token of tokens.keys()) {
    assert.ok(used.has(token), `theme token ${token} is not used by any blueprint`);
  }
});

test("every blueprint token reference has a fallback equal to the theme default", () => {
  const tokens = themeTokens();
  const uses = blueprintTokenUses();
  assert.ok(uses.length > 0);
  for (const use of uses) {
    const themeValue = tokens.get(use.token);
    assert.ok(themeValue !== undefined, `${use.file}: unknown token ${use.token}`);
    assert.equal(
      use.fallback,
      themeValue,
      `${use.file}: fallback for ${use.token} drifted from theme.css`,
    );
  }
});

test("blueprint token references never omit the fallback", () => {
  const files = fs
    .readdirSync(blueprintRoot, { recursive: true })
    .map(String)
    .filter((file) => file.endsWith(".vue"));
  for (const file of files) {
    const source = fs.readFileSync(path.join(blueprintRoot, file), "utf8");
    for (const match of source.matchAll(/var\((--nagi-[a-z0-9-]+)\s*\)/g)) {
      assert.fail(`${file}: ${match[1]} is referenced without a fallback`);
    }
  }
});
