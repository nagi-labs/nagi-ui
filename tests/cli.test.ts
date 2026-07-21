import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  components,
  detectSetupDefaults,
  diffOwned,
  main,
  markerLine,
  ownComponent,
  parseMarker,
  setupProject,
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

test("every registered component points at a shipped ownership source", () => {
  for (const [name, spec] of Object.entries(components)) {
    assert.ok(spec.files.length > 0, `${name} has at least one source file`);
    for (const file of spec.files) {
      assert.ok(
        fs.existsSync(path.join(packageRoot, spec.dir, file)),
        `${name}/${file} exists in the package`,
      );
    }
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
    () => ownComponent("carousel", { packageRoot, targetRoot: tempDir() }),
    /Unknown component "carousel"/,
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

test("diff gates only on drifted and unknown-source, not on local modification", async () => {
  const repo = path.join(import.meta.dirname, "..");
  const targetRoot = tempDir();
  ownComponent("listbox", { packageRoot, targetRoot });

  assert.equal(await main(["diff", "--dir", targetRoot], repo), 0);

  const owned = path.join(targetRoot, "listbox/Listbox.vue");
  fs.appendFileSync(owned, "\n<!-- local edit -->\n");
  assert.equal(await main(["diff", "--dir", targetRoot], repo), 0, "modified stays green");

  const stampedVersion = parseMarker(
    fs.readFileSync(owned, "utf8").split("\n", 1)[0] as string,
  )?.version;
  fs.writeFileSync(
    owned,
    fs.readFileSync(owned, "utf8").replace(`@${stampedVersion}`, `@${stampedVersion}-old`),
  );
  assert.equal(await main(["diff", "--dir", targetRoot], repo), 1, "drifted fails the gate");
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

test("setup detects Nuxt integrations from the consumer manifest", () => {
  const cwd = tempDir();
  fs.writeFileSync(
    path.join(cwd, "package.json"),
    JSON.stringify({ dependencies: { nuxt: "^4.0.0", "@nuxt/image": "^2.0.0" } }),
  );
  assert.deepEqual(detectSetupDefaults(cwd), {
    framework: "nuxt",
    link: "nuxt-link",
    image: "nuxt-image",
  });
});

test("setup writes a Nuxt adapter without copying framework-specific Blueprints", () => {
  const cwd = tempDir();
  const result = setupProject({
    cwd,
    framework: "nuxt",
    link: "nuxt-link",
    image: "nuxt-image",
  });
  assert.deepEqual(JSON.parse(fs.readFileSync(result.configPath, "utf8")), {
    framework: "nuxt",
    link: "nuxt-link",
    image: "nuxt-image",
    integrationsDir: "src/nagi",
  });
  const integration = fs.readFileSync(result.integrationPath, "utf8");
  assert.match(integration, /from "#imports"/);
  assert.match(integration, /href: router\.resolve\(to\)\.href/);
  assert.match(integration, /navigate: \(\) => navigateTo\(to\)/);
  assert.match(integration, /prefetch: \(\) => preloadRouteComponents\(to\)/);
  assert.match(integration, /src: image\(src, modifiers\)/);
});

test("setup validates framework choices and protects existing user files", () => {
  const cwd = tempDir();
  assert.throws(
    () =>
      setupProject({
        cwd,
        framework: "vue",
        link: "nuxt-link",
        image: "native",
      }),
    /requires framework "nuxt"/,
  );

  const integrationDir = path.join(cwd, "src/nagi");
  fs.mkdirSync(integrationDir, { recursive: true });
  fs.writeFileSync(path.join(integrationDir, "integrations.ts"), "// user owned\n");
  assert.throws(
    () =>
      setupProject({
        cwd,
        framework: "vue",
        link: "native",
        image: "native",
      }),
    /--force/,
  );
});

test("setup accepts complete flags for non-interactive agents and CI", async () => {
  const cwd = tempDir();
  assert.equal(
    await main(
      [
        "setup",
        "--framework",
        "vue",
        "--link",
        "native",
        "--image",
        "native",
        "--dir",
        "app/nagi",
      ],
      cwd,
    ),
    0,
  );
  assert.ok(fs.existsSync(path.join(cwd, "app/nagi/integrations.ts")));
});

test("citty command routing preserves multi-component ownership and enum validation", async () => {
  const targetRoot = tempDir();
  const repo = path.join(import.meta.dirname, "..");
  const io = { log() {}, warn() {} };
  assert.equal(
    await main(["own", "listbox", "combobox", "--dir", targetRoot], repo, io),
    0,
  );
  assert.ok(fs.existsSync(path.join(targetRoot, "listbox/Listbox.vue")));
  assert.ok(fs.existsSync(path.join(targetRoot, "combobox/Combobox.vue")));

  await assert.rejects(
    main(
      ["setup", "--framework", "react", "--link", "native", "--image", "native"],
      repo,
      io,
    ),
    /Invalid value for argument:.*--framework/,
  );
});
