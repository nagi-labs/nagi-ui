import path from "node:path"

import { defineCommand } from "citty"

import { checkThemeFiles } from "../theme.mjs"

export function createThemeCommand({ cwd, log, warn, onExit }) {
  const check = defineCommand({
    meta: {
      name: "check",
      description: "Check a replacement theme for missing or unknown Nagi tokens",
    },
    args: {
      file: {
        type: "positional",
        required: true,
        valueHint: "theme.css...",
        description: "One or more CSS files that make up the replacement theme",
      },
    },
    run({ args }) {
      const files = args._.map((file) => path.resolve(cwd, file))
      const result = checkThemeFiles(files)
      for (const token of result.missing) warn(`warning: missing Nagi theme token ${token}`)
      for (const token of result.unknown) warn(`warning: unknown Nagi theme token ${token}`)

      const code = result.missing.length === 0 && result.unknown.length === 0 ? 0 : 1
      if (code === 0) log(`complete Nagi theme (${result.defined.length} tokens)`)
      else warn("warning: import @nagi-labs/nagi-ui/default-theme.css or complete the replacement theme")
      onExit(code)
      return code
    },
  })

  return defineCommand({
    meta: { name: "theme", description: "Validate Nagi UI theme token coverage" },
    subCommands: { check },
  })
}
