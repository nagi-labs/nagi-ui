import fs from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"

export const components = {
  accordion: { dir: "blueprints/accordion", files: ["Accordion.vue"] },
  alert: { dir: "blueprints/alert", files: ["Alert.vue"] },
  "alert-dialog": { dir: "blueprints/alert-dialog", files: ["AlertDialog.vue"] },
  avatar: { dir: "blueprints/avatar", files: ["Avatar.vue"] },
  badge: { dir: "blueprints/badge", files: ["Badge.vue"] },
  breadcrumb: { dir: "blueprints/breadcrumb", files: ["Breadcrumb.vue"] },
  button: { dir: "blueprints/button", files: ["Button.vue"] },
  "button-group": { dir: "blueprints/button-group", files: ["ButtonGroup.vue"] },
  card: { dir: "blueprints/card", files: ["Card.vue"] },
  checkbox: { dir: "blueprints/checkbox", files: ["Checkbox.vue"] },
  combobox: { dir: "blueprints/combobox", files: ["Combobox.vue"] },
  dialog: { dir: "blueprints/dialog", files: ["Dialog.vue"] },
  disclosure: { dir: "blueprints/disclosure", files: ["Disclosure.vue"] },
  "dropdown-menu": {
    dir: "blueprints/menu",
    files: [
      "DropdownMenu.vue",
      "DropdownMenuItem.vue",
      "DropdownSubmenu.vue",
      "dropdown-options.ts",
      "dropdown-schema.ts",
    ],
  },
  "empty-state": { dir: "blueprints/empty-state", files: ["EmptyState.vue"] },
  fieldset: { dir: "blueprints/fieldset", files: ["Fieldset.vue"] },
  "file-input": { dir: "blueprints/file-input", files: ["FileInput.vue"] },
  input: { dir: "blueprints/input", files: ["Input.vue"] },
  "input-group": { dir: "blueprints/input-group", files: ["InputGroup.vue"] },
  kbd: { dir: "blueprints/kbd", files: ["Kbd.vue"] },
  listbox: { dir: "blueprints/listbox", files: ["Listbox.vue"] },
  meter: { dir: "blueprints/meter", files: ["Meter.vue"] },
  "number-field": { dir: "blueprints/number-field", files: ["NumberField.vue"] },
  pagination: { dir: "blueprints/pagination", files: ["Pagination.vue"] },
  popover: { dir: "blueprints/popover", files: ["Popover.vue"] },
  progress: { dir: "blueprints/progress", files: ["Progress.vue"] },
  radio: { dir: "blueprints/radio", files: ["Radio.vue"] },
  rating: { dir: "blueprints/rating", files: ["Rating.vue"] },
  select: { dir: "blueprints/select", files: ["Select.vue"] },
  separator: { dir: "blueprints/separator", files: ["Separator.vue"] },
  skeleton: { dir: "blueprints/skeleton", files: ["Skeleton.vue"] },
  slider: { dir: "blueprints/slider", files: ["Slider.vue"] },
  spinner: { dir: "blueprints/spinner", files: ["Spinner.vue"] },
  switch: { dir: "blueprints/switch", files: ["Switch.vue"] },
  tabs: { dir: "blueprints/tabs", files: ["Tabs.vue"] },
  textarea: { dir: "blueprints/textarea", files: ["Textarea.vue"] },
  toast: { dir: "blueprints/toast", files: ["Toast.vue"] },
  toggle: { dir: "blueprints/toggle", files: ["Toggle.vue"] },
  "toggle-group": { dir: "blueprints/toggle-group", files: ["ToggleGroup.vue"] },
  tooltip: { dir: "blueprints/tooltip", files: ["Tooltip.vue"] },
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
