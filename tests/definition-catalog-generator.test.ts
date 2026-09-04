import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

function buttonContractSuite(fixture: "package" | "owned") {
  return {
    title: `Button / Component Contract / ${fixture}`,
    specs: [
      {
        title: "Exposes one visible, named button",
        file: "packages/core/src/test/button-contract.ts",
        tags: [
          "definition",
          "button",
          "component-contract",
          `fixture-${fixture}`,
          "semantics",
          "BTN_CONTRACT_01",
        ],
        tests: [
          {
            annotations: [
              { type: "component-contract", description: "nagi/button@2" },
              {
                type: "component-contract-requirements",
                description: "BTN_CONTRACT_01",
              },
            ],
            results: [{ status: "passed" }],
          },
        ],
      },
    ],
    suites: [],
  };
}

function buttonImplementationSuite(identity = "nagi/blueprint/button@1") {
  return {
    title: "Button / Implementation / package",
    specs: [
      {
        title: "Uses native button elements with explicit types",
        file: "packages/core/src/test/button-contract.ts",
        tags: [
          "definition",
          "button",
          "implementation",
          "fixture-package",
          "semantics",
          "BTN_IMPLEMENTATION_01",
        ],
        tests: [
          {
            annotations: [
              { type: "component-implementation", description: identity },
              {
                type: "component-implementation-requirements",
                description: "BTN_IMPLEMENTATION_01",
              },
            ],
            results: [{ status: "passed" }],
          },
        ],
      },
    ],
    suites: [],
  };
}

function compatibilityOnlyToastSuite() {
  return {
    title: "Toast / Component Contract / replacement",
    specs: [
      {
        title: "Announces a notification",
        file: "packages/core/src/test/toast-contract.ts",
        tags: [
          "definition",
          "toast",
          "component-contract",
          "semantics",
          "TST_CONTRACT_01",
        ],
        tests: [],
      },
    ],
    suites: [],
  };
}

function validateReport(suites: object[], includeImplementation = true) {
  const temporaryDirectory = mkdtempSync(path.join(tmpdir(), "nagi-definition-report-"));
  const reportPath = path.join(temporaryDirectory, "report.json");
  writeFileSync(
    reportPath,
    JSON.stringify({
      suites: includeImplementation ? [...suites, buttonImplementationSuite()] : suites,
    }),
  );
  const result = spawnSync(
    process.execPath,
    [
      path.join(import.meta.dirname, "../scripts/generate-definition-catalog.mjs"),
      "--validate-report",
      reportPath,
    ],
    { encoding: "utf8" },
  );
  rmSync(temporaryDirectory, { recursive: true });
  return result;
}

test("Definition catalog rejects a Contract requirement without owned evidence", () => {
  const result = validateReport([buttonContractSuite("package")]);
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}${result.stderr}`, /BTN_CONTRACT_01.*missing.*owned/su);
});

test("Definition catalog accepts package and owned evidence for the same Contract", () => {
  const result = validateReport([buttonContractSuite("package"), buttonContractSuite("owned")]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /fixture coverage is valid/u);
});

test("Definition catalog ignores a known compatibility-only component", () => {
  const result = validateReport([
    compatibilityOnlyToastSuite(),
    buttonContractSuite("package"),
    buttonContractSuite("owned"),
  ]);
  assert.equal(result.status, 0, result.stderr);
});

test("Definition catalog still rejects an unknown component tag", () => {
  const unknownSuite = buttonContractSuite("package");
  unknownSuite.specs[0]!.tags = unknownSuite.specs[0]!.tags.map((tag) =>
    tag === "button" ? "unknown-widget" : tag,
  );
  const result = validateReport([unknownSuite, buttonContractSuite("owned")]);
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}${result.stderr}`, /exactly one component tag/u);
});

test("Definition catalog rejects a complete Contract set omitted by every fixture", () => {
  const packageSuite = buttonContractSuite("package");
  const ownedSuite = buttonContractSuite("owned");
  for (const suite of [packageSuite, ownedSuite]) {
    suite.specs[0]!.tests[0]!.annotations[1]!.description =
      "BTN_CONTRACT_01,BTN_CONTRACT_02";
  }
  const result = validateReport([packageSuite, ownedSuite]);
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}${result.stderr}`, /complete Requirement set.*BTN_CONTRACT_02/su);
});

test("Definition catalog rejects different complete Contract sets across fixtures", () => {
  const ownedSuite = buttonContractSuite("owned");
  ownedSuite.specs[0]!.tests[0]!.annotations[1]!.description =
    "BTN_CONTRACT_01,BTN_CONTRACT_02";
  const result = validateReport([buttonContractSuite("package"), ownedSuite]);
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}${result.stderr}`, /different complete Requirement sets/u);
});

test("Definition catalog rejects a test outside its declared complete set", () => {
  const packageSuite = buttonContractSuite("package");
  const ownedSuite = buttonContractSuite("owned");
  for (const suite of [packageSuite, ownedSuite]) {
    suite.specs[0]!.tests[0]!.annotations[1]!.description = "BTN_CONTRACT_02";
  }
  const result = validateReport([packageSuite, ownedSuite]);
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}${result.stderr}`, /declared BTN_CONTRACT_02, observed BTN_CONTRACT_01/u);
});

test("Definition catalog rejects a Contract suite without a concrete Implementation suite", () => {
  const result = validateReport(
    [buttonContractSuite("package"), buttonContractSuite("owned")],
    false,
  );
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}${result.stderr}`, /no concrete Implementation suite/u);
});

