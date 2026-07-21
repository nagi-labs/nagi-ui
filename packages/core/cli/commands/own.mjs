import path from "node:path"

import { defineCommand } from "citty"

import { ownComponent, resolvePackageRoot } from "../ownership.mjs"

export function createOwnCommand({ cwd, log, onExit }) {
  return defineCommand({
    meta: { name: "own", description: "Copy canonical Blueprint source into the application" },
    args: {
      component: {
        type: "positional",
        required: true,
        valueHint: "component...",
        description: "One or more components",
      },
      dir: {
        type: "string",
        default: "src/components/nagi",
        description: "Owned source directory",
      },
      force: {
        type: "boolean",
        default: false,
        description: "Overwrite non-empty component directories",
      },
    },
    run({ args }) {
      const packageRoot = resolvePackageRoot(cwd)
      const targetRoot = path.resolve(cwd, args.dir)
      for (const name of args._) {
        const result = ownComponent(name, {
          packageRoot,
          targetRoot,
          force: args.force,
        })
        log(`owned ${name}@${result.version} → ${path.join(args.dir, name)}`)
        for (const file of result.files) log(`  ${path.relative(cwd, file)}`)
      }
      log("\nSwitch imports from @nagi-labs/nagi-ui/components to the owned files.")
      onExit(0)
      return 0
    },
  })
}
