import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import nagiCss from "@nagi-labs/eslint-plugin-nagi-css";
import { Linter } from "eslint";
import vueParser from "vue-eslint-parser";

import preset, {
  nagiUiAnatomyClasses,
  nagiUiComponentClasses,
  nagiUiComponents,
  nagiUiComponentSlots,
  nagiUiSurfaceRootPrefixes,
  nagiUiThemeTokens,
} from "../packages/core/nagi-css-preset.mjs";
import { requiredNagiThemeTokens } from "../packages/core/src/index.ts";
import { actionsFormsExamples } from "../site/data/examples/actions-forms.ts";
import { displayOverlayExamples } from "../site/data/examples/display-overlay.ts";

const repo = path.join(import.meta.dirname, "..");

function verifyConsumer(source: string, filename = "ButtonExample.vue") {
  const linter = new Linter();
  return linter.verify(
    source,
    [
      {
        files: ["**/*.vue"],
        languageOptions: {
          parser: vueParser,
          parserOptions: { ecmaVersion: "latest", sourceType: "module" },
        },
      },
      ...nagiCss.configs.recommended(
        { ...preset, surfaceRootPrefixes: ["app-"] },
        { files: ["**/*.vue"], severity: { "*": "error" } },
      ),
    ],
    { filename },
  );
}

test("Nagi CSS preset covers every package component export", () => {
  const source = fs.readFileSync(path.join(repo, "packages/core/components.ts"), "utf8");
  const exportedComponents = Array.from(
    source.matchAll(/export \{ default as ([A-Za-z0-9]+) \}/g),
    (match) => match[1] as string,
  ).sort();

  assert.deepEqual([...nagiUiComponents].sort(), exportedComponents);
  assert.equal(preset.anatomyClasses, nagiUiAnatomyClasses);
  assert.ok(nagiUiAnatomyClasses.includes("rail"));
  assert.equal(preset.componentClasses, nagiUiComponentClasses);
  for (const component of exportedComponents) {
    const templateName = component
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
      .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
      .toLowerCase();
    assert.equal(
      nagiUiComponentClasses[templateName],
      nagiUiComponentClasses[component],
      `${component} and <${templateName}> share one boundary class`,
    );
  }
  assert.equal(nagiUiComponentClasses.NButton, "n-button");
  assert.equal(nagiUiComponentClasses["n-button"], "n-button");
  assert.equal(nagiUiComponentClasses.NOtpField, "n-otp-field");
  assert.equal(nagiUiComponentClasses["n-otp-field"], "n-otp-field");
  assert.equal(preset.componentSlots, nagiUiComponentSlots);
  assert.deepEqual(nagiUiSurfaceRootPrefixes, ["n-"]);
  assert.equal(nagiUiThemeTokens, requiredNagiThemeTokens);
});

test("declared slot surfaces stay inside their component boundary prefix", () => {
  for (const [component, slots] of Object.entries(nagiUiComponentSlots)) {
    const owner = nagiUiComponentClasses[component];
    assert.ok(owner, `${component} has a canonical component class`);
    for (const surface of Object.values(slots)) {
      assert.ok(surface.startsWith(`${owner}-`), `${surface} starts with ${owner}-`);
    }
  }
});

test("kebab-case Nagi component tags use their fixed package boundary class", () => {
  const valid = verifyConsumer(`<template>
  <main class="app-button-example">
    <div class="actions">
      <n-button class="n-button">Delete</n-button>
    </div>
  </main>
</template>
<style scoped>
.app-button-example {
  > .actions {
    > .n-button {
      --button-tone: danger;
    }
  }
}
</style>`);
  assert.deepEqual(valid, []);

  const invalid = verifyConsumer(`<template>
  <main class="app-button-example">
    <n-button class="button">Delete</n-button>
  </main>
</template>
<style scoped>.app-button-example > .button { color: red; }</style>`);
  assert.ok(invalid.some((message) => message.ruleId === "nagi-css/reserved-element-name"));
});

test("styled Button documentation examples conform to the Nagi CSS preset", () => {
  const examples = [
    ["ButtonExample.vue", actionsFormsExamples.Button],
    ["ButtonGroupExample.vue", actionsFormsExamples.ButtonGroup],
    ["InputGroupExample.vue", actionsFormsExamples.InputGroup],
    ["EmptyStateExample.vue", displayOverlayExamples.EmptyState],
    ["DialogExample.vue", displayOverlayExamples.Dialog],
  ] as const;

  for (const [filename, source] of examples) {
    assert.deepEqual(verifyConsumer(source, filename), [], filename);
  }
});
