import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const blueprintsRoot = path.join(
  import.meta.dirname,
  "../packages/core/blueprints",
);

function vueFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return vueFiles(absolute);
    return entry.isFile() && entry.name.endsWith(".vue") ? [absolute] : [];
  });
}

test("every owned Blueprint rejects implicit attribute fallthrough", () => {
  const files = vueFiles(blueprintsRoot);
  assert.ok(files.length > 0);

  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    const name = path.relative(blueprintsRoot, file);

    assert.match(
      source,
      /defineOptions\(\{[^}]*inheritAttrs: false[^}]*\}\)/u,
      `${name} must disable Vue's implicit attribute fallthrough`,
    );
    assert.doesNotMatch(
      source,
      /\$attrs/u,
      `${name} must bind supported attributes explicitly`,
    );
  }
});

test("element prop composition is limited to an explicit attrs destination", () => {
  for (const file of vueFiles(blueprintsRoot)) {
    const source = fs.readFileSync(file, "utf8");
    if (!source.includes("mergeElementProps")) continue;

    assert.match(
      source,
      /\buseAttrs\(\)/u,
      `${path.relative(blueprintsRoot, file)} must merge consumer attrs only at a documented element destination`,
    );
    assert.match(
      source,
      /v-bind="[A-Za-z][A-Za-z0-9]*Props"/u,
      `${path.relative(blueprintsRoot, file)} must bind merged element props as one auditable object`,
    );
  }
});

test("grouped native props do not require unused exclusion bindings", () => {
  for (const file of vueFiles(blueprintsRoot)) {
    const source = fs.readFileSync(file, "utf8");
    assert.doesNotMatch(
      source,
      /:\s*_[A-Za-z][A-Za-z0-9]*\s*[,}]/u,
      `${path.relative(blueprintsRoot, file)} must not hide exclusions behind throwaway bindings`,
    );
  }
});
