import nagiCss from "@nagi-labs/eslint-plugin-nagi-css";
import typescriptParser from "@typescript-eslint/parser";
import vue from "eslint-plugin-vue";
import vueParser from "vue-eslint-parser";

import nagiUiPreset from "../packages/core/nagi-css-preset.mjs";

export default [
  ...vue.configs["flat/recommended"],
  {
    files: ["**/*.vue"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        ecmaVersion: "latest",
        extraFileExtensions: [".vue"],
        parser: typescriptParser,
        sourceType: "module",
      },
    },
    rules: {
      "vue/html-closing-bracket-newline": "off",
      "vue/html-indent": "off",
      "vue/html-self-closing": "off",
      "vue/max-attributes-per-line": "off",
      "vue/multiline-html-element-content-newline": "off",
      "vue/singleline-html-element-content-newline": "off",
      "vue/component-name-in-template-casing": [
        "error",
        "kebab-case",
        { registeredComponentsOnly: false },
      ],
      "vue/multi-word-component-names": "off",
    },
  },
  ...nagiCss.configs.recommended(
    {
      ...nagiUiPreset,
      surfaceRootPrefixes: ["site-"],
      emitPolicy: "when-styled",
      tokens: {
        sources: [
          { file: "assets/css/site.css", layer: "semantic" },
          { file: "../packages/core/theme/default-theme.css", layer: "semantic" },
        ],
      },
    },
    { files: ["**/*.vue"], severity: { "*": "error" } },
  ),
  { ignores: [".nuxt/**", ".output/**", "node_modules/**"] },
];
