import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import { assertDefinition, validateDefinition } from "../packages/core/src/definition.ts";
import { nagiListboxRequirementsV1 } from "../packages/core/src/standards/nagi-listbox.ts";
import { comboboxDefinition } from "../packages/core/blueprints/combobox/combobox.definition.ts";
import { listboxDefinition } from "../packages/core/blueprints/listbox/listbox.definition.ts";
import { assertDefinitionEvidence } from "../scripts/audits/definition-evidence.ts";

test("nagi/listbox records only the listbox semantics shared by Listbox and Combobox", () => {
  assert.deepEqual(
    nagiListboxRequirementsV1.requirements.map((requirement) => requirement.id),
    ["SEM-01", "SEM-02", "STATE-01"],
  );
  assert.deepEqual(Object.keys(nagiListboxRequirementsV1.profile), ["context", "selection"]);
});

test("Listbox Definition resolves the standalone listbox Requirement set", () => {
  assert.deepEqual(validateDefinition(listboxDefinition), []);
  assert.doesNotThrow(() => assertDefinition(listboxDefinition));
  assert.equal(listboxDefinition.contract?.id, "nagi/listbox");
  assert.equal(listboxDefinition.implementation?.id, "nagi/blueprint/listbox-active-descendant");
  assert.deepEqual(
    listboxDefinition.parts.map((part) => part.name),
    ["listbox", "option"],
  );

  const adoption = listboxDefinition.adoptions?.find(
    ({ requirementSet }) => requirementSet === "nagi/listbox",
  );
  assert.deepEqual(adoption?.profile, {
    context: "standalone",
    selection: "single-or-multiple",
  });
  assert.deepEqual(adoption?.requirementIds, ["LST-SEM-01", "LST-SEM-02", "LST-STATE-01"]);
  assert.doesNotThrow(() =>
    assertDefinitionEvidence(listboxDefinition, path.join(import.meta.dirname, "..")),
  );
});

test("Combobox adopts only the shared popup-listbox semantics", () => {
  assert.deepEqual(validateDefinition(comboboxDefinition), []);
  assert.equal(comboboxDefinition.contract?.id, "nagi/combobox");
  assert.equal(comboboxDefinition.implementation?.id, "nagi/blueprint/combobox-native-popover");

  const adoption = comboboxDefinition.adoptions?.find(
    ({ requirementSet }) => requirementSet === "nagi/listbox",
  );
  assert.deepEqual(adoption?.profile, {
    context: "combobox-popup",
    selection: "single",
  });
  assert.deepEqual(adoption?.requirementIds, [
    "CMB-LBX-SEM-01",
    "CMB-LBX-SEM-02",
    "CMB-LBX-STATE-01",
  ]);
  assert.equal(
    comboboxDefinition.focus.some(
      (entry) => typeof entry !== "string" && entry.id === "CMB-FOCUS-01",
    ),
    true,
  );
});
