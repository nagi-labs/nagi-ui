import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import { comboboxDefinition } from "../packages/core/blueprints/combobox/combobox.definition.ts";
import { popoverDefinition } from "../packages/core/blueprints/popover/popover.definition.ts";
import { nagiPopupRequirementsV1 } from "../packages/core/src/standards/nagi-popup.ts";
import { assertDefinitionEvidence } from "../scripts/audits/definition-evidence.ts";

test("nagi/popup contains only the native surface lifecycle shared across popup widgets", () => {
  assert.deepEqual(
    nagiPopupRequirementsV1.requirements.map((requirement) => requirement.id),
    ["SEM-01", "STATE-01", "INT-01"],
  );
  assert.deepEqual(Object.keys(nagiPopupRequirementsV1.profile), [
    "invocation",
    "focus",
    "dismissal",
  ]);
});

test("nagi/popup distinguishes HTML behavior from Nagi model synchronization", () => {
  const statements = popoverDefinition.semantics
    .concat(popoverDefinition.state, popoverDefinition.interaction)
    .filter((entry) => typeof entry !== "string");
  assert.equal(
    statements.find((statement) => statement.id === "POP-STATE-01")?.origin?.kind,
    "nagi",
  );
  assert.equal(
    statements.find((statement) => statement.id === "POP-SEM-01")?.origin?.kind,
    "standard",
  );
  assert.equal(
    statements.find((statement) => statement.id === "POP-INT-01")?.origin?.kind,
    "standard",
  );
});

test("Popover Definition verifies the native-target and unmanaged-focus profile", () => {
  const adoption = popoverDefinition.adoptions?.find(
    ({ requirementSet }) => requirementSet === "nagi/popup",
  );
  assert.deepEqual(adoption?.profile, {
    invocation: "native-target",
    focus: "unmanaged",
    dismissal: "auto",
  });
  assert.doesNotThrow(() =>
    assertDefinitionEvidence(popoverDefinition, path.join(import.meta.dirname, "..")),
  );
});

test("Combobox composes listbox and imperative popup foundations without sharing focus policy", () => {
  assert.deepEqual(
    comboboxDefinition.adoptions?.map(({ requirementSet }) => requirementSet),
    ["nagi/listbox", "nagi/popup"],
  );
  const popup = comboboxDefinition.adoptions?.find(
    ({ requirementSet }) => requirementSet === "nagi/popup",
  );
  assert.deepEqual(popup?.profile, {
    invocation: "behavior-imperative",
    focus: "input-retained",
    dismissal: "auto",
  });
});
