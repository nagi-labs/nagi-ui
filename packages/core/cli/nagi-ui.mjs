#!/usr/bin/env node
/**
 * Nagi UI ownership CLI (CHARTER §3 保守契約 / Phase 4 slice 2).
 *
 * `own` copies the installed package's Blueprint source — the exact files the
 * package consumes, raw-SFC distribution has no separate build — into the
 * application and stamps each file with a machine-readable @nagi-source
 * marker. `diff` reads those markers back and reports how owned sources
 * relate to the currently installed upstream.
 */
import fs from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"

export const components = {
  alert: { dir: "blueprints/alert", files: ["Alert.vue"] },
  badge: { dir: "blueprints/badge", files: ["Badge.vue"] },
  button: { dir: "blueprints/button", files: ["NagiButton.vue"] },
  card: { dir: "blueprints/card", files: ["Card.vue"] },
  combobox: { dir: "blueprints/combobox", files: ["Combobox.vue"] },
  dialog: { dir: "blueprints/dialog", files: ["NagiDialog.vue"] },
  disclosure: { dir: "blueprints/disclosure", files: ["NagiDisclosure.vue"] },
  "dropdown-menu": {
    dir: "blueprints/menu",
    files: [
      "DropdownMenu.vue",
      "DropdownMenuItem.vue",
      "DropdownSubmenu.vue",
      "dropdown-schema.ts",
    ],
  },
  listbox: { dir: "blueprints/listbox", files: ["Listbox.vue"] },
  popover: { dir: "blueprints/popover", files: ["NagiPopover.vue"] },
  toast: { dir: "blueprints/toast", files: ["NagiToast.vue"] },
  tooltip: { dir: "blueprints/tooltip", files: ["NagiTooltip.vue"] },
}

const MARKER_RE = /^(?:<!--|\/\/) @nagi-source ([a-z0-9-]+)\/([^@\s]+)@(\S+?)(?: -->)?$/

export function markerLine(file, component, version) {
  const marker = `@nagi-source ${component}/${file}@${version}`
  return file.endsWith(".vue") ? `<!-- ${marker} -->\n` : `// ${marker}\n`
}

export function parseMarker(line) {
  const match = MARKER_RE.exec(line.trim())
  if (!match) return null
  return { component: match[1], file: match[2], version: match[3] }
}

export function resolvePackageRoot(from = process.cwd()) {
  const require = createRequire(path.join(from, "__nagi_resolve__.js"))
  return path.dirname(require.resolve("@nagi-labs/nagi-ui/package.json"))
}

function packageVersion(packageRoot) {
  return JSON.parse(fs.readFileSync(path.join(packageRoot, "package.json"), "utf8")).version
}

export function ownComponent(name, { packageRoot, targetRoot, force = false }) {
  const spec = components[name]
  if (!spec) {
    throw new Error(
      `Unknown component "${name}". Available: ${Object.keys(components).join(", ")}`,
    )
  }
  const version = packageVersion(packageRoot)
  const destDir = path.join(targetRoot, name)
  if (!force && fs.existsSync(destDir) && fs.readdirSync(destDir).length > 0) {
    throw new Error(`${destDir} is not empty. Pass --force to overwrite.`)
  }
  fs.mkdirSync(destDir, { recursive: true })
  const files = []
  for (const file of spec.files) {
    const source = fs.readFileSync(path.join(packageRoot, spec.dir, file), "utf8")
    const dest = path.join(destDir, file)
    fs.writeFileSync(dest, markerLine(file, name, version) + source)
    files.push(dest)
  }
  return { component: name, version, files }
}

function walk(root) {
  return fs
    .readdirSync(root, { recursive: true })
    .map(String)
    .filter((file) => file.endsWith(".vue") || file.endsWith(".ts"))
    .map((file) => path.join(root, file))
}

