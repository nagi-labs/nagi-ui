import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const repositoryRoot = path.resolve(import.meta.dirname, "..");
const outputPath = path.join(repositoryRoot, "site/data/generated/definition-tests.json");
const validateReportIndex = process.argv.indexOf("--validate-report");
const validateReportPath =
  validateReportIndex >= 0 ? process.argv[validateReportIndex + 1] : undefined;

if (validateReportIndex >= 0 && !validateReportPath) {
  throw new Error("--validate-report requires a Playwright JSON report path.");
}

const result = validateReportPath
  ? { stdout: readFileSync(path.resolve(validateReportPath), "utf8"), stderr: "", status: 0 }
  : spawnSync(
      "vp",
      [
        "exec",
        "playwright",
        "test",
        "--grep",
        "@definition",
        "--reporter=json",
      ],
      {
        cwd: repositoryRoot,
        encoding: "utf8",
        maxBuffer: 32 * 1024 * 1024,
      },
    );

if (!result.stdout.trim()) {
  process.stderr.write(result.stderr);
  throw new Error("Playwright did not produce a Definition report.");
}

const report = JSON.parse(result.stdout);
const collected = new Map();
const collectedReferences = new Map();
const collectedContracts = new Map();
const collectedImplementations = new Map();
const declaredRequirementSets = new Map();
const collectedSuiteRequirements = new Map();
const declaredIdentityRequirementSets = new Map();

const componentCatalog = {
  button: { name: "Button", prefix: "BTN" },
  carousel: { name: "Carousel", prefix: "CAR" },
  combobox: { name: "Combobox", prefix: "CMB" },
  "date-picker": { name: "DatePicker", prefix: "DTP" },
  dialog: { name: "Dialog", prefix: "DLG" },
};

// Every known Definition component owns a valid classification tag. Only the
// subset above is materialized into the local package/owned browser catalog;
// compatibility-only Definitions may be proven in an external replacement
// repository without being mistaken for an unknown component tag here.
const definitionComponentKeys = [
  "alert-dialog",
  ...Object.keys(componentCatalog),
  "dropdown-menu",
  "listbox",
  "popover",
  "toast",
];

function exactlyOneTag(tags, allowed, classification, title) {
  const values = allowed.filter((value) => tags.includes(value));
  if (values.length !== 1) {
    throw new Error(
      `Definition test needs exactly one ${classification} tag; found ${values.join(", ") || "none"}: ${title}`,
    );
  }
  return values[0];
}

