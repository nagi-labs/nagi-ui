import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

import { fileURLToPath } from "node:url";

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(path.join(repository, "package.json"));
const { parseForESLint } = require("vue-eslint-parser");
const preset = await import(path.join(repository, "packages/core/nagi-css-preset.mjs"));

const elementClasses = new Map([
  ...["h1", "h2", "h3", "h4", "h5", "h6"].map((tag) => [tag, "title"]),
  ...["ul", "ol", "dl"].map((tag) => [tag, "list"]),
  ["p", "text"], ["small", "note"], ["a", "link"], ["li", "item"],
  ["dt", "term"], ["dd", "definition"], ["img", "image"], ["tr", "row"],
  ["th", "cell"], ["td", "cell"],
]);
const anatomy = new Set(preset.nagiUiAnatomyClasses);
const stn = new Set(["stratum", "region", "block", "unit", "seg", "fr", "g"]);
const componentClasses = new Set(Object.values(preset.nagiUiComponentClasses));
const slotClasses = new Set(
  Object.values(preset.nagiUiComponentSlots).flatMap((slots) => Object.values(slots)),
);
const excludedSelfMap = new Set(["div", "span", "b", "i", "u", "s", "template", "slot"]);

function kebabCase(value) {
  return value
    .replace(/^\[|\]$/g, "")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase();
}

function vueFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const resolved = path.join(directory, entry.name);
    if (entry.isDirectory()) return vueFiles(resolved);
    return entry.name.endsWith(".vue") ? [resolved] : [];
  });
}

function attribute(node, name) {
  const candidate = node.startTag.attributes.find(
    (item) => !item.directive && item.key.name === name,
  );
  return candidate?.value?.value ?? null;
}

function hasDirective(node, name) {
  return node.startTag.attributes.some(
    (item) => item.directive && item.key.name.name === name,
  );
}

function tagName(node) {
  return String(node.rawName ?? node.name).toLowerCase();
}

function surfaceName(file) {
  return `site-${kebabCase(path.basename(file, ".vue"))}`;
}

function classCategory({ token, tag, role, surface }) {
  if (token.startsWith("-")) return "variant";
  // Routed Nuxt pages derive a `*-page` surface that can differ from the raw
  // filename (index routes, dynamic segments, and nested route directories).
  if (token === surface || token.startsWith("site-")) return "surface";
  if (componentClasses.has(token)) return "component-boundary";
  if (slotClasses.has(token)) return "component-slot";
  if (role && token === role) return "role";
  if (anatomy.has(token)) return "anatomy";
  if (stn.has(token)) return "stn";
  const expected = elementClasses.get(tag) ?? (!excludedSelfMap.has(tag) && !tag.includes("-") ? tag : null);
  if (expected === token) return elementClasses.has(tag) ? "element-map" : "self-map";
  return "unclassified";
}

const files = vueFiles(path.join(repository, "site")).sort();
const records = [];
const elements = [];

for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  const parsed = parseForESLint(source, {
    filePath: file,
    sourceType: "module",
    ecmaVersion: "latest",
    parser: false,
  });
  const template = parsed.ast.templateBody;
  if (!template) continue;
  const surface = surfaceName(file);

  function visit(node) {
    if (node.type === "VElement") {
      const tag = tagName(node);
      const role = attribute(node, "role");
      const classValue = attribute(node, "class");
      const classes = classValue?.split(/\s+/).filter(Boolean) ?? [];
      const record = {
        file: path.relative(repository, file),
        line: node.loc.start.line,
        tag,
        role,
        classes,
        directives: {
          on: hasDirective(node, "on"),
          if: hasDirective(node, "if"),
          for: hasDirective(node, "for"),
        },
      };
      elements.push(record);
      for (const token of classes) {
        records.push({
          ...record,
          token,
          category: classCategory({ token, tag, role, surface }),
        });
      }
    }
    for (const key of ["children"]) {
      for (const child of node[key] ?? []) visit(child);
    }
  }
  visit(template);
}

const categoryCounts = Object.fromEntries(
  [...new Set(records.map((record) => record.category))]
    .sort()
    .map((category) => [category, records.filter((record) => record.category === category).length]),
);
const categoryUnique = Object.fromEntries(
  Object.keys(categoryCounts).map((category) => [
    category,
    [...new Set(records.filter((record) => record.category === category).map((record) => record.token))].sort(),
  ]),
);
const variantFrequencies = Object.fromEntries(
  [...new Set(records.filter((record) => record.category === "variant").map((record) => record.token))]
    .sort()
    .map((token) => [token, records.filter((record) => record.token === token).length]),
);
const baseRecords = records.filter((record) => record.category !== "variant");
const derivedCategories = new Set([
  "surface", "component-boundary", "component-slot", "role", "stn", "element-map", "self-map",
]);
const derivedRecords = records.filter((record) => derivedCategories.has(record.category));
const decisionRecords = records.filter((record) => ["variant", "anatomy", "unclassified"].includes(record.category));
const styledElements = elements.filter((element) => element.classes.length > 0);
const styledDivSpan = styledElements.filter((element) => ["div", "span"].includes(element.tag));

const divSpanAudit = styledDivSpan.map((element) => ({
  ...element,
  categories: element.classes.map((token) => classCategory({
    token,
    tag: element.tag,
    role: element.role,
    surface: surfaceName(path.join(repository, element.file)),
  })),
}));

const result = {
  scope: {
    files: files.length,
    elements: elements.length,
    nagiComponentElements: elements.filter((element) => element.tag.startsWith("n-")).length,
    uniqueNagiComponents: new Set(
      elements.filter((element) => element.tag.startsWith("n-")).map((element) => element.tag),
    ).size,
    styledElements: styledElements.length,
    classTokens: records.length,
    uniqueClassTokens: new Set(records.map((record) => record.token)).size,
    baseTokens: baseRecords.length,
    variantTokens: categoryCounts.variant ?? 0,
  },
  categoryCounts,
  categoryUnique,
  variantFrequencies,
  rates: {
    derivedAllTokens: derivedRecords.length / records.length,
    authorDecisionAllTokens: decisionRecords.length / records.length,
    derivedBaseTokens: derivedRecords.length / baseRecords.length,
    styledNodesWithoutAuthorNamedToken:
      styledElements.filter((element) => element.classes.every((token) => {
        const category = records.find((record) =>
          record.file === element.file && record.line === element.line && record.token === token
        )?.category;
        return derivedCategories.has(category);
      })).length / styledElements.length,
  },
  divSpan: {
    total: elements.filter((element) => ["div", "span"].includes(element.tag)).length,
    styled: styledDivSpan.length,
    audit: divSpanAudit,
  },
  unclassified: records.filter((record) => record.category === "unclassified"),
};

console.log(JSON.stringify(result, null, 2));
