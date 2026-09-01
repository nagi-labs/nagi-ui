import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const repositoryRoot = path.resolve(import.meta.dirname, "../..");
const blueprintsRoot = path.join(repositoryRoot, "packages/core/blueprints");

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

function lineNumber(source, offset) {
  return source.slice(0, offset).split("\n").length;
}

function report(issues, file, source, offset, message) {
  issues.push(`${path.relative(repositoryRoot, file)}:${lineNumber(source, offset)} ${message}`);
}

const issues = [];
const files = await vueFiles(blueprintsRoot);

for (const file of files) {
  const source = await readFile(file, "utf8");
  const template = source.match(/<template>([\s\S]*?)<\/template>/u);
  const setup = source.match(/<script\s+setup(?:\s+lang="[^"]+")?>([\s\S]*?)<\/script>/u);

  if (!template) {
    report(issues, file, source, 0, "Blueprint has no visible template.");
    continue;
  }

  const templateSource = template[1];
  const templateOffset = template.index + template[0].indexOf(templateSource);

  for (const match of templateSource.matchAll(/:ref\s*=\s*"[^"]*(?:=>|\bfunction\b)[^"]*"/gu)) {
    report(
      issues,
      file,
      source,
      templateOffset + match.index,
      "Inline ref callback leaks element registration into the template; expose it in a binding bundle.",
    );
  }

  for (const match of templateSource.matchAll(/@[\w:-]+(?:\.[\w-]+)*\s*=\s*"([^"]*)"/gu)) {
    const expression = match[1];
    const assigns = /(^|[^=!<>])=(?!=|>)/u.test(expression);
    if (!assigns && !expression.includes("=>") && !expression.includes(";")) continue;
    report(
      issues,
      file,
      source,
      templateOffset + match.index,
      "Event binding contains inline state logic; route the transition through a named script or Behavior API function.",
    );
  }

  if (!setup) continue;
  const setupSource = setup[1];
  const setupOffset = setup.index + setup[0].indexOf(setupSource);
  const forbiddenSetupPatterns = [
    {
      pattern: /\b(?:watch|watchEffect|onMounted|onBeforeMount|onUpdated)\s*\(/gu,
      message:
        "Reactive reconciliation or lifecycle behavior lives in the Blueprint; move correctness-sensitive logic to a named Behavior API.",
    },
    {
      pattern: /\b(?:document|window)\.(?:querySelector|querySelectorAll|getElementById)\s*\(/gu,
      message:
        "Blueprint performs document-global element lookup; register the destination through a scoped binding bundle.",
    },
  ];
  for (const { pattern, message } of forbiddenSetupPatterns) {
    for (const match of setupSource.matchAll(pattern)) {
      report(issues, file, source, setupOffset + match.index, message);
    }
  }
}

if (issues.length) {
  throw new Error(`Template responsibility audit failed:\n${issues.join("\n")}`);
}

console.log(`Template responsibility: ${files.length}/${files.length} Blueprint SFCs pass.`);
