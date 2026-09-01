import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import postcss from "postcss";

import {
  expandNagiStyleDeclaration,
  nagiStyleAxes,
  nagiStyleCompiler,
  nagiStylePropertyRegistrations,
} from "../packages/core/style-compiler.mjs";

const repo = path.join(import.meta.dirname, "..");

test("[BTN-STYLE-01] button style axes declare independent finite contracts", () => {
  assert.deepEqual(Object.keys(nagiStyleAxes.button), ["tone", "appearance", "shape", "size"]);
  assert.deepEqual(Object.keys(nagiStyleAxes.button.tone.values), ["neutral", "accent", "danger"]);
  assert.deepEqual(Object.keys(nagiStyleAxes.button.appearance.values), [
    "outlined",
    "solid",
    "ghost",
  ]);
  assert.deepEqual(Object.keys(nagiStyleAxes.button.shape.values), ["square", "rounded", "pill"]);
  assert.deepEqual(Object.keys(nagiStyleAxes.button.size.values), ["small", "medium", "large"]);
  assert.ok(Object.values(nagiStyleAxes.button).every((axis) => axis.inherits === false));
});

test("[BTN-STYLE-04] public and generated Button properties are all registered as component-local", () => {
  const css = fs.readFileSync(path.join(repo, "packages/core/theme/style-axes.css"), "utf8");
  const root = postcss.parse(css);
  const actual = new Map<string, Map<string, string>>();

  root.walkAtRules("property", (rule) => {
    const descriptors = new Map<string, string>();
    rule.walkDecls((declaration) => descriptors.set(declaration.prop, declaration.value));
    actual.set(rule.params, descriptors);
  });

  assert.deepEqual(
    [...actual.keys()],
    nagiStylePropertyRegistrations.map(({ property }) => property),
  );
  for (const registration of nagiStylePropertyRegistrations) {
    const descriptors = actual.get(registration.property);
    assert.ok(descriptors, `${registration.property} is registered`);
    assert.equal(descriptors.get("syntax"), `"${registration.syntax}"`);
    assert.equal(descriptors.get("inherits"), "false");
    assert.equal(descriptors.get("initial-value"), registration.initialValue);
  }
});

test("[BTN-STYLE-03] style axes expand independently and compose without a cross-product", async () => {
  const source = `.n-button.delete-action {
  --button-tone: danger;
  --button-appearance: outlined;
  --button-shape: rounded;
  --button-size: small;
}`;
  const result = await postcss([nagiStyleCompiler()]).process(source, { from: undefined });

  assert.match(result.css, /--_button-tone-color: var\(--nagi-color-danger\)/u);
  assert.match(
    result.css,
    /--_button-border-color: var\(--_button-tone-border, var\(--nagi-color-border\)\)/u,
  );
  assert.match(result.css, /--_button-radius: var\(--nagi-radius-control\)/u);
  assert.match(result.css, /--_button-min-block-size: 1\.75rem/u);
  assert.match(result.css, /--button-tone: danger/u);
  assert.match(result.css, /--button-appearance: outlined/u);
});

test("non-axis custom properties pass through untouched", async () => {
  const source = ".card { --card-padding: 1rem; }";
  const result = await postcss([nagiStyleCompiler()]).process(source, { from: undefined });
  assert.equal(result.css, source);
  assert.equal(expandNagiStyleDeclaration("--card-padding", "1rem"), null);
});

test("unknown finite axis values fail the build with accepted values", async () => {
  await assert.rejects(
    postcss([nagiStyleCompiler()]).process(".n-button { --button-shape: blob; }", {
      from: undefined,
    }),
    /Unknown button shape value "blob"[\s\S]*square, rounded, pill/u,
  );
});

test("component axes reject ancestor selectors and mixed selector lists", async () => {
  await assert.rejects(
    postcss([nagiStyleCompiler()]).process(".n-dialog { --button-tone: accent; }", {
      from: undefined,
    }),
    /--button-tone is a component-local button axis/u,
  );
  await assert.rejects(
    postcss([nagiStyleCompiler()]).process(".n-button, .n-dialog { --button-tone: accent; }", {
      from: undefined,
    }),
    /--button-tone is a component-local button axis/u,
  );
});

test("component axes accept package and owned Button boundaries", async () => {
  const source = `.actions > .n-button {
  --button-tone: accent;
}
[data-scope="button"][data-part="root"] {
  --button-size: small;
}`;
  const result = await postcss([nagiStyleCompiler()]).process(source, { from: undefined });
  assert.match(result.css, /--_button-tone-color/u);
  assert.match(result.css, /--_button-min-block-size/u);
});
