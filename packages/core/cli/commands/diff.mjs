import path from "node:path"

import { defineCommand } from "citty"

import { diffOwned, resolvePackageRoot } from "../ownership.mjs"

export function createDiffCommand({ cwd, log, onExit }) {
  return defineCommand({
    meta: { name: "diff", description: "Compare owned files with the installed package" },
    args: {
      dir: {
        type: "string",
        default: "src/components/nagi",
        description: "Owned source directory",
      },
    },
    run({ args }) {
      const packageRoot = resolvePackageRoot(cwd)
      const entries = diffOwned(path.resolve(cwd, args.dir), { packageRoot })
      if (entries.length === 0) {
        log(`no @nagi-source files under ${args.dir}`)
        onExit(0)
        return 0
      }
      let gating = 0
      for (const entry of entries) {
        const stamp = `${entry.marker.component}/${entry.marker.file}@${entry.marker.version}`
        log(`${entry.status.padEnd(14)} ${path.relative(cwd, entry.file)}  (${stamp})`)
        if (entry.status !== "clean" && entry.upstream) {
          log(`  compare: git diff --no-index ${entry.upstream} ${entry.file}`)
        }
        if (entry.status === "drifted" || entry.status === "unknown-source") gating += 1
      }
      const code = gating === 0 ? 0 : 1
      onExit(code)
      return code
    },
  })
}