function visit(suite, parents = []) {
  const lineage = suite.title ? [...parents, suite.title] : parents;
  for (const spec of suite.specs ?? []) {
    const tags = spec.tags ?? [];
    if (!tags.includes("definition")) continue;

    const componentKey = exactlyOneTag(
      tags,
      definitionComponentKeys,
      "component",
      spec.title,
    );
    if (!Object.hasOwn(componentCatalog, componentKey)) continue;
    const layer = exactlyOneTag(
      tags,
      ["component-contract", "implementation"],
      "layer",
      spec.title,
    );
    const fixtureTag = exactlyOneTag(
      tags,
      ["fixture-package", "fixture-owned"],
      "fixture",
      spec.title,
    );
    const sectionTags = ["semantics", "state", "interaction", "focus", "anatomy", "style"];
    const sections = sectionTags.filter((value) => tags.includes(value));
    if (sections.length === 0) {
      throw new Error(`Definition test needs at least one section facet tag: ${spec.title}`);
    }
    const fixtureKind = fixtureTag.replace("fixture-", "");

    const componentPrefix = componentCatalog[componentKey].prefix;
    const layerPrefix = {
      "component-contract": "CONTRACT",
      implementation: "IMPLEMENTATION",
    }[layer];
    const requirementPattern = new RegExp(`^${componentPrefix}_${layerPrefix}_[0-9]{2}$`, "u");
    const allRequirementIds = tags.filter((tag) =>
      /^[A-Z]+_(?:CONTRACT|IMPLEMENTATION|PROFILE)_(?:(?:SEM|STATE|INT|FOCUS|ANAT|STYLE)_)?[0-9]{2}$/u.test(
        tag,
      ),
    );
    const requirementIds = allRequirementIds.filter((tag) => requirementPattern.test(tag));
    if (allRequirementIds.length !== 1 || requirementIds.length !== 1) {
      throw new Error(
        `Definition test needs exactly one ${componentPrefix}_${layerPrefix}_NN function tag: ${spec.title}`,
      );
    }

    const [key] = requirementIds;
    const title = spec.title;
    const statuses = (spec.tests ?? []).flatMap((test) =>
      (test.results ?? []).map((testResult) => testResult.status),
    );
    const annotations = (spec.tests ?? []).flatMap((test) => test.annotations ?? []);
    const references = annotations
      .filter((annotation) => annotation.type === "reference" && annotation.description)
      .map((annotation) => annotation.description);
    for (const reference of references) {
      collectedReferences.set(`${componentKey}/${layer}/${reference}`, {
        layer,
        url: reference,
      });
    }
    const identityType =
      layer === "component-contract" ? "component-contract" : "component-implementation";
    const identities = [
      ...new Set(
        annotations
          .filter((annotation) => annotation.type === identityType && annotation.description)
          .map((annotation) => annotation.description),
      ),
    ];
    if (identities.length !== 1) {
      throw new Error(
        `${spec.title} needs exactly one ${identityType} identity annotation; found ${identities.join(", ") || "none"}.`,
      );
    }
    if (layer === "component-contract") {
      const existingIdentity = collectedContracts.get(componentKey);
      if (existingIdentity && existingIdentity !== identities[0]) {
        throw new Error(
          `${componentCatalog[componentKey].name} has conflicting ${identityType} identities: ${existingIdentity} and ${identities[0]}.`,
        );
      }
      collectedContracts.set(componentKey, identities[0]);
    } else {
      const implementationIdentities = collectedImplementations.get(componentKey) ?? new Set();
      implementationIdentities.add(identities[0]);
      collectedImplementations.set(componentKey, implementationIdentities);
    }
    const requirementSetType =
      layer === "component-contract"
        ? "component-contract-requirements"
        : "component-implementation-requirements";
    const requirementSetDescriptions = [
      ...new Set(
        annotations
          .filter(
            (annotation) =>
              annotation.type === requirementSetType && annotation.description,
          )
          .map((annotation) => annotation.description),
      ),
    ];
    if (requirementSetDescriptions.length !== 1) {
      throw new Error(
        `${spec.title} needs exactly one ${requirementSetType} annotation; found ${requirementSetDescriptions.join(" | ") || "none"}.`,
      );
    }
    const declaredRequirements = requirementSetDescriptions[0]
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .sort();
    if (
      declaredRequirements.length === 0 ||
      new Set(declaredRequirements).size !== declaredRequirements.length ||
      declaredRequirements.some((requirement) => !requirementPattern.test(requirement))
    ) {
      throw new Error(
        `${spec.title} has an invalid ${requirementSetType} declaration: ${requirementSetDescriptions[0]}.`,
      );
    }
    const suiteRequirementKey = `${componentKey}/${layer}/${identities[0]}/${fixtureKind}`;
    const declaredSet = declaredRequirements.join(",");
    const existingDeclaredSet = declaredRequirementSets.get(suiteRequirementKey);
    if (existingDeclaredSet && existingDeclaredSet !== declaredSet) {
      throw new Error(
        `${componentCatalog[componentKey].name} ${layer} ${fixtureKind} has conflicting complete Requirement sets.`,
      );
    }
    declaredRequirementSets.set(suiteRequirementKey, declaredSet);
    const identityRequirementKey = `${componentKey}/${layer}/${identities[0]}`;
    const existingIdentitySet = declaredIdentityRequirementSets.get(identityRequirementKey);
    if (existingIdentitySet && existingIdentitySet !== declaredSet) {
      throw new Error(
        `${componentCatalog[componentKey].name} ${identities[0]} declares different complete Requirement sets across fixtures.`,
      );
    }
    declaredIdentityRequirementSets.set(identityRequirementKey, declaredSet);
    const observed = collectedSuiteRequirements.get(suiteRequirementKey) ?? new Set();
    observed.add(key);
    collectedSuiteRequirements.set(suiteRequirementKey, observed);
    const fixtureSuite = [...lineage]
      .reverse()
      .find((titlePart) => titlePart.startsWith(`${componentCatalog[componentKey].name} /`));
    const fixture = fixtureSuite?.split(" / ").at(-1) ?? "default";
    const evidence = {
      fixture,
      fixtureKind,
      source: spec.file,
      status:
        statuses.length > 0 && statuses.every((status) => status === "passed")
          ? "passed"
          : "failed",
    };

    const collectionKey =
      layer === "component-contract" ? key : `${identities[0]}::${key}`;
    const existing = collected.get(collectionKey);
    if (existing) {
      if (
        existing.title !== title ||
        existing.layer !== layer ||
        existing.sections.join("\0") !== sections.join("\0")
      ) {
        throw new Error(`Requirement ${key} has conflicting test metadata.`);
      }
      if (existing.evidence.some((candidate) => candidate.fixtureKind === fixtureKind)) {
        throw new Error(`Requirement ${key} is registered more than once for ${fixtureKind}.`);
      }
      existing.evidence.push(evidence);
    } else {
      collected.set(collectionKey, {
        key,
        layer,
        ...(layer === "implementation" ? { implementationIdentity: identities[0] } : {}),
        sections,
        title,
        runner: "playwright",
        evidence: [evidence],
      });
    }
  }

  for (const child of suite.suites ?? []) visit(child, lineage);
}

