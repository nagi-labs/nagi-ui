import path from "node:path"

import { defineCommand } from "citty"

import { inspectProjectStatus } from "../status.mjs"

function line(label, status, detail) {
  return `${label.padEnd(9)} ${status.padEnd(23)} ${detail}`
}

function plural(count, singular) {
  return `${count} ${singular}${count === 1 ? "" : "s"}`
}

export function createStatusCommand({ cwd, log, onExit }) {
  return defineCommand({
    meta: {
      name: "status",
      description: "Inspect package, theme, and owned source state",
    },
    args: {
      theme: {
        type: "positional",
        required: false,
        valueHint: "theme.css...",
        description: "Replacement-theme CSS files to validate",
      },
      dir: {
        type: "string",
        default: "src/components/nagi",
        description: "Owned source directory",
      },
    },
    run({ args }) {
      const status = inspectProjectStatus({
        cwd,
        ownedDir: args.dir,
        themeFiles: args._,
      })

      if (status.package.status === "installed") {
        const declaration = status.package.declaration
          ? `${status.package.declaration.section} ${status.package.declaration.specifier}`
          : "not declared directly in package.json"
        log(line("package", "installed", `${status.package.version} (${declaration})`))
      } else {
        log(line("package", "missing", "@nagi-labs/nagi-ui could not be resolved"))
      }

      if (status.theme.status === "default-detected") {
        const [first] = status.theme.imports
        const extra =
          status.theme.imports.length > 1
            ? ` +${status.theme.imports.length - 1} more`
            : ""
        log(line("theme", status.theme.status, `${first}${extra}`))
      } else if (
        status.theme.status === "replacement-complete" ||
        status.theme.status === "replacement-incomplete"
      ) {
        const detail = [
          plural(status.theme.defined.length, "token"),
          status.theme.missing.length > 0 ? `${status.theme.missing.length} missing` : null,
          status.theme.unknown.length > 0 ? `${status.theme.unknown.length} unknown` : null,
        ]
          .filter(Boolean)
          .join(", ")
        log(line("theme", status.theme.status, detail))
        if (status.theme.status === "replacement-incomplete") {
          log(`  run: nagi-ui theme check ${args._.join(" ")}`)
        }
      } else if (status.theme.status === "replacement-unreadable") {
        const error = String(status.theme.error?.message ?? status.theme.error)
        log(line("theme", status.theme.status, error))
      } else {
        log(
          line(
            "theme",
            "unresolved",
            "no default-theme import detected; pass replacement CSS files to verify",
          ),
        )
      }

      if (status.own.status === "none") {
        const relativeRoot = path.relative(cwd, status.own.root) || "."
        log(line("own", "none", `no @nagi-source files under ${relativeRoot}`))
      } else if (status.own.status === "unavailable") {
        log(line("own", "unavailable", "installed package is required for comparison"))
      } else {
        log(
          line(
            "own",
            status.own.status,
            `${plural(status.own.components.length, "component")}, ${plural(status.own.files, "file")}`,
          ),
        )
        for (const component of status.own.components) {
          const files = plural(component.files, "file")
          log(`  ${component.status.padEnd(14)} ${component.component} (${files})`)
        }
      }

      onExit(status.exitCode)
      return status.exitCode
    },
  })
}
