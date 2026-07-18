import vueParser from "vue-eslint-parser"

import nagiUi from "./packages/eslint-plugin-nagi-ui/src/index.ts"

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
]
