import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

import { fileURLToPath } from "node:url";

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(path.join(repository, "package.json"));
const { parseForESLint } = require("vue-eslint-parser");

// These replacements preserve the browser's ordinary visual formatting:
// block containers become divs and an inline time element becomes a span.
// Elements with UA margins, font changes, markers, table layout, form behavior,
// or disclosure/link behavior are deliberately not in these sets.
const safeBlockTags = new Set([
  "article", "aside", "footer", "header", "main", "nav", "section", "figcaption",
]);
const safeInlineTags = new Set(["time"]);
const stn = ["stratum", "region", "block", "unit", "seg", "fr", "g"];
const stnIndex = new Map(stn.map((name, index) => [name, index]));

function vueFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const resolved = path.join(directory, entry.name);
    return entry.isDirectory()
      ? vueFiles(resolved)
      : entry.name.endsWith(".vue") ? [resolved] : [];
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
    const classes = (staticAttribute(astNode, "class") ?? "").split(/\s+/).filter(Boolean);
    const base = classes.find((token) => !token.startsWith("-")) ?? null;
    const variants = classes.filter((token) => token.startsWith("-")).sort();
    const node = {
      id: nextId++,
      file: path.relative(repository, file),
      line: astNode.loc.start.line,
      tag,
      base,
      variants,
      parent,
      children: [],
      isSurface: base?.startsWith("site-") ?? false,
    };
    nodes.push(node);
    if (parent) parent.children.push(node);
    else roots.push(node);
    for (const child of astNode.children ?? []) visit(child, node);
  }

  // The VDocumentFragment itself is not an element.
  for (const child of template.children ?? []) visit(child);
}

const candidateNodes = nodes.filter((node) =>
  !node.isSurface && node.base && (safeBlockTags.has(node.tag) || safeInlineTags.has(node.tag))
);
const safeSurfaceRoots = nodes.filter((node) =>
  node.isSurface && (safeBlockTags.has(node.tag) || safeInlineTags.has(node.tag))
);
const excludedStyledSemantic = nodes.filter((node) =>
  !node.isSurface && node.base &&
  !["div", "span", "template", "slot"].includes(node.tag) &&
  !safeBlockTags.has(node.tag) && !safeInlineTags.has(node.tag)
);

function simulate(selectedIds) {
  const states = new Map();
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
    const childNearest = node.isSurface
      ? null
      : ownStn == null ? nearestStn : ownStn;
    const identity = `${tag}.${base ?? "_"}${node.variants.join("")}`;
    const pathKey = `${node.file}|${parentPath}>${identity}`;
    states.set(node.id, { base, identity, pathKey, selected, tag });

    if (selected) {
      // Same final structural selector + same existing variants, but different
      // former semantic identities, is the conservative collision that needs a
      // new distinction to retain independently targetable style roles.
      const key = pathKey;
      const group = collisionGroups.get(key) ?? [];
      group.push(node);
      collisionGroups.set(key, group);
    }

    for (const child of node.children) visit(child, childNearest, pathKey);
  }
  for (const root of roots) visit(root);

  let extraVariantOccurrences = 0;
  let extraVariantStems = 0;
  let collidedOccurrences = 0;
  const collisions = [];
  for (const [selector, group] of collisionGroups) {
    const byOldIdentity = new Map();
    for (const node of group) {
      const oldIdentity = `${node.tag}.${node.base}`;
      byOldIdentity.set(oldIdentity, (byOldIdentity.get(oldIdentity) ?? 0) + 1);
    }
    if (byOldIdentity.size < 2) continue;
    const counts = [...byOldIdentity.values()].sort((a, b) => b - a);
    extraVariantStems += byOldIdentity.size - 1;
    extraVariantOccurrences += group.length - counts[0];
    collidedOccurrences += group.length;
    collisions.push({
      selector,
      oldIdentities: Object.fromEntries([...byOldIdentity].sort()),
      occurrences: group.map((node) => `${node.file}:${node.line}`),
    });
  }

  return {
    replaced: selectedIds.size,
    extraVariantOccurrences,
    extraVariantStems,
    collidedOccurrences,
    collisionGroups: collisions.length,
    collisions,
  };
}

