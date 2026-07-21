import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  components,
  diffOwned,
  main,
  markerLine,
  ownComponent,
  parseMarker,
} from "../packages/core/cli/nagi-ui.mjs";

const packageRoot = path.join(import.meta.dirname, "../packages/core");

function tempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "nagi-cli-"));
}

test("markers round-trip for vue and ts files", () => {
  const vue = markerLine("DropdownMenu.vue", "dropdown-menu", "0.0.0");
  assert.equal(vue, "<!-- @nagi-source dropdown-menu/DropdownMenu.vue@0.0.0 -->\n");
  assert.deepEqual(parseMarker(vue.trim()), {
    component: "dropdown-menu",
    file: "DropdownMenu.vue",
    version: "0.0.0",
  });

  const ts = markerLine("dropdown-schema.ts", "dropdown-menu", "1.2.3");
  assert.equal(ts, "// @nagi-source dropdown-menu/dropdown-schema.ts@1.2.3\n");
  assert.deepEqual(parseMarker(ts.trim()), {
    component: "dropdown-menu",
    file: "dropdown-schema.ts",
    version: "1.2.3",
  });

  assert.equal(parseMarker("<!-- not a marker -->"), null);
});

test("own copies the exact installed source with a stamped first line", () => {
  const targetRoot = tempDir();
  const result = ownComponent("dropdown-menu", { packageRoot, targetRoot });
  assert.equal(result.files.length, 4);

  for (const file of result.files) {
    const content = fs.readFileSync(file, "utf8");
    const [first, ...rest] = content.split("\n");
    const marker = parseMarker(first as string);
    assert.ok(marker, `${file} is stamped`);
    const upstream = fs.readFileSync(
      path.join(packageRoot, components["dropdown-menu"].dir, marker!.file),
      "utf8",
    );
    assert.equal(rest.join("\n"), upstream, `${file} body equals upstream`);
  }
});

test("own refuses to overwrite a non-empty target without --force", () => {
  const targetRoot = tempDir();
  ownComponent("listbox", { packageRoot, targetRoot });
  assert.throws(() => ownComponent("listbox", { packageRoot, targetRoot }), /--force/);
  ownComponent("listbox", { packageRoot, targetRoot, force: true });
});

test("own rejects unknown components with the available list", () => {
  assert.throws(
    () => ownComponent("card", { packageRoot, targetRoot: tempDir() }),
    /Unknown component "card"/,
  );
});

test("diff reports clean, modified, and drifted owned sources", () => {
  const targetRoot = tempDir();
  ownComponent("listbox", { packageRoot, targetRoot });
  ownComponent("combobox", { packageRoot, targetRoot });

  let entries = diffOwned(targetRoot, { packageRoot });
  assert.equal(entries.length, 2);
  assert.ok(entries.every((entry) => entry.status === "clean"));

  const owned = path.join(targetRoot, "listbox/Listbox.vue");
  fs.appendFileSync(owned, "\n<!-- local edit -->\n");
  entries = diffOwned(targetRoot, { packageRoot });
  assert.equal(entries.find((entry) => entry.file === owned)?.status, "modified");

  const stampedVersion = parseMarker(
    fs.readFileSync(owned, "utf8").split("\n", 1)[0] as string,
  )?.version;
  assert.ok(stampedVersion, "owned file is stamped with the installed version");
  const drifted = fs
    .readFileSync(owned, "utf8")
    .replace(`@${stampedVersion}`, `@${stampedVersion}-old`);
  fs.writeFileSync(owned, drifted);
  entries = diffOwned(targetRoot, { packageRoot });
  assert.equal(entries.find((entry) => entry.file === owned)?.status, "drifted");
});

test("diff gates only on drifted and unknown-source, not on local modification", () => {
  const repo = path.join(import.meta.dirname, "..");
  const targetRoot = tempDir();
  ownComponent("listbox", { packageRoot, targetRoot });

  assert.equal(main(["diff", "--dir", targetRoot], repo), 0);

  const owned = path.join(targetRoot, "listbox/Listbox.vue");
  fs.appendFileSync(owned, "\n<!-- local edit -->\n");
  assert.equal(main(["diff", "--dir", targetRoot], repo), 0, "modified stays green");

  const stampedVersion = parseMarker(
    fs.readFileSync(owned, "utf8").split("\n", 1)[0] as string,
  )?.version;
  fs.writeFileSync(
    owned,
    fs.readFileSync(owned, "utf8").replace(`@${stampedVersion}`, `@${stampedVersion}-old`),
  );
  assert.equal(main(["diff", "--dir", targetRoot], repo), 1, "drifted fails the gate");
});

test("diff flags markers that no longer match a shipped source", () => {
  const targetRoot = tempDir();
  const dir = path.join(targetRoot, "mystery");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, "Mystery.vue"),
    "<!-- @nagi-source mystery/Mystery.vue@0.0.0 -->\n<template><div /></template>\n",
  );
  const entries = diffOwned(targetRoot, { packageRoot });
  assert.equal(entries.length, 1);
  assert.equal(entries[0]?.status, "unknown-source");
});

test("diff ignores files without markers and missing roots", () => {
  const targetRoot = tempDir();
  fs.writeFileSync(path.join(targetRoot, "App.vue"), "<template><div /></template>\n");
  assert.deepEqual(diffOwned(targetRoot, { packageRoot }), []);
  assert.deepEqual(diffOwned(path.join(targetRoot, "nope"), { packageRoot }), []);
});
