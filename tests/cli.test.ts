import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  checkThemeFiles,
  components,
  detectSetupDefaults,
  diffOwned,
  inspectProjectStatus,
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

  const markdown = markerLine("EXTENDING.md", "context-menu", "1.2.3");
  assert.equal(
    markdown,
    "<!-- @nagi-source context-menu/EXTENDING.md@1.2.3 -->\n",
  );

  assert.equal(parseMarker("<!-- not a marker -->"), null);
});

test("own copies the exact installed source with a stamped first line", () => {
  const targetRoot = tempDir();
  const result = ownComponent("dropdown-menu", { packageRoot, targetRoot });
  assert.equal(result.files.length, components["dropdown-menu"].files.length);

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

test("ownership includes every Blueprint-local relative dependency", () => {
  for (const [name, spec] of Object.entries(components)) {
    for (const file of spec.files) {
      const source = fs.readFileSync(path.join(packageRoot, spec.dir, file), "utf8");
      for (const match of source.matchAll(/(?:from\s+|import\s+)["'](\.\.?\/[^"']+)["']/g)) {
        const dependency = path.posix.normalize(
          path.posix.join(path.posix.dirname(file), match[1] as string),
        );
        assert.ok(
          spec.files.includes(dependency),
          `${name}/${file} depends on ${dependency}, which own must copy`,
        );
      }
    }
  }
});

test("ordinary ownership keeps package composables out of the copied source", () => {
  for (const [name, spec] of Object.entries(components)) {
    assert.deepEqual(
      spec.files.filter((file) => /^use-.*\.ts$/u.test(file)),
      [],
      `${name} must import fixed composables from the package until ownership layers ship`,
    );
  }
});

test("every public package component has an ownership registry entry", () => {
  const source = fs.readFileSync(path.join(packageRoot, "components.ts"), "utf8");
  const publicComponents = Array.from(
    source.matchAll(/export \{ default as ([A-Za-z0-9]+) \}/g),
    (match) => (match[1] as string)
      .replace(/^N(?=[A-Z])/u, "")
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
      .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
      .toLowerCase(),
  ).sort();
  assert.deepEqual(Object.keys(components).sort(), publicComponents);
});

test("DropdownMenu renderers remain owned internals rather than package components", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(packageRoot, "package.json"), "utf8")) as {
    exports: Record<string, unknown>;
  };
  const componentEntry = fs.readFileSync(path.join(packageRoot, "components.ts"), "utf8");

  assert.equal(manifest.exports["./blueprints/menu/internal/*"], null);
  assert.doesNotMatch(
    componentEntry,
    /export\s+\{\s*default\s+as\s+NDropdownMenu(?:Item|Group|Submenu)\b/u,
  );
});

test("theme check reports missing and unknown replacement-theme tokens", async () => {
  const root = tempDir();
  const incomplete = path.join(root, "theme.css");
  fs.writeFileSync(incomplete, `:root {
  /* --nagi-color-focus-ring: this-comment-must-not-count; */
  --nagi-color-accent: hotpink;
  --nagi-color-foucs-ring: red;
}\n`);

  const result = checkThemeFiles([incomplete]);
  assert.ok(result.missing.includes("--nagi-color-focus-ring"));
  assert.deepEqual(result.unknown, ["--nagi-color-foucs-ring"]);

  const warnings: string[] = [];
  assert.equal(
    await main(["theme", "check", incomplete], path.join(import.meta.dirname, ".."), {
      log: () => undefined,
      warn: (message: string) => warnings.push(message),
    }),
    1,
  );
  assert.ok(warnings.some((message) => message.includes("--nagi-color-focus-ring")));
  assert.ok(warnings.some((message) => message.includes("--nagi-color-foucs-ring")));
});

test("status reports package, default theme, and locally modified ownership independently", () => {
  const cwd = tempDir();
  fs.writeFileSync(
    path.join(cwd, "package.json"),
    JSON.stringify({ dependencies: { "@nagi-labs/nagi-ui": "^0.4.0" } }),
  );
  fs.mkdirSync(path.join(cwd, "src"), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, "src/main.ts"),
    'import "@nagi-labs/nagi-ui/styles.css";\n',
  );
  fs.writeFileSync(
    path.join(cwd, "src/commented.ts"),
    '/* import "@nagi-labs/nagi-ui/default-theme.css"; */\n',
  );
  const targetRoot = path.join(cwd, "src/components/nagi");
  ownComponent("listbox", { packageRoot, targetRoot });
  fs.appendFileSync(path.join(targetRoot, "listbox/Listbox.vue"), "\n<!-- local edit -->\n");

  const status = inspectProjectStatus({ cwd, packageRoot });
  assert.deepEqual(status.package.declaration, {
    section: "dependencies",
    specifier: "^0.4.0",
  });
  assert.equal(status.package.status, "installed");
  assert.equal(status.theme.status, "default-detected");
  assert.deepEqual(status.theme.imports, ["src/main.ts"]);
  assert.equal(status.own.status, "modified");
  assert.equal(status.own.components.length, 1);
  assert.equal(status.own.components[0]?.component, "listbox");
  assert.equal(status.exitCode, 0, "a local ownership modification is expected");
});

