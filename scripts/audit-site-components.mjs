import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const repositoryRoot = path.resolve(import.meta.dirname, "..");
const root = path.join(repositoryRoot, "site/.output/public/components");
const entries = await readdir(root, { withFileTypes: true });
const routes = entries
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
const failures = [];

for (const route of routes) {
  const html = await readFile(path.join(root, route, "index.html"), "utf8");
  const requirements = [
    [/<h2\b[^>]*>\s*Basic\s*<\/h2>/u, "Basic heading"],
    [/<h2\b[^>]*>\s*API\s*<\/h2>/u, "API heading"],
    [/<h2\b[^>]*>\s*Source\s*<\/h2>/u, "Source heading"],
    [/<h2\b[^>]*>\s*Definition\s*<\/h2>/u, "Definition heading"],
    ["text -guidance", "component-specific Basic guidance"],
    ["View code", "code disclosure"],
    [`nagi-ui own ${route}`, "ownership command"],
    ["@nagi-labs/nagi-ui/components", "component import in Basic source"],
  ];
  for (const [needle, label] of requirements) {
    const found = typeof needle === "string" ? html.includes(needle) : needle.test(html);
    if (!found) failures.push(`${route}: missing ${label}`);
  }
  if (
    !html.includes("Contract audit ready") &&
    !html.includes("Contract audit WIP")
  ) {
    failures.push(`${route}: missing Contract audit status`);
  }
  if (
    !html.includes("Browser evidence passed") &&
    !html.includes("Browser evidence failed") &&
    !html.includes("Browser evidence not collected")
  ) {
    failures.push(`${route}: missing browser evidence status`);
  }
  if (html.includes("Usage guidance is under review.")) {
    failures.push(`${route}: Basic usage guidance is still a fallback`);
  }
  if (html.includes("Import and compose")) failures.push(`${route}: legacy usage section remains`);
  if (
    !html.includes("site-actions-forms-preview") &&
    !html.includes("site-date-navigation-preview") &&
    !html.includes("site-display-overlay-preview")
  ) {
    failures.push(`${route}: missing dedicated preview`);
  }
}

const previewSources = await Promise.all(
  ["ActionsFormsPreview.vue", "DateNavigationPreview.vue", "DisplayOverlayPreview.vue"].map(
    (file) => readFile(path.join(repositoryRoot, "site/components/previews", file), "utf8"),
  ),
);
const previewNames = new Set(
  previewSources.flatMap((source) =>
    [...source.matchAll(/componentName === ['"]([^'"]+)['"]/gu)].map((match) => match[1]),
  ),
);
if (previewNames.size !== routes.length) {
  failures.push(`dedicated preview coverage is ${previewNames.size}/${routes.length}`);
}

async function collectFiles(directory) {
  const directoryEntries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      directoryEntries.map((entry) => {
        const target = path.join(directory, entry.name);
        return entry.isDirectory() ? collectFiles(target) : [target];
      }),
    )
  ).flat();
}

for (const file of await collectFiles(path.join(repositoryRoot, "site"))) {
  if (!/\.(?:ts|vue|md)$/u.test(file)) continue;
  if ((await readFile(file, "utf8")).includes("data-testid")) {
    failures.push(`${path.relative(repositoryRoot, file)}: data-testid remains`);
  }
}

if (failures.length) {
  throw new Error(`Component documentation audit failed:\n${failures.join("\n")}`);
}

console.log(`Component documentation structure: ${routes.length}/${routes.length} routes complete`);
