import { defineCommand } from "citty"

import { components } from "../ownership.mjs"

export function createListCommand({ log, onExit }) {
  return defineCommand({
    meta: { name: "list", description: "List ownable components" },
    run() {
      for (const [name, spec] of Object.entries(components)) {
        log(`${name}  (${spec.files.length} file${spec.files.length === 1 ? "" : "s"})`)
      }
      onExit(0)
      return 0
    },
  })
}
