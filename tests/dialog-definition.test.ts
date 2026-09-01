import assert from "node:assert/strict"
import path from "node:path"
import test from "node:test"

import { alertDialogDefinition } from "../packages/core/blueprints/alert-dialog/alert-dialog.definition.ts"
import { dialogDefinition } from "../packages/core/blueprints/dialog/dialog.definition.ts"
import { validateDefinition, type DefinitionStatement } from "../packages/core/src/definition.ts"
import { nagiDialogRequirementsV1 } from "../packages/core/src/standards/nagi-dialog.ts"
import { assertDefinitionEvidence } from "../scripts/audits/definition-evidence.ts"

test("nagi/dialog separates platform behavior from Nagi integration policy", () => {
  assert.deepEqual(
    nagiDialogRequirementsV1.requirements.map((requirement) => requirement.id),
    [
      "SEM-01",
      "SEM-02",
      "SEM-03",
      "STATE-01",
      "STATE-02",
      "INT-01",
      "FOCUS-01",
      "FOCUS-02",
    ],
  )
  assert.deepEqual(Object.keys(nagiDialogRequirementsV1.profile), [
    "role",
    "modality",
    "description",
    "dismissal",
  ])

  const policyRequirements = nagiDialogRequirementsV1.requirements
    .filter((requirement) => requirement.policy !== undefined)
    .map((requirement) => requirement.id)
  assert.deepEqual(policyRequirements, ["SEM-03", "STATE-01"])
})

test("Dialog adopts its configurable modal profile as a verified Definition", () => {
  assert.deepEqual(validateDefinition(dialogDefinition), [])
  assert.equal(dialogDefinition.status, "verified")
  assert.equal(dialogDefinition.version, "2.0")
  assert.deepEqual(
    dialogDefinition.adoptions?.find(
      ({ requirementSet }) => requirementSet === "nagi/dialog",
    )?.profile,
    {
      role: "dialog",
      modality: "modal-default",
      description: "optional-simple",
      dismissal: "configurable",
    },
  )
  assert.doesNotThrow(() =>
    assertDefinitionEvidence(dialogDefinition, path.join(import.meta.dirname, "..")),
  )
})

test("Dialog keeps Nagi policy distinguishable from source-backed requirements", () => {
  const statements = [
    ...dialogDefinition.semantics,
    ...dialogDefinition.state,
    ...dialogDefinition.interaction,
    ...dialogDefinition.focus,
  ].filter((entry): entry is DefinitionStatement => typeof entry !== "string")

  assert.equal(
    statements.find((statement) => statement.id === "DLG-SEM-03")?.origin?.kind,
    "nagi",
  )
  assert.equal(
    statements.find((statement) => statement.id === "DLG-STATE-01")?.origin?.kind,
    "nagi",
  )
  assert.equal(
    statements.find((statement) => statement.id === "DLG-STATE-02")?.origin?.kind,
    "standard",
  )
  assert.equal(
    statements.find((statement) => statement.id === "DLG-FOCUS-01")?.origin?.kind,
    "standard",
  )
})

test("nagi/dialog already exposes the stricter profile needed by AlertDialog", () => {
  assert.deepEqual(nagiDialogRequirementsV1.profile.role, ["dialog", "alertdialog"])
  assert.deepEqual(nagiDialogRequirementsV1.profile.modality, ["modal-default", "modal-only"])
  assert.deepEqual(nagiDialogRequirementsV1.profile.description, [
    "optional-simple",
    "required-message",
  ])
  assert.deepEqual(nagiDialogRequirementsV1.profile.dismissal, [
    "configurable",
    "close-request-only",
  ])
})

test("AlertDialog proves the stricter nagi/dialog profile with component policy layered above it", () => {
  assert.deepEqual(validateDefinition(alertDialogDefinition), [])
  assert.equal(alertDialogDefinition.status, "verified")
  assert.deepEqual(
    alertDialogDefinition.adoptions?.find(
      ({ requirementSet }) => requirementSet === "nagi/dialog",
    )?.profile,
    {
      role: "alertdialog",
      modality: "modal-only",
      description: "required-message",
      dismissal: "close-request-only",
    },
  )
  assert.doesNotThrow(() =>
    assertDefinitionEvidence(alertDialogDefinition, path.join(import.meta.dirname, "..")),
  )
  assert.deepEqual(
    alertDialogDefinition.interaction
      .filter((entry): entry is DefinitionStatement => typeof entry !== "string")
      .find((entry) => entry.id === "ALD-INT-01")?.origin,
    { kind: "nagi", policy: "explicit-alert-dialog-actions", policyVersion: "1" },
  )
})
