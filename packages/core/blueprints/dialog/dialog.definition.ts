import {
  adoptRequirementSet,
  defineComponentDefinition,
  nagiDialogRequirementsV1,
} from "@nagi-labs/nagi-ui";

const nativeDialog = adoptRequirementSet(nagiDialogRequirementsV1, {
  prefix: "DLG",
  profile: {
    role: "dialog",
    modality: "modal-default",
    description: "optional-simple",
    dismissal: "configurable",
  },
  evidence: {
    "SEM-01": [
      "packages/core/src/test/dialog-contract.ts",
      "tests/browser/definition-mutations.spec.ts",
    ],
    "SEM-02": ["packages/core/src/test/dialog-contract.ts"],
    "SEM-03": ["packages/core/src/test/dialog-contract.ts", "tests/dialog.test.ts"],
    "STATE-01": ["packages/core/src/test/dialog-contract.ts", "tests/dialog.test.ts"],
    "STATE-02": [
      "packages/core/src/test/dialog-contract.ts",
      "tests/dialog.test.ts",
      "tests/browser/definition-mutations.spec.ts",
    ],
    "INT-01": ["packages/core/src/test/dialog-contract.ts", "tests/dialog.test.ts"],
    "FOCUS-01": ["packages/core/src/test/dialog-contract.ts"],
    "FOCUS-02": [
      "packages/core/src/test/dialog-contract.ts",
      "tests/browser/definition-mutations.spec.ts",
      "tests/browser/shadow-root.spec.ts",
    ],
  },
});

/** Observable guarantees owned with the native Dialog Blueprint. */
export const dialogDefinition = defineComponentDefinition({
  name: "Dialog",
  version: "2.0",
  status: "verified",
  adopts: [nativeDialog],
  anatomy: [
    {
      id: "DLG-ANAT-01",
      evidence: ["packages/core/src/test/dialog-contract.ts"],
      name: "root",
      description: "The owned Dialog scope containing the invoker and native surface.",
      match: { by: "part", scope: "dialog", part: "root" },
    },
    {
      name: "trigger",
      description: "The native invoker receiving the complete triggerProps bundle.",
      match: { by: "part", scope: "dialog", part: "trigger" },
      within: "root",
    },
    {
      name: "surface",
      description: "The native dialog receiving the complete dialogProps bundle.",
      match: { by: "part", scope: "dialog", part: "surface" },
      within: "root",
    },
    {
      name: "title",
      description: "The visible element that supplies the surface's accessible name.",
      match: { by: "part", scope: "dialog", part: "title" },
      within: "surface",
    },
    {
      name: "description",
      description: "An optional concise description referenced by the surface.",
      match: { by: "part", scope: "dialog", part: "description" },
      within: "surface",
      required: false,
    },
    {
      name: "close",
      description: "A visible native close action within the surface.",
      match: { by: "part", scope: "dialog", part: "close" },
      within: "surface",
    },
  ],
  style: [
    {
      id: "DLG-STYLE-01",
      classification: "intentional-extension",
      source: "Nagi modal-surface and forced-colors policy",
      text: "The modal surface has a visible backdrop, viewport-bounded width, and forced-colors-visible focus indicators.",
      evidence: ["packages/core/src/test/dialog-contract.ts"],
      origin: {
        kind: "nagi",
        policy: "dialog-functional-presentation",
        policyVersion: "1",
      },
    },
  ],
});
