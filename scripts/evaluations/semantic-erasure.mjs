import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(path.join(repository, "package.json"));
const { parseForESLint } = require("vue-eslint-parser");
const ignoredDirectories = new Set([".nuxt", ".output", "node_modules"]);

// Replacements preserve ordinary browser formatting: block containers become
// divs and the inline time element becomes a span. Elements with UA margins,
// markers, table layout, form behavior, or link/disclosure behavior are out of scope.
const safeBlockTags = new Set([
  "article",
  "aside",
  "footer",
  "header",
  "main",
  "nav",
  "section",
  "figcaption",
]);
const safeInlineTags = new Set(["time"]);
const stn = ["stratum", "region", "block", "unit", "seg", "fr", "g"];
const stnIndex = new Map(stn.map((name, index) => [name, index]));

function vueFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (ignoredDirectories.has(entry.name)) return [];
    const resolved = path.join(directory, entry.name);
    if (entry.isDirectory()) return vueFiles(resolved);
    return entry.name.endsWith(".vue") ? [resolved] : [];
  });
}

function staticAttribute(node, name) {
  const item = node.startTag.attributes.find(
    (candidate) => !candidate.directive && candidate.key.name === name,
  );
  return item?.value?.value ?? null;
}

function tagName(node) {
  return String(node.rawName ?? node.name).toLowerCase();
}

function round(value, digits = 1) {
  return Number(value.toFixed(digits));
}

function seeded(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

const files = vueFiles(path.join(repository, "site")).sort();
const roots = [];
const nodes = [];
let nextId = 0;

for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  const parsed = parseForESLint(source, {
    ecmaVersion: "latest",
    filePath: file,
    parser: false,
    sourceType: "module",
  });
  const template = parsed.ast.templateBody;
  if (!template) continue;

  function visit(astNode, parent = null) {
    if (astNode.type !== "VElement") {
      for (const child of astNode.children ?? []) visit(child, parent);
      return;
    }
    const tag = tagName(astNode);
    const classes = (staticAttribute(astNode, "class") ?? "").split(/\s+/u).filter(Boolean);
    const base = classes.find((token) => !token.startsWith("-")) ?? null;
    const variants = classes.filter((token) => token.startsWith("-")).sort();
    const node = {
      id: nextId,
      file: path.relative(repository, file),
      line: astNode.loc.start.line,
      tag,
      base,
      variants,
      parent,
      children: [],
      isSurface: base?.startsWith("site-") ?? false,
    };
    nextId += 1;
    nodes.push(node);
    if (parent) parent.children.push(node);
    else roots.push(node);
    for (const child of astNode.children ?? []) visit(child, node);
  }

  for (const child of template.children ?? []) visit(child);
}

const eligibleNodes = nodes.filter(
  (node) =>
    !node.isSurface &&
    node.base &&
    (safeBlockTags.has(node.tag) || safeInlineTags.has(node.tag)),
);
const safeSurfaceRoots = nodes.filter(
  (node) => node.isSurface && (safeBlockTags.has(node.tag) || safeInlineTags.has(node.tag)),
);
const excludedStyledSemantic = nodes.filter(
  (node) =>
    !node.isSurface &&
    node.base &&
    !["div", "span", "template", "slot"].includes(node.tag) &&
    !safeBlockTags.has(node.tag) &&
    !safeInlineTags.has(node.tag),
);

function simulate(selectedIds) {
  const collisionGroups = new Map();

  function visit(node, nearestStn = null, parentPath = "root") {
    const selected = selectedIds.has(node.id);
    let base = node.base;
    let tag = node.tag;
    if (selected) {
      tag = safeInlineTags.has(node.tag) ? "span" : "div";
      const nextIndex = nearestStn == null ? stnIndex.get("unit") : nearestStn + 1;
      base = stn[Math.min(nextIndex, stn.length - 1)];
    }

    const ownStn = base != null ? stnIndex.get(base) : undefined;
    const childNearest = node.isSurface ? null : ownStn == null ? nearestStn : ownStn;
    const identity = `${tag}.${base ?? "_"}${node.variants.join("")}`;
    const pathKey = `${node.file}|${parentPath}>${identity}`;

    if (selected) {
      const group = collisionGroups.get(pathKey) ?? [];
      group.push(node);
      collisionGroups.set(pathKey, group);
    }

    for (const child of node.children) visit(child, childNearest, pathKey);
  }
  for (const root of roots) visit(root);

  let addedVariantOccurrences = 0;
  let addedUniqueStems = 0;
  let collidedOccurrences = 0;
  const collisions = [];
  for (const [selector, group] of collisionGroups) {
    const formerIdentities = new Map();
    for (const node of group) {
      const oldIdentity = `${node.tag}.${node.base}`;
      formerIdentities.set(oldIdentity, (formerIdentities.get(oldIdentity) ?? 0) + 1);
    }
    if (formerIdentities.size < 2) continue;
    const counts = [...formerIdentities.values()].sort((left, right) => right - left);
    addedUniqueStems += formerIdentities.size - 1;
    addedVariantOccurrences += group.length - counts[0];
    collidedOccurrences += group.length;
    collisions.push({
      selector,
      formerIdentities: Object.fromEntries(
        [...formerIdentities].sort(([left], [right]) => left.localeCompare(right)),
      ),
      occurrences: group.map((node) => `${node.file}:${node.line}`),
    });
  }

  return {
    replacements: selectedIds.size,
    addedVariantOccurrences,
    addedUniqueStems,
    collidedOccurrences,
    collisionGroups: collisions.length,
    collisions,
  };
}