const levels = [0, 0.25, 0.5, 0.75, 1];
const trials = 200;
const simulations = levels.map((level, levelIndex) => {
  if (level === 0 || level === 1) {
    const ids = new Set(level === 1 ? candidateNodes.map((node) => node.id) : []);
    return { level, samples: 1, ...simulate(ids) };
  }
  const samples = [];
  for (let trial = 0; trial < trials; trial++) {
    const random = seeded(0x4e414749 + levelIndex * 1000 + trial);
    const ids = new Set(candidateNodes.filter(() => random() < level).map((node) => node.id));
    samples.push(simulate(ids));
  }
  const average = (key) => samples.reduce((sum, item) => sum + item[key], 0) / samples.length;
  return {
    level,
    samples: trials,
    replaced: round(average("replaced")),
    extraVariantOccurrences: round(average("extraVariantOccurrences")),
    extraVariantStems: round(average("extraVariantStems")),
    collidedOccurrences: round(average("collidedOccurrences")),
    collisionGroups: round(average("collisionGroups")),
  };
});

const full = simulate(new Set(candidateNodes.map((node) => node.id)));
const baselineVariants = nodes.flatMap((node) => node.variants);
const originalCandidateIdentities = new Set(candidateNodes.map((node) => `${node.tag}.${node.base}`));
const byTag = Object.fromEntries(
  [...new Set(candidateNodes.map((node) => node.tag))].sort().map((tag) => [
    tag,
    candidateNodes.filter((node) => node.tag === tag).length,
  ]),
);
const excludedByTag = Object.fromEntries(
  [...new Set(excludedStyledSemantic.map((node) => node.tag))].sort().map((tag) => [
    tag,
    excludedStyledSemantic.filter((node) => node.tag === tag).length,
  ]),
);

console.log(JSON.stringify({
  methodology: {
    safeBlockTags: [...safeBlockTags],
    safeInlineTags: [...safeInlineTags],
    trialsPerPartialLevel: trials,
    collisionDefinition:
      "same file-local final structural selector and existing variant set, but distinct former semantic base identities",
  },
  population: {
    totalElements: nodes.length,
    visuallySafeSemanticElements: candidateNodes.length + safeSurfaceRoots.length,
    safeSurfaceRootsWithNoNamingChange: safeSurfaceRoots.length,
    eligibleStyledSemanticElements: candidateNodes.length,
    eligibleByTag: byTag,
    excludedStyledSemanticElements: excludedStyledSemantic.length,
    excludedByTag,
  },
  simulations,
  fullReplacement: {
    ...full,
    variantPressurePerReplacement: round(full.extraVariantOccurrences / full.replaced, 3),
    uniqueStemPressurePerReplacement: round(full.extraVariantStems / full.replaced, 3),
  },
  bounds: {
    baselineVariantOccurrences: baselineVariants.length,
    baselineUniqueVariantStems: new Set(baselineVariants).size,
    minimumStylePreserving: {
      addedOccurrences: full.extraVariantOccurrences,
      addedUniqueStems: full.extraVariantStems,
      occurrenceIncreasePercent: round(full.extraVariantOccurrences / baselineVariants.length * 100),
      uniqueStemIncreasePercent: round(full.extraVariantStems / new Set(baselineVariants).size * 100),
    },
    explicitRolePreservingUpperBound: {
      addedOccurrences: candidateNodes.length,
      addedUniqueStems: originalCandidateIdentities.size,
      occurrenceIncreasePercent: round(candidateNodes.length / baselineVariants.length * 100),
      uniqueStemIncreasePercent: round(originalCandidateIdentities.size / new Set(baselineVariants).size * 100),
      note:
        "Every erased native identity receives an explicit distinction. Reserved native vocabulary cannot be reused as a variant stem, so synonyms would be required.",
    },
  },
}, null, 2));
