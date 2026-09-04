import nagiCss from "@nagi-labs/eslint-plugin-nagi-css";
import vueParser from "vue-eslint-parser";

import nagiUi from "./packages/eslint-plugin-nagi-ui/src/index.ts";
import nagiUiPreset from "./packages/core/nagi-css-preset.mjs";

const nagiUiSlotSurfaces = [
  ...new Set(Object.values(nagiUiPreset.componentSlots).flatMap((slots) => Object.values(slots))),
];

export default [
  {
    files: ["packages/core/blueprints/**/*.vue"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        // Nagi's rule is template-only. This is vue-eslint-parser's supported
        // escape hatch while the TypeScript ESLint parser cannot load TS 7.
        parser: false,
      },
    },
    plugins: { "nagi-ui": nagiUi },
    rules: { "nagi-ui/verified-bindings": "error" },
  },
  ...nagiCss.configs.recommended(
    {
      anatomyClasses: nagiUiPreset.anatomyClasses,
      componentClassPrefix: "n-",
      componentSlotPrefixes: nagiUiPreset.componentClasses,
      componentSlots: nagiUiPreset.componentSlots,
      detachedSlotSurfaces: nagiUiSlotSurfaces,
      surfaceRootPrefixes: ["n-"],
      // Nagi CSS's next contract revision self-maps prose paragraphs.
      elementClasses: { p: "p" },
      tokens: {
        exposedPrefixes: ["--button-", "--_button-"],
        sources: [{ file: "packages/core/theme/default-theme.css", layer: "semantic" }],
      },
    },
    {
      files: ["packages/core/blueprints/**/*.vue"],
      severity: {
        "*": "error",
        // Blueprint roots deliberately forward the consumer-owned `class`
        // value. Static source cannot enumerate that public input.
        "unverifiable-dynamic-class": "warn",
      },
    },
  ),
];
