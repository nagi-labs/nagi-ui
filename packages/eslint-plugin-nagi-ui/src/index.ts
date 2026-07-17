import { verifiedBindingsRule } from "./verified-bindings.ts"

const plugin = {
  meta: {
    name: "eslint-plugin-nagi-ui",
    version: "0.0.0",
  },
  rules: {
    "verified-bindings": verifiedBindingsRule,
  },
  configs: {} as Record<string, unknown>,
}

plugin.configs.recommended = {
  plugins: {
    "nagi-ui": plugin,
  },
  rules: {
    "nagi-ui/verified-bindings": "error",
  },
}

export { verifiedBindingsRule }
export default plugin