for (const suite of report.suites ?? []) visit(suite);

for (const [suiteRequirementKey, declaredSet] of declaredRequirementSets) {
  const observedSet = [...(collectedSuiteRequirements.get(suiteRequirementKey) ?? [])]
    .sort()
    .join(",");
  if (observedSet !== declaredSet) {
    throw new Error(
      `${suiteRequirementKey} does not execute its complete Requirement set; declared ${declaredSet}, observed ${observedSet || "none"}.`,
    );
  }
}

function splitIdentity(component, identity, kind) {
  if (!identity) return undefined;
  const separator = identity.lastIndexOf("@");
  if (separator <= 0 || separator === identity.length - 1) {
    throw new Error(`${component.name} has invalid runner identity "${identity}".`);
  }
  const id = identity.slice(0, separator);
  const generation = identity.slice(separator + 1);
  const expectedId = `nagi/${component.key}`;
  if (kind === "component-contract" && id !== expectedId) {
    throw new Error(
      `${component.name} Component Contract identity must use ${expectedId}@N; found ${identity}.`,
    );
  }
  if (
    kind === "component-implementation" &&
    !/^[a-z][a-z0-9-]*(?:\/[a-z][a-z0-9-]*)+$/u.test(id)
  ) {
    throw new Error(
      `${component.name} Implementation identity needs an owner-qualified slash ID; found ${identity}.`,
    );
  }
  if (!/^[1-9][0-9]*$/u.test(generation)) {
    throw new Error(
      `${component.name} runner identity needs a positive integer generation: ${identity}.`,
    );
  }
  return kind === "component-contract"
    ? { id, revision: generation }
    : { id, version: generation };
}

