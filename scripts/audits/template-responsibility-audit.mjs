import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const repositoryRoot = path.resolve(import.meta.dirname, "../..");
const blueprintsRoot = path.join(repositoryRoot, "packages/core/blueprints");
const scriptLocalPropertyExceptions = new Map([
  [
    "packages/core/blueprints/range-slider/RangeSlider.vue",
    new Set(["--local-range-start", "--local-range-end"]),
  ],
  ["packages/core/blueprints/resizable/Resizable.vue", new Set(["--local-first-basis"])],
]);
const seenScriptLocalPropertyExceptions = new Set();
const blueprintFunctionExceptions = new Map([
  [
    "packages/core/blueprints/table/Table.vue",
    new Set(["rowIdentity", "headerSlotName", "cellSlotName"]),
  ],
]);
const seenBlueprintFunctionExceptions = new Set();
const vueSetupUtilities = new Set(["useAttrs", "useId", "useSlots", "useTemplateRef"]);

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
  const setup = source.match(/<script\s+setup\b[^>]*>([\s\S]*?)<\/script>/u);

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
  const relativeFile = path.relative(repositoryRoot, file);
  const allowedLocalProperties = scriptLocalPropertyExceptions.get(relativeFile) ?? new Set();
  const allowedFunctions = blueprintFunctionExceptions.get(relativeFile) ?? new Set();

  const behaviorCalls = [...setupSource.matchAll(/\b(use[A-Z][A-Za-z0-9_$]*)\s*\(/gu)]
    .map((match) => ({ name: match[1], index: match.index }))
    .filter(({ name }) => !vueSetupUtilities.has(name));
  if (behaviorCalls.length > 1) {
    const names = behaviorCalls.map(({ name }) => name).join(", ");
    report(
      issues,
      file,
      source,
      setupOffset + behaviorCalls[1].index,
      `Blueprint invokes multiple Behavior composables (${names}); expose one component binding unless the composition has a reviewed reason.`,
    );
  }

  for (const match of setupSource.matchAll(/["'](--local-[\w-]+)["']/gu)) {
    const property = match[1];
    if (allowedLocalProperties.has(property)) {
      seenScriptLocalPropertyExceptions.add(`${relativeFile}:${property}`);
      continue;
    }
    report(
      issues,
      file,
      source,
      setupOffset + match.index,
      "Blueprint script generates a local CSS property without a reviewed platform limitation; prefer deriving layout from DOM and CSS.",
    );
  }

  for (const match of setupSource.matchAll(/^function\s+([A-Za-z_$][\w$]*)\s*\(/gmu)) {
    const name = match[1];
    if (allowedFunctions.has(name)) {
      seenBlueprintFunctionExceptions.add(`${relativeFile}:${name}`);
      continue;
    }
    report(
      issues,
      file,
      source,
      setupOffset + match.index,
      "Blueprint declares a local function without a reviewed rendering-only reason; move state, interaction, focus, DOM synchronization, and ordered event composition to its Behavior binding.",
    );
  }

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

for (const [file, properties] of scriptLocalPropertyExceptions) {
  for (const property of properties) {
    if (seenScriptLocalPropertyExceptions.has(`${file}:${property}`)) continue;
    issues.push(`${file}:1 Stale script-local CSS property exception: ${property}`);
  }
}

for (const [file, functions] of blueprintFunctionExceptions) {
  for (const name of functions) {
    if (seenBlueprintFunctionExceptions.has(`${file}:${name}`)) continue;
    issues.push(`${file}:1 Stale Blueprint function exception: ${name}`);
  }
}

if (issues.length) {
  throw new Error(`Template responsibility audit failed:\n${issues.join("\n")}`);
}

console.log(`Template responsibility: ${files.length}/${files.length} Blueprint SFCs pass.`);
