import fs from "node:fs"
import path from "node:path"

import { diffOwned, packageVersion, resolvePackageRoot } from "./ownership.mjs"
import { checkThemeFiles } from "./theme.mjs"

const PACKAGE_NAME = "@nagi-labs/nagi-ui"
const DEPENDENCY_SECTIONS = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
]
const SOURCE_EXTENSIONS = new Set([
  ".cjs",
  ".css",
  ".cts",
  ".js",
  ".jsx",
  ".less",
  ".mjs",
  ".mts",
  ".sass",
  ".scss",
  ".styl",
  ".ts",
  ".tsx",
  ".vue",
])
const IGNORED_DIRECTORIES = new Set([
  ".git",
  ".next",
  ".nuxt",
  ".output",
  ".vite",
  "build",
  "coverage",
  "dist",
  "node_modules",
])
const DEFAULT_THEME_IMPORT =
  /(?:^|\n)\s*(?:import\s+(?:[^"'\n]+?\s+from\s+)?|@import\s+(?:url\(\s*)?)["']@nagi-labs\/nagi-ui\/(?:default-theme|styles|theme)\.css["']/u
const BLOCK_COMMENT = /\/\*[\s\S]*?\*\//gu
const STATUS_PRIORITY = {
  clean: 0,
  modified: 1,
  drifted: 2,
  "unknown-source": 3,
}

function directPackageDeclaration(cwd) {
  const manifestPath = path.join(cwd, "package.json")
  if (!fs.existsSync(manifestPath)) return null
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"))
  for (const section of DEPENDENCY_SECTIONS) {
    const specifier = manifest[section]?.[PACKAGE_NAME]
    if (typeof specifier === "string") return { section, specifier }
  }
  return null
}

function sourceFiles(root) {
  const files = []
  const visit = (directory) => {
    const entries = fs.readdirSync(directory, { withFileTypes: true })
    entries.sort((left, right) => left.name.localeCompare(right.name))
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!entry.name.startsWith(".") && !IGNORED_DIRECTORIES.has(entry.name)) {
          visit(path.join(directory, entry.name))
        }
        continue
      }
      if (entry.isFile() && SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
        files.push(path.join(directory, entry.name))
      }
    }
  }
  visit(root)
  return files
}

function detectDefaultThemeImports(cwd) {
  const imports = []
  for (const file of sourceFiles(cwd)) {
    if (fs.statSync(file).size > 1024 * 1024) continue
    const source = fs.readFileSync(file, "utf8").replace(BLOCK_COMMENT, "")
    if (DEFAULT_THEME_IMPORT.test(source)) {
      imports.push(path.relative(cwd, file))
    }
  }
  return imports
}

function summarizeOwned(entries) {
  const counts = {
    clean: 0,
    modified: 0,
    drifted: 0,
    "unknown-source": 0,
  }
  const grouped = new Map()
  for (const entry of entries) {
    counts[entry.status] += 1
    const current = grouped.get(entry.marker.component) ?? {
      component: entry.marker.component,
      files: 0,
      status: "clean",
    }
    current.files += 1
    if (STATUS_PRIORITY[entry.status] > STATUS_PRIORITY[current.status]) {
      current.status = entry.status
    }
    grouped.set(entry.marker.component, current)
  }
  const components = [...grouped.values()].sort((left, right) =>
    left.component.localeCompare(right.component),
  )
  const status =
    components.reduce(
      (worst, component) =>
        STATUS_PRIORITY[component.status] > STATUS_PRIORITY[worst]
          ? component.status
          : worst,
      "clean",
    ) ?? "clean"
  return {
    status: entries.length === 0 ? "none" : status,
    files: entries.length,
    counts,
    components,
  }
}

/**
 * Inspect the three independent Nagi adoption axes:
 * installed package, active theme evidence, and owned source state.
 */
export function inspectProjectStatus({
  cwd = process.cwd(),
  packageRoot,
  ownedDir = "src/components/nagi",
  themeFiles = [],
} = {}) {
  const root = path.resolve(cwd)
  let resolvedPackageRoot = packageRoot
  let packageError = null
  if (resolvedPackageRoot === undefined) {
    try {
      resolvedPackageRoot = resolvePackageRoot(root)
    } catch (error) {
      resolvedPackageRoot = null
      packageError = error
    }
  }

  let packageStatus
  if (resolvedPackageRoot) {
    try {
      packageStatus = {
        status: "installed",
        version: packageVersion(resolvedPackageRoot),
        root: resolvedPackageRoot,
        declaration: directPackageDeclaration(root),
      }
    } catch (error) {
      packageStatus = { status: "missing", error }
      resolvedPackageRoot = null
    }
  } else {
    packageStatus = { status: "missing", error: packageError }
  }

  const resolvedThemeFiles = themeFiles.map((file) => path.resolve(root, file))
  let theme
  if (resolvedThemeFiles.length > 0) {
    try {
      const result = checkThemeFiles(resolvedThemeFiles)
      theme = {
        status:
          result.missing.length === 0 && result.unknown.length === 0
            ? "replacement-complete"
            : "replacement-incomplete",
        files: resolvedThemeFiles,
        ...result,
      }
    } catch (error) {
      theme = { status: "replacement-unreadable", files: resolvedThemeFiles, error }
    }
  } else {
    const imports = detectDefaultThemeImports(root)
    theme =
      imports.length > 0
        ? { status: "default-detected", imports }
        : { status: "unresolved", imports: [] }
  }

  const ownedRoot = path.resolve(root, ownedDir)
  const own = resolvedPackageRoot
    ? {
        ...summarizeOwned(diffOwned(ownedRoot, { packageRoot: resolvedPackageRoot })),
        root: ownedRoot,
      }
    : { status: "unavailable", root: ownedRoot, files: 0, components: [] }

  const exitCode =
    packageStatus.status === "missing" ||
    theme.status === "replacement-incomplete" ||
    theme.status === "replacement-unreadable" ||
    own.status === "drifted" ||
    own.status === "unknown-source"
      ? 1
      : 0

  return { package: packageStatus, theme, own, exitCode }
}
