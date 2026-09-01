import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import { validateDefinition, type DefinitionStatement } from "../packages/core/src/definition.ts";
import { nagiMenuRequirementsV1 } from "../packages/core/src/standards/nagi-menu.ts";
import { dropdownMenuDefinition } from "../packages/core/blueprints/menu/dropdown-menu.definition.ts";
import { assertDefinitionEvidence } from "../scripts/audits/definition-evidence.ts";

test("nagi/menu contains only the shared menu semantics and item state", () => {
  assert.deepEqual(
    nagiMenuRequirementsV1.requirements.map((requirement) => requirement.id),
    ["SEM-01", "SEM-02", "STATE-01"],
  );
  assert.deepEqual(Object.keys(nagiMenuRequirementsV1.profile), ["context", "submenu"]);
});

test("DropdownMenu resolves menu and popup foundations with a nested profile", () => {
  assert.deepEqual(validateDefinition(dropdownMenuDefinition), []);
  assert.equal(dropdownMenuDefinition.status, "verified");
  assert.deepEqual(
    dropdownMenuDefinition.adoptions?.map(({ requirementSet }) => requirementSet),
    ["nagi/menu", "nagi/popup"],
  );
  assert.deepEqual(
    dropdownMenuDefinition.adoptions?.find(({ requirementSet }) => requirementSet === "nagi/menu")?.profile,
    { context: "dropdown", submenu: "nested" },
  );
  assert.deepEqual(
    dropdownMenuDefinition.adoptions?.find(({ requirementSet }) => requirementSet === "nagi/popup")?.profile,
    { invocation: "native-target", focus: "menu-managed", dismissal: "auto" },
  );
  assert.doesNotThrow(() => assertDefinitionEvidence(
    dropdownMenuDefinition,
    path.join(import.meta.dirname, ".."),
  ));
});

test("DropdownMenu keeps component policy separate from adopted standards", () => {
  const local = [
    ...dropdownMenuDefinition.semantics,
    ...dropdownMenuDefinition.state,
    ...dropdownMenuDefinition.interaction,
    ...dropdownMenuDefinition.focus,
    ...dropdownMenuDefinition.style,
  ].filter((entry): entry is DefinitionStatement =>
    typeof entry !== "string"
    && entry.id.startsWith("MNU-")
    && !entry.id.startsWith("MNU-MENU-")
    && !entry.id.startsWith("MNU-POP-"));

  assert.ok(local.length > 0);
  assert.ok(local.every((entry) => entry.origin?.kind === "nagi" || entry.origin?.kind === "reference"));
  assert.equal(local.some((entry) => entry.origin?.kind === "standard"), false);
});
