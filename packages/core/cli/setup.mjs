import fs from "node:fs"
import path from "node:path"
import { createInterface } from "node:readline/promises"

const SETUP_HEADER =
  "// @nagi-setup generated — rerun `nagi-ui setup` instead of editing this file."

export const setupChoices = {
  framework: ["vue", "nuxt"],
  link: ["native", "vue-router", "nuxt-link"],
  image: ["native", "nuxt-image"],
}

function readDependencies(cwd) {
  const packageFile = path.join(cwd, "package.json")
  if (!fs.existsSync(packageFile)) return {}
  const manifest = JSON.parse(fs.readFileSync(packageFile, "utf8"))
  return { ...manifest.dependencies, ...manifest.devDependencies }
}

export function detectSetupDefaults(cwd) {
  const dependencies = readDependencies(cwd)
  const framework = dependencies.nuxt ? "nuxt" : "vue"
  return {
    framework,
    link:
      framework === "nuxt"
        ? "nuxt-link"
        : dependencies["vue-router"]
          ? "vue-router"
          : "native",
    image:
      framework === "nuxt" && dependencies["@nuxt/image"] ? "nuxt-image" : "native",
  }
}

export function validateSetupOptions(options) {
  for (const key of Object.keys(setupChoices)) {
    if (!setupChoices[key].includes(options[key])) {
      throw new Error(
        `Invalid ${key} "${options[key]}". Choose: ${setupChoices[key].join(", ")}`,
      )
    }
  }
  if (options.framework === "vue" && options.link === "nuxt-link") {
    throw new Error('link "nuxt-link" requires framework "nuxt"')
  }
  if (options.framework === "nuxt" && options.link === "vue-router") {
    throw new Error('Use link "nuxt-link" for Nuxt, or "native" to opt out')
  }
  if (options.framework !== "nuxt" && options.image === "nuxt-image") {
    throw new Error('image "nuxt-image" requires framework "nuxt"')
  }
}

function renderIntegrationSource({ link, image }) {
  const imports = []
  const nuxtImports = []
  if (link === "vue-router") {
    imports.push('import { useRouter, type RouteLocationRaw } from "vue-router";')
  }
  if (link === "nuxt-link") {
    nuxtImports.push("navigateTo", "preloadRouteComponents", "useRouter")
  }
  if (image === "nuxt-image") nuxtImports.push("useImage")
  if (nuxtImports.length > 0) {
    imports.unshift(`import { ${nuxtImports.join(", ")} } from "#imports";`)
  }

  const linkSource =
    link === "native"
      ? `export function useNagiLink() {
  return (href: string) => ({ href });
}`
      : link === "vue-router"
        ? `export function useNagiLink() {
  const router = useRouter();
  return (to: RouteLocationRaw) => ({
    href: router.resolve(to).href,
    navigate: () => router.push(to),
  });
}`
        : `type NagiRouteLocation = Parameters<ReturnType<typeof useRouter>["resolve"]>[0];

export function useNagiLink() {
  const router = useRouter();
  return (to: NagiRouteLocation) => ({
    href: router.resolve(to).href,
    navigate: () => navigateTo(to),
    prefetch: () => preloadRouteComponents(to),
  });
}`

  const imageSource =
    image === "native"
      ? `export function useNagiImage() {
  return (src: string) => ({ src });
}`
      : `export type NagiImageModifiers = Record<
  string,
  string | number | boolean | undefined
>;

export function useNagiImage() {
  const image = useImage();
  return (src: string, modifiers: NagiImageModifiers = {}) => ({
    src: image(src, modifiers),
  });
}`

  return [SETUP_HEADER, ...imports, "", linkSource, "", imageSource, ""].join("\n")
}

export function setupProject({ cwd, framework, link, image, dir = "src/nagi", force = false }) {
  const options = { framework, link, image }
  validateSetupOptions(options)
  const configPath = path.join(cwd, "nagi-ui.config.json")
  const integrationPath = path.resolve(cwd, dir, "integrations.ts")
  const config = `${JSON.stringify({ ...options, integrationsDir: dir }, null, 2)}\n`
  const integration = renderIntegrationSource(options)

  for (const [file, expected, generated] of [
    [configPath, config, false],
    [integrationPath, integration, true],
  ]) {
    if (!fs.existsSync(file)) continue
    const current = fs.readFileSync(file, "utf8")
    if (current === expected) continue
    if (generated && current.startsWith(SETUP_HEADER)) continue
    if (!force) throw new Error(`${file} already exists. Pass --force to overwrite.`)
  }

  fs.mkdirSync(path.dirname(integrationPath), { recursive: true })
  fs.writeFileSync(configPath, config)
  fs.writeFileSync(integrationPath, integration)
  return { configPath, integrationPath, options }
}

export function setupWarnings(cwd, options) {
  const dependencies = readDependencies(cwd)
  const warnings = []
  if (options.link === "vue-router" && !dependencies["vue-router"]) {
    warnings.push("vue-router is not declared. Add it before importing the adapter.")
  }
  if (options.image === "nuxt-image" && !dependencies["@nuxt/image"]) {
    warnings.push("Add @nuxt/image with `vp add @nuxt/image` and register it in nuxt.config.")
  }
  return warnings
}

async function choose(readline, question, choices, defaultValue, error) {
  const rows = choices.map((choice, index) => `  ${index + 1}) ${choice}`).join("\n")
  while (true) {
    const answer = (await readline.question(`${question}\n${rows}\n> `)).trim()
    if (answer === "") return defaultValue
    const number = Number(answer)
    if (Number.isInteger(number) && number >= 1 && number <= choices.length) {
      return choices[number - 1]
    }
    if (choices.includes(answer)) return answer
    error(`Choose 1-${choices.length} or one of: ${choices.join(", ")}`)
  }
}

export async function collectSetupOptions(partial, cwd, io = {}) {
  const defaults = detectSetupDefaults(cwd)
  if (partial.framework && partial.link && partial.image) return partial
  const input = io.input ?? process.stdin
  const output = io.output ?? process.stdout
  if (!input.isTTY || !output.isTTY) {
    throw new Error(
      "setup needs a TTY or all flags: --framework, --link, and --image",
    )
  }
  const readline = createInterface({ input, output })
  const error = io.error ?? console.error
  try {
    const framework =
      partial.framework ??
      (await choose(
        readline,
        `Framework [default: ${defaults.framework}]`,
        setupChoices.framework,
        defaults.framework,
        error,
      ))
    const linkChoices = framework === "nuxt" ? ["nuxt-link", "native"] : ["vue-router", "native"]
    const linkDefault =
      framework === defaults.framework && linkChoices.includes(defaults.link)
        ? defaults.link
        : framework === "nuxt"
          ? "nuxt-link"
          : "native"
    const link =
      partial.link ??
      (await choose(
        readline,
        `Link [default: ${linkDefault}]`,
        linkChoices,
        linkDefault,
        error,
      ))
    const imageChoices = framework === "nuxt" ? ["nuxt-image", "native"] : ["native"]
    const imageDefault = imageChoices.includes(defaults.image) ? defaults.image : imageChoices[0]
    const image =
      partial.image ??
      (await choose(
        readline,
        `Image [default: ${imageDefault}]`,
        imageChoices,
        imageDefault,
        error,
      ))
    return { framework, link, image }
  } finally {
    readline.close()
  }
}
