import fs from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"

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

export function packageVersion(packageRoot) {
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
 * - clean: owned body equals the installed upstream source
 * - modified: bodies differ and the stamp matches the installed version
 * - drifted: bodies differ and the installed version moved past the stamp
 * - unknown-source: the marker no longer identifies a shipped source
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
