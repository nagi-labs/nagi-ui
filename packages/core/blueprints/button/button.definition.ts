import {
  adoptRequirementSet,
  defineComponentContract,
  defineComponentDefinition,
  defineComponentImplementation,
  nagiButtonRequirementsV2,
} from "@nagi-labs/nagi-ui";

const buttonFoundation = adoptRequirementSet(nagiButtonRequirementsV2, {
  prefix: "BTN",
  profile: {
    semantics: "button",
    naming: "accessible-name",
    disabled: "perceivable-inoperable",
    activation: "click-enter-space",
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

export const buttonContract = defineComponentContract({
  id: "nagi/button",
  revision: "2",
  description:
    "Button semantics, activation, disabled behavior, focus policy, and style axes that remain true regardless of the rendering mechanism.",
  api: [
    { name: "type", kind: "prop", description: "Selects button, submit, or reset intent." },
    { name: "disabled", kind: "prop", description: "Makes the control unavailable." },
    {
      name: "focusableWhenDisabled",
      kind: "prop",
      description: "Keeps an unavailable control reachable without allowing activation.",
    },
    { name: "default", kind: "slot", description: "Supplies the Button's accessible content." },
    {
      name: "click",
      kind: "event",
      description: "Reports accepted pointer or keyboard activation.",
    },
    {
      name: "--button-tone",
      kind: "css-property",
      description: "Selects the semantic color axis.",
    },
    {
      name: "--button-appearance",
      kind: "css-property",
      description: "Selects the visual treatment axis.",
    },
    { name: "--button-shape", kind: "css-property", description: "Selects the corner-shape axis." },
    { name: "--button-size", kind: "css-property", description: "Selects the control-size axis." },
  ],
  parts: [
    {
      name: "control",
      description: "The single action a user can focus and activate.",
    },
  ],
  adopts: [buttonFoundation],
  state: [
    {
      id: "BTN-STATE-02",
      classification: "intentional-extension",
      source: "Nagi focusable-disabled policy",
      text: '`focusableWhenDisabled` exposes `aria-disabled="true"`, keeps the Button in sequential focus navigation, and suppresses activation.',
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
      text: "Focusable-disabled activation is canceled before consumer activation handlers run.",
      evidence: [
        "packages/core/src/test/button-contract.ts",
        "tests/button-control.test.ts",
        "tests/browser/catalog.spec.ts",
      ],
      origin: { kind: "nagi", policy: "focusable-disabled", policyVersion: "1" },
    },
  ],
  focus: [
    {
      id: "BTN-FOCUS-01",
      classification: "intentional-extension",
      source: "Nagi caller-owned focus policy",
      text: "Button never moves, traps, or restores focus; `focusableWhenDisabled` deliberately keeps the control reachable.",
      evidence: ["packages/core/src/test/button-contract.ts", "tests/browser/catalog.spec.ts"],
      origin: { kind: "nagi", policy: "caller-owned-focus", policyVersion: "1" },
    },
  ],
  style: [
    {
      id: "BTN-STYLE-01",
      classification: "intentional-extension",
      source: "Nagi Button finite style-axis contract",
      text: "Button exposes tone, appearance, shape, and size as independent finite CSS custom-property axes. Their defaults are neutral, outlined, rounded, and medium; visual states continue to follow semantic Button state.",
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

export const nativeButtonImplementation = defineComponentImplementation({
  id: "nagi/blueprint/button",
  title: "Default Button Blueprint",
  version: "1",
  strategy: "platform-first",
  description:
    "The standard Blueprint realizes the Button contract with one native button and browser-owned activation.",
  references: [
    {
      id: "html-button-ls",
      title: "HTML Living Standard — The button element",
      url: "https://html.spec.whatwg.org/multipage/form-elements.html#the-button-element",
      kind: "living-standard",
      revision: "Living Standard snapshot",
      reviewedAt: "2026-09-02",
    },
  ],
  decisions: [
    {
      name: "element",
      value: "button",
      description: "Use the native button element as the semantic and activation owner.",
      evidence: ["packages/core/src/test/button-contract.ts"],
    },
    {
      name: "activation",
      value: "browser",
      description: "Leave ordinary click, Enter, and Space activation to the browser.",
      evidence: ["tests/button-control.test.ts", "tests/browser/catalog.spec.ts"],
    },
    {
      name: "disabled",
      value: "native-by-default",
      description: "Use native disabled unless the public focusable-disabled policy is requested.",
      evidence: ["packages/core/src/test/button-contract.ts", "tests/button-control.test.ts"],
    },
    {
      name: "presence",
      value: "persistent",
      description: "Button has no open or exit lifecycle; its root remains mounted.",
      evidence: ["packages/core/src/test/button-contract.ts"],
    },
  ],
  semantics: [
    {
      id: "BTN-SEM-02",
      classification: "implementation-constraint",
      source: "Default Button Blueprint native-element policy",
      text: "The standard Blueprint renders a native `button`; its explicit `type` defaults to `button`, preventing accidental form submission while preserving explicit `submit` and `reset` choices.",
      evidence: [
        "packages/core/src/test/button-contract.ts",
        "tests/component-catalog.test.ts",
        "tests/button-control.test.ts",
        "tests/browser/definition-mutations.spec.ts",
      ],
      origin: { kind: "nagi", policy: "native-button-blueprint", policyVersion: "1" },
    },
  ],
  interaction: [
    {
      id: "BTN-INT-03",
      classification: "implementation-constraint",
      source: "Default Button Blueprint binding policy",
      text: "Behavior-owned props, consumer attributes, the explicit native type, and declared consumer events are composed onto one native button destination.",
      evidence: [
        "packages/core/src/test/button-contract.ts",
        "tests/button-control.test.ts",
        "tests/component-catalog.test.ts",
      ],
      origin: { kind: "nagi", policy: "native-button-binding", policyVersion: "1" },
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
      contractPart: "control",
    },
  ],
});

/** Resolved guarantees for the standard, native Button Blueprint. */
export const buttonDefinition = defineComponentDefinition({
  name: "Button",
  version: "3.0",
  status: "draft",
  contract: buttonContract,
  implementation: nativeButtonImplementation,
});
