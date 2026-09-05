import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

import {
  defineNagiConfig,
  deriveAllowedSurfaceRootNames,
  mappingBase,
} from "@nagi-labs/nagi-css-core";
import nagiCss from "@nagi-labs/eslint-plugin-nagi-css";

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(path.join(repository, "package.json"));
const { parseForESLint } = require("vue-eslint-parser");
const preset = await import(path.join(repository, "packages/core/nagi-css-preset.mjs"));

const ignoredDirectories = new Set([".nuxt", ".output", "node_modules"]);
const contract = defineNagiConfig({
  ...preset.default,
  emitPolicy: "when-styled",
  surfaceRootPrefixes: ["site-"],
});
const elementClasses = new Map(
  Object.entries(contract.elementClasses).map(([tag, value]) => [tag, mappingBase(value)]),
);
const anatomy = new Set(contract.anatomyClasses);
const stn = new Set(contract.tiers);
const componentClasses = new Set(Object.values(contract.componentClasses).map(mappingBase));
const slotClasses = new Set(
  Object.values(contract.componentSlots).flatMap((slots) => Object.values(slots)),
);
const excludedSelfMap = new Set(["div", "span", "b", "i", "u", "s", "template", "slot"]);
const fullyDerivedCategories = new Set([
  "surface",
  "component-boundary",
  "component-slot",
  "role",
  "stn",
  "element-map",
  "self-map",
]);

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

function hasDynamicClass(node) {
  return node.startTag.attributes.some(
    (item) =>
      item.directive &&
      item.key.name.name === "bind" &&
      item.key.argument?.type === "VIdentifier" &&
      item.key.argument.name === "class",
  );
}

function tagName(node) {
  return String(node.rawName ?? node.name).toLowerCase();
}

function classCategory({ token, tag, role, surfaces }) {
  if (token.startsWith("-")) return "variant";
  if (surfaces.has(token)) return "surface";
  if (componentClasses.has(token)) return "component-boundary";
  if (slotClasses.has(token)) return "component-slot";
  if (role && token === role) return "role";
  if (stn.has(token)) return "stn";

  const expected =
    elementClasses.get(tag) ??
    (!excludedSelfMap.has(tag) && !tag.includes("-") ? tag : null);
  if (expected === token) return expected === tag ? "self-map" : "element-map";
  if (anatomy.has(token)) return "anatomy";
  return "unclassified";
}

function percentage(count, total) {
  return total === 0 ? 0 : Number(((count / total) * 100).toFixed(1));
}

const files = vueFiles(path.join(repository, "site")).sort();
const elements = [];
const records = [];
let templateAstElements = 0;

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
  const surfaces = new Set(
    deriveAllowedSurfaceRootNames(file, contract.surfaceRootPrefixes),
  );

  function countAstElements(node) {
    if (node.type === "VElement") templateAstElements += 1;
    for (const child of node.children ?? []) countAstElements(child);
  }
  countAstElements(template);

  function visit(node) {
    if (node.type === "VElement") {
      const tag = tagName(node);
      const role = staticAttribute(node, "role");
      const classes = (staticAttribute(node, "class") ?? "").split(/\s+/u).filter(Boolean);
      const element = {
        file: path.relative(repository, file),
        line: node.loc.start.line,
        tag,
        classes,
        dynamicClass: hasDynamicClass(node),
      };
      elements.push(element);
      for (const token of classes) {
        records.push({
          ...element,
          token,
          category: classCategory({ token, tag, role, surfaces }),
        });
      }
    }
    for (const child of node.children ?? []) visit(child);
  }

  // Exclude the SFC's outer template wrapper while retaining authored
  // structural template nodes such as v-for and named-slot templates.
  for (const child of template.children ?? []) visit(child);
}

const categories = [
  "surface",
  "component-boundary",
  "component-slot",
  "role",
  "stn",
  "element-map",
  "self-map",
  "anatomy",
  "variant",
  "unclassified",
];
const categoryCounts = Object.fromEntries(
  categories.map((category) => [
    category,
    records.filter((record) => record.category === category).length,
  ]),
);
const categoryVocabulary = Object.fromEntries(
  categories.map((category) => [
    category,
    [...new Set(records.filter((record) => record.category === category).map((record) => record.token))].sort(
      (left, right) => left.localeCompare(right),
    ),
  ]),
);
const explicitClassElements = elements.filter((element) => element.classes.length > 0);
const baseRecords = records.filter((record) => record.category !== "variant");
const fullyDerivedRecords = records.filter((record) => fullyDerivedCategories.has(record.category));
const fullyDerivedBaseRecords = baseRecords.filter((record) => fullyDerivedCategories.has(record.category));
const anatomyRecords = baseRecords.filter((record) => record.category === "anatomy");
const variantRecords = records.filter((record) => record.category === "variant");
const unclassifiedRecords = records.filter((record) => record.category === "unclassified");
const nagiComponentElements = elements.filter((element) => element.tag.startsWith("n-"));
const divSpanElements = elements.filter((element) => ["div", "span"].includes(element.tag));
const styledDivSpan = divSpanElements.filter((element) => element.classes.length > 0);
const divSpanBaseCategories = Object.fromEntries(
  categories
    .filter((category) => !["variant", "unclassified"].includes(category))
    .map((category) => [
      category,
      records.filter(
        (record) => ["div", "span"].includes(record.tag) && record.category === category,
      ).length,
    ])
    .filter(([, count]) => count > 0),
);
const explicitNoNewWord = fullyDerivedBaseRecords.length + anatomyRecords.length;
const implicitComponentIdentities = nagiComponentElements.length;

