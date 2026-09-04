import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { validateDefinition } from "../../packages/core/src/definition.ts";
import { assertDefinitionEvidence } from "./definition-evidence.ts";

const repositoryRoot = path.resolve(import.meta.dirname, "../..");
const blueprintsRoot = path.join(repositoryRoot, "packages/core/blueprints");
const generatedCatalog = JSON.parse(
  await readFile(path.join(repositoryRoot, "site/data/generated/definition-tests.json"), "utf8"),
);
const runnerCatalogComponents = new Set(Object.keys(generatedCatalog.components ?? {}));

async function definitionFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) return definitionFiles(target);
      return entry.isFile() && entry.name.endsWith(".definition.ts") ? [target] : [];
    }),
  );
  return nested.flat();
}

function isDefinition(value) {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof value.name === "string" &&
    typeof value.version === "string" &&
    Array.isArray(value.anatomy)
  );
}

const definitions = [];
for (const file of await definitionFiles(blueprintsRoot)) {
  const module = await import(pathToFileURL(file).href);
  const exported = Object.values(module).filter(isDefinition);
  if (exported.length !== 1) {
    throw new Error(
      `${path.relative(repositoryRoot, file)} must export exactly one Component Definition; found ${exported.length}.`,
    );
  }
  definitions.push({ file, definition: exported[0] });
}

const names = new Set();
for (const { file, definition } of definitions) {
  if (names.has(definition.name)) {
    throw new Error(`Component Definition name "${definition.name}" is declared more than once.`);
  }
  names.add(definition.name);

  const issues = validateDefinition(definition);
  if (issues.length > 0) {
    throw new AggregateError(
      issues.map((issue) => new Error(`${issue.field}: ${issue.message}`)),
      `${path.relative(repositoryRoot, file)} has ${issues.length} Definition issue${issues.length === 1 ? "" : "s"}.`,
    );
  }
  if (definition.status === "verified" && !runnerCatalogComponents.has(definition.name)) {
    assertDefinitionEvidence(definition, repositoryRoot);
  }
}

const runnerPassing = Object.values(generatedCatalog.components ?? {}).filter(
  ({ status }) => status === "passing",
).length;
const compatibilityOnly = definitions.length - runnerCatalogComponents.size;
console.log(
  `Component Definitions: ${definitions.length} compatibility manifests; ${runnerPassing} browser catalogs passing; ${compatibilityOnly} compatibility-only.`,
);