test("Definition catalog accepts an owner-qualified custom Implementation identity", () => {
  const result = validateReport(
    [
      buttonContractSuite("package"),
      buttonContractSuite("owned"),
      buttonImplementationSuite("deep-sea/button-motion@1"),
    ],
    false,
  );
  assert.equal(result.status, 0, result.stderr);
});

test("Definition catalog namespaces repeated local IDs by Implementation identity", () => {
  const result = validateReport(
    [
      buttonContractSuite("package"),
      buttonContractSuite("owned"),
      buttonImplementationSuite("nagi/blueprint/button@1"),
      buttonImplementationSuite("deep-sea/button-motion@1"),
    ],
    false,
  );
  assert.equal(result.status, 0, result.stderr);
  assert.match(
    result.stdout,
    /2 Implementation identities, 2 namespaced Implementation requirements/u,
  );
});

test("Definition catalog rejects an unqualified custom Implementation identity", () => {
  const result = validateReport(
    [
      buttonContractSuite("package"),
      buttonContractSuite("owned"),
      buttonImplementationSuite("button-motion@1"),
    ],
    false,
  );
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}${result.stderr}`, /owner-qualified slash ID/u);
});

test("Definition catalog rejects ambiguous Component Contract/Implementation classification", () => {
  const packageSuite = buttonContractSuite("package");
  packageSuite.specs[0]!.tags.push("implementation");
  const result = validateReport([packageSuite, buttonContractSuite("owned")]);
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}${result.stderr}`, /exactly one layer tag/u);
});

test("Definition catalog rejects ambiguous component classification", () => {
  const packageSuite = buttonContractSuite("package");
  packageSuite.specs[0]!.tags.push("carousel");
  const result = validateReport([packageSuite, buttonContractSuite("owned")]);
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}${result.stderr}`, /exactly one component tag/u);
});

test("Definition catalog accepts several section facets for one Requirement", () => {
  const packageSuite = buttonContractSuite("package");
  packageSuite.specs[0]!.tags.push("focus");
  const ownedSuite = buttonContractSuite("owned");
  ownedSuite.specs[0]!.tags.push("focus");
  const result = validateReport([packageSuite, ownedSuite]);
  assert.equal(result.status, 0, result.stderr);
});

test("Definition catalog rejects a Requirement without a section facet", () => {
  const packageSuite = buttonContractSuite("package");
  packageSuite.specs[0]!.tags = packageSuite.specs[0]!.tags.filter((tag) => tag !== "semantics");
  const result = validateReport([packageSuite, buttonContractSuite("owned")]);
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}${result.stderr}`, /at least one section facet tag/u);
});

test("Definition catalog rejects conflicting facets between package and owned evidence", () => {
  const ownedSuite = buttonContractSuite("owned");
  ownedSuite.specs[0]!.tags.push("focus");
  const result = validateReport([buttonContractSuite("package"), ownedSuite]);
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}${result.stderr}`, /BTN_CONTRACT_01.*conflicting test metadata/su);
});

test("Definition catalog rejects missing Component Contract identity", () => {
  const packageSuite = buttonContractSuite("package");
  packageSuite.specs[0]!.tests[0]!.annotations = [];
  const result = validateReport([packageSuite, buttonContractSuite("owned")]);
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}${result.stderr}`, /exactly one component-contract identity/u);
});

test("Definition catalog rejects conflicting Component Contract revisions", () => {
  const ownedSuite = buttonContractSuite("owned");
  ownedSuite.specs[0]!.tests[0]!.annotations[0]!.description = "nagi/button@3";
  const result = validateReport([buttonContractSuite("package"), ownedSuite]);
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}${result.stderr}`, /conflicting component-contract identities/u);
});

test("Definition catalog rejects a component-specific Contract under the wrong ID", () => {
  const packageSuite = buttonContractSuite("package");
  const ownedSuite = buttonContractSuite("owned");
  for (const suite of [packageSuite, ownedSuite]) {
    suite.specs[0]!.tests[0]!.annotations[0]!.description = "nagi/control@2";
  }
  const result = validateReport([packageSuite, ownedSuite]);
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}${result.stderr}`, /must use nagi\/button@N/u);
});

test("Definition catalog rejects a non-integer Component Contract revision", () => {
  const packageSuite = buttonContractSuite("package");
  const ownedSuite = buttonContractSuite("owned");
  for (const suite of [packageSuite, ownedSuite]) {
    suite.specs[0]!.tests[0]!.annotations[0]!.description = "nagi/button@2.1";
  }
  const result = validateReport([packageSuite, ownedSuite]);
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}${result.stderr}`, /positive integer generation/u);
});

test("Definition catalog rejects a section-encoded legacy Requirement ID", () => {
  const packageSuite = buttonContractSuite("package");
  packageSuite.specs[0]!.tags = packageSuite.specs[0]!.tags.map((tag) =>
    tag === "BTN_CONTRACT_01" ? "BTN_CONTRACT_SEM_01" : tag,
  );
  const result = validateReport([packageSuite, buttonContractSuite("owned")]);
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}${result.stderr}`, /BTN_CONTRACT_NN function tag/u);
});

test("Definition catalog rejects ambiguous fixture classification", () => {
  const packageSuite = buttonContractSuite("package");
  packageSuite.specs[0]!.tags.push("fixture-owned");
  const result = validateReport([packageSuite, buttonContractSuite("owned")]);
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}${result.stderr}`, /exactly one fixture tag/u);
});

test("Definition catalog rejects a repeated Requirement within one fixture", () => {
  const packageSuite = buttonContractSuite("package");
  packageSuite.specs.push(structuredClone(packageSuite.specs[0]!));
  const result = validateReport([packageSuite, buttonContractSuite("owned")]);
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}${result.stderr}`, /BTN_CONTRACT_01.*more than once.*package/su);
});
