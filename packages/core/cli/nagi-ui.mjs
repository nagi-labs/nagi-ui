#!/usr/bin/env node
/** Nagi UI setup and ownership CLI (CHARTER §3 / Phase 4 slice 2). */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { defineCommand, runCommand, runMain } from "citty"

import { createDiffCommand } from "./commands/diff.mjs"
import { createListCommand } from "./commands/list.mjs"
import { createOwnCommand } from "./commands/own.mjs"
import { createSetupCommand } from "./commands/setup.mjs"
import { createThemeCommand } from "./commands/theme.mjs"
import { packageVersion } from "./ownership.mjs"

export {
  components,
  diffOwned,
  markerLine,
  ownComponent,
  parseMarker,
  resolvePackageRoot,
} from "./ownership.mjs"
export {
  detectSetupDefaults,
  setupProject,
  validateSetupOptions,
} from "./setup.mjs"
export { checkThemeFiles } from "./theme.mjs"

const localPackageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

function output(io = {}) {
  return {
    log: io.log ?? console.log,
    warn: io.warn ?? console.warn,
  }
}

export function createNagiCommand({
  cwd = process.cwd(),
  io = {},
  onExit = () => {},
} = {}) {
  const { log, warn } = output(io)
  const context = { cwd, io, log, warn, onExit }

  return defineCommand({
    meta: {
      name: "nagi-ui",
      version: packageVersion(localPackageRoot),
      description: "Set up integrations and own Nagi UI Blueprint source",
    },
    subCommands: {
      setup: createSetupCommand(context),
      list: createListCommand(context),
      own: createOwnCommand(context),
      diff: createDiffCommand(context),
      theme: createThemeCommand(context),
    },
  })
}

export async function main(argv = process.argv.slice(2), cwd = process.cwd(), io = {}) {
  let exitCode = 0
  const command = createNagiCommand({ cwd, io, onExit: (code) => (exitCode = code) })
  await runCommand(command, { rawArgs: argv })
  return exitCode
}

const invokedPath =
  process.argv[1] && fs.existsSync(process.argv[1]) ? fs.realpathSync(process.argv[1]) : null
if (invokedPath === fileURLToPath(import.meta.url)) {
  let exitCode = 0
  await runMain(
    createNagiCommand({
      onExit: (code) => (exitCode = code),
    }),
  )
  if (exitCode !== 0) process.exit(exitCode)
}
