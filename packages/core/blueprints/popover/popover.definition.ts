import {
  adoptRequirementSet,
  defineComponentDefinition,
  nagiPopupRequirementsV1,
} from "@nagi-labs/nagi-ui";

const nativePopup = adoptRequirementSet(nagiPopupRequirementsV1, {
  prefix: "POP",
  profile: {
    invocation: "native-target",
    focus: "unmanaged",
    dismissal: "auto",
  },
  evidence: {
    "SEM-01": ["tests/popover.test.ts", "tests/browser/catalog.spec.ts"],
    "STATE-01": ["tests/popover.test.ts"],
    "INT-01": ["tests/browser/catalog.spec.ts"],
  },
});

export const popoverDefinition = defineComponentDefinition({
  name: "Popover",
  version: "1.0",
  status: "verified",
  adopts: [nativePopup],
  anatomy: [
    {
      id: "POP-ANAT-01",
      evidence: ["tests/browser/catalog.spec.ts"],
      name: "root",
      description: "The owned scope containing the native invoker and popup surface.",
      match: { by: "part", scope: "popover", part: "root" },
    },
    {
      name: "trigger",
      description: "The native invoker receiving the complete triggerProps bundle.",
      match: { by: "part", scope: "popover", part: "trigger" },
      within: "root",
    },
    {
      name: "surface",
      description: "The native auto-popover receiving the complete popoverProps bundle.",
      match: { by: "part", scope: "popover", part: "surface" },
      within: "root",
    },
  ],
  style: [
    {
      id: "POP-STYLE-01",
      classification: "intentional-extension",
      source: "Nagi popup visibility and forced-colors policy",
      text: "The open surface is visibly distinct and its native trigger retains a visible focus indicator, including forced colors.",
      evidence: ["tests/browser/catalog.spec.ts"],
      origin: { kind: "nagi", policy: "popup-functional-visibility", policyVersion: "1" },
    },
  ],
});