/**
 * Statuses:
 * - clean:    owned body equals the installed upstream source
 * - modified: bodies differ and the stamp matches the installed version
 *             (the difference is local)
 * - drifted:  bodies differ and the installed version moved past the stamp
 *             (local and upstream changes may both be present)
 * - unknown-source: the marker names a component/file this package version
 *             does not ship
 */
export function diffOwned(root, { packageRoot }) {
  const version = packageVersion(packageRoot)
  const entries = []
  if (!fs.existsSync(root)) return entries
  for (const file of walk(root)) {
    const content = fs.readFileSync(file, "utf8")
    const newline = content.indexOf("\n")
    const marker = parseMarker(newline === -1 ? content : content.slice(0, newline))
    if (!marker) continue
    const spec = components[marker.component]
    const upstreamPath = spec ? path.join(packageRoot, spec.dir, marker.file) : null
    if (!upstreamPath || !spec.files.includes(marker.file) || !fs.existsSync(upstreamPath)) {
      entries.push({ file, marker, status: "unknown-source", upstream: null })
      continue
    }
    const body = content.slice(newline + 1)
    const upstream = fs.readFileSync(upstreamPath, "utf8")
    const status =
      body === upstream ? "clean" : marker.version === version ? "modified" : "drifted"
    entries.push({ file, marker, status, upstream: upstreamPath, installedVersion: version })
  }
  return entries
}

function usage() {
  return `Usage:
  nagi-ui list
  nagi-ui own <component> [<component> ...] [--dir <target>] [--force]
  nagi-ui diff [--dir <target>]

The default target directory is src/components/nagi. "diff" exits non-zero
only for drifted or unknown-source files — local customization ("modified")
is the normal steady state of an owned file and does not fail the gate.`
}

export function main(argv = process.argv.slice(2), cwd = process.cwd()) {
  const args = [...argv]
  const command = args.shift()
  let dir = "src/components/nagi"
  let force = false
  const names = []
  while (args.length > 0) {
    const value = args.shift()
    if (value === "--dir") dir = args.shift() ?? dir
    else if (value === "--force") force = true
    else names.push(value)
  }
  const targetRoot = path.resolve(cwd, dir)

  if (command === "list") {
    for (const [name, spec] of Object.entries(components)) {
      console.log(`${name}  (${spec.files.length} file${spec.files.length === 1 ? "" : "s"})`)
    }
    return 0
  }
  if (command === "own") {
    if (names.length === 0) {
      console.error(usage())
      return 1
    }
    const packageRoot = resolvePackageRoot(cwd)
    for (const name of names) {
      const result = ownComponent(name, { packageRoot, targetRoot, force })
      console.log(`owned ${name}@${result.version} → ${path.join(dir, name)}`)
      for (const file of result.files) console.log(`  ${path.relative(cwd, file)}`)
    }
    console.log(
      "\nSwitch your imports from @nagi-labs/nagi-ui/components to the owned files.",
    )
    return 0
  }
  if (command === "diff") {
    const packageRoot = resolvePackageRoot(cwd)
    const entries = diffOwned(targetRoot, { packageRoot })
    if (entries.length === 0) {
      console.log(`no @nagi-source files under ${dir}`)
      return 0
    }
    let gating = 0
    for (const entry of entries) {
      const stamp = `${entry.marker.component}/${entry.marker.file}@${entry.marker.version}`
      console.log(`${entry.status.padEnd(14)} ${path.relative(cwd, entry.file)}  (${stamp})`)
      if (entry.status !== "clean" && entry.upstream) {
        console.log(`  compare: git diff --no-index ${entry.upstream} ${entry.file}`)
      }
      if (entry.status === "drifted" || entry.status === "unknown-source") gating += 1
    }
    return gating === 0 ? 0 : 1
  }
  console.error(usage())
  return command === undefined || command === "--help" || command === "-h" ? 0 : 1
}

const invokedPath =
  process.argv[1] && fs.existsSync(process.argv[1]) ? fs.realpathSync(process.argv[1]) : null
if (invokedPath === fileURLToPath(import.meta.url)) {
  process.exit(main())
}
