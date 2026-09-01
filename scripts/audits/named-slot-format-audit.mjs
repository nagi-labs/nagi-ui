import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { actionsFormsExamples } from "../../site/data/examples/actions-forms.ts";
import { dateNavigationExamples } from "../../site/data/examples/date-navigation.ts";
import { displayOverlayExamples } from "../../site/data/examples/display-overlay.ts";

const repositoryRoot = path.resolve(import.meta.dirname, "../..");
const roots = [
  path.join(repositoryRoot, "packages/core/blueprints"),
  path.join(repositoryRoot, "playground/src"),
  path.join(repositoryRoot, "site/components"),
  path.join(repositoryRoot, "site/pages"),
];

async function vueFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) => {
        const target = path.join(directory, entry.name);
        if (entry.isDirectory()) return vueFiles(target);
        return entry.isFile() && entry.name.endsWith(".vue") ? [target] : [];
      }),
    )
  ).flat();
}

function inlineNamedSlots(source) {
  return [...source.matchAll(/<template\s+(?:#|v-slot:)[^>]*>([^\r\n]*)/gu)].filter(
    (match) => match[1].trim() !== "",
  );
}

function lineNumber(source, offset) {
  return source.slice(0, offset).split("\n").length;
}

const issues = [];
const files = (await Promise.all(roots.map((root) => vueFiles(root)))).flat();
for (const file of files) {
  const source = await readFile(file, "utf8");
  for (const match of inlineNamedSlots(source)) {
    issues.push(
      `${path.relative(repositoryRoot, file)}:${lineNumber(source, match.index)} named slot content must start on the next line.`,
    );
  }
}

const exampleGroups = {
  "site/data/examples/actions-forms.ts": actionsFormsExamples,
  "site/data/examples/date-navigation.ts": dateNavigationExamples,
  "site/data/examples/display-overlay.ts": displayOverlayExamples,
};
for (const [file, examples] of Object.entries(exampleGroups)) {
  for (const [name, source] of Object.entries(examples)) {
    if (inlineNamedSlots(source).length > 0) {
      issues.push(`${file} (${name}) named slot content must start on the next line.`);
    }
  }
}

if (issues.length > 0) {
  throw new Error(`Named slot formatting audit failed:\n${issues.join("\n")}`);
}

console.log(
  `Named slot formatting: ${files.length} Vue files and ${Object.values(exampleGroups).reduce((count, examples) => count + Object.keys(examples).length, 0)} examples pass.`,
);
