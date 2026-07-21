import path from "node:path"

import { defineCommand } from "citty"

import {
  collectSetupOptions,
  setupChoices,
  setupProject,
  setupWarnings,
} from "../setup.mjs"

export function createSetupCommand({ cwd, io, log, warn, onExit }) {
  return defineCommand({
    meta: {
      name: "setup",
      description: "Select framework Link and Image integrations",
    },
    args: {
      framework: {
        type: "enum",
        options: setupChoices.framework,
        description: "Application framework",
      },
      link: {
        type: "enum",
        options: setupChoices.link,
        description: "Link navigation integration",
      },
      image: {
        type: "enum",
        options: setupChoices.image,
        description: "Image URL integration",
      },
      dir: {
        type: "string",
        default: "src/nagi",
        description: "Generated integration directory",
      },
      force: {
        type: "boolean",
        default: false,
        description: "Replace existing user-owned files",
      },
    },
    async run({ args }) {
      const options = await collectSetupOptions(
        { framework: args.framework, link: args.link, image: args.image },
        cwd,
        io,
      )
      const result = setupProject({
        cwd,
        ...options,
        dir: args.dir,
        force: args.force,
      })
      log(`configured ${options.framework} → ${path.relative(cwd, result.configPath)}`)
      log(`generated integrations → ${path.relative(cwd, result.integrationPath)}`)
      for (const message of setupWarnings(cwd, options)) warn(`warning: ${message}`)
      onExit(0)
      return 0
    },
  })
}