const levels = [0, 0.25, 0.5, 0.75, 1];
const trials = 200;
const simulations = levels.map((level, levelIndex) => {
  if (level === 0 || level === 1) {
    const ids = new Set(level === 1 ? eligibleNodes.map((node) => node.id) : []);
    return { percentage: level * 100, samples: 1, ...simulate(ids) };
  }
  const samples = [];
  for (let trial = 0; trial < trials; trial += 1) {
    const random = seeded(0x4e414749 + levelIndex * 1000 + trial);
    const ids = new Set(eligibleNodes.filter(() => random() < level).map((node) => node.id));
    samples.push(simulate(ids));
  }
  const average = (key) => samples.reduce((sum, item) => sum + item[key], 0) / samples.length;
  return {
    percentage: level * 100,
    samples: trials,
    replacements: round(average("replacements")),
    addedVariantOccurrences: round(average("addedVariantOccurrences")),
    addedUniqueStems: round(average("addedUniqueStems")),
    collidedOccurrences: round(average("collidedOccurrences")),
    collisionGroups: round(average("collisionGroups")),
  };
});

const fullReplacement = simulate(new Set(eligibleNodes.map((node) => node.id)));
const baselineVariants = nodes.flatMap((node) => node.variants);
const originalEligibleIdentities = new Set(eligibleNodes.map((node) => `${node.tag}.${node.base}`));
const eligibleByTag = Object.fromEntries(
  [...new Set(eligibleNodes.map((node) => node.tag))]
    .sort((left, right) => left.localeCompare(right))
    .map((tag) => [
    tag,
    eligibleNodes.filter((node) => node.tag === tag).length,
    ]),
);
const excludedByTag = Object.fromEntries(
  [...new Set(excludedStyledSemantic.map((node) => node.tag))]
    .sort((left, right) => left.localeCompare(right))
    .map((tag) => [
    tag,
    excludedStyledSemantic.filter((node) => node.tag === tag).length,
    ]),
);

const result = {
  methodology: {
    parser: "vue-eslint-parser",
    scope: "site/**/*.vue",
    excludedDirectories: [...ignoredDirectories].sort(),
    safeBlockTags: [...safeBlockTags],
    safeInlineTags: [...safeInlineTags],
    trialsPerPartialLevel: trials,
    collisionDefinition:
      "same file-local final structural selector and existing variant set, but distinct former semantic base identities",
  },
  population: {
    renderedOrTemplateOwnedElements: nodes.length,
    visuallySafeSemanticElements: eligibleNodes.length + safeSurfaceRoots.length,
    safeSurfaceRootsWithNoNamingChange: safeSurfaceRoots.length,
    eligibleStyledSemanticElements: eligibleNodes.length,
    eligibleByTag,
    excludedStyledSemanticElements: excludedStyledSemantic.length,
    excludedByTag,
  },
  simulations,
  fullReplacement: {
    ...fullReplacement,
    addedOccurrencesPerReplacement: round(
      fullReplacement.addedVariantOccurrences / fullReplacement.replacements,
      3,
    ),
    addedUniqueStemsPerReplacement: round(
      fullReplacement.addedUniqueStems / fullReplacement.replacements,
      3,
    ),
  },
  bounds: {
    baselineVariantOccurrences: baselineVariants.length,
    baselineUniqueVariantStems: new Set(baselineVariants).size,
    minimumStylePreserving: {
      addedOccurrences: fullReplacement.addedVariantOccurrences,
      addedUniqueStems: fullReplacement.addedUniqueStems,
      occurrenceIncreasePercentage: round(
        (fullReplacement.addedVariantOccurrences / baselineVariants.length) * 100,
      ),
      uniqueStemIncreasePercentage: round(
        (fullReplacement.addedUniqueStems / new Set(baselineVariants).size) * 100,
      ),
    },
    explicitRolePreservingUpperBound: {
      addedOccurrences: eligibleNodes.length,
      addedUniqueStems: originalEligibleIdentities.size,
      occurrenceIncreasePercentage: round((eligibleNodes.length / baselineVariants.length) * 100),
      uniqueStemIncreasePercentage: round(
        (originalEligibleIdentities.size / new Set(baselineVariants).size) * 100,
      ),
    },
  },
};

const checkIndex = process.argv.indexOf("--check");
if (checkIndex >= 0) {
  const snapshotArgument = process.argv[checkIndex + 1];
  if (!snapshotArgument) throw new Error("--check requires a repository-relative JSON path");
  const snapshotPath = path.resolve(repository, snapshotArgument);
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
  assert.deepEqual(result, snapshot);
  console.log(`Semantic erasure evaluation matches ${path.relative(repository, snapshotPath)}.`);
} else {
  console.log(JSON.stringify(result, null, 2));
}
