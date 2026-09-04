import {
  adoptRequirementSet,
  defineComponentContract,
  defineComponentDefinition,
  defineComponentImplementation,
  nagiDialogRequirementsV2,
} from "@nagi-labs/nagi-ui";

export { nagiDialogRequirementsV2 };

const nativeDialog = adoptRequirementSet(nagiDialogRequirementsV2, {
  prefix: "DLG",
  profile: {
    role: "dialog",
    modality: "modal-only",
    description: "optional-simple",
    dismissal: "light-dismiss-any",
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

export const dialogComponentContract = defineComponentContract({
  id: "nagi/dialog",
  revision: "2",
  description:
    "Named modal-surface, dismissal, controlled visibility, focus containment, and invoker-restoration guarantees shared by interchangeable Dialog implementations.",
  api: [
    { name: "open", kind: "model", description: "Controls accepted dialog visibility." },
    { name: "triggerLabel", kind: "prop", description: "Names the visible invoker." },
    { name: "title", kind: "prop", description: "Supplies the dialog's accessible name." },
    {
      name: "description",
      kind: "prop",
      description: "Optionally supplies a concise accessible description.",
    },
    { name: "closeLabel", kind: "prop", description: "Names the visible close action." },
    { name: "default", kind: "slot", description: "Supplies dialog content." },
    { name: "title", kind: "slot", description: "Overrides the visible title content." },
    {
      name: "description",
      kind: "slot",
      description: "Overrides the visible description content.",
    },
    {
      name: "actions",
      kind: "slot",
      description: "Supplies visible actions and exposes the Contract close operation.",
    },
    { name: "show", kind: "method", description: "Requests accepted open state." },
    { name: "close", kind: "method", description: "Requests accepted closed state." },
    { name: "toggle", kind: "method", description: "Requests the opposite open state." },
  ],
  parts: [
    { name: "invoker", description: "The control that opens the dialog." },
    { name: "surface", description: "The named modal interaction surface." },
  ],
});

/** The standard package implementation backed by the native dialog element. */
export const nativeDialogImplementation = defineComponentImplementation({
  id: "nagi/blueprint/dialog-native",
  title: "Native Dialog Blueprint",
  version: "1",
  strategy: "platform-first",
  description:
    "The standard Blueprint realizes the Dialog Component Contract with a native modal dialog, a Chromium-tested Tab-boundary repair, and browser-owned dismissal.",
  decisions: [
    {
      name: "surface",
      value: "native-dialog",
      description:
        "Use the platform dialog element as the modal owner and repair Chromium's observed transient body-focus boundary so the adopted focus loop remains intact.",
      evidence: ["packages/core/src/test/dialog-contract.ts"],
    },
    {
      name: "presence",
      value: "native-dialog",
      description: "Let the native open state own immediate surface presence.",
      evidence: ["packages/core/src/test/dialog-contract.ts"],
    },
  ],
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

export const dialogDefinition = defineComponentDefinition({
  name: "Dialog",
  version: "3.0",
  status: "draft",
  contract: dialogComponentContract,
  implementation: nativeDialogImplementation,
});
