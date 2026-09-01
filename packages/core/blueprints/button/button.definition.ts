import {
  adoptRequirementSet,
  defineComponentDefinition,
  nagiButtonRequirementsV1,
} from "@nagi-labs/nagi-ui";

const nativeButton = adoptRequirementSet(nagiButtonRequirementsV1, {
  prefix: "BTN",
  profile: {
    element: "button",
    naming: "native-accessible-name",
    disabled: "native",
    activation: "browser",
  },
  evidence: {
    "SEM-01": [
      "packages/core/src/test/button-contract.ts",
      "tests/component-catalog.test.ts",
      "tests/browser/anatomy.spec.ts",
    ],
    "STATE-01": [
      "packages/core/src/test/button-contract.ts",
      "tests/button-control.test.ts",
      "tests/component-catalog.test.ts",
    ],
    "INT-01": [
      "packages/core/src/test/button-contract.ts",
      "tests/button-control.test.ts",
      "tests/browser/catalog.spec.ts",
    ],
  },
});

/**
 * What Button guarantees. Owned alongside `Button.vue`: if the owned source
 * changes a guarantee, change it here too, then update the local tests.
 */
export const buttonDefinition = defineComponentDefinition({
  name: "Button",
  version: "2.0",
  status: "verified",
  adopts: [nativeButton],

  semantics: [
    {
      id: "BTN-SEM-02",
      classification: "intentional-extension",
      source: "Nagi safe button-type policy",
      text: "The native `type` is explicit and defaults to `button`, preventing accidental form submission while preserving explicit `submit` and `reset` choices.",
      evidence: [
        "packages/core/src/test/button-contract.ts",
        "tests/component-catalog.test.ts",
        "tests/button-control.test.ts",
      ],
      origin: { kind: "nagi", policy: "safe-button-type", policyVersion: "1" },
    },
  ],

  state: [
    {
      id: "BTN-STATE-02",
      classification: "intentional-extension",
      source: "Nagi focusable-disabled policy",
      text: '`focusableWhenDisabled` replaces native `disabled` with `aria-disabled="true"`, keeps the button in sequential focus navigation, and suppresses activation.',
      evidence: [
        "packages/core/src/test/button-contract.ts",
        "tests/button-control.test.ts",
        "tests/browser/catalog.spec.ts",
      ],
      origin: { kind: "nagi", policy: "focusable-disabled", policyVersion: "1" },
    },
  ],

  interaction: [
    {
      id: "BTN-INT-02",
      classification: "intentional-extension",
      source: "Nagi focusable-disabled policy",
      text: "Focusable-disabled activation is canceled in the capture phase before consumer click handlers run.",
      evidence: [
        "packages/core/src/test/button-contract.ts",
        "tests/button-control.test.ts",
        "tests/browser/catalog.spec.ts",
      ],
      origin: { kind: "nagi", policy: "focusable-disabled", policyVersion: "1" },
    },
    {
      id: "BTN-INT-03",
      classification: "intentional-extension",
      source: "Nagi attribute and event composition policy",
      text: "Behavior-owned props, consumer attributes, the explicit native type, and declared consumer events are composed onto one native button destination.",
      evidence: [
        "packages/core/src/test/button-contract.ts",
        "tests/button-control.test.ts",
        "tests/component-catalog.test.ts",
      ],
      origin: { kind: "nagi", policy: "element-prop-composition", policyVersion: "1" },
    },
  ],

  focus: [
    {
      id: "BTN-FOCUS-01",
      classification: "intentional-extension",
      source: "Nagi browser-owned focus policy",
      text: "The component never moves, traps, or restores focus; `focusableWhenDisabled` deliberately keeps the control reachable.",
      evidence: ["packages/core/src/test/button-contract.ts", "tests/browser/catalog.spec.ts"],
      origin: { kind: "nagi", policy: "browser-owned-focus", policyVersion: "1" },
    },
  ],

  anatomy: [
    {
      id: "BTN-ANAT-01",
      evidence: ["tests/definition.test.ts", "packages/core/src/test/button-contract.ts"],
      name: "root",
      description:
        "The native button that receives the complete `buttonProps` binding. Button has no required internal parts, so slot content may change without affecting behavior.",
      match: { by: "part", scope: "button", part: "root" },
    },
  ],

  style: [
    {
      id: "BTN-STYLE-01",
      classification: "intentional-extension",
      source: "Nagi Button finite style-axis contract",
      text: "Button exposes tone, appearance, shape, and size as independent finite CSS custom-property axes. Their defaults are neutral, outlined, rounded, and medium; visual states continue to follow native pseudo-classes and the focusable-disabled ARIA state.",
      evidence: [
        "packages/core/src/test/button-contract.ts",
        "tests/style-compiler.test.ts",
        "tests/browser/catalog.spec.ts",
      ],
      origin: { kind: "nagi", policy: "button-style-axes", policyVersion: "1" },
    },
    {
      id: "BTN-STYLE-03",
      classification: "implementation-constraint",
      source: "Nagi static style-axis compilation policy",
      text: "The build-time style compiler expands each literal public axis declaration into its separately owned private variables, preserving the public declaration and allowing axes to compose without generated DOM attributes, modifier classes, or a cross-product table.",
      evidence: [
        "packages/core/src/test/button-contract.ts",
        "tests/style-compiler.test.ts",
        "tests/component-catalog.test.ts",
      ],
      origin: { kind: "nagi", policy: "static-style-axis-compilation", policyVersion: "1" },
    },
    {
      id: "BTN-STYLE-04",
      classification: "implementation-constraint",
      source: "Nagi component-local style-axis policy",
      text: "Public Button axes and their generated private outputs are registered as non-inheriting properties. An axis declaration must target the package Button boundary or an owned button root, so styling an ancestor cannot change descendant Buttons accidentally.",
      evidence: [
        "packages/core/theme/style-axes.css",
        "tests/style-compiler.test.ts",
        "tests/browser/catalog.spec.ts",
      ],
      origin: { kind: "nagi", policy: "component-local-style-axes", policyVersion: "1" },
    },
    {
      id: "BTN-STYLE-02",
      classification: "intentional-extension",
      source: "Nagi forced-colors focus visibility policy",
      text: "Forced-colors mode preserves a visible system-color focus outline.",
      evidence: ["packages/core/src/test/button-contract.ts", "tests/browser/catalog.spec.ts"],
      origin: { kind: "nagi", policy: "forced-colors-focus-visibility", policyVersion: "1" },
    },
  ],
});