const result = {
  methodology: {
    parser: "vue-eslint-parser",
    nagiCssVersion: nagiCss.meta.version,
    scope: "site/**/*.vue",
    excludedDirectories: [...ignoredDirectories].sort(),
    explicitTokenDefinition: "tokens in literal class attributes on template-owned elements",
    fullyDerivedCategories: [...fullyDerivedCategories],
    boundedCategory: "anatomy",
    openEndedCategory: "variant",
  },
  scope: {
    vueSfcFiles: files.length,
    templateAstElements,
    renderedOrTemplateOwnedElements: elements.length,
    explicitClassElements: explicitClassElements.length,
    explicitClassTokens: records.length,
    uniqueExplicitClassTokens: new Set(records.map((record) => record.token)).size,
    baseIdentityTokens: baseRecords.length,
    variantOccurrences: variantRecords.length,
    uniqueVariantStems: new Set(variantRecords.map((record) => record.token)).size,
    nagiComponentUsages: nagiComponentElements.length,
    distinctNagiComponentTags: new Set(nagiComponentElements.map((element) => element.tag)).size,
    elementsWithDynamicClassBindings: elements.filter((element) => element.dynamicClass).length,
  },
  classification: {
    categoryOccurrences: categoryCounts,
    categoryUniqueCounts: Object.fromEntries(
      categories.map((category) => [category, categoryVocabulary[category].length]),
    ),
    fullyDerivedExplicitTokens: {
      count: fullyDerivedRecords.length,
      total: records.length,
      percentage: percentage(fullyDerivedRecords.length, records.length),
    },
    fullyDerivedBaseIdentities: {
      count: fullyDerivedBaseRecords.length,
      total: baseRecords.length,
      percentage: percentage(fullyDerivedBaseRecords.length, baseRecords.length),
    },
    boundedAnatomy: {
      count: anatomyRecords.length,
      total: baseRecords.length,
      percentage: percentage(anatomyRecords.length, baseRecords.length),
      uniqueWords: categoryVocabulary.anatomy.length,
      vocabulary: categoryVocabulary.anatomy,
    },
    openEndedVariants: {
      count: variantRecords.length,
      total: records.length,
      percentage: percentage(variantRecords.length, records.length),
      uniqueStems: new Set(variantRecords.map((record) => record.token)).size,
    },
    baseIdentitiesRequiringNoNewVocabulary: {
      count: explicitNoNewWord,
      total: baseRecords.length,
      percentage: percentage(explicitNoNewWord, baseRecords.length),
    },
    withImplicitComponentIdentities: {
      fullyDerived: {
        count: fullyDerivedBaseRecords.length + implicitComponentIdentities,
        total: baseRecords.length + implicitComponentIdentities,
        percentage: percentage(
          fullyDerivedBaseRecords.length + implicitComponentIdentities,
          baseRecords.length + implicitComponentIdentities,
        ),
      },
      requiringNoNewVocabulary: {
        count: explicitNoNewWord + implicitComponentIdentities,
        total: baseRecords.length + implicitComponentIdentities,
        percentage: percentage(
          explicitNoNewWord + implicitComponentIdentities,
          baseRecords.length + implicitComponentIdentities,
        ),
      },
    },
  },
  divAndSpan: {
    total: divSpanElements.length,
    byTag: Object.fromEntries(
      ["div", "span"].map((tag) => [tag, divSpanElements.filter((element) => element.tag === tag).length]),
    ),
    withExplicitClass: styledDivSpan.length,
    baseCategoryOccurrences: divSpanBaseCategories,
    variantOccurrences: records.filter(
      (record) => ["div", "span"].includes(record.tag) && record.category === "variant",
    ).length,
  },
  unclassified: {
    count: unclassifiedRecords.length,
    occurrences: unclassifiedRecords.map(({ file, line, tag, token }) => ({ file, line, tag, token })),
  },
};

const checkIndex = process.argv.indexOf("--check");
if (checkIndex >= 0) {
  const snapshotArgument = process.argv[checkIndex + 1];
  if (!snapshotArgument) throw new Error("--check requires a repository-relative JSON path");
  const snapshotPath = path.resolve(repository, snapshotArgument);
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
  assert.deepEqual(result, snapshot);
  console.log(`Naming derivation evaluation matches ${path.relative(repository, snapshotPath)}.`);
} else {
  console.log(JSON.stringify(result, null, 2));
}