const components = Object.fromEntries(
  Object.entries(componentCatalog).map(([componentKey, component]) => {
    const componentIdentity = { ...component, key: componentKey };
    const requirements = [...collected.values()]
      .filter((requirement) => requirement.key.startsWith(`${component.prefix}_`))
      .map(({ implementationIdentity, ...requirement }) => ({
        ...requirement,
        ...(implementationIdentity
          ? {
              implementation: splitIdentity(
                componentIdentity,
                implementationIdentity,
                "component-implementation",
              ),
            }
          : {}),
        evidence: [...requirement.evidence].sort((left, right) =>
          `${left.fixture}/${left.source}`.localeCompare(`${right.fixture}/${right.source}`),
        ),
      }))
      .sort((left, right) =>
        `${left.implementation?.id ?? ""}/${left.key}`.localeCompare(
          `${right.implementation?.id ?? ""}/${right.key}`,
        ),
      );
    for (const requirement of requirements.filter(({ layer }) => layer === "component-contract")) {
      const fixtureKinds = new Set(requirement.evidence.map(({ fixtureKind }) => fixtureKind));
      const missing = ["package", "owned"].filter((fixtureKind) => !fixtureKinds.has(fixtureKind));
      if (missing.length > 0) {
        throw new Error(
          `${requirement.key} is missing required Contract fixture evidence: ${missing.join(", ")}.`,
        );
      }
    }
    const references = [...collectedReferences.entries()]
      .filter(([key]) => key.startsWith(`${componentKey}/`))
      .map(([, reference]) => reference)
      .sort((left, right) =>
        `${left.layer}/${left.url}`.localeCompare(`${right.layer}/${right.url}`),
      );
    const contractIdentity = collectedContracts.get(componentKey);
    const implementationIdentities = [
      ...(collectedImplementations.get(componentKey) ?? new Set()),
    ].sort();
    if (requirements.length > 0 && !contractIdentity) {
      throw new Error(
        `${component.name} has runner requirements but no Component Contract identity.`,
      );
    }
    if (requirements.length > 0 && !requirements.some(({ layer }) => layer === "implementation")) {
      throw new Error(
        `${component.name} has a Component Contract suite but no concrete Implementation suite.`,
      );
    }
    if (requirements.length > 0 && implementationIdentities.length === 0) {
      throw new Error(`${component.name} has runner requirements but no Implementation identity.`);
    }
    return [
      component.name,
      {
        status:
          requirements.length > 0 &&
          requirements.every((requirement) =>
            requirement.evidence.every((evidence) => evidence.status === "passed"),
          )
            ? "passing"
            : "failed",
        componentContract: splitIdentity(
          componentIdentity,
          contractIdentity,
          "component-contract",
        ),
        implementations: implementationIdentities.map((identity) =>
          splitIdentity(componentIdentity, identity, "component-implementation"),
        ),
        references,
        requirements,
      },
    ];
  }),
);

const output = `${JSON.stringify({ schemaVersion: 5, components }, null, 2)}\n`;
if (validateReportPath) {
  const implementationCount = [...collectedImplementations.values()].reduce(
    (total, identities) => total + identities.size,
    0,
  );
  const implementationRequirementCount = [...collected.values()].filter(
    ({ layer }) => layer === "implementation",
  ).length;
  process.stdout.write(
    `Definition report fixture coverage is valid: ${implementationCount} Implementation identities, ${implementationRequirementCount} namespaced Implementation requirements.\n`,
  );
} else if (process.argv.includes("--check")) {
  if (readFileSync(outputPath, "utf8") !== output) {
    throw new Error("Generated Definition catalog is stale. Run `vp run definitions:generate`.");
  }
} else {
  writeFileSync(outputPath, output);
}

if (result.status !== 0) {
  process.stderr.write(result.stderr);
  process.exit(result.status ?? 1);
}

const requirementCount = [...collected.values()].length;
if (!validateReportPath) {
  process.stdout.write(
    `${process.argv.includes("--check") ? "Checked" : "Generated"} ${requirementCount} Definition requirements at ${outputPath}\n`,
  );
}