test("status validates an explicit replacement theme and gates confirmed problems", () => {
  const cwd = tempDir();
  const incomplete = path.join(cwd, "theme.css");
  fs.writeFileSync(incomplete, ":root { --nagi-color-accent: hotpink; }\n");

  let status = inspectProjectStatus({
    cwd,
    packageRoot,
    themeFiles: [incomplete],
  });
  assert.equal(status.theme.status, "replacement-incomplete");
  assert.ok(status.theme.missing.length > 0);
  assert.equal(status.exitCode, 1);

  status = inspectProjectStatus({
    cwd,
    packageRoot,
    themeFiles: [path.join(packageRoot, "theme/default-theme.css")],
  });
  assert.equal(status.theme.status, "replacement-complete");
  assert.equal(status.exitCode, 0);
});

test("status reports unavailable comparisons when the package cannot be resolved", () => {
  const status = inspectProjectStatus({ cwd: tempDir(), packageRoot: null });
  assert.equal(status.package.status, "missing");
  assert.equal(status.theme.status, "unresolved");
  assert.equal(status.own.status, "unavailable");
  assert.equal(status.exitCode, 1);
});

test("the shipped default theme passes the replacement-theme CI gate", async () => {
  const theme = path.join(packageRoot, "theme/default-theme.css");
  assert.deepEqual(checkThemeFiles([theme]).missing, []);
  assert.deepEqual(checkThemeFiles([theme]).unknown, []);
  assert.equal(
    await main(["theme", "check", theme], path.join(import.meta.dirname, "..")),
    0,
  );
});

test("Tabs ownership stamps the package source and starts clean", () => {
  const targetRoot = tempDir();
  const result = ownComponent("tabs", { packageRoot, targetRoot });
  assert.equal(result.files.length, 1);
  const owned = result.files[0] as string;
  const [marker, ...body] = fs.readFileSync(owned, "utf8").split("\n");
  assert.deepEqual(parseMarker(marker as string), {
    component: "tabs",
    file: "Tabs.vue",
    version: result.version,
  });
  assert.equal(
    body.join("\n"),
    fs.readFileSync(path.join(packageRoot, "blueprints/tabs/Tabs.vue"), "utf8"),
  );
  assert.equal(diffOwned(targetRoot, { packageRoot })[0]?.status, "clean");
});

test("own refuses to overwrite a non-empty target without --force", () => {
  const targetRoot = tempDir();
  ownComponent("listbox", { packageRoot, targetRoot });
  assert.throws(() => ownComponent("listbox", { packageRoot, targetRoot }), /--force/);
  ownComponent("listbox", { packageRoot, targetRoot, force: true });
});

test("own rejects unknown components with the available list", () => {
  assert.throws(
    () => ownComponent("data-grid", { packageRoot, targetRoot: tempDir() }),
    /Unknown component "data-grid"/,
  );
});

test("diff reports clean, modified, and drifted owned sources", () => {
  const targetRoot = tempDir();
  ownComponent("listbox", { packageRoot, targetRoot });
  ownComponent("combobox", { packageRoot, targetRoot });

  let entries = diffOwned(targetRoot, { packageRoot });
  assert.equal(
    entries.length,
    components.listbox.files.length + components.combobox.files.length,
  );
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

test("diff checks every registered owned file, including Markdown guidance", () => {
  const targetRoot = tempDir();
  ownComponent("context-menu", { packageRoot, targetRoot });
  const entries = diffOwned(targetRoot, { packageRoot });
  assert.equal(entries.length, components["context-menu"].files.length);
  assert.equal(
    entries.find((entry) => entry.marker.file === "EXTENDING.md")?.status,
    "clean",
  );
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

test("status command summarizes owned components and reuses diff gating", async () => {
  const repo = path.join(import.meta.dirname, "..");
  const targetRoot = tempDir();
  const theme = path.join(packageRoot, "theme/default-theme.css");
  const logs: string[] = [];
  const io = {
    log(message: unknown) {
      logs.push(String(message));
    },
    warn() {},
  };
  ownComponent("listbox", { packageRoot, targetRoot });

  assert.equal(await main(["status", theme, "--dir", targetRoot], repo, io), 0);
  assert.match(logs.join("\n"), /theme\s+replacement-complete/);
  assert.match(logs.join("\n"), /own\s+clean/);
  assert.match(logs.join("\n"), /listbox/);

  const owned = path.join(targetRoot, "listbox/Listbox.vue");
  const stampedVersion = parseMarker(
    fs.readFileSync(owned, "utf8").split("\n", 1)[0] as string,
  )?.version;
  fs.appendFileSync(owned, "\n<!-- local edit -->\n");
  fs.writeFileSync(
    owned,
    fs.readFileSync(owned, "utf8").replace(`@${stampedVersion}`, `@${stampedVersion}-old`),
  );
  assert.equal(await main(["status", theme, "--dir", targetRoot], repo, io), 1);
  assert.match(logs.join("\n"), /own\s+drifted/);
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
  const logs: string[] = [];
  const io = {
    log(value: unknown) {
      logs.push(String(value));
    },
    warn() {},
  };
  assert.equal(
    await main(["own", "listbox", "combobox", "--dir", targetRoot], repo, io),
    0,
  );
  assert.ok(fs.existsSync(path.join(targetRoot, "listbox/Listbox.vue")));
  assert.ok(fs.existsSync(path.join(targetRoot, "combobox/Combobox.vue")));
  const output = logs.join("\n");
  assert.match(output, /Commit the untouched owned files now/);
  assert.match(output, /recipes\/control-expansion\.md/);
  assert.match(output, /recipes\/testing\/README\.md/);
  assert.ok(output.includes(`nagi-ui diff --dir ${targetRoot}`));

  await assert.rejects(
    main(
      ["setup", "--framework", "react", "--link", "native", "--image", "native"],
      repo,
      io,
    ),
    /Invalid value for argument:.*--framework/,
  );
});
