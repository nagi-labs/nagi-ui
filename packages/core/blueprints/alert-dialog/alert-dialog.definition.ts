import {
  adoptRequirementSet,
  defineComponentDefinition,
  nagiDialogRequirementsV1,
} from "@nagi-labs/nagi-ui";

const nativeAlertDialog = adoptRequirementSet(nagiDialogRequirementsV1, {
  prefix: "ALD-DIALOG",
  profile: {
    role: "alertdialog",
    modality: "modal-only",
    description: "required-message",
    dismissal: "close-request-only",
  },
  evidence: {
    "SEM-01": ["packages/core/src/test/dialog-contract.ts", "tests/alert-dialog.test.ts"],
    "SEM-02": [
      "packages/core/src/test/dialog-contract.ts",
      "tests/alert-dialog.test.ts",
      "tests/browser/definition-mutations.spec.ts",
    ],
    "SEM-03": ["packages/core/src/test/dialog-contract.ts", "tests/alert-dialog.test.ts"],
    "STATE-01": ["packages/core/src/test/dialog-contract.ts"],
    "STATE-02": ["packages/core/src/test/dialog-contract.ts"],
    "INT-01": ["packages/core/src/test/dialog-contract.ts"],
    "FOCUS-01": ["packages/core/src/test/dialog-contract.ts"],
    "FOCUS-02": ["packages/core/src/test/dialog-contract.ts"],
  },
});

/** Observable guarantees owned with the critical-decision AlertDialog Blueprint. */
export const alertDialogDefinition = defineComponentDefinition({
  name: "AlertDialog",
  version: "1.0",
  status: "verified",
  adopts: [nativeAlertDialog],
  interaction: [
    {
      id: "ALD-INT-01",
      classification: "intentional-extension",
      source: "Nagi explicit critical-decision action policy",
      text: "Cancel and primary actions are distinct native buttons; activating either closes the dialog and restores the invoker.",
      evidence: ["packages/core/src/test/dialog-contract.ts"],
      origin: { kind: "nagi", policy: "explicit-alert-dialog-actions", policyVersion: "1" },
    },
  ],
  focus: [
    {
      id: "ALD-FOCUS-01",
      classification: "conformant",
      source: "WAI-ARIA APG Dialog (Modal) Pattern least-destructive-action guidance",
      text: "Initial focus is placed on the explicit cancel action so a destructive primary action is never the default focus destination.",
      evidence: ["packages/core/src/test/dialog-contract.ts", "tests/alert-dialog.test.ts"],
      origin: {
        kind: "nagi",
        policy: "least-destructive-alert-dialog-focus",
        policyVersion: "1",
      },
    },
  ],
  anatomy: [
    {
      id: "ALD-ANAT-01",
      evidence: ["packages/core/src/test/dialog-contract.ts", "tests/definition.test.ts"],
      name: "root",
      description:
        "The owned AlertDialog scope containing its invoker and critical-decision surface.",
      match: { by: "part", scope: "alert-dialog", part: "root" },
    },
    {
      name: "trigger",
      description: "The native invoker receiving the complete triggerProps bundle.",
      match: { by: "part", scope: "alert-dialog", part: "trigger" },
      within: "root",
    },
    {
      name: "surface",
      description: "The native dialog surface exposing the alertdialog role.",
      match: { by: "part", scope: "alert-dialog", part: "surface" },
      within: "root",
    },
    {
      name: "title",
      description: "The visible title that supplies the alert dialog's accessible name.",
      match: { by: "part", scope: "alert-dialog", part: "title" },
      within: "surface",
    },
    {
      name: "description",
      description: "The required visible critical message referenced by the surface.",
      match: { by: "part", scope: "alert-dialog", part: "description" },
      within: "surface",
    },
    {
      name: "cancel",
      description: "The least-destructive native action and initial focus destination.",
      match: { by: "part", scope: "alert-dialog", part: "cancel" },
      within: "surface",
    },
    {
      name: "action",
      description: "The explicit primary native action for the critical decision.",
      match: { by: "part", scope: "alert-dialog", part: "action" },
      within: "surface",
    },
  ],
  style: [
    {
      id: "ALD-STYLE-01",
      classification: "intentional-extension",
      source: "Nagi critical-action and forced-colors policy",
      text: "Cancel and primary actions remain visibly distinct, and focused actions retain a visible indicator in forced-colors mode.",
      evidence: ["packages/core/src/test/dialog-contract.ts"],
      origin: {
        kind: "nagi",
        policy: "alert-dialog-functional-presentation",
        policyVersion: "1",
      },
    },
  ],
});
